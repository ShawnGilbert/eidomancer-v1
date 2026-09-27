import {ref,GENERIC_RECORD_SCHEMA,embeddedRefs,sortedRefs} from './recordSchemas.js';
import {storeCrystal} from './crystalValidator.js';

const r=obj=>ref(obj.payload.kind,obj.id,true,GENERIC_RECORD_SCHEMA);
const actor=(role,provider,model_or_version,identification_status)=>({role,provider,model_or_version,identification_status});
const source=(status)=>{
  if(status==='test_double')return 'fixture/test double';
  if(status==='caller_reported'||status==='known')return `captured external intelligence at adapter boundary (${status} provider/model identification)`;
  throw new Error('Unsupported intelligence identification status for generic Crystal');
};
const scope=branches=>{
  const generation=new Set(branches.map(b=>source(b.response.payload.body.identification_status)));
  const evaluation=new Set(branches.map(b=>{
    const e=b.evaluation;
    if(e.payload.body.evaluator==='caller_declared_evaluator' && !e.payload.body.intelligence_response_ref)return 'caller-declared evaluation';
    if(e.payload.body.evaluator==='captured_external_intelligence' && e.payload.body.intelligence_response_ref &&
      e.payload.provenance.input_refs.some(x=>x.id===e.payload.body.intelligence_response_ref.id))return `captured evaluation: ${source(e.payload.provenance.identification_status)}`;
    throw new Error('Unsupported generic Crystal evaluation provenance');
  }));
  return `Declared fictional world; generation: ${[...generation].sort().join(' + ')}; evaluation: ${[...evaluation].sort().join(' + ')}. Captures describe adapter-boundary bytes only; provider-side transformations are unverified`;
};
export function makeGenericManifest(session,procedure,{question,intended_reuse,consequence,why_retained,limitations=[]}={}){
  if(session.profile!=='fictional.generic.v1'||procedure.payload.schema_version!==GENERIC_RECORD_SCHEMA||
     ![question,intended_reuse,consequence,why_retained].every(x=>typeof x==='string'&&x.trim()))throw new Error('Complete generic Crystal summaries required');
  const branches=[...session.branches.values()].filter(b=>b.audit);
  if(!branches.length||!branches.some(b=>b.status==='retained')||branches.some(b=>b.evaluation.payload.body.procedure_ref.id!==procedure.id))
    throw new Error('Evaluated retained generic branch and shared procedure required');
  const retained=branches.find(b=>b.status==='retained');
  const payload={schema_version:'eidomancer.crystal.schema.v0.1',crystal_version:'0.1',canonicalization_version:'eidomancer.jcs.v1',
    purpose:{question,intended_reuse,scope:'Bounded fictional world'},boundary:{inclusion_rule:'Explored declared fictional branches and actual checks',
      excluded_scope:'Empirical claims, provider-side transformations, and exhaustive raw traces',stopping_reason:'Declared branch/call budget and evaluated useful outcome',search_limitations:limitations},
    world_mode:'fictional',assumptions:[{id:'A1',statement:session.initial.payload.body.description,claim_class:'declared_world_assumption',
      scope:session.seed.payload.body.scope,source_refs:[r(session.seed),r(session.rule)],uncertainty:'Declared fictional premise',qualifiers:['Not an empirical claim']}],
    constraints:session.constraints.map((c,i)=>({id:`C${i+1}`,statement:c.payload.body.statement,scope:c.payload.body.scope,strength:c.payload.body.strength,
      verification:c.payload.body.check_mode,rule_ref:r(session.rule),exceptions:[]})),
    anchors:[{world_state_ref:r(session.initial),role:'entry',defining_state:session.initial.payload.body.description,rule_set_ref:r(session.rule),claim_class:'declared_world_assumption'},
      {world_state_ref:r(retained.successor),role:'evaluated outcome',defining_state:retained.successor.payload.body.description,rule_set_ref:r(session.rule),claim_class:'generated_candidate'}],
    branches:branches.map(b=>({id:b.id,parent_branch_ids:[],entry_state_ref:r(b.parent),outcome_state_refs:b.successor?[r(b.successor)]:[],
      operation_refs:[r(b.operation),r(b.selection)],status:b.status,relationship:'Independent fork under declared fictional constraints',
      significant_result:b.successor?b.successor.payload.body.description:'Rejected candidate; no mechanically valid successor World state',
      rationale:b.evaluation.payload.body.rationale,trace_ref:r(b.audit)})),
    significant_consequences:[{id:'K1',statement:consequence,claim_class:'generated_candidate',scope:session.seed.payload.body.scope,
      source_refs:[r(retained.successor),r(retained.transition)],uncertainty:'Conditional on declared fictional constraints and evaluation',qualifiers:['No empirical prediction']}],
    unresolved_cracks:branches.filter(b=>b.crack).map((b,i)=>({id:`CR${i+1}`,kind:'fictional_inconsistency',statement:b.crack.payload.body.statement,
      conflicting_claim_ids:[],conflicting_refs:b.crack.payload.body.conflicting_refs,status:'open',candidate_explanations:[],
      effect_on_evaluation:b.crack.payload.body.effect_on_evaluation,detail_ref:r(b.crack)})),
    evaluation_summary:{procedure_ref:r(procedure),evaluator:actor(retained.evaluation.payload.provenance.actor_role,retained.evaluation.payload.provenance.provider,
      retained.evaluation.payload.provenance.model_or_version,retained.evaluation.payload.provenance.identification_status),comparator_refs:[r(session.initial)],
      verdict:retained.evaluation.payload.body.verdict,findings:[retained.evaluation.payload.body.rationale],uncertainty:retained.evaluation.payload.body.uncertainty,
      limitations:retained.evaluation.payload.body.limitations,why_retained,detail_ref:r(retained.evaluation)},
    lineage:{parents:[],origin:r(session.seed)},
    provenance:{environment:actor('environment','eidomancer','fictional.generic.v1','declared'),
      intelligence:branches.map(b=>actor('external_intelligence',b.response.payload.body.provider,b.response.payload.body.model,b.response.payload.body.identification_status)),
      operations:branches.flatMap(b=>[r(b.operation),r(b.selection)]),source_scope:scope(branches),
      evidence_handling:'Mechanical results name checks actually run; judged and unverified constraints remain separate; fictional candidates never become empirical evidence'},
    required_references:[]};
  payload.required_references=sortedRefs(embeddedRefs(payload).filter(x=>x.required));
  return payload;
}
export async function crystallizeGeneric(session,procedure,options){return storeCrystal(session.store,makeGenericManifest(session,procedure,options));}
