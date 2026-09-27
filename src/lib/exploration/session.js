import {record,ref} from './recordSchemas.js';
import {captureAdapter,extractCandidate,extractEvaluation} from './intelligenceAdapter.js';

const env = (input_refs = []) => ({actor_role:'environment',provider:'eidomancer',model_or_version:'exploration.v0.3',identification_status:'declared',input_refs});
const born = async (store,kind,body,claim_class,provenance = env()) => {const object=record(kind,body,claim_class,provenance);await store.put(object);return object;};
const r = (object) => ref(object.payload.kind,object.id);

export async function createSession(store,{purpose,description,scope='fictional world',budgets={calls:3,branches:2,depth:2},
  max_recall=3,external_inscription_available=true}) {
  if (max_recall !== 3) throw new Error('R0 requires maximum private recall of three exchanges');
  const constraint=await born(store,'constraint',{statement:'Private recall ends after three exchanges under R0',scope,strength:'hard',check_mode:'mechanical',predicate:'private_recall_max_v1',parameters:{maximum:3}},'declared_world_assumption');
  const seed=await born(store,'seed',{purpose,mode:'fictional',initial_description:description,constraint_refs:[r(constraint)],scope,budgets,stop_conditions:['Declared call, branch, and depth budgets']},'declared_world_assumption');
  const rule=await born(store,'rule_set',{name:'R0',version:'1',mode:'fictional',constraint_refs:[r(constraint)],allowed_operations:['fork','candidate_selection']},'declared_world_assumption');
  const initial=await born(store,'world_state',{seed_ref:r(seed),rule_set_ref:r(rule),constraint_refs:[r(constraint)],branch_id:'V0',description,private_recall_after_exchanges:0,external_inscription_available},'declared_world_assumption');
  return {store,seed,constraint,rule,initial,branches:new Map(),calls:0,budgets};
}

export async function fork(session,intents) {
  if (!Array.isArray(intents) || intents.length < 2 || intents.some(x=>typeof x?.intent!=='string' || !x.intent.trim()) || new Set(intents.map(x=>x.id)).size!==intents.length || intents.length>session.budgets.branches) throw new Error('Invalid fork/budget');
  for (const intent of intents) {
    const operation=await born(session.store,'operation',{type:'fork',input_refs:[r(session.initial)],changes:[intent.intent],invariants:[`${session.rule.payload.body.name} private recall <= ${session.constraint.payload.body.parameters.maximum}`],budget_debit:1,actor:'environment'},'declared_world_assumption');
    session.branches.set(intent.id,{id:intent.id,intent:intent.intent,operation,parent:session.initial,status:'active'});
  }
  return session.branches;
}

export function mechanicalCheck(candidate, rule, constraint) {
  const maximum=constraint.payload.body.parameters.maximum;
  if (!['R0','R1'].includes(rule.payload.body.name) || constraint.payload.body.predicate !== 'private_recall_max_v1' || maximum !== (rule.payload.body.name==='R0'?3:4)) throw new Error('Unsupported mechanical rule');
  return {predicate:'private_recall_max_v1',rule_set_ref:r(rule),constraint_ref:r(constraint),passed:candidate.private_recall_after_exchanges<=maximum,
    observed:candidate.private_recall_after_exchanges,maximum};
}

