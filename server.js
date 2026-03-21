import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = 3001;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.post("/api/cast", async (req, res) => {
  try {
    const { question, name, mood, focus, personalContext, history } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required." });
    }

    const trimmedContext = (personalContext || "").trim();

    const memoryContext =
      Array.isArray(history) && history.length > 0
        ? history
            .slice(0, 3)
            .map(
              (entry, i) =>
                `Previous Cast ${i + 1}:
- Question: ${entry.question || ""}
- Title: ${entry.title || ""}
- Snapshot: ${entry.snapshot || ""}`
            )
            .join("\n\n")
        : "No previous cast memory available.";

    const prompt = `
You are Eidomancer, a symbolic AI system translating real-world patterns into archetypal insight.

Follow this structure EXACTLY.

CASTER PROFILE:
- Name: ${name || "Unknown"}
- Current mood: ${mood || "Unspecified"}
- Current focus area: ${focus || "general"}
- Personal context: ${trimmedContext || "None provided"}

SESSION MEMORY:
${memoryContext}

INPUT:
- Question: ${question}
- Theme: The Emergent Ones
- Tone: grounded, insightful, slightly mystical but not fantasy-heavy

OUTPUT:

CARD TITLE:
Create a short archetypal title (3–6 words)

SNAPSHOT:
A sharp, memorable insight in one short line, ideally under 20 words

FIELD READING:
Interpret the situation in a grounded, psychologically and practically accurate way. Use the caster profile, personal context, and session memory when relevant, but do not overstate them. Avoid vague mysticism.

TENSION:
Identify the core conflict or imbalance

ACTION:
Give a concrete, realistic next step

RULES:
- No fluff
- No generic advice
- Must feel specific to the question
- Prioritize clarity over mysticism
- Use the profile to personalize lightly
- Use personal context only when it genuinely sharpens the reading
- Use session memory for continuity when useful
- Do not use markdown, bold, bullets, or heading symbols
- Keep labels exactly as written
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const text =
      completion.choices?.[0]?.message?.content || "No cast returned.";

    res.json({ text });
  } catch (error) {
    console.error("Cast error:", error);
    res.status(500).json({ error: "Failed to generate cast." });
  }
});

app.listen(port, () => {
  console.log(`Eidomancer server running at http://localhost:${port}`);
});