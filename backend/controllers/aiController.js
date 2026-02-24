const InterviewAttempt = require("../models/InterviewAttempt");
const RoadmapPlan = require("../models/RoadmapPlan");
const { ROADMAPS } = require("../config/roadmaps");
const { RECOMMENDED_COURSES } = require("../config/recommendedCourses");
const { getGeminiClient } = require("../services/geminiClient");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const clampScore = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(5, Math.round(num)));
};

const extractJson = (text) => {
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (_) {
    return null;
  }
};

const getTextFromResult = (result) => {
  if (!result) return "";
  if (typeof result.text === "string") return result.text;
  const candidate = result.candidates && result.candidates[0];
  const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
  return (part && part.text) || "";
};

async function generateJsonWithGemini({ prompt, schema, temperature = 0.2 }) {
  const { ai, Type } = await getGeminiClient();
  const model = DEFAULT_MODEL;
  const contents = [{ role: "user", parts: [{ text: prompt }] }];

  try {
    const result = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    const text = getTextFromResult(result);
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    const fallback = await ai.models.generateContent({
      model,
      contents,
      config: { temperature }
    });
    const text = getTextFromResult(fallback);
    const parsed = extractJson(text);
    if (!parsed) {
      throw new Error("AI response could not be parsed");
    }
    return parsed;
  }
}

