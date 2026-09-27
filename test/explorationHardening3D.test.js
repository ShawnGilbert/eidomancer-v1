import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ObjectStore,createSession,fork,evolve,record,ref} from '../src/lib/exploration/index.js';
import {captureAdapter,extractCandidate} from '../src/lib/exploration/intelligenceAdapter.js';

const root = () => mkdtemp(path.join(tmpdir(),'eidomancer-3d-'));
const candidate = (description='Public ledger',recall=3) => ({description,private_recall_after_exchanges:recall,external_inscription_available:true});
const adapter = (bytes,overrides={}) => ({async invoke(){return {bytes:Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider:'fixture',model:'scripted',identification_status:'test_double',...overrides};}});
const setup = async (intents=[{id:'B1',intent:'Public ledger'},{id:'B2',intent:'Private fourth recall'}]) => {
  const store=new ObjectStore(await root());
  const session=await createSession(store,{purpose:'Memory village',description:'Three exchanges; public inscriptions persist'});
  await fork(session,intents);
  return {store,session};
};
const captured = async (bytes,overrides={}) => {
  const store=new ObjectStore(await root());
  return captureAdapter(store,adapter(bytes,overrides),{request_id:'candidate',request_bytes:Buffer.from('{}')});
};

test('3D R0: accepted and rejected branches retain the same governing rule and constraint',async()=>{
  const {session}=await setup();
  const a=await evolve(session,'B1',adapter(JSON.stringify(candidate())),'b1');
  const b=await evolve(session,'B2',adapter(JSON.stringify(candidate('Impossible recall',4))),'b2');
  for(const branch of [a,b]) {
    assert.equal(branch.transition.payload.body.rule_set_ref.id,session.rule.id);
    assert.equal(branch.transition.payload.body.checks[0].constraint_ref.id,session.constraint.id);
    assert.equal(branch.transition.payload.body.from_state_ref.id,session.initial.id);
  }
  assert.equal(a.successor.payload.body.constraint_refs[0].id,session.constraint.id);
  assert.equal(b.successor,undefined);
  assert.equal(b.transition.payload.body.status,'rejected');
});

test('3D R0: a mismatched successor rule/constraint is refused by the object store',async()=>{
  const {store,session}=await setup();
  const other=record('constraint',{...session.constraint.payload.body,statement:'Other constraint'},'declared_world_assumption',session.constraint.payload.provenance);
  await store.put(other);
  const bad=record('world_state',{...session.initial.payload.body,constraint_refs:[ref('constraint',other.id)]},'declared_world_assumption',session.initial.payload.provenance);
  await assert.rejects(store.put(bad),/inheritance mismatch/);
});

test('3D branches: distinct intents retain independent requests and source responses',async()=>{
  const {session}=await setup();
  const b1=await evolve(session,'B1',adapter(JSON.stringify(candidate('A public ledger'))),'b1');
  const b2=await evolve(session,'B2',adapter(JSON.stringify(candidate('A private memory',4))),'b2');
  assert.notEqual(b1.operation.id,b2.operation.id);
  assert.notEqual(b1.response.id,b2.response.id);
  assert.notEqual(b1.response.payload.body.request.sha256,b2.response.payload.body.request.sha256);
  assert.equal(JSON.parse(Buffer.from(b1.response.payload.body.request.base64,'base64')).branch_id,'B1');
  assert.equal(JSON.parse(Buffer.from(b2.response.payload.body.request.base64,'base64')).branch_id,'B2');
  assert.equal(b1.transition.payload.body.intelligence_response_ref.id,b1.response.id);
  assert.equal(b2.transition.payload.body.intelligence_response_ref.id,b2.response.id);
});

test('3D branches: empty intent is rejected at fork',async()=>{
  const store=new ObjectStore(await root());
  const session=await createSession(store,{purpose:'Memory village',description:'Three exchanges'});
  await assert.rejects(fork(session,[{id:'B1',intent:''},{id:'B2',intent:'ledger'}]),/Invalid fork|intent/);
});

