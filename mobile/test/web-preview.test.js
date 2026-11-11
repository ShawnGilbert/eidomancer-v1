import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { build } from "vite";
import { layers } from "../src/content.js";
import { exampleQuestion, exampleReading } from "../web/example.js";

const configFile = fileURLToPath(new URL("../vite.config.mjs", import.meta.url));
const origin = "https://pilot.example/";
const readWorker = () => readFile(new URL("../web/worker.js", import.meta.url), "utf8");

test("only the web preview build emits an installable shell with all precache files present", async () => {
  for (const mode of ["web-preview", "production"]) {
    const { output } = await build({ configFile, mode, logLevel: "silent", build: { write: false } });
    const files = new Map(output.map((file) => [file.fileName, file.source ?? file.code]));
    const client = output.find((file) => file.type === "chunk" && file.isEntry).code;
    if (mode === "production") {
      assert.equal(files.has("sw.js"), false);
      assert.equal(files.has("manifest.webmanifest"), false);
      assert.equal(client.includes(exampleQuestion), false);
      continue;
    }
    assert.match(files.get("index.html"), /rel="manifest"/);
    assert.equal(client.includes("/api/mobile/"), false);
    const manifest = JSON.parse(files.get("manifest.webmanifest"));
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "./");
    const [shell] = files.get("sw.js").split("\n");
    const precache = JSON.parse(shell.slice("const SHELL_FILES = ".length, -1));
    assert.deepEqual(precache.sort(), [...files.keys()].filter((name) => name !== "sw.js").sort());
    for (const icon of manifest.icons) assert.ok(files.has(icon.src));
  }
});

test("worker serves the shell offline and never intercepts customer traffic", async () => {
  const listeners = {};
  const cached = [];
  const removed = [];
  const cache = {
    addAll: async (requests) => cached.push(...requests.map(({ url }) => url)),
    match: async (request) => ({ url: request.url ?? request }),
  };
  const context = {
    self: { registration: { scope: origin }, clients: { claim() {} },
      addEventListener: (name, handler) => { listeners[name] = handler; } },
    SHELL_FILES: ["index.html", "assets/a.js"], CACHE_VERSION: "eidomancer-web-preview-new",
    URL, Request, fetch: () => assert.fail("Offline shell should not reach the network"),
    caches: { open: async () => cache, keys: async () => ["other", "eidomancer-web-preview-old"],
      delete: async (key) => removed.push(key) },
  };
  vm.runInNewContext(await readWorker(), context);
  for (const event of ["install", "activate"]) {
    let pending;
    listeners[event]({ waitUntil: (promise) => { pending = promise; } });
    await pending;
  }
  assert.deepEqual(cached, [origin + "index.html", origin + "assets/a.js"]);
  assert.deepEqual(removed, ["eidomancer-web-preview-old"]);

  function dispatch(path, method = "GET", mode = "navigate") {
    let response;
    listeners.fetch({ request: { url: new URL(path, origin).href, method, mode },
      respondWith: (promise) => { response = promise; } });
    return response;
  }
  assert.equal((await dispatch("./")).url, origin + "index.html");
  assert.equal((await dispatch("./#journal")).url, origin + "index.html");
  assert.equal((await dispatch("assets/a.js", "GET", "cors")).url, origin + "assets/a.js");
  assert.equal(dispatch("api/mobile/readings", "POST"), undefined);
  assert.equal(dispatch("api/credits"), undefined);
  assert.equal(dispatch("checkout"), undefined);
  assert.equal(dispatch("?payment=123"), undefined);
  assert.equal(dispatch("https://other.example/"), undefined);
});

test("the fictional reading has all seven layers and quotes its supplied account verbatim", () => {
  assert.ok(Object.keys(layers).every((layer) => exampleReading[layer]?.length > 0));
  assert.ok(exampleReading.evidence.every(({ quote }) => exampleQuestion.includes(quote)));
});
