import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractTextFromResponse(response) {
  if (!response || typeof response !== "object") return "";

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  if (Array.isArray(response.output)) {
    const chunks = [];

    for (const item of response.output) {
      if (!item || typeof item !== "object") continue;
      if (!Array.isArray(item.content)) continue;

      for (const content of item.content) {
        if (!content || typeof content !== "object") continue;

        if (typeof content.text === "string" && content.text.trim()) {
          chunks.push(content.text.trim());
        }
      }
    }

    if (chunks.length) {
      return chunks.join("\n").trim();
    }
  }

  return "";
}

// ----------------------------------
// Existing cast route
// ----------------------------------

app.post("/api/cast", async (req, res) => {
  try {
    const question = req.body?.question?.trim();

    if (!question) {
      return res.status(400).json({ error: "A question is required." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY on the server." });
    }

    const prompt = `
You are Eidomancer, a symbolic reflection system.

Return ONLY valid JSON with this exact shape:
{
  "title": "short evocative title",
  "pattern": "2-4 sentences",
  "tension": "2-4 sentences",
  "insight": "2-4 sentences",
  "advice": "2-4 sentences",
  "echo": "1-3 sentences"
}

Guidelines:
- Be direct, poetic, readable, and grounded.
- Do not be vague on purpose.
- Do not claim supernatural certainty.
- Make the response feel like a symbolic reading rooted in human reality.
- Keep each field concise but meaningful.

Question: ${question}
`.trim();

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Eidomancer. Return only JSON. No markdown. No commentary outside the JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({ error: "Model returned an empty response." });
    }

    const parsed = safeParseJson(content);

    if (!parsed || typeof parsed !== "object") {
      return res.status(500).json({
        error: "Model returned invalid JSON.",
        raw: content,
      });
    }

    return res.json({
      title: parsed.title || "Untitled Cast",
      pattern: parsed.pattern || "",
      tension: parsed.tension || "",
      insight: parsed.insight || "",
      advice: parsed.advice || "",
      echo: parsed.echo || "",
      raw: content,
    });
  } catch (error) {
    console.error("Cast error:", error);
    return res.status(500).json({
      error: error?.message || "The cast failed on the server.",
    });
  }
});

// ----------------------------------
// New generic generation route
// Used by castEngine.js
// ----------------------------------

app.post("/api/generate", async (req, res) => {
  try {
    const prompt = req.body?.prompt?.trim();

    if (!prompt) {
      return res.status(400).json({ error: "A prompt is required." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY on the server." });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
    });

    const text = extractTextFromResponse(response);

    if (!text) {
      return res.status(500).json({
        error: "Model returned an empty response.",
        raw: response,
      });
    }

    return res.json({ text });
  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({
      error: error?.message || "The generate request failed on the server.",
    });
  }
});

app.listen(port, () => {
  console.log(`Eidomancer server listening on port ${port}`);
});