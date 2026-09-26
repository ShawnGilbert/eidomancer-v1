import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { canonicalBytes, identity, parseStrictJson } from '../src/lib/exploration/canonicalJson.js';
import { ObjectStore } from '../src/lib/exploration/objectStore.js';
import { record } from '../src/lib/exploration/recordSchemas.js';

test('RFC 8785 independent cyberphone structures vector (integer-only subset)', () => {
  const input = '{"1":{"f":{"f":"hi","F":5},"\\n":56},"10":{},"":"empty","a":{},"111":[{"e":"yes","E":"no"}],"A":{}}';
  const expected = '{"":"empty","1":{"\\n":56,"f":{"F":5,"f":"hi"}},"10":{},"111":[{"E":"no","e":"yes"}],"A":{},"a":{}}';
  assert.equal(canonicalBytes(parseStrictJson(input)).toString(), expected);
});

test('strict parser and v1 restrictions reject unsafe values', () => {
  for (const source of ['{"a":1,"a":2}','{"a":null}','{"a":1.5}','{"a":"e\\u0301"}','{"a":"\\ud800"}']) {
    assert.throws(() => parseStrictJson(source));
  }
  assert.throws(() => canonicalBytes({bad:undefined}));
  assert.throws(() => canonicalBytes({bad:-0}));
});

test('record IDs are deterministic and store verifies immutable bytes after restart', async () => {
  const provenance = {actor_role:'environment',provider:'eidomancer',model_or_version:'v0.3',identification_status:'known',input_refs:[]};
  const body = {statement:'Memory decays',scope:'fictional',strength:'hard',check_mode:'mechanical',predicate:'private_recall_max_v1',parameters:{maximum:3}};
  const first = record('constraint',body,'declared_world_assumption',provenance);
  const second = record('constraint',{...body,parameters:{maximum:3}},'declared_world_assumption',provenance);
  assert.equal(first.id,second.id);
  assert.notEqual(first.id,record('constraint',{...body,parameters:{maximum:4}},'declared_world_assumption',provenance).id);
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'eidomancer-stage1-'));
  const store = new ObjectStore(root);
  await store.put(first); await store.put(second);
  assert.equal((await new ObjectStore(root).get(first.id)).id,first.id);
  await fs.writeFile(store.location(first.id),'{}');
  await assert.rejects(() => store.get(first.id));
  assert.match(identity('record',first.payload),/^record:sha256:[a-f0-9]{64}$/);
});
