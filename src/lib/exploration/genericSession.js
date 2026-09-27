import {record,ref,GENERIC_RECORD_SCHEMA} from './recordSchemas.js';
import {captureAdapter,extractEvaluation} from './intelligenceAdapter.js';
import {canonicalBytes,parseStrictJson} from './canonicalJson.js';
import {validateFactTypes,validateValidator,runValidator} from './fictionalValidators.js';

const r=obj=>ref(obj.payload.kind,obj.id,true,GENERIC_RECORD_SCHEMA);
const environment=(input_refs=[])=>({actor_role:'environment',provider:'eidomancer',model_or_version:'fictional.generic.v1',identification_status:'declared',input_refs});
const put=async(store,kind,body,claim_class,provenance=environment())=>{const obj=record(kind,body,claim_class,provenance,GENERIC_RECORD_SCHEMA);await store.put(obj);return obj;};
const sameRefs=(left,right)=>left.length===right.length && left.every((v,i)=>v.id===right[i].id && v.schema_version===right[i].schema_version);

export async function createGenericSession(store,{purpose,description,facts,fact_types,constraints,budgets={calls:2,branches:2,depth:1},scope='bounded fictional world'}){
  if(typeof description!=='string'||!description.trim()||typeof purpose!=='string'||!purpose.trim()||
    typeof scope!=='string'||!scope.trim()||!Array.isArray(constraints)||!constraints.length||constraints.length>16)throw new Error('Bounded fictional world and constraints required');
  validateFactTypes(fact_types,facts);
  for(const constraint of constraints)if(constraint.check_mode==='mechanical')validateValidator(constraint.predicate,constraint.parameters,fact_types);
  const records=[];
  for(const constraint of constraints)records.push(await put(store,'constraint',{statement:constraint.statement,scope,strength:constraint.strength,check_mode:constraint.check_mode,
    predicate:constraint.predicate,parameters:constraint.parameters},'declared_world_assumption'));
  const refs=records.map(r);
  const seed=await put(store,'seed',{purpose,mode:'fictional',initial_description:description,constraint_refs:refs,scope,budgets,
    stop_conditions:['Declared call, branch, and depth budgets'],profile:'fictional.generic.v1',fact_types},'declared_world_assumption');
  const rule=await put(store,'rule_set',{name:'fictional.generic',version:'1',mode:'fictional',constraint_refs:refs,
    allowed_operations:['fork','candidate_selection']},'declared_world_assumption');
  const initial=await put(store,'world_state',{seed_ref:r(seed),rule_set_ref:r(rule),constraint_refs:refs,branch_id:'V0',description,facts},'declared_world_assumption');
  return {profile:'fictional.generic.v1',store,seed,rule,initial,constraints:records,branches:new Map(),calls:0,budgets};
}

export async function forkGeneric(session,intents){
  if(session.profile!=='fictional.generic.v1'||!Array.isArray(intents)||intents.length<2||intents.length>session.budgets.branches||
    intents.some(x=>typeof x?.id!=='string'||!x.id.trim()||typeof x.intent!=='string'||!x.intent.trim())||
    new Set(intents.map(x=>x.id)).size!==intents.length||session.branches.size)throw new Error('Invalid generic fork/budget');
  for(const {id,intent} of intents){const operation=await put(session.store,'operation',{type:'fork',input_refs:[r(session.initial)],changes:[intent],
    invariants:session.constraints.map(x=>x.payload.body.statement),budget_debit:1,actor:'environment'},'declared_world_assumption');
    session.branches.set(id,{id,intent,operation,parent:session.initial,status:'active'});}
  return session.branches;
}

function extractGeneric(response,fact_types){
  const body=response.payload.body;
  if(body.completion_status!=='complete'||body.response.content_type!=='application/json'||body.response.encoding!=='utf-8')throw new Error('Incomplete or incompatible generic candidate');
  const candidate=parseStrictJson(Buffer.from(body.response.base64,'base64'));
  if(!candidate||Array.isArray(candidate)||typeof candidate!=='object'||Object.keys(candidate).sort().join(',')!=='description,facts'||
    typeof candidate.description!=='string'||!candidate.description.trim())throw new Error('Invalid generic candidate fields');
  validateFactTypes(fact_types,candidate.facts);
  return candidate;
}

