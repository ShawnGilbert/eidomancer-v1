import {canonicalBytes,identity,CANONICALIZATION_VERSION} from './canonicalJson.js';
import {CRYSTAL_SCHEMA,RECORD_SCHEMA,KINDS,CLASSES,isRef,sortedRefs,embeddedRefs} from './recordSchemas.js';

const fail=(message)=>{throw new Error(message);};
const requireThat=(v,message)=>{if(!v)fail(message);};
const keys=(v,required,optional=[])=>{
  requireThat(v && typeof v==='object' && !Array.isArray(v),'Expected object');
  required.forEach(k=>requireThat(Object.hasOwn(v,k),`Missing ${k}`));
  Object.keys(v).forEach(k=>requireThat([...required,...optional].includes(k),`Unknown field ${k}`));
};
const text=v=>typeof v==='string' && v.trim().length>0;
const texts=v=>Array.isArray(v)&&v.every(text);
const arr=v=>Array.isArray(v);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const typed=(v,kind)=>requireThat(isRef(v)&&v.kind===kind,`Expected ${kind} reference`);
const actor=a=>{keys(a,['role','provider','model_or_version','identification_status']);requireThat(Object.values(a).every(text),'Invalid Actor');};
const refs=a=>requireThat(arr(a)&&a.every(isRef),'Invalid reference array');
const claim=c=>{
  keys(c,['id','statement','claim_class','scope','source_refs','uncertainty','qualifiers']);
  requireThat([c.id,c.statement,c.scope,c.uncertainty].every(text)&&CLASSES.has(c.claim_class)&&texts(c.qualifiers),'Invalid Claim');refs(c.source_refs);
  if(c.claim_class==='inferred'||c.claim_class==='evaluation_judgment')requireThat(c.source_refs.length>0,'Derived claim requires sources');
};
const uniqueIds=(array,label)=>requireThat(new Set(array.map(v=>v.id)).size===array.length,`Duplicate ${label} ID`);
export function validateCrystal(payload) {
  keys(payload,['schema_version','crystal_version','canonicalization_version','purpose','boundary','world_mode','assumptions','constraints','anchors','branches','significant_consequences','unresolved_cracks','evaluation_summary','lineage','provenance','required_references'],['optional_references']);
  requireThat(payload.schema_version===CRYSTAL_SCHEMA&&payload.crystal_version==='0.1'&&payload.canonicalization_version===CANONICALIZATION_VERSION,'Unsupported Crystal version');
  keys(payload.purpose,['question','intended_reuse','scope']);requireThat(Object.values(payload.purpose).every(text),'Invalid purpose');
  keys(payload.boundary,['inclusion_rule','excluded_scope','stopping_reason','search_limitations']);requireThat([payload.boundary.inclusion_rule,payload.boundary.excluded_scope,payload.boundary.stopping_reason].every(text)&&texts(payload.boundary.search_limitations),'Invalid boundary');
  requireThat(['fictional','hypothetical','real_model'].includes(payload.world_mode),'Invalid world mode');
  if(payload.world_mode!=='fictional')fail('MVP supports fictional worlds only');
  requireThat(arr(payload.assumptions)&&arr(payload.constraints)&&payload.constraints.length>0&&arr(payload.anchors)&&payload.anchors.length>0&&arr(payload.branches)&&payload.branches.length>0&&arr(payload.significant_consequences)&&payload.significant_consequences.length>0&&arr(payload.unresolved_cracks),'Missing Crystal territory');
  [...payload.assumptions,...payload.significant_consequences].forEach(claim);uniqueIds([...payload.assumptions,...payload.significant_consequences],'claim');
  for(const c of payload.constraints){keys(c,['id','statement','scope','strength','verification','exceptions'],['rule_ref','inherited_from']);requireThat([c.id,c.statement,c.scope].every(text)&&['hard','soft'].includes(c.strength)&&['mechanical','intelligence_judgment','unverified'].includes(c.verification)&&texts(c.exceptions),'Invalid constraint summary');if(c.rule_ref)typed(c.rule_ref,'rule_set');if(c.inherited_from)requireThat(isRef(c.inherited_from),'Invalid inherited constraint');}
  uniqueIds(payload.constraints,'constraint');
  for(const a of payload.anchors){keys(a,['world_state_ref','role','defining_state','rule_set_ref','claim_class'],['topology_ref']);typed(a.world_state_ref,'world_state');typed(a.rule_set_ref,'rule_set');requireThat(text(a.role)&&text(a.defining_state)&&CLASSES.has(a.claim_class),'Invalid anchor');if(a.topology_ref)typed(a.topology_ref,'topology');}
  for(const b of payload.branches){keys(b,['id','parent_branch_ids','entry_state_ref','outcome_state_refs','operation_refs','status','relationship','significant_result','rationale'],['trace_ref']);typed(b.entry_state_ref,'world_state');refs(b.outcome_state_refs);b.outcome_state_refs.forEach(v=>typed(v,'world_state'));refs(b.operation_refs);b.operation_refs.forEach(v=>typed(v,'operation'));requireThat(text(b.id)&&texts(b.parent_branch_ids)&&['retained','pruned','rejected','unresolved'].includes(b.status)&&[b.relationship,b.significant_result,b.rationale].every(text),'Invalid branch summary');if(b.trace_ref)typed(b.trace_ref,'branch_audit');if(['pruned','rejected'].includes(b.status))requireThat(b.trace_ref?.required,'Rejected/pruned branch requires audit');if(b.status==='rejected')requireThat(b.outcome_state_refs.length===0,'Rejected branch cannot contain successor');}
  uniqueIds(payload.branches,'branch');const branchIds=new Set(payload.branches.map(b=>b.id));for(const b of payload.branches)for(const p of b.parent_branch_ids)requireThat(branchIds.has(p),'Unknown branch parent');
  for(const c of payload.unresolved_cracks){keys(c,['id','kind','statement','conflicting_claim_ids','conflicting_refs','status','candidate_explanations','effect_on_evaluation'],['detail_ref']);requireThat(text(c.id)&&text(c.statement)&&['empirical_conflict','model_failure','fictional_inconsistency','unknown'].includes(c.kind)&&c.status==='open'&&texts(c.conflicting_claim_ids)&&texts(c.candidate_explanations)&&text(c.effect_on_evaluation),'Invalid Crack');refs(c.conflicting_refs);if(c.detail_ref)typed(c.detail_ref,'crack_record');}
  uniqueIds(payload.unresolved_cracks,'crack');
  const e=payload.evaluation_summary;keys(e,['procedure_ref','evaluator','comparator_refs','verdict','findings','uncertainty','limitations','why_retained','detail_ref']);typed(e.procedure_ref,'evaluation_procedure');typed(e.detail_ref,'evaluation_record');actor(e.evaluator);refs(e.comparator_refs);requireThat(['retain','retain_negative_finding','limited','reject'].includes(e.verdict)&&texts(e.findings)&&text(e.uncertainty)&&texts(e.limitations)&&text(e.why_retained),'Invalid evaluation summary');
  keys(payload.lineage,['parents','origin']);requireThat(arr(payload.lineage.parents),'Invalid lineage');typed(payload.lineage.origin,'seed');for(const p of payload.lineage.parents){keys(p,['crystal_ref','relation','inherited','changed'],['reconciliation_ref']);typed(p.crystal_ref,'crystal');requireThat(['extension','correction','evaluation_revision','merge'].includes(p.relation)&&texts(p.inherited)&&texts(p.changed),'Invalid parent');if(p.reconciliation_ref)typed(p.reconciliation_ref,'reconciliation');}requireThat(payload.lineage.parents.length<=1,'Multiple-parent merge deferred');
  const parentIds=payload.lineage.parents.map(p=>p.crystal_ref.id);requireThat(eq(parentIds,[...new Set(parentIds)].sort()),'Parents must be sorted and unique');
  keys(payload.provenance,['environment','intelligence','operations','source_scope','evidence_handling']);actor(payload.provenance.environment);requireThat(arr(payload.provenance.intelligence),'Invalid intelligence provenance');payload.provenance.intelligence.forEach(actor);refs(payload.provenance.operations);payload.provenance.operations.forEach(x=>typed(x,'operation'));requireThat(text(payload.provenance.source_scope)&&text(payload.provenance.evidence_handling),'Invalid provenance');
  refs(payload.required_references);requireThat(eq(payload.required_references,sortedRefs(payload.required_references))&&payload.required_references.every(v=>v.required),'Required refs must be sorted and unique');
  if(payload.optional_references){refs(payload.optional_references);requireThat(eq(payload.optional_references,sortedRefs(payload.optional_references))&&payload.optional_references.every(v=>!v.required),'Optional refs must be sorted and unique');}
  const {required_references,optional_references,...embedded}=payload;
  const found=embeddedRefs(embedded);requireThat(eq(payload.required_references,found.filter(x=>x.required)),'Required refs must equal embedded required refs');
  requireThat(eq(payload.optional_references??[],found.filter(x=>!x.required)),'Optional refs must equal embedded optional refs');
  requireThat(!found.some(x=>x.required&&!KINDS.has(x.kind)&&x.kind!=='crystal'),'Unsupported required record kind');
  requireThat(!payload.significant_consequences.some(x=>x.claim_class==='symbolized'||x.claim_class==='observed_or_supplied'),'One-way evidence violation in fictional consequence');
  for(const b of payload.branches) if(['pruned','rejected'].includes(b.status))requireThat(!payload.significant_consequences.some(c=>c.source_refs.some(s=>s.id===b.trace_ref.id)),'Failed branch cannot be successful consequence');
  canonicalBytes(payload);return payload;
}

