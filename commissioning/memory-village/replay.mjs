// Manual commissioning replay. Reads user-supplied bytes; never calls a model.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ObjectStore,createSession,fork,evolve,openCrack,declareProcedure,audit,makeManifest,storeCrystal,retrieveCrystal,record,ref} from '../../src/lib/exploration/index.js';
import {captureAdapter} from '../../src/lib/exploration/intelligenceAdapter.js';
import {parseStrictJson,sha256} from '../../src/lib/exploration/canonicalJson.js';
import {embeddedRefs,sortedRefs} from '../../src/lib/exploration/recordSchemas.js';
const directory=path.dirname(fileURLToPath(import.meta.url));
const store=new ObjectStore(path.join(directory,'objects-v0.1'));
const r=o=>ref(o.payload.kind,o.id);
const reported={provider:'OpenAI',model:'GPT-5.6 Sol',identification_status:'caller_reported'};
const write=async object=>{await store.put(object);return object;};
const session=await createSession(store,{purpose:'Explore obligations in a village with three-exchange memory',description:'Villagers forget private obligations after three exchanges; public inscriptions are available',budgets:{calls:3,branches:2,depth:2}});
await fork(session,[{id:'B1',intent:'Public ledger'},{id:'B2',intent:'Unexplained private recall on fourth exchange'}]);
const earlier=JSON.parse(await readFile(path.join(directory,'ingest-b1-result.json'),'utf8'));
const priorB2=JSON.parse(await readFile(path.join(directory,'ingest-b2-result.json'),'utf8'));
for(const [id,file,expected] of [['B1','mv-b1-response.adapter-boundary.json',earlier.b1],['B2','mv-b2-response.adapter-boundary.json',priorB2]]){
  const adapter={async invoke(){return {bytes:await readFile(path.join(directory,file)),content_type:'application/json',encoding:'utf-8',completion_status:'complete',...reported};}};
  const branch=await evolve(session,id,adapter,id==='B1'?'mv-b1':'mv-b2');
  if(branch.response.id!==expected.response_record_id||branch.transition.id!==expected.transition_id)throw Error(`Replay mismatch ${id}`);
}
const crack=await openCrack(session,'B2','Unexplained private recall on the fourth exchange conflicts with unchanged R0; the asserted exception remains open');
if(crack.id!==priorB2.open_crack_id)throw Error('Crack replay mismatch');
const procedure=await declareProcedure(store);
const requestBytes=await readFile(path.join(directory,'mv-eval-1-request.adapter-boundary.txt'));
const responseBytes=await readFile(path.join(directory,'mv-eval-1-response.adapter-boundary.json'));
const evalResponse=await captureAdapter(store,{async invoke(){return {bytes:responseBytes,content_type:'application/json',encoding:'utf-8',completion_status:'complete',...reported};}},
  {request_id:'mv-eval-1',request_bytes:requestBytes,content_type:'text/plain',input_refs:[r(procedure),r(session.branches.get('B1').transition),r(session.branches.get('B2').transition),r(crack)]});
const judged=parseStrictJson(responseBytes);
if(Object.keys(judged).sort().join(',')!=='B1,B2,crystallize,direct_question_comparison')throw Error('Evaluation extraction: unexpected fields');
for(const id of ['B1','B2']){
  const j=judged[id];
  if(Object.keys(j).sort().join(',')!=='limitations,rationale,semantic_finding,uncertainty,verdict'||!['retain','limited','reject','retain_negative_finding'].includes(j.verdict)||
    ![j.rationale,j.semantic_finding,j.uncertainty].every(x=>typeof x==='string'&&x.length)||!Array.isArray(j.limitations)||!j.limitations.every(x=>typeof x==='string'))throw Error(`Evaluation extraction: invalid ${id}`);
}
if(judged.B1.verdict!=='retain'||judged.B2.verdict!=='retain_negative_finding'||judged.crystallize.worth_retaining!==true||!judged.crystallize.significant_consequence||!judged.crystallize.why)throw Error('Unexpected retention decision; no automatic correction');
const extraction=await write(record('operation',{type:'candidate_selection',input_refs:[r(evalResponse),r(procedure)],changes:['Manual evaluation JSON extraction v1: read B1/B2 verdict, rationale, uncertainty, limitations and semantic_finding verbatim from source response'],invariants:['Do not turn failed R0 branch into valid successor'],budget_debit:0,actor:'environment'},'generated_candidate',{
  actor_role:'environment',provider:'eidomancer',model_or_version:'manual-evaluation-extraction.v1',identification_status:'declared',input_refs:[r(evalResponse),r(procedure)]}));