export async function evolveGeneric(session,branch_id,adapter,request_id){
  const branch=session.branches.get(branch_id);
  if(session.profile!=='fictional.generic.v1'||!branch||branch.status!=='active'||branch.transition)throw new Error('Generic branch unavailable');
  if(session.calls>=session.budgets.calls||typeof request_id!=='string'||!request_id.trim())throw new Error('Generic intelligence budget/request ID invalid');
  const constraint_refs=session.constraints.map(r),seed_ref=r(session.seed),current_state_ref=r(branch.parent),rule_set_ref=r(session.rule),declared_operation_ref=r(branch.operation);
  const resolved=async reference=>({ref:reference,body:(await session.store.verifyRef(reference)).payload.body});
  const [seed,current_state,rule_set,declared_operation,constraint_records]=await Promise.all([
    resolved(seed_ref),resolved(current_state_ref),resolved(rule_set_ref),resolved(declared_operation_ref),Promise.all(constraint_refs.map(resolved))]);
  if(!sameRefs(seed.body.constraint_refs,constraint_refs)||!sameRefs(rule_set.body.constraint_refs,constraint_refs)||
    !sameRefs(current_state.body.constraint_refs,constraint_refs)||current_state.body.seed_ref.id!==seed_ref.id||
    current_state.body.rule_set_ref.id!==rule_set_ref.id||declared_operation.body.type!=='fork'||
    !declared_operation.body.input_refs.some(x=>x.id===current_state_ref.id)||!declared_operation.body.changes.includes(branch.intent))
    throw new Error('Generic resolved context inconsistent');
  const request_bytes=canonicalBytes({schema_version:'eidomancer.generic.generation-request.v1',seed_ref,current_state_ref,rule_set_ref,
    constraint_refs,declared_operation_ref,branch_id,intent:branch.intent,request_id,seed,current_state,rule_set,declared_operation,constraint_records});
  session.calls++;
  const response=await captureAdapter(session.store,adapter,{request_id,request_bytes,input_refs:[seed_ref,current_state_ref,rule_set_ref,declared_operation_ref,...constraint_refs],schema_version:GENERIC_RECORD_SCHEMA});
  branch.response=response;
  const candidate=extractGeneric(response,session.seed.payload.body.fact_types);
  const selection=await put(session.store,'operation',{type:'candidate_selection',input_refs:[r(response),declared_operation_ref],
    changes:[`Extracted by fictional-generic-json-v1 from ${response.id}`],invariants:session.constraints.map(x=>x.payload.body.statement),
    budget_debit:0,actor:'environment'},'generated_candidate');
  branch.selection=selection;
  const checks=session.constraints.filter(x=>x.payload.body.check_mode==='mechanical').map(x=>runValidator(x,candidate.facts,session.seed.payload.body.fact_types));
  branch.checks=checks;
  const passed=checks.every(x=>x.passed);
  const unchecked=session.constraints.filter(x=>x.payload.body.check_mode!=='mechanical');
  const limitations=unchecked.map(x=>`${x.payload.body.check_mode}: ${x.payload.body.statement} (not mechanically verified)`);
  if(passed)branch.successor=await put(session.store,'world_state',{seed_ref,rule_set_ref,constraint_refs,branch_id,description:candidate.description,
    facts:candidate.facts,creator_operation_ref:r(selection),intelligence_response_ref:r(response)},'generated_candidate',environment([r(selection),r(response)]));
  const transitionBody={from_state_ref:current_state_ref,rule_set_ref,operation_ref:r(selection),intelligence_response_ref:r(response),checks,
    judgments:[],limitations,status:passed?'accepted':'rejected'};
  if(branch.successor)transitionBody.to_state_ref=r(branch.successor);
  branch.transition=await put(session.store,'transition',transitionBody,'generated_candidate',environment([r(response),r(selection)]));
  return branch;
}

export async function declareGenericProcedure(session,{name,criteria,comparator='Initial fictional state',uncertainty_policy='Retain unresolved limitations'}){
  if(session.profile!=='fictional.generic.v1'||typeof name!=='string'||!name.trim()||!Array.isArray(criteria))throw new Error('Generic evaluation procedure required');
  const judged=session.constraints.map((x,i)=>x.payload.body.check_mode==='intelligence_judgment'?i:-1).filter(i=>i>=0);
  if(criteria.length!==judged.length||criteria.some((x,i)=>x.constraint_index!==judged[i]||typeof x.question!=='string'||!x.question.trim()))
    throw new Error('Evaluation criteria must address every evaluator-judged constraint exactly once');
  const items=session.constraints.map((x,i)=>({id:`C${i+1}`,mode:x.payload.body.check_mode,question:criteria.find(y=>y.constraint_index===i)?.question??x.payload.body.statement,constraint_ref:r(x)}));
  return put(session.store,'evaluation_procedure',{name,version:'fictional.generic.v1',criteria:items,comparator,
    evaluator_role:'declared_external_evaluator',uncertainty_policy},'declared_world_assumption');
}

