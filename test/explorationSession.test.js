import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ObjectStore} from '../src/lib/exploration/objectStore.js';
import {createSession,fork,evolve,declareProcedure,evaluate,openCrack,audit,activeBranches} from '../src/lib/exploration/session.js';
import {captureAdapter} from '../src/lib/exploration/intelligenceAdapter.js';
import {record} from '../src/lib/exploration/recordSchemas.js';

const adapter = (recall,description) => ({async invoke(request) { assert.ok(Buffer.isBuffer(request.bytes)); return {bytes:Buffer.from(JSON.stringify({private_recall_after_exchanges:recall,external_inscription_available:true,description})),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider:'fixture',model:'scripted',identification_status:'test_double'}; }});
const setup=async()=>{const store=new ObjectStore(await mkdtemp(path.join(tmpdir(),'eidomancer-session-')));const session=await createSession(store,{purpose:'Memory village',description:'Memory lasts three exchanges'});await fork(session,[{id:'B1',intent:'Public ledger'},{id:'B2',intent:'Unexpected fourth recall'}]);return {store,session};};

test('stage 2: exact adapter-boundary bytes, mechanical rejection without a successor',async()=>{
  const {store,session}=await setup();
  const b1=await evolve(session,'B1',adapter(3,'Public ledger'),'request-1');
  const b2=await evolve(session,'B2',adapter(4,'Four-exchange private recall'),'request-2');
  assert.ok(b1.successor);assert.equal(b2.successor,undefined);assert.equal(b2.transition.payload.body.status,'rejected');
  assert.equal(b2.transition.payload.body.to_state_ref,undefined);
  const stored=await new ObjectStore(store.root).get(b2.response.id);
  assert.equal(Buffer.from(stored.payload.body.response.base64,'base64').toString(),'{"private_recall_after_exchanges":4,"external_inscription_available":true,"description":"Four-exchange private recall"}');
  assert.equal(stored.payload.body.identification_status,'test_double');
  assert.deepEqual(await readFile(store.location(b2.response.id),'utf8'),JSON.stringify(stored.payload));
});

test('stage 3: evaluated rejected branch is pruned without erasing crack and audit',async()=>{
  const {store,session}=await setup(); const procedure=await declareProcedure(store);
  await evolve(session,'B1',adapter(3,'Public ledger'),'request-1');await evolve(session,'B2',adapter(4,'Unexpected recall'),'request-2');
  await evaluate(session,'B1',procedure,{verdict:'limited',rationale:'Ledger is coherent but contested',uncertainty:'Authority remains unsettled'});
  await evaluate(session,'B2',procedure,{verdict:'reject',rationale:'R0 fails',uncertainty:'Cause unknown'});
  await openCrack(session,'B2','Fourth-exchange recall contradicts R0');
  await audit(session,'B1','retained','Useful conditional institution');await audit(session,'B2','pruned','Failed R0');
  assert.deepEqual(activeBranches(session).map(x=>x.id),['B1']);
  for(const object of [session.branches.get('B2').response,session.branches.get('B2').transition,session.branches.get('B2').evaluation,session.branches.get('B2').crack,session.branches.get('B2').audit]) assert.deepEqual((await new ObjectStore(store.root).get(object.id)).payload,object.payload);
});

test('stage 2: direct World state write cannot bypass R0; adapter errors retain request bytes',async()=>{
  const {store,session}=await setup();
  const invalid=record('world_state',{...session.initial.payload.body,private_recall_after_exchanges:4},'declared_world_assumption',session.initial.payload.provenance);
  await assert.rejects(store.put(invalid),/fails mechanical/);
  assert.throws(()=>record('world_state',session.initial.payload.body,'observed_or_supplied',session.initial.payload.provenance),/One-way evidence/);
  const captured=await captureAdapter(store,{provider:'fixture',model:'scripted',identification_status:'test_double',async invoke(){throw new Error('no response returned');}},
    {request_id:'adapter-error',request_bytes:Buffer.from([0,1,2]),content_type:'application/octet-stream',request_encoding:'binary'});
  assert.equal(captured.payload.body.completion_status,'error');
  assert.equal(captured.payload.body.request.base64,'AAEC');
  assert.equal(captured.payload.body.response.base64,'');
});
