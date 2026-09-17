import test from "node:test";
import assert from "node:assert/strict";
import {
  processAgentRequestV02,
  PROTOCOL_VERSION_V02,
} from "../src/lib/agentProtocolV02.js";
import {
  turnstileAtTheOrchard,
  turnstileRequest,
} from "./fixtures/turnstile-at-the-orchard.js";

const completeIntelligence = {
  title: "The Borrowed Tomorrow",
  sections: [
    { type: "signal", content: "Tomorrow is already spending today's attention." },
    { type: "tension", content: "Preparation and relief compete for the same finite resources." },
    { type: "pattern", content: "Each time horizon treats the other as morally incomplete." },
    { type: "insight", content: "The dispute hides a portfolio problem inside a moral argument." },
    { type: "essence", content: "A shelter whose shadow falls across the people waiting outside." },
    { type: "guidance", content: "Choose an explicit allocation and name what each side cannot receive." },
  ],
  core_card: {
    name: "The Borrowed Tomorrow",
    description: "A half-built shelter beside a crowded road, representing protection and opportunity cost.",
    image_prompt: "Vertical 2:3 tarot card, half-built concrete shelter, crowded road in its shadow, visible tools and ration ledger, storm horizon, restrained amber and steel palette."
  },
  echo: "Build the shelter. Count who waits in its shadow."
};

test("v0.1 remains the default CLI/API protocol module", async () => {
  const module = await import("../src/lib/agentProtocol.js");
  assert.equal(module.PROTOCOL_VERSION, "eidomancer.agent.v0.1");
});