test('3D branches: reused request ID still preserves distinct branch attribution',async()=>{
  const {session}=await setup();
  const a=await evolve(session,'B1',adapter(JSON.stringify(candidate('A'))),'same-id');
  const b=await evolve(session,'B2',adapter(JSON.stringify(candidate('B'))),'same-id');
  assert.notEqual(a.response.id,b.response.id);
  assert.notEqual(a.response.payload.body.request.sha256,b.response.payload.body.request.sha256);
  assert.deepEqual([a,b].map(x=>JSON.parse(Buffer.from(x.response.payload.body.request.base64,'base64')).branch_id),['B1','B2']);
});

test('3D branches: identical intents do not falsely claim substantive divergence',async()=>{
  const {session}=await setup([{id:'B1',intent:'ledger'},{id:'B2',intent:'ledger'}]);
  const a=await evolve(session,'B1',adapter(JSON.stringify(candidate('Same'))),'b1');
  const b=await evolve(session,'B2',adapter(JSON.stringify(candidate('Same'))),'b2');
  assert.equal(a.successor.payload.body.description,b.successor.payload.body.description);
  assert.notEqual(a.response.id,b.response.id);
});

test('3D candidate: unexpected model-controlled structural fields are rejected',async()=>{
  const response=await captured(JSON.stringify({...candidate(),status:'accepted',constraint_refs:[],verdict:'retain'}));
  assert.throws(()=>extractCandidate(response),/unexpected|unknown|invalid/i);
});

test('3D candidate: incompatible media type and encoding cannot be parsed as JSON',async()=>{
  for(const extra of [{content_type:'text/plain'},{encoding:'binary'}]) {
    const response=await captured(JSON.stringify(candidate()),extra);
    assert.throws(()=>extractCandidate(response),/content.type|encoding|invalid/i);
  }
});

test('3D candidate: malformed, empty, duplicate-key, partial, and trailing data fail closed',async()=>{
  const cases=['','{"description":','{"description":"A","description":"B","private_recall_after_exchanges":3,"external_inscription_available":true}',
    JSON.stringify(candidate())+' trailing','[]',JSON.stringify({...candidate(),description:'   '})];
  for(const bytes of cases) {
    const response=await captured(bytes);
    assert.throws(()=>extractCandidate(response),undefined,`Accepted ${JSON.stringify(bytes)}`);
  }
});

test('3D noncooperation: incomplete and error responses yield no successor or retry',async()=>{
  for(const completion_status of ['partial','error']) {
    const {session}=await setup();let invocations=0;
    const failing={async invoke(){invocations++;return {...(await adapter(JSON.stringify(candidate())).invoke()),completion_status};}};
    await assert.rejects(evolve(session,'B1',failing,'failed'),/Incomplete/);
    assert.equal(invocations,1);
    assert.equal(session.calls,1);
    assert.equal(session.branches.get('B1').successor,undefined);
    assert.equal(session.branches.get('B1').transition,undefined);
    assert.equal(session.branches.get('B1').response.payload.body.completion_status,completion_status);
  }
});

test('3D noncooperation: malformed complete response retains exact bytes and cannot advance',async()=>{
  const {session}=await setup();let invocations=0;
  await assert.rejects(evolve(session,'B1',{async invoke(){invocations++;return adapter('{bad').invoke();}},'bad'));
  const branch=session.branches.get('B1');
  assert.equal(invocations,1);assert.equal(session.calls,1);
  assert.equal(Buffer.from(branch.response.payload.body.response.base64,'base64').toString(),'{bad');
  assert.equal(branch.successor,undefined);assert.equal(branch.transition,undefined);
});

test('3D deterministic: fixed inputs produce identical IDs across fresh stores',async()=>{
  const run=async()=>{const {session}=await setup();const b=await evolve(session,'B1',adapter(JSON.stringify(candidate())),'fixed');return [session.seed.id,session.rule.id,session.constraint.id,b.response.id,b.selection.id,b.successor.id,b.transition.id];};
  assert.deepEqual(await run(),await run());
});

test('3D parsing: no automatic retry, salvage, or fallback after invalid complete output',async()=>{
  const {session}=await setup();let calls=0;
  await assert.rejects(evolve(session,'B1',{async invoke(){calls++;return adapter('```json\n'+JSON.stringify(candidate())+'\n```').invoke();}},'fenced'));
  assert.equal(calls,1);assert.equal(session.branches.get('B1').successor,undefined);
});
