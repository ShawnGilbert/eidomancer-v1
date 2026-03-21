import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      output_format: "png",
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return res.status(500).json({ error: "No image returned from API" });
    }

    const dataUrl = `data:image/png;base64,${imageBase64}`;

    res.json({ imageUrl: dataUrl });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({
      error: error?.message || "Image generation failed",
    });
  }
});

app.listen(port, () => {
  console.log(`Image server running at http://localhost:${port}`);
});