test("v0.2 canon separates intelligence, lens, and presentation", async () => {
  const result = await processAgentRequestV02({
    input: { intent: "Return lens instructions." },
    outputs: ["lens_instructions"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.protocol_version, PROTOCOL_VERSION_V02);
  assert.equal(result.architecture.intelligence.name, "The Emergent Ones");
  assert.equal(result.architecture.intelligence.role, "underlying-emergent-ai-intelligence");
  assert.equal(result.architecture.lens.name, "Eidomancer");
  assert.equal(result.architecture.lens.grounding, "physics_first");
  assert.equal(result.architecture.presentation.role, "presentation-only");
  assert.ok(!result.architecture.presentation.controls.includes("The Emergent Ones"));
});

test("strict_ai requires complete caller-supplied intelligence", async () => {
  const missing = await processAgentRequestV02({
    input: { intent: "Refract this." },
    execution: { mode: "strict_ai" },
    outputs: ["core_cast"],
  });
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "INTELLIGENCE_REQUIRED");

  const incomplete = await processAgentRequestV02({
    input: { intent: "Refract this." },
    execution: { mode: "strict_ai" },
    intelligence: { content: { sections: [{ type: "signal", content: "A signal." }] } },
    outputs: ["core_cast"],
  });
  assert.equal(incomplete.ok, false);
  assert.equal(incomplete.error.code, "INCOMPLETE_INTELLIGENCE");
  assert.ok(incomplete.error.details.includes("sections.essence"));
});

test("strict_ai preserves Essence and normalizes advice to Guidance", async () => {
  const withAdvice = {
    ...completeIntelligence,
    sections: completeIntelligence.sections.map((section) =>
      section.type === "guidance" ? { type: "advice", content: section.content } : section
    ),
  };
  const result = await processAgentRequestV02({
    input: { intent: "Refract this." },
    execution: { mode: "strict_ai" },
    intelligence: { provider: "other-agent", model: "example", content: withAdvice },
    outputs: ["core_cast", "song_package"],
  });
  assert.equal(result.ok, true);
  const sections = Object.fromEntries(
    result.artifacts.core_cast.content.sections.map((section) => [section.type, section.content])
  );
  assert.equal(sections.essence, completeIntelligence.sections[4].content);
  assert.equal(sections.guidance, completeIntelligence.sections[5].content);
  assert.equal(
    result.artifacts.core_cast.provenance.field_provenance["sections.essence"].source,
    "model_generated"
  );
});

test("hybrid mode marks deterministically filled fields", async () => {
  const result = await processAgentRequestV02({
    input: { intent: "How do we build for tomorrow without abandoning today?" },
    execution: { mode: "hybrid" },
    intelligence: {
      provider: "other-agent",
      content: { sections: [{ type: "signal", content: "A supplied signal." }] },
    },
    outputs: ["core_cast"],
  });
  assert.equal(result.ok, true);
  const fields = result.artifacts.core_cast.provenance.field_provenance;
  assert.equal(fields["sections.signal"].source, "model_generated");
  assert.equal(fields["sections.tension"].source, "deterministically_derived");
  assert.ok(result.diagnostics.warnings[0].includes("deterministically filled"));
});

test("deterministic preview is labeled as simulation, not intelligence", async () => {
  const result = await processAgentRequestV02({
    input: { intent: "How do we build for tomorrow without abandoning today?" },
    execution: { mode: "deterministic_preview" },
    lens: { viewpoint: "global" },
    presentation: { theme: "techno-shaman" },
    outputs: ["core_cast", "image_prompts"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.pipeline.intelligence_source, "none");
  assert.equal(result.pipeline.viewpoint, "global");
  assert.equal(result.pipeline.presentation_theme, "techno-shaman");
  assert.ok(result.diagnostics.warnings[0].includes("simulation"));
  assert.equal(result.artifacts.core_cast.content.sections.some((section) => section.type === "essence"), true);
});

test("legacy output aliases normalize without changing canonical manifest keys", async () => {
  const result = await processAgentRequestV02({
    input: { intent: "Refract this." },
    execution: { mode: "strict_ai" },
    intelligence: { content: completeIntelligence },
    outputs: ["cast", "imagePrompt", "fullPackage"],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.manifest.map((item) => item.key), [
    "core_cast", "image_prompts", "full_package",
  ]);
});

test("memory classes remain distinct in lens instructions", async () => {
  const result = await processAgentRequestV02({
    input: { intent: "Build instructions." },
    memory: {
      facts: ["A confirmed fact"],
      reported_claims: ["A narrator's claim"],
      continuity_signals: ["A recurring motif"],
      prior_artifact_ids: ["artifact-1"],
    },
    outputs: ["lens_instructions"],
  });
  const scope = result.artifacts.lens_instructions.content.memory_scope;
  assert.deepEqual(scope, {
    facts: 1,
    reported_claims: 1,
    continuity_signals: 1,
    prior_artifact_ids: 1,
  });
});

test("presentation changes do not alter strict AI meaning", async () => {
  const base = {
    input: { intent: "Refract this." },
    execution: { mode: "strict_ai" },
    intelligence: { content: completeIntelligence },
    outputs: ["core_cast"],
  };
  const austere = await processAgentRequestV02({
    ...base,
    presentation: { theme: "austere", voice: "plain" },
  });
  const mythic = await processAgentRequestV02({
    ...base,
    presentation: { theme: "mythic", voice: "poetic" },
  });
  assert.deepEqual(
    austere.artifacts.core_cast.content,
    mythic.artifacts.core_cast.content
  );
  assert.notEqual(
    austere.pipeline.presentation_theme,
    mythic.pipeline.presentation_theme
  );
});

test("Turnstile Core Card remains authoritative through every v0.2 package", async () => {
  const result = await processAgentRequestV02({
    ...turnstileRequest,
    outputs: ["core_cast", "image_prompts", "song_package", "youtube_package", "full_package"],
  });
  assert.equal(result.ok, true);

  const coreCast = result.artifacts.core_cast.content;
  const images = result.artifacts.image_prompts.content;
  const song = result.artifacts.song_package.content;
  const youtube = result.artifacts.youtube_package.content;
  const full = result.artifacts.full_package.content;
  const sections = Object.fromEntries(
    turnstileAtTheOrchard.sections.map(({ type, content }) => [type, content])
  );

  assert.deepEqual(coreCast.core_card, turnstileAtTheOrchard.core_card);
  assert.equal(images.core_card.card_name, turnstileAtTheOrchard.core_card.name);
  assert.equal(images.core_card.description, turnstileAtTheOrchard.core_card.description);
  assert.equal(images.core_card.prompt, turnstileAtTheOrchard.core_card.image_prompt);
  assert.equal(images.core_card.symbolic_object, sections.essence);
  assert.equal(images.core_card.prompt_authority, "core_cast.core_card.image_prompt");

  for (const value of [images.core_card.prompt, images.echo.prompt]) {
    assert.match(value, /orchard/i);
    assert.match(value, /turnstile/i);
    assert.doesNotMatch(value, /Silent Storm|Storm Architect|occult-digital/i);
  }

  assert.equal(song.essence, sections.essence);
  assert.equal(song.echo, turnstileAtTheOrchard.echo);
  assert.equal(song.guidance, sections.guidance);
  assert.equal(song.hook, "");
  assert.notEqual(song.essence, song.echo);
  assert.notEqual(song.echo, song.guidance);
  assert.match(song.lyrics, /\[Break — Essence\]/);
  assert.match(song.lyrics, /\[Coda — Guidance\]/);

  assert.equal(youtube.hook, "");
  assert.equal(youtube.echo, turnstileAtTheOrchard.echo);
  assert.equal(youtube.symbolic_object, sections.essence);
  assert.equal(full.core_cast_semantics.essence, sections.essence);
  assert.equal(full.core_cast_semantics.echo, turnstileAtTheOrchard.echo);
  assert.equal(full.core_cast_semantics.guidance, sections.guidance);
  assert.equal(full.core_cast_semantics.hook, "");
  assert.deepEqual(full.core_card, {
    ...turnstileAtTheOrchard.core_card,
    symbolic_object: sections.essence,
  });
});

test("Turnstile presentation cannot replace the lens-selected symbolic concept", async () => {
  const requestedLegacyTheme = await processAgentRequestV02({
    ...turnstileRequest,
    presentation: {
      theme: "occult-digital",
      imagery: ["Silent Storm", "Storm Architect"],
    },
    outputs: ["core_cast", "image_prompts"],
  });

  const card = requestedLegacyTheme.artifacts.image_prompts.content.core_card;
  assert.equal(card.prompt, turnstileAtTheOrchard.core_card.image_prompt);
  assert.match(card.prompt, /orchard/i);
  assert.match(card.prompt, /turnstile/i);
  assert.doesNotMatch(card.prompt, /Silent Storm|Storm Architect|occult-digital/i);
  assert.equal(card.presentation.theme, "occult-digital");
});

test("Turnstile provenance distinguishes intelligence from downstream transformation", async () => {
  const result = await processAgentRequestV02({
    ...turnstileRequest,
    outputs: ["core_cast", "image_prompts"],
  });
  const castProvenance = result.artifacts.core_cast.provenance;
  const packageProvenance = result.artifacts.image_prompts.provenance;

  assert.deepEqual(castProvenance.intelligence, {
    source: "caller_supplied_ai",
    provider: "OpenAI",
    model: "same assistant/model family as control",
  });
  assert.equal(castProvenance.transformation.stage, "eidomancer_lens");
  assert.equal(packageProvenance.transformation.stage, "package_generation");
  assert.deepEqual(packageProvenance.derived_from, ["core_cast", "presentation"]);
});