exports.generateInterviewQuestion = async (req, res) => {
  try {
    const { domain, type, difficulty } = req.body || {};
    if (!domain) {
      return res.status(400).json({ success: false, message: "domain is required" });
    }

    const prompt = `You are an interview coach. Create ONE ${type || "technical"} interview question for the domain: ${domain}. Difficulty: ${difficulty || "medium"}.
- Keep it concise (1-2 sentences).
- No multiple questions.
- Output ONLY the question text.`;

    const { ai } = await getGeminiClient();
    const result = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.6 }
    });

    const question = getTextFromResult(result).trim();
    if (!question) {
      return res.status(500).json({ success: false, message: "Failed to generate question" });
    }

    return res.status(200).json({ success: true, data: { question } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.scoreInterviewResponse = async (req, res) => {
  try {
    const { domain, question, response } = req.body || {};
    if (!domain || !question || !response) {
      return res.status(400).json({
        success: false,
        message: "domain, question, and response are required"
      });
    }

    const { Type } = await getGeminiClient();

    const schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
        scores: {
          type: Type.OBJECT,
          properties: {
            communication: { type: Type.INTEGER },
            correctness: { type: Type.INTEGER },
            structure: { type: Type.INTEGER },
            depth: { type: Type.INTEGER },
            tradeoffs: { type: Type.INTEGER },
            systemsThinking: { type: Type.INTEGER },
            problemSolving: { type: Type.INTEGER }
          },
          required: [
            "communication",
            "correctness",
            "structure",
            "depth",
            "tradeoffs",
            "systemsThinking",
            "problemSolving"
          ]
        }
      },
      required: ["summary", "strengths", "improvements", "scores"]
    };

    const prompt = `You are an interview coach. Score the candidate response using 0-5 for each competency.
Return JSON ONLY matching the schema.

Domain: ${domain}
Question: ${question}
Response: ${response}

Rubric:
- communication: clarity and conciseness
- correctness: technical accuracy
- structure: organized answer
- depth: explanation depth
- tradeoffs: discusses alternatives
- systemsThinking: considers scale, constraints, or architecture
- problemSolving: reasoning quality
`;

    const result = await generateJsonWithGemini({ prompt, schema, temperature: 0.2 });
    const scores = result.scores || {};

    const normalizedScores = {
      communication: clampScore(scores.communication),
      correctness: clampScore(scores.correctness),
      structure: clampScore(scores.structure),
      depth: clampScore(scores.depth),
      tradeoffs: clampScore(scores.tradeoffs),
      systemsThinking: clampScore(scores.systemsThinking),
      problemSolving: clampScore(scores.problemSolving)
    };

    const attempt = await InterviewAttempt.create({
      user: req.user.id,
      domain,
      question,
      response,
      scores: normalizedScores,
      summary: result.summary || "",
      strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 6) : [],
      improvements: Array.isArray(result.improvements) ? result.improvements.slice(0, 6) : []
    });

    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        summary: attempt.summary,
        strengths: attempt.strengths,
        improvements: attempt.improvements,
        scores: normalizedScores
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInterviewHeatmap = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 8), 20);
    const attempts = await InterviewAttempt.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const competencies = [
      "communication",
      "correctness",
      "structure",
      "depth",
      "tradeoffs",
      "systemsThinking",
      "problemSolving"
    ];

    const averages = competencies.reduce((acc, key) => {
      const values = attempts.map((a) => Number(a.scores?.[key] || 0));
      const avg = values.length
        ? Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10
        : 0;
      acc[key] = avg;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        competencies,
        attempts: attempts.map((a) => ({
          id: a._id,
          createdAt: a.createdAt,
          scores: a.scores || {}
        })),
        averages
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateRoadmapPlan = async (req, res) => {
  try {
    const { goalText, timeframeWeeks, domain } = req.body || {};
    if (!goalText || !timeframeWeeks || !domain) {
      return res.status(400).json({
        success: false,
        message: "goalText, timeframeWeeks, and domain are required"
      });
    }

    const roadmap = ROADMAPS[domain];
    if (!roadmap) {
      return res.status(400).json({ success: false, message: "Invalid domain" });
    }

    const weeks = Math.max(2, Math.min(52, Number(timeframeWeeks)));
    const courses = RECOMMENDED_COURSES[domain] || [];

    const roadmapItems = [];
    ["beginner", "intermediate", "advanced"].forEach((stage) => {
      const section = roadmap[stage];
      if (!section) return;
      ["skills", "resources", "projects"].forEach((type) => {
        section[type].forEach((label) => {
          roadmapItems.push({ stage, type, label });
        });
      });
    });

    const { Type } = await getGeminiClient();

    const schema = {
      type: Type.OBJECT,
      properties: {
        domain: { type: Type.STRING },
        timeframeWeeks: { type: Type.INTEGER },
        plan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              week: { type: Type.INTEGER },
              focus: { type: Type.STRING },
              roadmapItems: { type: Type.ARRAY, items: { type: Type.STRING } },
              courseIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              milestone: { type: Type.STRING }
            },
            required: ["week", "focus", "roadmapItems", "courseIds", "milestone"]
          }
        }
      },
      required: ["domain", "timeframeWeeks", "plan"]
    };

    const prompt = `You are a learning planner. Build a ${weeks}-week plan for the goal: "${goalText}".
Domain: ${domain}.
Use ONLY the roadmap items and course IDs provided. Distribute them across weeks.
Output JSON ONLY matching the schema.

Roadmap items:
${roadmapItems.map((item) => `- ${item.label} (${item.stage}/${item.type})`).join("\n")}

Courses (use courseIds only):
${courses.map((c) => `- ${c.id}: ${c.title}`).join("\n")}
`;

    const result = await generateJsonWithGemini({ prompt, schema, temperature: 0.3 });

    const plan = Array.isArray(result.plan) ? result.plan : [];

    const courseIndex = new Map(courses.map((c) => [c.id, c]));
    const normalizedPlan = plan.map((week) => ({
      week: Number(week.week) || 1,
      focus: String(week.focus || ""),
      milestone: String(week.milestone || ""),
      roadmapItems: Array.isArray(week.roadmapItems) ? week.roadmapItems.slice(0, 6) : [],
      courses: Array.isArray(week.courseIds)
        ? week.courseIds
            .map((id) => courseIndex.get(id))
            .filter(Boolean)
        : []
    }));

    const saved = await RoadmapPlan.create({
      user: req.user.id,
      goalText,
      timeframeWeeks: weeks,
      domain,
      plan: normalizedPlan
    });

    return res.status(200).json({
      success: true,
      data: {
        planId: saved._id,
        goalText,
        timeframeWeeks: weeks,
        domain,
        plan: normalizedPlan
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
