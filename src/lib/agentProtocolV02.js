import { buildSeed, generateCastFromSeed } from "./castEngine.js";
import {
  generateFullPackageV02,
  generateImagePromptsV02,
  generateSongPackageV02,
  generateYouTubePackageV02,
} from "./packageGeneratorsV02.js";
import {
  CAST_V02_CONTRACT,
  CAST_V02_FIELDS,
  EIDOMANCER_CANON,
  EIDOMANCER_CANON_VERSION,
  buildLensInstructions,
} from "./eidomancerCanon.js";

export const PROTOCOL_VERSION_V02 = "eidomancer.agent.v0.2";
export const EXECUTION_MODES = ["strict_ai", "hybrid", "deterministic_preview"];
export const OUTPUT_TYPES_V02 = [
  "lens_instructions",
  "core_cast",
  "image_prompts",
  "song_package",
  "youtube_package",
  "full_package",
];

const OUTPUT_ALIASES = {
  cast: "core_cast",
  artifact: "core_cast",
  coreCard: "core_cast",
  imagePrompt: "image_prompts",
  song: "song_package",
  youtube: "youtube_package",
  fullPackage: "full_package",
};

function text(value, max = 12000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function list(value, maxItems = 30, maxLength = 1200) {
  return Array.isArray(value)
    ? value.slice(0, maxItems).map((item) => text(item, maxLength)).filter(Boolean)
    : [];
}

function requestId(value) {
  return text(value, 120).replace(/[^a-zA-Z0-9._:-]/g, "-") ||
    `cast-${Date.now().toString(36)}`;
}

function parseObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  const raw = text(value, 40000);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
  }
}

function sectionType(value) {
  const normalized = text(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (["recommendation", "advice", "next_move", "nextmove"].includes(normalized)) {
    return "guidance";
  }
  return normalized;
}

function sectionMap(cast = {}) {
  const map = {};
  for (const section of Array.isArray(cast.sections) ? cast.sections : []) {
    const type = sectionType(section?.type || section?.id || section?.title);
    const content = text(section?.content || section?.body || section?.text, 8000);
    if (type && content) map[type] = content;
  }
  for (const type of CAST_V02_FIELDS) {
    if (!map[type]) map[type] = text(cast[type], 8000);
  }
  map.echo = map.echo || text(cast.echo, 4000);
  return map;
}

function coreCard(cast = {}) {
  const card = cast.core_card || cast.coreCard || {};
  return {
    name: text(card.name || card.title || cast.cardName || cast.title, 300),
    description: text(card.description || card.coreObject, 8000),
    symbolic_object: text(card.symbolic_object || card.symbolicObject, 8000),
    image_prompt: text(card.image_prompt || card.imagePrompt || card.imageGeneration?.prompt, 12000),
  };
}

function inspectCast(cast) {
  if (!cast) return { complete: false, missing: ["intelligence.content"] };
  const sections = sectionMap(cast);
  const card = coreCard(cast);
  const missing = [];
  for (const type of CAST_V02_FIELDS) if (!sections[type]) missing.push(`sections.${type}`);
  if (!sections.echo) missing.push("echo");
  if (!card.name) missing.push("core_card.name");
  if (!card.description) missing.push("core_card.description");
  if (!card.image_prompt) missing.push("core_card.image_prompt");
  return { complete: missing.length === 0, missing, sections, card };
}

function normalizeOutputs(outputs) {
  const source = Array.isArray(outputs) && outputs.length ? outputs : ["core_cast", "image_prompts"];
  return [...new Set(source.map((item) => OUTPUT_ALIASES[item] || item))];
}

export function validateAgentRequestV02(raw) {
  const errors = [];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, errors: ["Request body must be a JSON object."] };
  }
  if (!text(raw?.input?.intent, 4000)) errors.push("input.intent is required.");
  const mode = raw?.execution?.mode || "strict_ai";
  if (!EXECUTION_MODES.includes(mode)) errors.push(`execution.mode must be one of: ${EXECUTION_MODES.join(", ")}.`);
  const viewpoint = raw?.lens?.viewpoint || "personal";
  if (!["personal", "global"].includes(viewpoint)) errors.push("lens.viewpoint must be personal or global.");
  if (raw.outputs !== undefined && !Array.isArray(raw.outputs)) errors.push("outputs must be an array.");
  const unknown = normalizeOutputs(raw.outputs).filter((item) => !OUTPUT_TYPES_V02.includes(item));
  if (unknown.length) errors.push(`Unsupported outputs: ${unknown.join(", ")}.`);
  return { valid: errors.length === 0, errors };
}