export function crystal(payload) {validateCrystal(payload);return {id:identity('crystal',payload),payload};}

async function validateAgainstRecords(store,payload) {
  const get=async ref=>store.verifyRef(ref);
  const origin=await get(payload.lineage.origin);
  if(origin.payload.body.mode!==payload.world_mode)fail('Origin world mode mismatch');
  for(const anchor of payload.anchors){
    const state=await get(anchor.world_state_ref);
    if(state.payload.body.rule_set_ref.id!==anchor.rule_set_ref.id)fail('Anchor rule set mismatch');
  }
  for(const branch of payload.branches){
    if(!branch.trace_ref)continue;
    const audit=await get(branch.trace_ref);
    if(audit.payload.body.branch_id!==branch.id||audit.payload.body.status!==branch.status||audit.payload.body.parent_state_ref.id!==branch.entry_state_ref.id)fail('Branch audit differs from manifest');
    const transition=await get(audit.payload.body.transition_ref);
    if(branch.outcome_state_refs.length===0 && transition.payload.body.to_state_ref)fail('Omitted valid successor from branch');
    if(branch.outcome_state_refs.length && !branch.outcome_state_refs.some(x=>x.id===transition.payload.body.to_state_ref?.id))fail('Branch outcome differs from transition');
    if(transition.payload.body.status==='rejected' && (branch.outcome_state_refs.length||branch.status==='retained'))fail('Rejected transition presented as success');
    if(transition.payload.body.status==='accepted' && !transition.payload.body.checks.every(c=>c.passed===true))fail('Failed mechanical check on accepted transition');
    const evaluation=await get(audit.payload.body.evaluation_ref);
    if(evaluation.payload.body.procedure_ref.id!==payload.evaluation_summary.procedure_ref.id)fail('Branch evaluation procedure mismatch');
    if(branch.status==='pruned' && !['reject','retain_negative_finding'].includes(evaluation.payload.body.verdict))fail('Pruned branch evaluation mismatch');
    if(transition.payload.body.status==='rejected' && !payload.unresolved_cracks.some(c=>c.conflicting_refs.some(x=>x.id===audit.payload.body.transition_ref.id)))fail('Rejected contradiction missing Crack');
  }
  const detail=await get(payload.evaluation_summary.detail_ref);
  if(detail.payload.body.verdict!==payload.evaluation_summary.verdict||detail.payload.body.procedure_ref.id!==payload.evaluation_summary.procedure_ref.id)fail('Evaluation summary differs from detail');
  if(payload.lineage.parents.length){
    const parent=payload.lineage.parents[0];await get(parent.crystal_ref);
    if(origin.payload.body.parent_crystal_ref?.id!==parent.crystal_ref.id)fail('Origin seed parent mismatch');
    if(!origin.payload.body.changed?.length||!origin.payload.body.inherited?.length)fail('Descendant needs explicit inheritance and changes');
  }
}

