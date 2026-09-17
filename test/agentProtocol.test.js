import test from "node:test";
import assert from "node:assert/strict";
import { processAgentRequest, PROTOCOL_VERSION } from "../src/lib/agentProtocol.js";

test("rejects a request without input.intent", async () => {
  const result = await processAgentRequest({ input: {}, outputs: [] });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "INVALID_REQUEST");
});

test("returns a deterministic structured artifact package", async () => {
  const result = await processAgentRequest({
    request_id: "test-1",
    input: { intent: "How do we build for tomorrow without abandoning today?" },
    outputs: ["core_cast", "song_package", "youtube_package"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.protocol_version, PROTOCOL_VERSION);
  assert.equal(result.pipeline.intelligence_source, "local_deterministic");
  assert.deepEqual(result.manifest.map((item) => item.key), [
    "core_cast", "song_package", "youtube_package",
  ]);
  assert.ok(result.artifacts.core_cast.content.sections.length >= 5);
  assert.ok(result.artifacts.song_package.content.lyrics.includes("Chorus"));
  assert.ok(result.artifacts.youtube_package.content.videoTitle);
});

test("accepts caller-supplied structured intelligence", async () => {
  const intelligence = JSON.stringify({
    coreCard: { name: "The Borrowed Tomorrow" },
    sections: [{ type: "signal", content: "Tomorrow is spending today's attention." }],
    echo: "Build the shelter without forgetting who is standing in the rain."
  });
  const result = await processAgentRequest({
    input: { intent: "Refract this analysis." },
    intelligence: { provider: "other-agent", model: "example", content: intelligence },
    outputs: ["core_cast"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.pipeline.intelligence_source, "caller_supplied");
  assert.equal(result.artifacts.core_cast.content.coreCard.name, "The Borrowed Tomorrow");
  assert.equal(result.diagnostics.intelligence_parse_fallback, false);
});