export function normalizeAgentRequestV02(raw) {
  const mode = raw?.execution?.mode || "strict_ai";
  return {
    protocol_version: PROTOCOL_VERSION_V02,
    request_id: requestId(raw.request_id),
    execution: { mode },
    input: {
      intent: text(raw.input.intent, 4000),
      source_material: text(raw.input.source_material, 16000),
      constraints: list(raw.input.constraints),
      audience: text(raw.input.audience, 500) || "unspecified",
    },
    intelligence: {
      content: raw?.intelligence?.content ?? "",
      provider: text(raw?.intelligence?.provider, 120) || "unspecified",
      model: text(raw?.intelligence?.model, 120) || "unspecified",
    },
    lens: {
      grounding: "physics_first",
      viewpoint: raw?.lens?.viewpoint || "personal",
      avoid: list(raw?.lens?.avoid, 20, 400),
    },
    evidence: {
      facts: list(raw?.evidence?.facts),
      reported_claims: list(raw?.evidence?.reported_claims),
      inferences: list(raw?.evidence?.inferences),
    },
    memory: {
      facts: list(raw?.memory?.facts),
      reported_claims: list(raw?.memory?.reported_claims),
      continuity_signals: list(raw?.memory?.continuity_signals),
      prior_artifact_ids: list(raw?.memory?.prior_artifact_ids, 50, 200),
    },
    presentation: {
      theme: text(raw?.presentation?.theme, 120) || "eidomancer-default",
      voice: text(raw?.presentation?.voice, 200) || "direct, specific, unsentimental",
      imagery: list(raw?.presentation?.imagery, 20, 300),
      metaphor: list(raw?.presentation?.metaphor, 20, 300),
      visual_language: list(raw?.presentation?.visual_language, 20, 300),
      tone: text(raw?.presentation?.tone, 200) || "grounded symbolic compression",
    },
    outputs: normalizeOutputs(raw.outputs),
  };
}

function intelligenceProvenance(request, supplied = true) {
  if (!supplied) return null;
  return {
    source: "caller_supplied_ai",
    provider: request.intelligence.provider,
    model: request.intelligence.model,
  };
}

function provenance(stage, request, detail = {}) {
  const operations = {
    lens_instruction_generation: "compile_lens_instructions",
    eidomancer_lens: "validate_normalize_and_preserve_meaning",
    package_generation: "derive_package_without_replacing_core_symbol",
  };
  return {
    intelligence: intelligenceProvenance(
      request,
      request.execution.mode !== "deterministic_preview"
    ),
    transformation: {
      stage,
      operation: operations[stage] || "unspecified_transformation",
    },
    ...detail,
  };
}

function normalizeModelCast(parsed, request) {
  const inspected = inspectCast(parsed);
  const sections = CAST_V02_FIELDS.map((type) => ({
    type,
    title: type[0].toUpperCase() + type.slice(1),
    content: inspected.sections[type] || "",
  }));
  return {
    title: inspected.card.name,
    question: request.input.intent,
    sections,
    core_card: {
      name: inspected.card.name,
      description: inspected.card.description,
      ...(inspected.card.symbolic_object
        ? { symbolic_object: inspected.card.symbolic_object }
        : {}),
      image_prompt: inspected.card.image_prompt,
    },
    coreCard: {
      name: inspected.card.name,
      description: inspected.card.description,
      ...(inspected.card.symbolic_object
        ? { symbolicObject: inspected.card.symbolic_object }
        : {}),
      imagePrompt: inspected.card.image_prompt,
    },
    echo: inspected.sections.echo || "",
  };
}

function deterministicCastToV02(cast, request) {
  const map = sectionMap(cast);
  const card = coreCard(cast);
  const essence = map.essence || card.description || map.echo;
  const guidance = map.guidance || map.recommendation || "Name one grounded next move and its real cost.";
  const imagePrompt = card.image_prompt || cast?.coreCard?.imagePrompt ||
    `Vertical 2:3 symbolic card for ${card.name || cast.cardName}; grounded physical objects, visible cause and effect, restrained techno-mystic atmosphere.`;
  return normalizeModelCast({
    ...cast,
    title: card.name || cast.cardName,
    essence,
    guidance,
    echo: map.echo || cast.echo,
    core_card: { ...card, image_prompt: imagePrompt },
  }, request);
}