for(const id of ['B1','B2']){
  const branch=session.branches.get(id),j=judged[id];
  branch.evaluation=await write(record('evaluation_record',{target_ref:r(branch.transition),procedure_ref:r(procedure),results:[{criterion:'R0',kind:'mechanical',passed:branch.check.passed},{criterion:'meaning',kind:'intelligence_judgment',finding:j.semantic_finding}],verdict:j.verdict,rationale:j.rationale,uncertainty:j.uncertainty,limitations:j.limitations,evaluator:'external_intelligence (caller reported OpenAI GPT-5.6 Sol)',intelligence_response_ref:r(evalResponse)},'evaluation_judgment',{
    actor_role:'external_intelligence',provider:'OpenAI',model_or_version:'GPT-5.6 Sol',identification_status:'caller_reported',input_refs:[r(branch.transition),r(procedure),r(evalResponse)],operation_ref:r(extraction)}));
}
await audit(session,'B1','retained',judged.B1.rationale);
await audit(session,'B2','pruned','Failed R0 predicate; negative finding retained in immutable evaluation and open Crack');
const crystallization=await write(record('operation',{type:'crystallization',input_refs:[r(session.branches.get('B1').audit),r(session.branches.get('B2').audit),r(evalResponse)],changes:['Assemble summaries from manual evaluation verbatim','Disclose caller-reported model provenance and raw response limitations instead of fixture label'],invariants:['B2 has no successor under R0','Keep Crack open'],budget_debit:0,actor:'environment'},'declared_world_assumption',{
  actor_role:'environment',provider:'eidomancer',model_or_version:'manual-commissioning-assembly.v1',identification_status:'declared',input_refs:[r(extraction),r(evalResponse)]}));
const manifest=makeManifest(session,procedure,{question:'How can obligations persist past private forgetting?',intended_reuse:'Extend the bounded fictional memory-village exploration',consequence:judged.crystallize.significant_consequence,why_retained:judged.crystallize.why,
  limitations:['Model response delivered through user; original provider transport bytes and submitted UI prompt are not observable','Provider request IDs and usage unavailable','No independently run direct-question baseline']});
manifest.significant_consequences[0].claim_class='evaluation_judgment';
manifest.significant_consequences[0].source_refs.push(r(session.branches.get('B1').evaluation),r(evalResponse));
manifest.evaluation_summary.evaluator={role:'external_intelligence',provider:'OpenAI',model_or_version:'GPT-5.6 Sol',identification_status:'caller_reported'};
manifest.evaluation_summary.limitations.push('B2 negative finding remains pruned, with no R0 successor and an open Crack');
manifest.provenance.operations.push(r(extraction),r(crystallization));
manifest.provenance.source_scope='Fictional village; externally generated candidates and evaluation manually supplied through user, provider/model caller reported';
manifest.provenance.evidence_handling='Exact manual adapter-boundary request/response bytes are stored with digests; supplemental UI prompt and provider transport bytes are not independently observed; B2 remains rejected';
const {required_references,optional_references,...embedded}=manifest;
manifest.required_references=sortedRefs(embeddedRefs(embedded).filter(x=>x.required));
const crystal=await storeCrystal(store,manifest);
const retrieved=await retrieveCrystal(new ObjectStore(store.root),crystal.id);
if(retrieved.status!=='complete')throw Error(`Crystal closure: ${retrieved.status}`);
const result={seed:'Memory village',world_mode:'fictional',calls:3,usage:'unknown',provider:'OpenAI (caller reported)',model:'GPT-5.6 Sol (caller reported)',request_ids:['mv-b1','mv-b2','mv-eval-1'],request_sha256:[earlier.b1.request_sha256,priorB2.request_sha256,sha256(requestBytes)],response_sha256:[earlier.b1.response_sha256,priorB2.response_sha256,sha256(responseBytes)],evaluation_response_record_id:evalResponse.id,extraction_operation_id:extraction.id,
  b1:{transition_id:session.branches.get('B1').transition.id,evaluation_id:session.branches.get('B1').evaluation.id,audit_id:session.branches.get('B1').audit.id,status:'retained'},
  b2:{transition_id:session.branches.get('B2').transition.id,evaluation_id:session.branches.get('B2').evaluation.id,crack_id:crack.id,audit_id:session.branches.get('B2').audit.id,status:'pruned',successor_world_state_id:'none'},
  crystal_id:crystal.id,closure_status:retrieved.status,verified_reference_count:retrieved.references.filter(x=>x.status==='verified').length,
  direct_question_comparison:judged.direct_question_comparison,direct_baseline_was_run:false,store:store.root};
await writeFile(path.join(directory,'commissioning-result.json'),JSON.stringify(result,null,2)+'\n');
await writeFile(path.join(directory,'mv-eval-1-metadata.json'),JSON.stringify({request_id:'mv-eval-1',provider:'OpenAI',model:'GPT-5.6 Sol',identification_status:'caller_reported',completion_status:'complete',provider_request_id:'unknown',usage:'unknown',content_type:'application/json',encoding:'utf-8',request_sha256:sha256(requestBytes),response_sha256:sha256(responseBytes),provenance_limit:'User pasted visible model output; provider transport bytes, actual submitted UI prompt, and provider-side usage are not observable.'},null,2)+'\n');
console.log(JSON.stringify(result,null,2));
