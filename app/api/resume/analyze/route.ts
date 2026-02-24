import { NextResponse } from "next/server";
import { techDictionary } from "@/utils/techDictionary";
import { roadmapMap } from "@/utils/roadmapMap";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new NextResponse(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers || {})
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

type AnalyzeRequestBody = {
  resumeText: string;
  jobDescription: string;
};

type AiInsights = {
  analysisBreakdown: {
    skillsMatch: string[];
    experienceStrength: string[];
    impactAndMetrics: string[];
    professionalBranding: string[];
  };
  immediateActionChecklist: string[];
  interviewQuestions: {
    technicalQuestions: string[];
    behavioralQuestions: string[];
    projectBasedQuestions: string[];
  };
  professionalSummarySuggestion: string;
  atsCompatibilityExplanation: string;
};

const REQUIRED_SECTION_HEADERS = ["must have", "required"];
const PREFERRED_SECTION_HEADERS = ["nice to have", "preferred"];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSectionSkills(
  text: string,
  headers: string[],
  dictionary: string[]
): Set<string> {
  const extractedSkills = new Set<string>();
  const headerPattern = headers.map((header) => escapeRegExp(header)).join("|");
  const sectionRegex = new RegExp(`(?:${headerPattern})\\s*:\\s*([^\\n\\r\\.]+)`, "gi");

  for (const match of text.matchAll(sectionRegex)) {
    const sectionText = match[1].toLowerCase();

    for (const skill of dictionary) {
      if (sectionText.includes(skill)) {
        extractedSkills.add(skill);
      }
    }
  }

  return extractedSkills;
}

function extractJobYears(jobDescription: string): number | null {
  const match = jobDescription.match(/(\d+)\+?\s*(year|years)/i);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function extractResumeYears(resumeText: string): number {
  const matches = resumeText.matchAll(/(\d+)\s*(year|years|month|months)/gi);
  let totalYears = 0;

  for (const match of matches) {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === "month" || unit === "months") {
      totalYears += value / 12;
    } else {
      totalYears += value;
    }
  }

  return totalYears;
}

function getExperienceAlignmentScore(jdYears: number | null, resumeYears: number): number {
  if (jdYears === null) {
    return 50;
  }

  if (resumeYears >= jdYears) {
    return 100;
  }

  if (resumeYears >= 0.75 * jdYears) {
    return 70;
  }

  if (resumeYears >= 0.5 * jdYears) {
    return 40;
  }

  return 10;
}

function getReadinessLevel(finalScore: number): string {
  if (finalScore >= 85) {
    return "Highly Competitive";
  }

  if (finalScore >= 70) {
    return "Strong Candidate";
  }

  if (finalScore >= 55) {
    return "Moderate Fit";
  }

  if (finalScore >= 40) {
    return "Needs Improvement";
  }

  return "Low Alignment";
}

function createEmptyInsights(): AiInsights {
  return {
    analysisBreakdown: {
      skillsMatch: [],
      experienceStrength: [],
      impactAndMetrics: [],
      professionalBranding: []
    },
    immediateActionChecklist: [],
    interviewQuestions: {
      technicalQuestions: [],
      behavioralQuestions: [],
      projectBasedQuestions: []
    },
    professionalSummarySuggestion: "",
    atsCompatibilityExplanation: ""
  };
}

