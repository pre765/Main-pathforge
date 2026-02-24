let cached = null;

async function getGeminiClient() {
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in .env");
  }

  const mod = await import("@google/genai");
  const { GoogleGenAI, Type } = mod;
  const ai = new GoogleGenAI({ apiKey });
  cached = { ai, Type };
  return cached;
}

module.exports = {
  getGeminiClient
};
