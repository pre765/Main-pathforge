const { execFile } = require("node:child_process");
const { mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const techDictionary = [
  "python",
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "scikit-learn",
  "natural language processing",
  "computer vision",
  "react",
  "next.js",
  "javascript",
  "typescript",
  "node",
  "express",
  "html",
  "css",
  "cybersecurity",
  "network security",
  "penetration testing",
  "ethical hacking",
  "cryptography",
  "siem",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "ci/cd",
  "terraform",
  "linux",
  "sql",
  "mongodb",
  "pandas",
  "numpy",
  "data visualization",
  "statistics",
  "git"
];

const roadmapMap = {
  python: "AI/ML -> Python Programming",
  "machine learning": "AI/ML -> Machine Learning Foundations",
  "deep learning": "AI/ML -> Deep Learning Core Concepts",
  tensorflow: "AI/ML -> Deep Learning Module",
  pytorch: "AI/ML -> Deep Learning with PyTorch",
  "scikit-learn": "AI/ML -> Classical ML with scikit-learn",
  "natural language processing": "AI/ML -> NLP Fundamentals",
  "computer vision": "AI/ML -> Computer Vision Fundamentals",
  react: "Web Dev -> React Essentials",
  "next.js": "Web Dev -> Next.js Full Stack",
  javascript: "Web Dev -> JavaScript Fundamentals",
  typescript: "Web Dev -> TypeScript for Web Apps",
  node: "Web Dev -> Backend with Node.js",
  express: "Web Dev -> API Development with Express",
  html: "Web Dev -> HTML Foundations",
  css: "Web Dev -> CSS Layout and Responsive Design",
  cybersecurity: "Cybersecurity -> Security Fundamentals",
  "network security": "Cybersecurity -> Network Security Basics",
  "penetration testing": "Cybersecurity -> Penetration Testing Intro",
  "ethical hacking": "Cybersecurity -> Ethical Hacking Practices",
  cryptography: "Cybersecurity -> Applied Cryptography",
  siem: "Cybersecurity -> SIEM and Monitoring",
  docker: "DevOps -> Docker Fundamentals",
  kubernetes: "DevOps -> Kubernetes Orchestration",
  aws: "Cloud -> AWS Basics",
  azure: "Cloud -> Azure Fundamentals",
  "ci/cd": "DevOps -> CI/CD Pipelines",
  terraform: "DevOps -> Infrastructure as Code",
  linux: "DevOps -> Linux for Engineers",
  sql: "Data Science -> SQL for Data Analysis",
  mongodb: "Data Engineering -> NoSQL with MongoDB",
  pandas: "Data Science -> Data Analysis with pandas",
  numpy: "Data Science -> Numerical Computing with NumPy",
  "data visualization": "Data Science -> Data Visualization Essentials",
  statistics: "Data Science -> Statistics for Analytics",
  git: "Software Engineering -> Version Control with Git"
};

const MAX_BYTES = 10 * 1024 * 1024;
const REQUIRED_SECTION_HEADERS = ["must have", "required"];
const PREFERRED_SECTION_HEADERS = ["nice to have", "preferred"];

function isPdf(buffer) {
  return buffer.subarray(0, 4).toString() === "%PDF";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSectionSkills(text, headers, dictionary) {
  const extractedSkills = new Set();
  const headerPattern = headers.map((header) => escapeRegExp(header)).join("|");
  const sectionRegex = new RegExp(`(?:${headerPattern})\\s*:\\s*([^\\n\\r\\.]+)`, "gi");

  for (const match of text.matchAll(sectionRegex)) {
    const sectionText = match[1].toLowerCase();
    for (const skill of dictionary) {
      if (sectionText.includes(skill)) extractedSkills.add(skill);
    }
  }

  return extractedSkills;
}

function extractJobYears(jobDescription) {
  const match = jobDescription.match(/(\d+)\+?\s*(year|years)/i);
  return match ? Number(match[1]) : null;
}

function extractResumeYears(resumeText) {
  const matches = resumeText.matchAll(/(\d+)\s*(year|years|month|months)/gi);
  let totalYears = 0;
  for (const match of matches) {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    totalYears += unit === "month" || unit === "months" ? value / 12 : value;
  }
  return totalYears;
}

function getExperienceAlignmentScore(jdYears, resumeYears) {
  if (jdYears === null) return 50;
  if (resumeYears >= jdYears) return 100;
  if (resumeYears >= 0.75 * jdYears) return 70;
  if (resumeYears >= 0.5 * jdYears) return 40;
  return 10;
}

function getReadinessLevel(finalScore) {
  if (finalScore >= 85) return "Highly Competitive";
  if (finalScore >= 70) return "Strong Candidate";
  if (finalScore >= 55) return "Moderate Fit";
  if (finalScore >= 40) return "Needs Improvement";
  return "Low Alignment";
}

function createFallbackAiInsights(missingSkills, requiredSkills, resumeYears) {
  return {
    analysisBreakdown: {
      skillsMatch: missingSkills.length
        ? [`Missing skills: ${missingSkills.join(", ")}`]
        : ["Required and preferred skills are largely covered."],
      experienceStrength: resumeYears > 0
        ? [`Detected about ${resumeYears.toFixed(1)} years of stated experience.`]
        : ["Add explicit years of experience to improve recruiter confidence."],
      impactAndMetrics: ["Add measurable results using numbers (%, time saved, revenue, users)."],
      professionalBranding: ["Include GitHub/LinkedIn profile links and a concise summary headline."]
    },
    immediateActionChecklist: [
      ...(missingSkills.length ? [`Add evidence for: ${missingSkills.slice(0, 6).join(", ")}`] : []),
      "Rewrite bullets using action + impact format.",
      "Tailor summary line to this role."
    ],
    interviewQuestions: {
      technicalQuestions: requiredSkills.slice(0, 5).map((skill) => `How have you used ${skill} in production?`),
      behavioralQuestions: [
        "Tell me about a time you handled a difficult technical tradeoff.",
        "Describe a project where you had to learn quickly."
      ],
      projectBasedQuestions: [
        "Walk me through your most relevant project and outcomes.",
        "What would you improve if you rebuilt that project today?"
      ]
    },
    professionalSummarySuggestion:
      "Results-driven engineer with role-relevant technical strengths, project delivery experience, and measurable impact across key initiatives.",
    atsCompatibilityExplanation:
      "ATS compatibility improves when your resume mirrors required job keywords and includes quantified achievements."
  };
}

function buildAnalysis(resumeText, jobDescription) {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  const jdSkills = techDictionary.filter((skill) => jdLower.includes(skill));
  const resumeSkills = techDictionary.filter((skill) => resumeLower.includes(skill));

  const explicitRequired = extractSectionSkills(jdLower, REQUIRED_SECTION_HEADERS, techDictionary);
  const explicitPreferred = extractSectionSkills(jdLower, PREFERRED_SECTION_HEADERS, techDictionary);

  const requiredSkillsSet = new Set();
  const preferredSkillsSet = new Set();

  if (explicitRequired.size === 0) {
    for (const skill of jdSkills) requiredSkillsSet.add(skill);
  } else {
    for (const skill of explicitRequired) requiredSkillsSet.add(skill);
  }

  for (const skill of explicitPreferred) {
    if (!requiredSkillsSet.has(skill)) preferredSkillsSet.add(skill);
  }

  const requiredSkills = Array.from(requiredSkillsSet);
  const preferredSkills = Array.from(preferredSkillsSet);

  const matchedRequiredSkills = requiredSkills.filter((skill) => resumeSkills.includes(skill));
  const matchedPreferredSkills = preferredSkills.filter((skill) => resumeSkills.includes(skill));

  const missingRequiredSkills = requiredSkills.filter((skill) => !resumeSkills.includes(skill));
  const missingPreferredSkills = preferredSkills.filter((skill) => !resumeSkills.includes(skill));

  const roadmapRecommendationSet = new Set();
  for (const skill of [...missingRequiredSkills, ...missingPreferredSkills]) {
    const roadmapModule = roadmapMap[skill];
    if (roadmapModule) roadmapRecommendationSet.add(roadmapModule);
  }

  const roadmapRecommendations = Array.from(roadmapRecommendationSet);

  const requiredSkillScore = requiredSkills.length > 0 ? (matchedRequiredSkills.length / requiredSkills.length) * 100 : 100;
  const preferredSkillScore = preferredSkills.length > 0 ? (matchedPreferredSkills.length / preferredSkills.length) * 100 : 0;

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
  const atsScore = Number(finalScore.toFixed(2));
  const missingSkills = [...missingRequiredSkills, ...missingPreferredSkills];

  const aiInsights = createFallbackAiInsights(missingSkills, requiredSkills, resumeYears);

  const improvements = [];
  if (!hasImpactNumbers) improvements.push("Add metrics and quantifiable impact to achievements.");
  if (!hasProfessionalLinks) improvements.push("Include professional links such as GitHub and LinkedIn.");
  if (missingSkills.length > 0) improvements.push(`Address missing skills: ${missingSkills.join(", ")}`);
  improvements.push(...aiInsights.immediateActionChecklist);

  const interviewQuestions = [
    ...aiInsights.interviewQuestions.technicalQuestions,
    ...aiInsights.interviewQuestions.behavioralQuestions,
    ...aiInsights.interviewQuestions.projectBasedQuestions
  ];

  return {
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
    improvedResumeSuggestion: aiInsights.professionalSummarySuggestion
  };
}

function getMultipartBoundary(contentType) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return (match?.[1] || match?.[2] || "").trim();
}

function trimLeadingCrlf(buffer) {
  let start = 0;
  while (start + 1 < buffer.length && buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
  return buffer.subarray(start);
}

function trimTrailingCrlf(buffer) {
  let end = buffer.length;
  while (end - 2 >= 0 && buffer[end - 2] === 13 && buffer[end - 1] === 10) end -= 2;
  return buffer.subarray(0, end);
}

function parseMultipartManually(body, boundary) {
  const boundaryMarker = Buffer.from(`--${boundary}`);
  const headerSeparator = Buffer.from("\r\n\r\n");
  const fields = new Map();
  const files = new Map();

  let cursor = 0;
  while (cursor < body.length) {
    const partStart = body.indexOf(boundaryMarker, cursor);
    if (partStart < 0) break;
    const afterBoundary = partStart + boundaryMarker.length;
    if (afterBoundary + 1 < body.length && body[afterBoundary] === 45 && body[afterBoundary + 1] === 45) break;
    const nextBoundary = body.indexOf(boundaryMarker, afterBoundary);
    if (nextBoundary < 0) break;

    let part = body.subarray(afterBoundary, nextBoundary);
    part = trimLeadingCrlf(trimTrailingCrlf(part));
    cursor = nextBoundary;

    const headerEnd = part.indexOf(headerSeparator);
    if (headerEnd < 0) continue;

    const rawHeaders = part.subarray(0, headerEnd).toString("utf8");
    const content = part.subarray(headerEnd + headerSeparator.length);
    const dispositionLine = rawHeaders
      .split("\r\n")
      .find((line) => line.toLowerCase().startsWith("content-disposition:"));
    if (!dispositionLine) continue;

    const nameMatch = dispositionLine.match(/name="([^"]+)"/i);
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];
    const fileNameMatch = dispositionLine.match(/filename="([^"]*)"/i);
    const typeMatch = rawHeaders.match(/content-type:\s*([^\r\n;]+)/i);

    if (fileNameMatch) {
      files.set(fieldName, {
        name: fileNameMatch[1] || "upload.pdf",
        type: typeMatch?.[1] || "",
        size: content.length,
        buffer: content
      });
      continue;
    }

    fields.set(fieldName, content.toString("utf8"));
  }

  return { fields, files };
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function extractTextWithPdfToText(buffer) {
  const dir = await mkdtemp(join(tmpdir(), "resume-upload-"));
  const inputPath = join(dir, "input.pdf");
  const outputPath = join(dir, "output.txt");
  try {
    await writeFile(inputPath, buffer);
    await execFileAsync("pdftotext", ["-layout", "-enc", "UTF-8", inputPath, outputPath]);
    const text = await readFile(outputPath, "utf8");
    return text.trim();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

exports.analyzeResume = async (req, res) => {
  try {
    const resumeText = String(req.body?.resumeText || "").trim();
    const jobDescription = String(req.body?.jobDescription || "").trim();

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "resumeText and jobDescription are required." });
    }

    const result = buildAnalysis(resumeText, jobDescription);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Analyze failed." });
  }
};

