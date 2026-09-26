import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ObjectStore,ref,crystal,storeCrystal,retrieveCrystal,extendSession,makeManifest} from '../src/lib/exploration/index.js';
import {runMemoryVillage} from '../examples/exploration-memory-village.js';
import {identity} from '../src/lib/exploration/canonicalJson.js';

const run=async()=>runMemoryVillage(await mkdtemp(path.join(tmpdir(),'eidomancer-crystals-')));
const clone=v=>structuredClone(v);

test('stage 4: complete manifest, verified closure, rejected branch and Crack after restart',async()=>{
  const result=await run();const {store,parent,b2}=result;
  const actual=await retrieveCrystal(new ObjectStore(store.root),parent.id);
  assert.equal(actual.status,'complete');assert.ok(actual.references.length>=18);assert.equal(identity('crystal',actual.payload),parent.id);
  assert.equal(b2.successor,undefined);assert.equal((await store.get(b2.transition.id)).payload.body.status,'rejected');
  assert.equal((await store.get(b2.crack.id)).payload.body.status,'open');assert.equal((await store.get(b2.audit.id)).payload.body.status,'pruned');
  assert.equal(actual.payload.unresolved_cracks[0].detail_ref.id,b2.crack.id);
  assert.equal(actual.payload.branches.find(x=>x.id==='B2').outcome_state_refs.length,0);
});

test('stage 4: incomplete expected requires exact address and explicit limitation; accidental missing fails closed',async()=>{
  const {store,parent}=await run();
  const missing=ref('constraint',`record:sha256:${'a'.repeat(64)}`);
  const payload=clone(parent.payload);
  payload.assumptions[0].source_refs.push(missing);
  payload.required_references.push(missing);
  payload.required_references.sort((a,b)=>Buffer.compare(Buffer.from(JSON.stringify(Object.keys(a).sort().reduce((o,k)=>(o[k]=a[k],o),{}))),Buffer.from(JSON.stringify(Object.keys(b).sort().reduce((o,k)=>(o[k]=b[k],o),{})))));
  const initial=crystal(payload);
  await assert.rejects(storeCrystal(store,payload,{allow_incomplete:true}),/integrity_error/);
  payload.boundary.search_limitations.push(`expected unavailable ${missing.id}: missing immutable constraint limits audit and extension`);
  const incomplete=await storeCrystal(store,payload,{allow_incomplete:true});
  assert.notEqual(incomplete.id,initial.id);
  assert.equal((await retrieveCrystal(store,incomplete.id)).status,'incomplete_expected');
  await assert.rejects(extendSession(store,incomplete),/Only complete Crystal/);
  const unknown=clone(payload);unknown.required_references[unknown.required_references.findIndex(r=>r.id===missing.id)].id='unknown';
  assert.throws(()=>crystal(unknown),/Invalid reference|Required refs/);
});

test('stage 4: unexpected missing and tampered required object are integrity errors',async()=>{
  const {store,parent}=await run();const target=parent.payload.evaluation_summary.detail_ref.id;
  const filename=store.location(target);const original=await readFile(filename);
  await unlink(filename);assert.equal((await retrieveCrystal(store,parent.id)).status,'integrity_error');
  await writeFile(filename,Buffer.from('{"bad":true}'));assert.equal((await retrieveCrystal(store,parent.id)).status,'integrity_error');
  await writeFile(filename,original);
});

test('stage 5: single-parent descendant preserves immutable R0 failure',async()=>{
  const {store,parent,descendant,b2}=await run();
  const before=await readFile(store.location(parent.id));
  assert.notEqual(descendant.id,parent.id);
  assert.equal(descendant.payload.lineage.parents[0].crystal_ref.id,parent.id);
  assert.equal((await retrieveCrystal(store,descendant.id)).status,'complete');
  assert.deepEqual(await readFile(store.location(parent.id)),before);
  assert.equal((await store.get(b2.transition.id)).payload.body.checks[0].passed,false);
  assert.equal((await store.get(b2.transition.id)).payload.body.checks[0].maximum,3);
  assert.equal(descendant.payload.anchors[0].rule_set_ref.id!==parent.payload.anchors[0].rule_set_ref.id,true);
  const invalid=clone(descendant.payload);invalid.lineage.parents.push(clone(invalid.lineage.parents[0]));assert.throws(()=>crystal(invalid),/Multiple-parent merge deferred/);
});

test('stage 5: fictional generated consequence cannot become empirical evidence',async()=>{
  const {parent}=await run();const invalid=clone(parent.payload);invalid.significant_consequences[0].claim_class='observed_or_supplied';
  assert.throws(()=>crystal(invalid),/One-way evidence/);
  const symbolic=clone(parent.payload);symbolic.significant_consequences[0].claim_class='symbolized';assert.throws(()=>crystal(symbolic),/One-way evidence/);
});