function mergeHybrid(modelCast, deterministicCast, request) {
  const supplied = inspectCast(modelCast);
  const local = inspectCast(deterministicCast);
  const merged = {
    sections: CAST_V02_FIELDS.map((type) => ({ type, content: supplied.sections?.[type] || local.sections?.[type] || "" })),
    echo: supplied.sections?.echo || local.sections?.echo || "",
    core_card: {
      name: supplied.card?.name || local.card?.name || "",
      description: supplied.card?.description || local.card?.description || "",
      symbolic_object: supplied.card?.symbolic_object || local.card?.symbolic_object || "",
      image_prompt: supplied.card?.image_prompt || local.card?.image_prompt || "",
    },
  };
  return normalizeModelCast(merged, request);
}

function buildFieldProvenance(cast, suppliedCast, request, deterministicOnly) {
  const supplied = inspectCast(suppliedCast);
  const fields = {};
  for (const type of CAST_V02_FIELDS) {
    fields[`sections.${type}`] = {
      ...provenance("eidomancer_lens", request),
      source:
      !deterministicOnly && supplied.sections?.[type] ? "model_generated" : "deterministically_derived",
    };
  }
  fields.echo = {
    ...provenance("eidomancer_lens", request),
    source: !deterministicOnly && supplied.sections?.echo
      ? "model_generated" : "deterministically_derived",
  };
  for (const field of ["name", "description", "image_prompt"]) {
    fields[`core_card.${field}`] = {
      ...provenance("eidomancer_lens", request),
      source:
      !deterministicOnly && supplied.card?.[field] ? "model_generated" : "deterministically_derived",
    };
  }
  if (coreCard(cast).symbolic_object) {
    fields["core_card.symbolic_object"] = {
      ...provenance("eidomancer_lens", request),
      source: !deterministicOnly && supplied.card?.symbolic_object
        ? "model_generated" : "deterministically_derived",
    };
  }
  return fields;
}

function recordForPackages(cast, request) {
  return {
    ...cast,
    theme: request.presentation.theme,
    tone: request.presentation.tone,
    coreCard: cast.coreCard,
    question: request.input.intent,
  };
}

function missingForPackage(cast, type) {
  const required = type === "image_prompts"
    ? ["signal", "tension", "pattern", "essence"]
    : [...CAST_V02_FIELDS, "echo"];
  const map = sectionMap(cast);
  const missing = required.filter((field) => !map[field]);
  if (!coreCard(cast).name) missing.push("core_card.name");
  if (type === "image_prompts" && !coreCard(cast).image_prompt) missing.push("core_card.image_prompt");
  return missing;
}

function unavailable(type, missingFields) {
  return {
    type,
    media_type: "application/json",
    status: "unavailable",
    partial: true,
    missing_fields: missingFields,
    content: null,
  };
}

function envelope(type, mediaType, content, request, detail = {}) {
  const stage = type === "core_cast" ? "eidomancer_lens"
    : type === "lens_instructions" ? "lens_instruction_generation"
      : "package_generation";
  return {
    type,
    media_type: mediaType,
    status: "complete",
    partial: false,
    content,
    provenance: provenance(stage, request, detail),
  };
}