export async function evaluateGeneric(session,branch_id,procedure,options){
  const branch=session.branches.get(branch_id);
  if(!branch?.transition||branch.evaluation||procedure.payload.schema_version!==GENERIC_RECORD_SCHEMA||
    procedure.payload.kind!=='evaluation_procedure'||procedure.payload.body.criteria.length!==session.constraints.length||
    procedure.payload.body.criteria.some((c,i)=>c.constraint_ref?.id!==session.constraints[i].id||c.mode!==session.constraints[i].payload.body.check_mode))
    throw new Error('Invalid generic evaluation procedure/branch');
  const captured=Object.hasOwn(options,'adapter')||Object.hasOwn(options,'request_bytes')||Object.hasOwn(options,'request_id');
  let response,values,extraction;
  if(captured){
    if(Object.keys(options).sort().join(',')!=='adapter,request_bytes,request_id'||!Buffer.isBuffer(options.request_bytes)||!options.request_bytes.length||
      typeof options.request_id!=='string'||!options.request_id.trim())throw new Error('Exact generic evaluator request required');
    response=await captureAdapter(session.store,options.adapter,{request_id:options.request_id,request_bytes:options.request_bytes,
      input_refs:[r(branch.transition),r(procedure),...session.constraints.map(r)],schema_version:GENERIC_RECORD_SCHEMA});
    values=extractEvaluation(response);
  }else values=options;
  if(!values||!['retain','limited','reject','retain_negative_finding'].includes(values.verdict)||
    ![values.rationale,values.uncertainty,values.judgment].every(x=>typeof x==='string'&&x.trim())||
    !Array.isArray(values.limitations)||!values.limitations.every(x=>typeof x==='string'&&x.trim()))throw new Error('Invalid generic evaluator judgment');
  if(branch.checks.some(x=>!x.passed)&&!['reject','retain_negative_finding'].includes(values.verdict))throw new Error('Failed mechanical check cannot be retained');
  if(response)extraction=await put(session.store,'operation',{type:'evaluation_extraction',input_refs:[r(response),r(procedure)],
    changes:['Extracted exact evaluation fields from captured JSON response'],invariants:['Mechanical checks remain authoritative'],budget_debit:0,actor:'environment'},
    'generated_candidate',environment([r(response),r(procedure)]));
  const results=session.constraints.map((x,i)=>{
    const mode=x.payload.body.check_mode,check=branch.checks.find(c=>c.constraint_ref.id===x.id);
    return {criterion:`C${i+1}`,constraint_ref:r(x),kind:mode,...(check?{passed:check.passed,validator_id:check.validator_id}:
      mode==='unverified'?{status:'unverified'}:{finding:values.judgment})};
  });
  const body={target_ref:r(branch.transition),procedure_ref:r(procedure),results,verdict:values.verdict,rationale:values.rationale,
    uncertainty:values.uncertainty,limitations:values.limitations,evaluator:response?'captured_external_intelligence':'caller_declared_evaluator'};
  if(response)body.intelligence_response_ref=r(response);
  const provenance=response?{actor_role:'external_intelligence',provider:response.payload.body.provider,model_or_version:response.payload.body.model,
    identification_status:response.payload.body.identification_status,input_refs:[r(branch.transition),r(procedure),r(response)],operation_ref:r(extraction)}:
    {actor_role:'caller_declared_evaluator',provider:'caller',model_or_version:'unspecified',identification_status:'declared',input_refs:[r(branch.transition),r(procedure)]};
  branch.evaluation=await put(session.store,'evaluation_record',body,'evaluation_judgment',provenance);
  return branch.evaluation;
}

export async function openGenericCrack(session,branch_id,statement,constraint_index){
  const branch=session.branches.get(branch_id),constraint=session.constraints[constraint_index];
  if(!branch?.transition||branch.transition.payload.body.status!=='rejected'||!constraint||
    !branch.checks.some(x=>x.constraint_ref.id===constraint.id&&!x.passed)||typeof statement!=='string'||!statement.trim())throw new Error('Failed named constraint required for generic Crack');
  branch.crack=await put(session.store,'crack_record',{kind:'fictional_inconsistency',statement,
    conflicting_refs:[r(branch.transition),r(constraint),r(session.rule)],candidate_explanations:[],
    effect_on_evaluation:'Failed declared mechanical constraint; no valid successor',status:'open'},'evaluation_judgment');
  return branch.crack;
}

export async function auditGeneric(session,branch_id,status,reason){
  const branch=session.branches.get(branch_id);
  if(!branch?.evaluation||!['retained','pruned','rejected','unresolved'].includes(status)||
    (status==='retained'&&!branch.successor)|| (branch.transition.payload.body.status==='rejected'&&!branch.crack)||
    (status==='retained'&&!['retain','limited'].includes(branch.evaluation.payload.body.verdict))||
    typeof reason!=='string'||!reason.trim())throw new Error('Evaluated generic branch, valid status and Crack required');
  branch.audit=await put(session.store,'branch_audit',{branch_id,parent_state_ref:r(branch.parent),operation_ref:r(branch.operation),
    transition_ref:r(branch.transition),status,evaluation_ref:r(branch.evaluation),reason,crack_refs:branch.crack?[r(branch.crack)]:[]},'evaluation_judgment');
  branch.status=status;return branch.audit;
}