export async function evolve(session,branch_id,adapter,request_id) {
  const branch=session.branches.get(branch_id);
  if (!branch || branch.status!=='active' || branch.transition) throw new Error('Branch unavailable');
  if (session.calls>=session.budgets.calls) throw new Error('Intelligence call budget exhausted');
  session.calls++;
  const request_bytes=Buffer.from(JSON.stringify({seed_ref:r(session.seed),current_state_ref:r(branch.parent),rule_set_ref:r(session.rule),constraint_refs:[r(session.constraint)],branch_id,declared_operation_ref:r(branch.operation),intent:branch.intent,request_id}),'utf8');
  const response=await captureAdapter(session.store,adapter,{request_id,request_bytes,input_refs:[r(session.seed),r(branch.parent),r(session.rule),r(branch.operation)]});
  branch.response=response;
  const extraction=extractCandidate(response);
  const selection=await born(session.store,'operation',{type:'candidate_selection',input_refs:[r(response),r(branch.operation)],changes:[`Extracted by ${extraction.method} from ${extraction.source_response_ref}`],invariants:[`${session.rule.payload.body.name} private recall <= ${session.constraint.payload.body.parameters.maximum}`],budget_debit:0,actor:'environment'},'generated_candidate');
  branch.selection=selection;
  const check=mechanicalCheck(extraction.candidate,session.rule,session.constraint);
  branch.check=check;
  let successor;
  if (check.passed) successor=await born(session.store,'world_state',{seed_ref:r(session.seed),rule_set_ref:r(session.rule),constraint_refs:[r(session.constraint)],branch_id,description:extraction.candidate.description,
    private_recall_after_exchanges:extraction.candidate.private_recall_after_exchanges,external_inscription_available:extraction.candidate.external_inscription_available,
    creator_operation_ref:r(selection),intelligence_response_ref:r(response)},'generated_candidate',env([r(selection),r(response)]));
  const transitionBody={from_state_ref:r(branch.parent),rule_set_ref:r(session.rule),operation_ref:r(selection),intelligence_response_ref:r(response),checks:[check],judgments:[],limitations:['Semantic coherence requires declared evaluation'],status:check.passed?'accepted':'rejected'};
  if (successor) transitionBody.to_state_ref=r(successor);
  branch.successor=successor;
  branch.transition=await born(session.store,'transition',transitionBody,'generated_candidate',env([r(response),r(selection)]));
  return branch;
}

export async function declareProcedure(store) {
  return born(store,'evaluation_procedure',{name:'memory-village-coherence',version:'1',criteria:[{id:'R0',mode:'mechanical',question:'Does private recall remain <= 3?'},{id:'meaning',mode:'intelligence_judgment',question:'Does the proposed institution make obligations intelligible?'}],comparator:'Initial village state under R0',evaluator_role:'declared_external_evaluator',uncertainty_policy:'Retain unresolved cracks as limitations'},'declared_world_assumption');
}

export async function evaluate(session,branch_id,procedure,options) {
  const branch=session.branches.get(branch_id);
  if (!branch?.transition || branch.evaluation) throw new Error('Unevolved or evaluated branch');
  const captured=Object.hasOwn(options,'adapter') || Object.hasOwn(options,'request_bytes') || Object.hasOwn(options,'request_id');
  let values, response, extraction;
  if (captured) {
    if (Object.keys(options).sort().join(',') !== 'adapter,request_bytes,request_id' || !Buffer.isBuffer(options.request_bytes) || !options.request_bytes.length ||
        typeof options.request_id !== 'string' || !options.request_id.trim()) throw new Error('Exact evaluator request and adapter required');
    response=await captureAdapter(session.store,options.adapter,{request_id:options.request_id,request_bytes:options.request_bytes,
      input_refs:[r(branch.transition),r(procedure)]});
    values=extractEvaluation(response);
  } else values=options;
  const {verdict,rationale,uncertainty,limitations=[],judgment='Declared human evaluator judgment'}=values;
  if (!branch.check.passed && verdict!=='reject' && verdict!=='retain_negative_finding') throw new Error('Failed mechanical check cannot be retained as a valid successor');
  if (response) extraction=await born(session.store,'operation',{type:'evaluation_extraction',input_refs:[r(response),r(procedure)],changes:['Extracted exact evaluation fields from captured JSON response'],invariants:['Mechanical checks remain authoritative'],budget_debit:0,actor:'environment'},'generated_candidate',env([r(response),r(procedure)]));
  const body={target_ref:r(branch.transition),procedure_ref:r(procedure),results:[{criterion:'R0',kind:'mechanical',passed:branch.check.passed},{criterion:'meaning',kind:'intelligence_judgment',finding:judgment}],verdict,rationale,uncertainty,limitations,
    evaluator:response?'captured_external_intelligence':'caller_declared_evaluator'};
  if (response) body.intelligence_response_ref=r(response);
  const provenance=response?{actor_role:'external_intelligence',provider:response.payload.body.provider,model_or_version:response.payload.body.model,
    identification_status:response.payload.body.identification_status,input_refs:[r(branch.transition),r(procedure),r(response)],operation_ref:r(extraction)}:
    {actor_role:'caller_declared_evaluator',provider:'caller',model_or_version:'unspecified',identification_status:'declared',input_refs:[r(branch.transition),r(procedure)]};
  branch.evaluation=await born(session.store,'evaluation_record',body,'evaluation_judgment',provenance);
  return branch.evaluation;
}

