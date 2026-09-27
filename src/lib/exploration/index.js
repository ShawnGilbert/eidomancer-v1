export {ObjectStore} from './objectStore.js';
export {record,ref} from './recordSchemas.js';
export {createSession,fork,evolve,evaluate,declareProcedure,openCrack,audit,activeBranches,extendSession} from './session.js';
export {validateCrystal,crystal,retrieveCrystal,storeCrystal} from './crystalValidator.js';
import {ref,embeddedRefs,sortedRefs} from './recordSchemas.js';
import {storeCrystal} from './crystalValidator.js';

const r=o=>ref(o.payload.kind,o.id);
const actor=(role,provider,model_or_version,identification_status)=>({role,provider,model_or_version,identification_status});
const sourceKind=(status)=>{
  if(status==='test_double')return 'fixture/test double';
  if(status==='caller_reported'||status==='known')return `captured external intelligence at adapter boundary (${status} provider/model identification)`;
  throw new Error('Unsupported intelligence identification status for Crystal source scope');
};
const sourceScope=(branches)=>{
  const generation=new Set(branches.map(b=>{
    if(b.response.payload.kind!=='intelligence_response' || b.response.payload.provenance.actor_role!=='external_intelligence')throw new Error('Unsupported generation source provenance');
    return sourceKind(b.response.payload.body.identification_status);
  }));
  const evaluation=new Set(branches.map(b=>{
    const record=b.evaluation;
    if(record.payload.body.evaluator==='caller_declared_evaluator' && record.payload.provenance.actor_role==='caller_declared_evaluator' && !record.payload.body.intelligence_response_ref)return 'caller-declared evaluation';
    if(record.payload.provenance.actor_role==='external_intelligence' &&
       record.payload.body.intelligence_response_ref && record.payload.provenance.input_refs.some(x=>x.id===record.payload.body.intelligence_response_ref.id))
      return `captured evaluation: ${sourceKind(record.payload.provenance.identification_status)}`;
    throw new Error('Unsupported evaluation provenance for Crystal source scope');
  }));
  return `Declared fictional world; generation: ${[...generation].sort().join(' + ')}; evaluation: ${[...evaluation].sort().join(' + ')}. Captures describe adapter-boundary bytes only; provider-side transformations are unverified`;
};

// Summaries are deliberate human/agent-authored decisions; no hidden semantic generator.
export function makeManifest(session,procedure,{question,intended_reuse,consequence,why_retained,limitations=[],parent_relation='extension'}={}) {
  const branches=[...session.branches.values()].filter(b=>b.audit);
  if(!branches.length || !branches.some(b=>b.status==='retained'))throw new Error('Evaluated retained branch required');
  const retained=branches.find(b=>b.status==='retained');
  const cracks=branches.filter(b=>b.crack);
  const payload={schema_version:'eidomancer.crystal.schema.v0.1',crystal_version:'0.1',canonicalization_version:'eidomancer.jcs.v1',
    purpose:{question,intended_reuse,scope:'Bounded fictional memory village'},
    boundary:{inclusion_rule:'Explored branch decisions and R0/R1 mechanical checks',excluded_scope:'Actual human memory, institutions, and complete raw traces',stopping_reason:'Declared branch/call budget and evaluated useful outcome',search_limitations:limitations},
    world_mode:'fictional',assumptions:[{id:'A1',statement:session.rule.payload.body.name==='R0'?'Private recall stops after three exchanges in this model':'R1 permits four exchanges in this descendant model',claim_class:'declared_world_assumption',scope:'fictional memory village',source_refs:[r(session.seed),r(session.rule)],uncertainty:'Declared fictional premise',qualifiers:['Not an empirical memory claim']}],
    constraints:[{id:'C1',statement:session.constraint.payload.body.statement,scope:'fictional village',strength:'hard',verification:'mechanical',rule_ref:r(session.rule),exceptions:[]}],
    anchors:[{world_state_ref:r(session.initial),role:'entry',defining_state:session.initial.payload.body.description,rule_set_ref:r(session.rule),claim_class:'declared_world_assumption'},
      {world_state_ref:r(retained.successor),role:'evaluated outcome',defining_state:retained.successor.payload.body.description,rule_set_ref:r(session.rule),claim_class:'generated_candidate'}],
    branches:branches.map(b=>({id:b.id,parent_branch_ids:[],entry_state_ref:r(b.parent),outcome_state_refs:b.successor?[r(b.successor)]:[],operation_refs:[r(b.operation),r(b.selection)],status:b.status,
      relationship:`Independent fork under ${session.rule.payload.body.name}`,significant_result:b.successor?b.successor.payload.body.description:'Rejected candidate; no valid successor World state',rationale:b.evaluation.payload.body.rationale,trace_ref:r(b.audit)})),
    significant_consequences:[{id:'K1',statement:consequence,claim_class:'generated_candidate',scope:'fictional village under '+session.rule.payload.body.name,source_refs:[r(retained.successor),r(retained.transition)],uncertainty:'Conditional on fictional constraints and evaluation',qualifiers:['No empirical prediction']}],
    unresolved_cracks:cracks.map((b,i)=>({id:`CR${i+1}`,kind:'fictional_inconsistency',statement:b.crack.payload.body.statement,conflicting_claim_ids:[],conflicting_refs:[r(b.transition),r(session.rule)],status:'open',candidate_explanations:[],effect_on_evaluation:b.crack.payload.body.effect_on_evaluation,detail_ref:r(b.crack)})),
    evaluation_summary:{procedure_ref:r(procedure),evaluator:actor(retained.evaluation.payload.provenance.actor_role,retained.evaluation.payload.provenance.provider,retained.evaluation.payload.provenance.model_or_version,retained.evaluation.payload.provenance.identification_status),comparator_refs:[r(session.initial)],verdict:retained.evaluation.payload.body.verdict,findings:[retained.evaluation.payload.body.rationale],uncertainty:retained.evaluation.payload.body.uncertainty,limitations:retained.evaluation.payload.body.limitations,why_retained,detail_ref:r(retained.evaluation)},
    lineage:{parents:session.parentCrystal?[{crystal_ref:ref('crystal',session.parentCrystal.id),relation:parent_relation,inherited:session.seed.payload.body.inherited,changed:session.seed.payload.body.changed}]:[],origin:r(session.seed)},
    provenance:{environment:actor('environment','eidomancer','exploration.v0.3','declared'),intelligence:branches.map(b=>actor('external_intelligence',b.response.payload.body.provider,b.response.payload.body.model,b.response.payload.body.identification_status)),operations:[...(session.displacement?[r(session.displacement)]:[]),...branches.flatMap(b=>[r(b.operation),r(b.selection)])],source_scope:sourceScope(branches),evidence_handling:'Generated candidates stay fictional; mechanical checks separate from evaluator judgments'},
    required_references:[]};
  payload.required_references=sortedRefs(embeddedRefs(payload).filter(x=>x.required));
  return payload;
}
export async function crystallize(session,procedure,options){return storeCrystal(session.store,makeManifest(session,procedure,options));}
