import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ObjectStore,createSession,fork,evolve,declareProcedure,evaluate} from '../src/lib/exploration/index.js';

const root=()=>mkdtemp(path.join(tmpdir(),'eidomancer-evaluation-'));
const generation={async invoke(){return {bytes:Buffer.from(JSON.stringify({description:'Public ledger',private_recall_after_exchanges:3,external_inscription_available:true})),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider:'generator',model:'g1',identification_status:'test_double'};}};
const judgment={verdict:'retain',rationale:'Ledger preserves obligations',uncertainty:'Authority unresolved',limitations:['Fictional only'],judgment:'Institution is coherent'};
const evaluator=(bytes=JSON.stringify(judgment),overrides={})=>({async invoke({bytes:request}){
  assert.deepEqual(request,Buffer.from('evaluate exact bytes'));
  return {bytes:Buffer.from(bytes),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider:'evaluator',model:'e1',identification_status:'test_double',...overrides};
}});
async function setup(){
  const store=new ObjectStore(await root());
  const session=await createSession(store,{purpose:'Village',description:'Three exchanges'});
  await fork(session,[{id:'B1',intent:'Ledger'},{id:'B2',intent:'Fourth recall'}]);
  const branch=await evolve(session,'B1',generation,'generate-1');
  return {store,session,branch,procedure:await declareProcedure(store)};
}
const captured=adapter=>({adapter,request_id:'evaluate-1',request_bytes:Buffer.from('evaluate exact bytes')});

test('captured evaluation attributes exact evaluator bytes and extracted values, preserving generation',async()=>{
  const {store,session,branch,procedure}=await setup();
  const generationId=branch.response.id,transitionId=branch.transition.id;
  const evaluation=await evaluate(session,'B1',procedure,captured(evaluator()));
  const response=await store.get(evaluation.payload.body.intelligence_response_ref.id);
  assert.notEqual(response.id,generationId);
  assert.equal(response.payload.body.request.base64,Buffer.from('evaluate exact bytes').toString('base64'));
  assert.equal(Buffer.from(response.payload.body.response.base64,'base64').toString(),JSON.stringify(judgment));
  assert.equal(response.payload.body.provider,'evaluator');
  assert.deepEqual({verdict:evaluation.payload.body.verdict,rationale:evaluation.payload.body.rationale,uncertainty:evaluation.payload.body.uncertainty,
    limitations:evaluation.payload.body.limitations,judgment:evaluation.payload.body.results[1].finding},judgment);
  assert.equal(evaluation.payload.provenance.input_refs[2].id,response.id);
  const extraction=await store.get(evaluation.payload.provenance.operation_ref.id);
  assert.equal(extraction.payload.body.type,'evaluation_extraction');
  assert.equal(extraction.payload.body.input_refs[0].id,response.id);
  assert.equal(branch.response.id,generationId);
  assert.equal(branch.transition.id,transitionId);
  assert.equal(branch.transition.payload.body.intelligence_response_ref.id,generationId);
});

test('caller-declared evaluation has no intelligence-response ref',async()=>{
  const {session,branch,procedure}=await setup();
  const evaluation=await evaluate(session,'B1',procedure,judgment);
  assert.equal(Object.hasOwn(evaluation.payload.body,'intelligence_response_ref'),false);
  assert.equal(evaluation.payload.provenance.actor_role,'caller_declared_evaluator');
  assert.equal(evaluation.payload.provenance.input_refs.some(x=>x.id===branch.response.id),false);
});

test('malformed, incomplete, incompatible and structurally invalid evaluator responses fail closed',async()=>{
  for(const adapter of [evaluator('{bad'),evaluator(undefined,{completion_status:'partial'}),evaluator(undefined,{content_type:'text/plain'}),
    evaluator(undefined,{encoding:'binary'}),evaluator(JSON.stringify({...judgment,extra:true})),evaluator(JSON.stringify({...judgment,limitations:'none'})),
    evaluator(JSON.stringify({...judgment,verdict:'unknown'})),evaluator(JSON.stringify({...judgment,judgment:'  '}))]){
    const {session,procedure}=await setup();
    await assert.rejects(evaluate(session,'B1',procedure,captured(adapter)));
    assert.equal(session.branches.get('B1').evaluation,undefined);
  }
});

test('equivalent captured evaluation has deterministic response, extraction and evaluation IDs',async()=>{
  const run=async()=>{const {session,procedure}=await setup();const result=await evaluate(session,'B1',procedure,captured(evaluator()));
    return [result.payload.body.intelligence_response_ref.id,result.payload.provenance.operation_ref.id,result.id];};
  assert.deepEqual(await run(),await run());
});
