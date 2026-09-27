import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ObjectStore,createSession,fork,evolve,declareProcedure,evaluate,audit,makeManifest} from '../src/lib/exploration/index.js';

const scopeOptions={question:'How do obligations persist?',intended_reuse:'Fictional exploration',consequence:'Public ledger',why_retained:'Coherent consequence'};
const adapter=(identification_status,provider)=>({async invoke(){return {bytes:Buffer.from(JSON.stringify({description:'Public ledger',private_recall_after_exchanges:3,external_inscription_available:true})),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider,model:'scripted',identification_status};}});
async function setup(sources=['test_double']) {
  const store=new ObjectStore(await mkdtemp(path.join(tmpdir(),'eidomancer-source-scope-')));
  const session=await createSession(store,{purpose:'Village',description:'Recall ends after three exchanges'});
  await fork(session,[{id:'B1',intent:'Ledger'},{id:'B2',intent:'Inscriptions'}]);
  const procedure=await declareProcedure(store);
  for(const [index,status] of sources.entries()) {
    const id=`B${index+1}`;
    await evolve(session,id,adapter(status,status==='test_double'?'fixture':'OpenAI'),`generate-${id}`);
    await evaluate(session,id,procedure,{verdict:'retain',rationale:'Coherent ledger',uncertainty:'Fictional',limitations:[]});
    await audit(session,id,'retained','Coherent fictional branch');
  }
  return {session,procedure};
}
test('fixture generation and caller evaluation retain truthful fixture scope',async()=>{
  const {session,procedure}=await setup();
  const scope=makeManifest(session,procedure,scopeOptions).provenance.source_scope;
  assert.match(scope,/fixture|test double/i);
  assert.match(scope,/caller.declared/i);
});
test('reported captured generation is labeled as adapter-boundary evidence, without fixture or provider-transport claims',async()=>{
  const {session,procedure}=await setup(['caller_reported']);
  const scope=makeManifest(session,procedure,scopeOptions).provenance.source_scope;
  assert.match(scope,/captured|adapter.boundary/i);
  assert.match(scope,/caller.reported/i);
  assert.doesNotMatch(scope,/fixture|provider transport verified/i);
});
test('mixed fixture and reported external generation has explicit mixed source scope and deterministic result',async()=>{
  const {session,procedure}=await setup(['test_double','caller_reported']);
  const first=makeManifest(session,procedure,scopeOptions);
  const second=makeManifest(session,procedure,scopeOptions);
  assert.match(first.provenance.source_scope,/fixture|test double/i);
  assert.match(first.provenance.source_scope,/captured|adapter.boundary/i);
  assert.equal(first.provenance.source_scope,second.provenance.source_scope);
});
test('captured evaluator is labeled by its own identification status, separately from fixture generation',async()=>{
  const fresh=await createSession(new ObjectStore(await mkdtemp(path.join(tmpdir(),'eidomancer-source-scope-eval-'))),{purpose:'Village',description:'Recall ends after three exchanges'});
  await fork(fresh,[{id:'B1',intent:'Ledger'},{id:'B2',intent:'Inscriptions'}]);
  const proc=await declareProcedure(fresh.store);
  await evolve(fresh,'B1',adapter('test_double','fixture'),'generate-B1');
  await evaluate(fresh,'B1',proc,{adapter:{async invoke(){return {bytes:Buffer.from(JSON.stringify({verdict:'retain',rationale:'Coherent ledger',uncertainty:'Fictional',limitations:[],judgment:'Meaningful'})),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider:'OpenAI',model:'reported',identification_status:'caller_reported'};}},request_id:'evaluate-B1',request_bytes:Buffer.from('exact evaluator input')});
  await audit(fresh,'B1','retained','Coherent fictional branch');
  const scope=makeManifest(fresh,proc,scopeOptions).provenance.source_scope;
  assert.match(scope,/generation: fixture\/test double/);
  assert.match(scope,/evaluation: captured evaluation: captured external intelligence at adapter boundary \(caller_reported/);
});
test('unsupported identification status fails closed instead of assigning fixture or external scope',async()=>{
  const {session,procedure}=await setup(['uncertain']);
  assert.throws(()=>makeManifest(session,procedure,scopeOptions),/unsupported|ambiguous|identification/i);
});