function safeParseInsights(raw: string): AiInsights | null {
  try {
    const parsed = JSON.parse(raw) as AiInsights;
    if (
      parsed &&
      parsed.analysisBreakdown &&
      Array.isArray(parsed.analysisBreakdown.skillsMatch) &&
      Array.isArray(parsed.analysisBreakdown.experienceStrength) &&
      Array.isArray(parsed.analysisBreakdown.impactAndMetrics) &&
      Array.isArray(parsed.analysisBreakdown.professionalBranding) &&
      Array.isArray(parsed.immediateActionChecklist) &&
      parsed.interviewQuestions &&
      Array.isArray(parsed.interviewQuestions.technicalQuestions) &&
      Array.isArray(parsed.interviewQuestions.behavioralQuestions) &&
      Array.isArray(parsed.interviewQuestions.projectBasedQuestions) &&
      typeof parsed.professionalSummarySuggestion === "string" &&
      typeof parsed.atsCompatibilityExplanation === "string"
    ) {
      return parsed;
    }
  } catch {
    // Fall through to null for safe handling.
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AnalyzeRequestBody>;
    const resumeText = body.resumeText ?? "";
    const jobDescription = body.jobDescription ?? "";

    if (!resumeText || !jobDescription) {
      return jsonResponse(
        { error: "resumeText and jobDescription are required." },
        { status: 400 }
      );
    }

    const resumeLower = resumeText.toLowerCase();
    const jdLower = jobDescription.toLowerCase();

    const jdSkills = techDictionary.filter((skill) => jdLower.includes(skill));
    const resumeSkills = techDictionary.filter((skill) => resumeLower.includes(skill));

    const explicitRequired = extractSectionSkills(jdLower, REQUIRED_SECTION_HEADERS, techDictionary);
    const explicitPreferred = extractSectionSkills(jdLower, PREFERRED_SECTION_HEADERS, techDictionary);

    const requiredSkillsSet = new Set<string>();
    const preferredSkillsSet = new Set<string>();

    if (explicitRequired.size === 0) {
      for (const skill of jdSkills) {
        requiredSkillsSet.add(skill);
      }
    } else {
      for (const skill of explicitRequired) {
        requiredSkillsSet.add(skill);
      }
    }

    for (const skill of explicitPreferred) {
      if (!requiredSkillsSet.has(skill)) {
        preferredSkillsSet.add(skill);
      }
    }

    const requiredSkills = Array.from(requiredSkillsSet);
    const preferredSkills = Array.from(preferredSkillsSet);

    const matchedRequiredSkills = requiredSkills.filter((skill) => resumeSkills.includes(skill));
    const matchedPreferredSkills = preferredSkills.filter((skill) => resumeSkills.includes(skill));

    const missingRequiredSkills = requiredSkills.filter((skill) => !resumeSkills.includes(skill));
    const missingPreferredSkills = preferredSkills.filter((skill) => !resumeSkills.includes(skill));

    const roadmapRecommendationSet = new Set<string>();

    for (const skill of [...missingRequiredSkills, ...missingPreferredSkills]) {
      const roadmapModule = roadmapMap[skill];
      if (roadmapModule) {
        roadmapRecommendationSet.add(roadmapModule);
      }
    }

    const roadmapRecommendations = Array.from(roadmapRecommendationSet);

    const requiredSkillScore =
      requiredSkills.length > 0 ? (matchedRequiredSkills.length / requiredSkills.length) * 100 : 100;

    const preferredSkillScore =
      preferredSkills.length > 0 ? (matchedPreferredSkills.length / preferredSkills.length) * 100 : 0;

    const hasImpactNumbers = /\d+/.test(resumeText);
    const impactScore = hasImpactNumbers ? 100 : 0;

    const hasExperienceKeywords = /\b(intern|internship|experience|worked)\b/i.test(resumeText);
    const experienceScore = hasExperienceKeywords ? 100 : 0;

    const hasProfessionalLinks = /(github\.com|linkedin\.com\/in)/i.test(resumeText);
    const professionalScore = hasProfessionalLinks ? 100 : 0;

    const jdYears = extractJobYears(jobDescription);
    const resumeYears = extractResumeYears(resumeText);
    const experienceAlignmentScore = getExperienceAlignmentScore(jdYears, resumeYears);

    const finalScore =
      requiredSkillScore * 0.55 +
      preferredSkillScore * 0.15 +
      experienceAlignmentScore * 0.15 +
      impactScore * 0.1 +
      professionalScore * 0.05;

    const readinessLevel = getReadinessLevel(finalScore);

    let aiInsights = createEmptyInsights();
    const openAiKey = process.env.OPENAI_API_KEY;
    const openAiModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    if (openAiKey) {
      const aiPayload = {
        model: openAiModel,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a professional resume reviewer. Respond only with strict JSON that matches the required schema. " +
              "Be concise, structured, and avoid long paragraphs. Use short bullets, highlight exact changes needed, and include example rewrites."
          },
          {
            role: "user",
            content:
              "Create structured resume feedback using the following inputs.\n" +
              "Return JSON only with this schema:\n" +
              "{\n" +
              '  "analysisBreakdown": {\n' +
              '    "skillsMatch": [],\n' +
              '    "experienceStrength": [],\n' +
              '    "impactAndMetrics": [],\n' +
              '    "professionalBranding": []\n' +
              "  },\n" +
              '  "immediateActionChecklist": [],\n' +
              '  "interviewQuestions": {\n' +
              '    "technicalQuestions": [],\n' +
              '    "behavioralQuestions": [],\n' +
              '    "projectBasedQuestions": []\n' +
              "  },\n" +
              '  "professionalSummarySuggestion": "",\n' +
              '  "atsCompatibilityExplanation": ""\n' +
              "}\n\n" +
              "Inputs:\n" +
              `Resume Text: ${resumeText}\n` +
              `Job Description: ${jobDescription}\n` +
              `Required Skills: ${requiredSkills.join(", ") || "None"}\n` +
              `Preferred Skills: ${preferredSkills.join(", ") || "None"}\n` +
              `Missing Skills: ${[...missingRequiredSkills, ...missingPreferredSkills].join(", ") || "None"}\n` +
              `Final Score: ${Number(finalScore.toFixed(2))}\n` +
              `Experience Alignment Score: ${experienceAlignmentScore}\n`
          }
        ]
      };

      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`
        },
        body: JSON.stringify(aiPayload)
      });

      if (aiResponse.ok) {
        const aiJson = (await aiResponse.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const aiContent = aiJson.choices?.[0]?.message?.content ?? "";
        const parsedInsights = safeParseInsights(aiContent);
        if (parsedInsights) {
          aiInsights = parsedInsights;
        }
      }
    }

    const atsScore = Number(finalScore.toFixed(2));
    const missingSkills = [...missingRequiredSkills, ...missingPreferredSkills];
    const improvements: string[] = [];
    if (!hasImpactNumbers) improvements.push("Add metrics and quantifiable impact to achievements.");
    if (!hasProfessionalLinks) improvements.push("Include professional links such as GitHub and LinkedIn.");
    if (missingSkills.length > 0) improvements.push(`Address missing skills: ${missingSkills.join(", ")}`);
    if (aiInsights.immediateActionChecklist.length > 0) {
      for (const item of aiInsights.immediateActionChecklist) improvements.push(item);
    }
    const interviewQuestions = [
      ...aiInsights.interviewQuestions.technicalQuestions,
      ...aiInsights.interviewQuestions.behavioralQuestions,
      ...aiInsights.interviewQuestions.projectBasedQuestions
    ];
    let improvedResumeSuggestion = aiInsights.professionalSummarySuggestion;
    if (!improvedResumeSuggestion || improvedResumeSuggestion.trim().length === 0) {
      const topSkills = jdSkills.slice(0, 6);
      improvedResumeSuggestion =
        `Results-driven professional aligning to the job requirements. Highlights: ${topSkills.join(", ")}. ` +
        `Emphasize outcomes with metrics, showcase relevant projects, and surface experience that matches the required skills.`;
    }

    return jsonResponse({
      finalScore: atsScore,
      readinessLevel,
      requiredSkillScore: Number(requiredSkillScore.toFixed(2)),
      preferredSkillScore: Number(preferredSkillScore.toFixed(2)),
      experienceScore,
      experienceAlignmentScore,
      impactScore,
      professionalScore,
      missingRequiredSkills,
      missingPreferredSkills,
      roadmapRecommendations,
      aiInsights,
      atsScore,
      missingSkills,
      improvements,
      interviewQuestions,
      improvedResumeSuggestion
    });
  } catch {
    return jsonResponse({ error: "Invalid request body." }, { status: 400 });
  }
}
