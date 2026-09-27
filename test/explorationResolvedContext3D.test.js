import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ObjectStore,createSession,fork,evolve,declareProcedure,evaluate} from '../src/lib/exploration/index.js';
import {canonicalBytes,sha256} from '../src/lib/exploration/canonicalJson.js';

async function setup(description='Village remembers three exchanges') {
  const store=new ObjectStore(await mkdtemp(path.join(tmpdir(),'eidomancer-context-')));
  const session=await createSession(store,{purpose:'Memory village',description});
  await fork(session,[{id:'B1',intent:'Make obligations visible in a ledger'},{id:'B2',intent:'Test another institution'}]);
  return {store,session};
}
async function run(description) {
  const {store,session}=await setup(description);
  let received;
  const adapter={async invoke({bytes}) {received=Buffer.from(bytes);return {bytes:Buffer.from(JSON.stringify({description:'Public ledger',private_recall_after_exchanges:3,external_inscription_available:true})),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider:'fixture',model:'scripted',identification_status:'test_double'};}};
  const branch=await evolve(session,'B1',adapter,'generate-1');
  const captured=Buffer.from(branch.response.payload.body.request.base64,'base64');
  return {store,session,branch,received,captured,envelope:JSON.parse(captured.toString('utf8'))};
}

test('generation captures the resolved rule, constraint, World state, seed and operation as exact canonical adapter bytes',async()=>{
  const {session,branch,received,captured,envelope}=await run();
  assert.deepEqual(received,captured);
  assert.deepEqual(captured,canonicalBytes(envelope));
  assert.equal(envelope.schema_version,'eidomancer.generation-request.v1');
  assert.equal(envelope.rule_set.body.name,'R0');
  assert.equal(envelope.constraint_records[0].body.parameters.maximum,3);
  assert.match(envelope.constraint_records[0].body.statement,/three exchanges/);
  assert.equal(envelope.current_state.body.description,session.initial.payload.body.description);
  assert.equal(envelope.seed.body.purpose,'Memory village');
  assert.deepEqual(envelope.declared_operation.body.changes,[branch.intent]);
  for(const [name,object] of [['seed',session.seed],['current_state',session.initial],['rule_set',session.rule],['declared_operation',branch.operation]]) {
    assert.equal(envelope[name].ref.id,object.id);
    assert.deepEqual(envelope[name].body,object.payload.body);
  }
  assert.equal(branch.response.payload.body.request.sha256,sha256(received));
});

test('equivalent inputs reproduce bytes and identities; changed resolved state changes request and descendants',async()=>{
  const first=await run('Village remembers three exchanges');
  const again=await run('Village remembers three exchanges');
  const changed=await run('Village has a public square and remembers three exchanges');
  assert.deepEqual(first.captured,again.captured);
  assert.deepEqual([first.branch.response.id,first.branch.selection.id,first.branch.successor.id,first.branch.transition.id],
    [again.branch.response.id,again.branch.selection.id,again.branch.successor.id,again.branch.transition.id]);
  assert.notEqual(first.branch.response.payload.body.request.sha256,changed.branch.response.payload.body.request.sha256);
  for(const key of ['response','selection','successor','transition']) assert.notEqual(first.branch[key].id,changed.branch[key].id);
});

test('missing referenced context fails before intelligence invocation',async()=>{
  const {store,session}=await setup();
  const ref=session.rule.id;
  const {unlink}=await import('node:fs/promises');
  await unlink(store.location(ref));
  let invoked=false;
  await assert.rejects(evolve(session,'B1',{async invoke(){invoked=true;}},'generate-1'),/ENOENT|no such file/i);
  assert.equal(invoked,false);
  assert.equal(session.branches.get('B1').response,undefined);
});

test('Phase 3 evaluator response remains separate from generation response',async()=>{
  const {store,session,branch}=await run();
  const procedure=await declareProcedure(store);
  const evaluation=await evaluate(session,'B1',procedure,{adapter:{async invoke(){return {bytes:Buffer.from(JSON.stringify({verdict:'retain',rationale:'Consistent ledger',uncertainty:'Social uptake unknown',limitations:[],judgment:'Meaningful'})),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider:'evaluator',model:'test',identification_status:'test_double'};}},request_id:'evaluation-1',request_bytes:Buffer.from('exact evaluation request')});
  assert.notEqual(evaluation.payload.body.intelligence_response_ref.id,branch.response.id);
  assert.equal(branch.transition.payload.body.intelligence_response_ref.id,branch.response.id);
  assert.equal(Buffer.from((await store.get(evaluation.payload.body.intelligence_response_ref.id)).payload.body.request.base64,'base64').toString(),'exact evaluation request');
});