export async function openCrack(session,branch_id,statement) {
  const branch=session.branches.get(branch_id);
  if (!branch?.transition || branch.check.passed) throw new Error('Failed transition required for this crack');
  branch.crack=await born(session.store,'crack_record',{kind:'fictional_inconsistency',statement,conflicting_refs:[r(branch.transition),r(session.rule)],candidate_explanations:[],effect_on_evaluation:'Invalid successor under unchanged R0; retain as open contradiction',status:'open'},'evaluation_judgment');
  return branch.crack;
}

export async function audit(session,branch_id,status,reason) {
  const branch=session.branches.get(branch_id);
  if (!branch?.evaluation || !['retained','pruned','rejected','unresolved'].includes(status)) throw new Error('Evaluated branch and valid status required');
  if (!branch.check.passed && status==='retained') throw new Error('Failed successor cannot be retained');
  branch.audit=await born(session.store,'branch_audit',{branch_id,parent_state_ref:r(branch.parent),operation_ref:r(branch.operation),transition_ref:r(branch.transition),status,evaluation_ref:r(branch.evaluation),reason,crack_refs:branch.crack?[r(branch.crack)]:[]},'evaluation_judgment');
  branch.status=status;
  return branch.audit;
}
export const activeBranches = session => [...session.branches.values()].filter(b=>b.status==='active'||b.status==='retained');

export async function extendSession(store,parentCrystal,{purpose='Explore a four-exchange memory displacement',budgets={calls:2,branches:2,depth:1}}={}) {
  const {retrieveCrystal}=await import('./crystalValidator.js');
  const retrieved=await retrieveCrystal(store,parentCrystal.id);
  if(retrieved.status!=='complete')throw new Error('Only complete Crystal may be an extension base');
  const parentAnchor=parentCrystal.payload.branches.find(b=>b.status==='retained'&&b.outcome_state_refs.length)?.outcome_state_refs[0];
  if(!parentAnchor)throw new Error('Extension needs a retained outcome World state');
  const old=await store.verifyRef(parentAnchor);
  const constraint=await born(store,'constraint',{statement:'Private recall lasts at most four exchanges under R1',scope:'fictional world',strength:'hard',check_mode:'mechanical',predicate:'private_recall_max_v1',parameters:{maximum:4}},'declared_world_assumption');
  const seed=await born(store,'seed',{purpose,mode:'fictional',initial_description:old.payload.body.description,constraint_refs:[r(constraint)],scope:'fictional descendant of memory village',budgets,stop_conditions:['Declared budgets'],parent_crystal_ref:ref('crystal',parentCrystal.id),inherited:['public ledger','fictional village'],changed:['R0 recall ceiling 3 replaced by R1 ceiling 4']},'declared_world_assumption');
  const displacement=await born(store,'operation',{type:'displacement',input_refs:[ref('crystal',parentCrystal.id),parentAnchor],changes:['R0 max private recall 3 -> R1 max private recall 4'],invariants:['Public ledger remains available'],budget_debit:0,actor:'environment'},'declared_world_assumption');
  const rule=await born(store,'rule_set',{name:'R1',version:'1',mode:'fictional',constraint_refs:[r(constraint)],allowed_operations:['fork','candidate_selection','displacement']},'declared_world_assumption');
  const initial=await born(store,'world_state',{seed_ref:r(seed),rule_set_ref:r(rule),constraint_refs:[r(constraint)],branch_id:'V1-R1',description:old.payload.body.description,private_recall_after_exchanges:old.payload.body.private_recall_after_exchanges,external_inscription_available:old.payload.body.external_inscription_available,creator_operation_ref:r(displacement)},'declared_world_assumption');
  return {store,seed,constraint,rule,initial,displacement,parentCrystal,branches:new Map(),calls:0,budgets};
}