const diagnostic=(code,path,message)=>({code,path,message});
export async function retrieveCrystal(store,id,{max_objects=1000}={}) {
  let root;
  try {root=await store.get(id);validateCrystal(root.payload);} catch(error){return {id,status:/Unsupported/.test(error.message)?'unsupported_version':'integrity_error',diagnostics:[diagnostic('root','crystal',error.message)],references:[]};}
  const statusList=[];const diagnostics=[];const visited=new Set();const active=new Set();
  const visit=async(reference)=>{
    const key=reference.id; if(active.has(key)){diagnostics.push(diagnostic('cycle',key,'Required closure cycle'));return;}
    if(visited.has(key))return;
    if(visited.size>=max_objects){diagnostics.push(diagnostic('limit',key,'Closure traversal budget exceeded'));return;}
    visited.add(key);active.add(key);
    try {
      const obj=await store.verifyRef(reference);
      statusList.push({ref:reference,status:'verified'});
      if(reference.kind==='crystal'){
        validateCrystal(obj.payload);
        for(const nested of obj.payload.required_references)await visit(nested);
      } else for(const nested of obj.payload.refs.filter(x=>x.required))await visit(nested);
    } catch(error){
      const missing=error.code==='ENOENT';
      const announced=missing && root.payload.boundary.search_limitations.some(x=>x.includes(reference.id) && x.includes('expected unavailable'));
      statusList.push({ref:reference,status:announced?'expected_unavailable':missing?'missing':'invalid'});
      diagnostics.push(diagnostic(announced?'expected_unavailable':/Unsupported/.test(error.message)?'unsupported_version':'integrity',reference.id,error.message));
    } finally{active.delete(key);}
  };
  for(const reference of root.payload.required_references)await visit(reference);
  for(const reference of root.payload.optional_references??[]) if(!visited.has(reference.id)) {
    try {await store.verifyRef(reference);statusList.push({ref:reference,status:'verified_optional'});}catch(error){statusList.push({ref:reference,status:'unavailable_optional'});}
  }
  if(diagnostics.length===0){try{await validateAgainstRecords(store,root.payload);}catch(error){diagnostics.push(diagnostic('integrity','crystal.semantic',error.message));}}
  const status=diagnostics.some(x=>x.code==='integrity'||x.code==='cycle'||x.code==='limit')?'integrity_error':diagnostics.some(x=>x.code==='unsupported_version')?'unsupported_version':diagnostics.some(x=>x.code==='expected_unavailable')?'incomplete_expected':'complete';
  return {id,status,payload:root.payload,references:statusList,diagnostics};
}

export async function storeCrystal(store,payload,{allow_incomplete=false}={}){
  const obj=crystal(payload);const checked=await retrieveAgainst(store,obj);
  if(checked.status!=='complete'&&!(allow_incomplete&&checked.status==='incomplete_expected'))throw new Error(`Crystal closure ${checked.status}: ${JSON.stringify(checked.diagnostics)}`);
  await store.put(obj);return obj;
}
// Verify closure before writing without temporarily publishing an invalid root.
async function retrieveAgainst(store,object){
  const proxy={get:async id=>id===object.id?object:store.get(id),verifyRef:ref=>store.verifyRef(ref)};
  return retrieveCrystal(proxy,object.id);
}
