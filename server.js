import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { processAgentRequest } from "./src/lib/agentProtocol.js";
import { processAgentRequestV02 } from "./src/lib/agentProtocolV02.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");

const app = express();
const port = process.env.PORT || 3001;
const imageModel = process.env.IMAGE_MODEL || "gpt-image-1";
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/ai/status", async (_req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        connected: false,
        provider: "openai",
        reason: "Missing OPENAI_API_KEY on the server.",
      });
    }

    return res.status(200).json({
      connected: true,
      provider: "openai",
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    });
  } catch (error) {
    return res.status(500).json({
      connected: false,
      provider: "openai",
      reason: error?.message || "Unknown status error.",
    });
  }
});

// Stable, machine-readable entry point for other agents. This route is local
// and deterministic by default; callers may optionally supply prior model
// intelligence in the request for Eidomancer to refract.
app.post("/api/v1/lens", async (req, res) => {
  const result = await processAgentRequest(req.body);
  return res.status(result.ok ? 200 : 400).json(result);
});

// v0.2 preserves v0.1 while making intelligence, lens doctrine, and
// presentation separate protocol layers.
app.post("/api/v2/lens", async (req, res) => {
  const result = await processAgentRequestV02(req.body);
  return res.status(result.ok ? 200 : 400).json(result);
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

const imageOutputTypes = {
  echo: {
    aspectRatio: "16:9",
    size: "1536x1024",
  },
  specterr: {
    aspectRatio: "16:9",
    size: "1536x1024",
  },
  coreCard: {
    aspectRatio: "2:3",
    size: "1024x1536",
  },
};

function getImageDataUrl(image) {
  const imageData = image?.data?.[0];

  if (imageData?.b64_json) {
    return `data:image/png;base64,${imageData.b64_json}`;
  }

  return imageData?.url || "";
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
// Generic generation route
// Used by castEngine.js
// ----------------------------------

app.post("/api/generate", async (req, res) => {
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const imagePrompt =
      typeof req.body?.imagePrompt === "string"
        ? req.body.imagePrompt.trim()
        : "";

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY on the server." });
    }

    // IMAGE GENERATION
    if (imagePrompt && !prompt) {
      const image = await openai.images.generate({
        model: "gpt-image-1",
        prompt: imagePrompt,
        size: "1024x1024",
      });

      const imageData = image?.data?.[0];
      let imageUrl = "";

      if (imageData?.url) {
        imageUrl = imageData.url;
      } else if (imageData?.b64_json) {
        imageUrl = `data:image/png;base64,${imageData.b64_json}`;
      }

      if (!imageUrl) {
        return res.status(500).json({
          error: "Image generation failed.",
          raw: image,
        });
      }

      return res.json({ imageUrl });
    }

    // TEXT GENERATION
    if (prompt) {
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
    }

    return res.status(400).json({ error: "No prompt provided." });
  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({
      error: error?.message || "The generate request failed on the server.",
    });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    if (process.env.IMAGE_GENERATION_ENABLED !== "true") {
      return res.status(503).json({
        error: "Image generation is disabled for this alpha.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY on the server.",
      });
    }

    const kind = typeof req.body?.kind === "string" ? req.body.kind.trim() : "";
    const prompt =
      typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const aspectRatio =
      typeof req.body?.aspectRatio === "string"
        ? req.body.aspectRatio.trim()
        : "";
    const outputType = imageOutputTypes[kind];

    if (!outputType) {
      return res.status(400).json({
        error: "Image kind must be echo, coreCard, or specterr.",
      });
    }

    if (!prompt) {
      return res.status(400).json({
        error: "Image prompt is required.",
      });
    }

    if (aspectRatio !== outputType.aspectRatio) {
      return res.status(400).json({
        error: `Image aspectRatio for ${kind} must be ${outputType.aspectRatio}.`,
      });
    }

    const image = await openai.images.generate({
      model: imageModel,
      prompt,
      size: outputType.size,
    });
    const imageUrl = getImageDataUrl(image);

    if (!imageUrl) {
      return res.status(500).json({
        error: "Image generation failed.",
      });
    }

    return res.json({
      imageUrl,
      kind,
      aspectRatio,
      model: imageModel,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    // Keep image failures diagnosable without logging prompts or API keys.
    console.error("Image generation error:", {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      causeCode: error?.cause?.code,
      causeErrno: error?.cause?.errno,
      causeType: error?.cause?.type,
      stack: error?.stack?.split("\n").slice(0, 3).join("\n"),
    });
    return res.status(500).json({
      error: "Image generation failed.",
    });
  }
});

if (fs.existsSync(indexPath)) {
  app.use(express.static(distPath));

  app.get("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}

app.listen(port, () => {
  console.log(`Eidomancer server listening on port ${port}`);
});
