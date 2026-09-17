import { buildSeed, generateCastFromSeed } from "./castEngine.js";
import {
  generateCoreCardImagePrompt,
  generateEcho,
  generateFullPackage,
  generateSongPackage,
  generateYouTubePackage,
} from "./packageGenerators.js";

export const PROTOCOL_VERSION = "eidomancer.agent.v0.1";
export const OUTPUT_TYPES = [
  "core_cast",
  "image_prompts",
  "song_package",
  "youtube_package",
  "full_package",
];

const DEFAULT_OUTPUTS = ["core_cast", "image_prompts"];

function text(value, max = 12000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringList(value, maxItems = 20, maxLength = 1000) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((item) => text(item, maxLength)).filter(Boolean);
}

function requestId(value) {
  const supplied = text(value, 120).replace(/[^a-zA-Z0-9._:-]/g, "-");
  return supplied || `cast-${Date.now().toString(36)}`;
}

export function validateAgentRequest(raw) {
  const errors = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, errors: ["Request body must be a JSON object."] };
  }

  const intent = text(raw?.input?.intent, 4000);
  if (!intent) errors.push("input.intent is required and must be a non-empty string.");

  if (raw.outputs !== undefined && !Array.isArray(raw.outputs)) {
    errors.push("outputs must be an array when provided.");
  }

  const unknownOutputs = Array.isArray(raw.outputs)
    ? raw.outputs.filter((value) => !OUTPUT_TYPES.includes(value))
    : [];
  if (unknownOutputs.length) {
    errors.push(`Unsupported outputs: ${unknownOutputs.join(", ")}.`);
  }

  return { valid: errors.length === 0, errors };
}

export function normalizeAgentRequest(raw) {
  const requestedOutputs = Array.isArray(raw.outputs) && raw.outputs.length
    ? [...new Set(raw.outputs)]
    : DEFAULT_OUTPUTS;

  return {
    protocol_version: PROTOCOL_VERSION,
    request_id: requestId(raw.request_id),
    input: {
      intent: text(raw.input.intent, 4000),
      source_material: text(raw.input.source_material, 12000),
      context: stringList(raw.input.context),
      constraints: stringList(raw.input.constraints),
      audience: text(raw.input.audience, 500) || "unspecified",
    },
    intelligence: {
      content: text(raw?.intelligence?.content, 20000),
      provider: text(raw?.intelligence?.provider, 120) || "caller",
      model: text(raw?.intelligence?.model, 120) || "unspecified",
    },
    lens: {
      mode: text(raw?.lens?.mode, 80) || "symbolic-compression",
      tone: text(raw?.lens?.tone, 120) || "reality-first, poetic, grounded",
      theme: text(raw?.lens?.theme, 120) || "The Emergent Ones",
      avoid: stringList(raw?.lens?.avoid, 12, 300),
    },
    outputs: requestedOutputs,
  };
}

function artifactRecord(cast, request) {
  return {
    ...cast,
    question: request.input.intent,
    input: request.input.intent,
    theme: request.lens.theme,
    tone: request.lens.tone,
    sourceContext: request.input.context,
    constraints: request.input.constraints,
  };
}

function artifactEnvelope(type, mediaType, content) {
  return { type, media_type: mediaType, content };
}

export async function processAgentRequest(raw) {
  const validation = validateAgentRequest(raw);
  if (!validation.valid) {
    return {
      ok: false,
      protocol_version: PROTOCOL_VERSION,
      request_id: requestId(raw?.request_id),
      error: { code: "INVALID_REQUEST", details: validation.errors },
    };
  }

  const request = normalizeAgentRequest(raw);
  const combinedContext = [
    request.input.source_material,
    ...request.input.context,
    request.input.constraints.length
      ? `Constraints: ${request.input.constraints.join("; ")}`
      : "",
    request.lens.avoid.length ? `Avoid: ${request.lens.avoid.join("; ")}` : "",
  ].filter(Boolean).join("\n\n");

  const seed = buildSeed({
    question: request.input.intent,
    sourceText: combinedContext,
    userContext: `Audience: ${request.input.audience}. Tone: ${request.lens.tone}.`,
  });
  const cast = await generateCastFromSeed(seed, {
    responseText: request.intelligence.content,
  });
  const record = artifactRecord(cast, request);
  const artifacts = {};

  if (request.outputs.includes("core_cast")) {
    artifacts.core_cast = artifactEnvelope("core_cast", "application/json", cast);
  }
  if (request.outputs.includes("image_prompts")) {
    artifacts.image_prompts = artifactEnvelope("image_prompts", "application/json", {
      core_card: generateCoreCardImagePrompt(record),
      echo: generateEcho(record),
    });
  }
  if (request.outputs.includes("song_package")) {
    artifacts.song_package = artifactEnvelope(
      "song_package", "application/json", generateSongPackage(record)
    );
  }
  if (request.outputs.includes("youtube_package")) {
    artifacts.youtube_package = artifactEnvelope(
      "youtube_package", "application/json", generateYouTubePackage(record)
    );
  }
  if (request.outputs.includes("full_package")) {
    artifacts.full_package = artifactEnvelope(
      "full_package", "text/plain", generateFullPackage(record)
    );
  }

  const usedCallerIntelligence = Boolean(request.intelligence.content);
  const artifactKeys = Object.keys(artifacts);

  return {
    ok: true,
    protocol_version: PROTOCOL_VERSION,
    request_id: request.request_id,
    created_at: new Date().toISOString(),
    pipeline: {
      stages: ["input", "intelligence", "eidomancer_lens", "artifact_package"],
      intelligence_source: usedCallerIntelligence ? "caller_supplied" : "local_deterministic",
      lens_mode: request.lens.mode,
      lens_version: cast?.metadata?.flowVersion || "eidomancer-v1-tension-extraction",
    },
    manifest: artifactKeys.map((key) => ({
      key,
      type: artifacts[key].type,
      media_type: artifacts[key].media_type,
    })),
    artifacts,
    diagnostics: {
      deterministic_mode: !usedCallerIntelligence,
      intelligence_parse_fallback:
        usedCallerIntelligence && Boolean(cast?.metadata?.usedFallback),
      core_tension_key: cast?.metadata?.coreTensionKey || "unknown",
      warnings: usedCallerIntelligence && cast?.metadata?.usedFallback
        ? ["Caller-supplied intelligence was not structured as an Eidomancer cast; deterministic lens output was used."]
        : [],
    },
  };
}