exports.uploadResume = async (req, res) => {
  try {
    const contentType = req.headers["content-type"] || "";
    if (!String(contentType).toLowerCase().startsWith("multipart/form-data")) {
      return res.status(415).json({ error: "Content-Type must be multipart/form-data." });
    }

    const boundary = getMultipartBoundary(String(contentType));
    if (!boundary) {
      return res.status(415).json({ error: "Malformed multipart request: missing boundary." });
    }

    const body = await readRawBody(req);
    const parsed = parseMultipartManually(body, boundary);
    const file = parsed.files.get("file") || null;
    const jobDescription = String(parsed.fields.get("jobDescription") || "").trim();

    if (!file) {
      return res.status(400).json({ error: 'Missing file field "file".' });
    }

    if (!jobDescription) {
      return res.status(400).json({ error: "jobDescription text is required." });
    }

    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return res.status(413).json({ error: `PDF too large. Max ${Math.round(MAX_BYTES / (1024 * 1024))}MB.` });
    }

    const fileName = String(file.name || "");
    const fileType = String(file.type || "").toLowerCase();

    const looksLikePdfByType = fileType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
    if (!looksLikePdfByType && !isPdf(file.buffer)) {
      return res.status(415).json({ error: "Only PDF uploads are allowed." });
    }

    if (!isPdf(file.buffer)) {
      return res.status(400).json({ error: "Invalid PDF file." });
    }

    let resumeText = "";
    try {
      resumeText = await extractTextWithPdfToText(file.buffer);
    } catch (error) {
      return res.status(422).json({
        error: "Unable to extract text from this PDF.",
        details: error.message || "pdftotext failed"
      });
    }

    if (!resumeText) {
      return res.status(422).json({ error: "PDF text is empty. Use a text-based PDF (not image-only/scanned)." });
    }

    const result = buildAnalysis(resumeText, jobDescription);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: "Resume upload parsing failed.",
      details: error.message || "Unknown upload error."
    });
  }
};