export async function processAgentRequestV02(raw) {
  const validation = validateAgentRequestV02(raw);
  if (!validation.valid) return {
    ok: false,
    protocol_version: PROTOCOL_VERSION_V02,
    request_id: requestId(raw?.request_id),
    error: { code: "INVALID_REQUEST", details: validation.errors },
  };

  const request = normalizeAgentRequestV02(raw);
  const suppliedCast = parseObject(request.intelligence.content);
  const suppliedInspection = inspectCast(suppliedCast);
  const onlyInstructions = request.outputs.every((output) => output === "lens_instructions");

  if (request.execution.mode === "strict_ai" && !onlyInstructions && !suppliedCast) {
    return {
      ok: false,
      protocol_version: PROTOCOL_VERSION_V02,
      request_id: request.request_id,
      error: {
        code: "INTELLIGENCE_REQUIRED",
        details: ["strict_ai mode requires intelligence.content."],
        required_intelligence_contract: CAST_V02_CONTRACT,
      },
    };
  }
  if (request.execution.mode === "strict_ai" && !onlyInstructions && !suppliedInspection.complete) {
    return {
      ok: false,
      protocol_version: PROTOCOL_VERSION_V02,
      request_id: request.request_id,
      error: {
        code: "INCOMPLETE_INTELLIGENCE",
        details: suppliedInspection.missing,
        required_intelligence_contract: CAST_V02_CONTRACT,
      },
    };
  }

  const context = [
    request.input.source_material,
    ...request.evidence.facts.map((item) => `Fact supplied by caller: ${item}`),
    ...request.evidence.reported_claims.map((item) => `Reported claim: ${item}`),
    ...request.evidence.inferences.map((item) => `Caller inference: ${item}`),
    ...request.memory.facts.map((item) => `Memory fact supplied: ${item}`),
    ...request.memory.reported_claims.map((item) => `Memory report: ${item}`),
    ...request.memory.continuity_signals.map((item) => `Continuity signal: ${item}`),
    ...request.input.constraints.map((item) => `Constraint: ${item}`),
    ...request.lens.avoid.map((item) => `Avoid: ${item}`),
  ].filter(Boolean).join("\n\n");

  let cast = null;
  let deterministicCast = null;
  if (!onlyInstructions && request.execution.mode !== "strict_ai") {
    const seed = buildSeed({ question: request.input.intent, sourceText: context });
    deterministicCast = deterministicCastToV02(await generateCastFromSeed(seed), request);
  }
  if (!onlyInstructions) {
    if (request.execution.mode === "strict_ai") cast = normalizeModelCast(suppliedCast, request);
    if (request.execution.mode === "hybrid") cast = mergeHybrid(suppliedCast, deterministicCast, request);
    if (request.execution.mode === "deterministic_preview") cast = deterministicCast;
  }

  const artifacts = {};
  const instructions = buildLensInstructions({
    viewpoint: request.lens.viewpoint,
    presentation: request.presentation,
    memory: request.memory,
    input: request.input,
    evidence: request.evidence,
    constraints: request.input.constraints,
  });
  if (request.outputs.includes("lens_instructions")) {
    artifacts.lens_instructions = envelope(
      "lens_instructions", "application/json", instructions, request,
      { derived_from: ["lens", "evidence", "memory", "presentation"] }
    );
  }

  if (cast) {
    const fieldProvenance = buildFieldProvenance(
      cast, suppliedCast, request, request.execution.mode === "deterministic_preview"
    );
    if (request.outputs.includes("core_cast")) {
      artifacts.core_cast = envelope("core_cast", "application/json", cast, request, {
        field_provenance: fieldProvenance,
      });
    }
    const record = recordForPackages(cast, request);
    for (const type of request.outputs.filter((item) => !["lens_instructions", "core_cast"].includes(item))) {
      const missing = missingForPackage(cast, type);
      if (missing.length) {
        artifacts[type] = unavailable(type, missing);
        continue;
      }
      if (type === "image_prompts") artifacts[type] = envelope(
        type, "application/json", generateImagePromptsV02(record, request.presentation),
        request, { derived_from: ["core_cast", "presentation"] }
      );
      if (type === "song_package") artifacts[type] = envelope(
        type, "application/json", generateSongPackageV02(record, request.presentation),
        request, { derived_from: ["core_cast", "presentation"] }
      );
      if (type === "youtube_package") artifacts[type] = envelope(
        type, "application/json", generateYouTubePackageV02(record, request.presentation),
        request, { derived_from: ["core_cast", "presentation"] }
      );
      if (type === "full_package") artifacts[type] = envelope(
        type, "application/json", generateFullPackageV02(record, request.presentation),
        request, { derived_from: ["core_cast", "presentation"] }
      );
    }
  }

  const warnings = [];
  if (request.execution.mode === "hybrid" && !suppliedInspection.complete) {
    warnings.push(`Hybrid mode deterministically filled: ${suppliedInspection.missing.join(", ")}.`);
  }
  if (request.execution.mode === "deterministic_preview") {
    warnings.push("Deterministic preview is a development mode; Eidomancer generated a simulation without underlying AI intelligence.");
  }

  return {
    ok: true,
    protocol_version: PROTOCOL_VERSION_V02,
    canon_version: EIDOMANCER_CANON_VERSION,
    request_id: request.request_id,
    created_at: new Date().toISOString(),
    architecture: {
      intelligence: EIDOMANCER_CANON.intelligence,
      lens: EIDOMANCER_CANON.lens,
      presentation: EIDOMANCER_CANON.presentation,
    },
    pipeline: {
      stages: ["input", "emergent_ai_intelligence", "eidomancer_lens", "presentation", "artifact_package"],
      execution_mode: request.execution.mode,
      intelligence_source: suppliedCast ? "caller_supplied_ai" : "none",
      viewpoint: request.lens.viewpoint,
      grounding: "physics_first",
      presentation_theme: request.presentation.theme,
    },
    manifest: Object.entries(artifacts).map(([key, artifact]) => ({
      key, type: artifact.type, media_type: artifact.media_type,
      status: artifact.status, partial: artifact.partial,
    })),
    artifacts,
    diagnostics: { warnings },
  };
}
