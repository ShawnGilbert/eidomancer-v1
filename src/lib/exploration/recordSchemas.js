import { canonicalBytes, identity, sha256, CANONICALIZATION_VERSION } from './canonicalJson.js';

export const RECORD_SCHEMA = 'eidomancer.record.schema.v0.1';
export const CRYSTAL_SCHEMA = 'eidomancer.crystal.schema.v0.1';
export const KINDS = new Set(['seed', 'constraint', 'rule_set', 'world_state', 'operation', 'transition', 'intelligence_response', 'evaluation_procedure', 'evaluation_record', 'branch_audit', 'crack_record']);
export const CLASSES = new Set(['observed_or_supplied', 'inferred', 'symbolized', 'declared_world_assumption', 'generated_candidate', 'evaluation_judgment']);
const addr = /^(record|crystal):sha256:[a-f0-9]{64}$/;
const check = (condition, message) => { if (!condition) throw new Error(message); };
const str = (v) => typeof v === 'string' && v.length > 0;
const refKey = (ref) => canonicalBytes(ref).toString('utf8');
export function isRef(value) {
  return value && !Array.isArray(value) && typeof value === 'object' &&
    Object.keys(value).sort().join(',') === 'id,kind,required,schema_version' &&
    str(value.kind) && str(value.schema_version) && typeof value.required === 'boolean' &&
    addr.test(value.id) && value.id.startsWith(value.kind === 'crystal' ? 'crystal:' : 'record:');
}
export function ref(kind, id, required = true) {
  const value = { kind, id, schema_version: kind === 'crystal' ? CRYSTAL_SCHEMA : RECORD_SCHEMA, required };
  check(isRef(value), 'Invalid typed reference');
  return value;
}
export function sortedRefs(refs) {
  check(Array.isArray(refs) && refs.every(isRef), 'Invalid reference list');
  return [...new Map(refs.map((r) => [refKey(r), r])).entries()].sort(([a], [b]) => Buffer.compare(Buffer.from(a), Buffer.from(b))).map(([, r]) => r);
}
function referencesIn(value, result = []) {
  if (isRef(value)) { result.push(value); return result; }
  if (Array.isArray(value)) value.forEach((v) => referencesIn(v, result));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => referencesIn(v, result));
  return result;
}
export const embeddedRefs = (value) => sortedRefs(referencesIn(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const keys = (obj, required, optional = []) => {
  check(obj && typeof obj === 'object' && !Array.isArray(obj), 'Expected object');
  for (const field of required) check(Object.hasOwn(obj, field), `Missing ${field}`);
  for (const field of Object.keys(obj)) check([...required, ...optional].includes(field), `Unknown field ${field}`);
};
const refOf = (v, kind) => check(isRef(v) && v.kind === kind && v.required, `Expected ${kind} reference`);
const refsOf = (v, kind) => { check(Array.isArray(v), 'Expected reference array'); v.forEach((r) => refOf(r, kind)); };

function validateBody(kind, b) {
  switch (kind) {
    case 'constraint':
      keys(b, ['statement','scope','strength','check_mode','predicate','parameters']);
      check(str(b.statement) && str(b.scope) && ['hard','soft'].includes(b.strength), 'Invalid constraint');
      check(['mechanical','intelligence_judgment','unverified'].includes(b.check_mode), 'Invalid constraint mode');
      check(b.check_mode !== 'mechanical' || b.predicate === 'private_recall_max_v1', 'Unsupported mechanical predicate');
      check(b.check_mode === 'mechanical' || b.predicate === 'none', 'Nonmechanical predicate must be none');
      break;
    case 'seed':
      keys(b, ['purpose','mode','initial_description','constraint_refs','scope','budgets','stop_conditions'], ['parent_crystal_ref','inherited','changed']);
      check(str(b.purpose) && b.mode === 'fictional' && str(b.scope), 'Only fictional seeds supported');
      refsOf(b.constraint_refs, 'constraint'); check(b.constraint_refs.length > 0, 'Constraints required');
      check(b.budgets && ['calls','branches','depth'].every((k) => Number.isSafeInteger(b.budgets[k]) && b.budgets[k] >= 0), 'Invalid budget');
      if (b.parent_crystal_ref) refOf(b.parent_crystal_ref, 'crystal');
      break;
    case 'rule_set':
      keys(b, ['name','version','mode','constraint_refs','allowed_operations']);
      check(str(b.name) && str(b.version) && b.mode === 'fictional', 'Invalid rule set'); refsOf(b.constraint_refs, 'constraint');
      break;
    case 'world_state':
      keys(b, ['seed_ref','rule_set_ref','constraint_refs','branch_id','description','private_recall_after_exchanges','external_inscription_available'], ['creator_operation_ref','intelligence_response_ref']);
      refOf(b.seed_ref, 'seed'); refOf(b.rule_set_ref, 'rule_set'); refsOf(b.constraint_refs, 'constraint');
      check(str(b.branch_id) && str(b.description), 'Invalid state');
      check(Number.isSafeInteger(b.private_recall_after_exchanges) && b.private_recall_after_exchanges >= 0 && typeof b.external_inscription_available === 'boolean', 'Invalid state fields');
      if (b.creator_operation_ref) refOf(b.creator_operation_ref, 'operation');
      if (b.intelligence_response_ref) refOf(b.intelligence_response_ref, 'intelligence_response');
      break;
    case 'operation':
      keys(b, ['type','input_refs','changes','invariants','budget_debit','actor']);
      check(['displacement','fork','candidate_selection','evaluation_extraction','crystallization','extension'].includes(b.type), 'Invalid operation');
      check(Array.isArray(b.input_refs) && b.input_refs.every(isRef) && Array.isArray(b.changes) && Array.isArray(b.invariants), 'Invalid operation data');
      check(Number.isSafeInteger(b.budget_debit) && b.budget_debit >= 0 && str(b.actor), 'Invalid operation actor/budget');
      break;
    case 'intelligence_response':
      keys(b, ['request_id','request','response','completion_status','provider','model','identification_status'], ['usage']);
      check(str(b.request_id) && ['complete','partial','error'].includes(b.completion_status) && str(b.provider) && str(b.model), 'Invalid adapter response');
      for (const part of [b.request,b.response]) {
        keys(part, ['content_type','encoding','base64','sha256']);
        check(str(part.content_type) && ['utf-8','binary','unknown'].includes(part.encoding) && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(part.base64) && /^[a-f0-9]{64}$/.test(part.sha256), 'Invalid adapter-boundary bytes');
        const bytes = Buffer.from(part.base64, 'base64');
        check(bytes.toString('base64') === part.base64 && sha256(bytes) === part.sha256, 'Adapter-boundary byte digest mismatch');
      }
      break;
    case 'transition':
      keys(b, ['from_state_ref','rule_set_ref','operation_ref','intelligence_response_ref','checks','judgments','limitations','status'], ['to_state_ref']);
      refOf(b.from_state_ref, 'world_state'); refOf(b.rule_set_ref, 'rule_set'); refOf(b.operation_ref, 'operation'); refOf(b.intelligence_response_ref, 'intelligence_response');
      check(['accepted','rejected'].includes(b.status) && Array.isArray(b.checks), 'Invalid transition');
      check(b.status === 'accepted' ? !!b.to_state_ref : !b.to_state_ref, 'Invalid successor state status');
      if (b.to_state_ref) refOf(b.to_state_ref, 'world_state');
      break;
    case 'evaluation_procedure':
      keys(b, ['name','version','criteria','comparator','evaluator_role','uncertainty_policy']);
      check(str(b.name) && str(b.version) && Array.isArray(b.criteria), 'Invalid evaluation procedure');
      break;
    case 'evaluation_record':
      keys(b, ['target_ref','procedure_ref','results','verdict','rationale','uncertainty','limitations','evaluator'], ['intelligence_response_ref','revises_ref']);
      check(isRef(b.target_ref) && ['world_state','transition','branch_audit'].includes(b.target_ref.kind), 'Invalid evaluation target');
      refOf(b.procedure_ref, 'evaluation_procedure');
      check(['retain','limited','reject','retain_negative_finding'].includes(b.verdict) && str(b.rationale) && str(b.evaluator), 'Invalid evaluation');
      if (b.intelligence_response_ref) refOf(b.intelligence_response_ref, 'intelligence_response');
      break;
    case 'branch_audit':
      keys(b, ['branch_id','parent_state_ref','operation_ref','transition_ref','status','evaluation_ref','reason','crack_refs']);
      refOf(b.parent_state_ref, 'world_state'); refOf(b.operation_ref, 'operation'); refOf(b.transition_ref, 'transition'); refOf(b.evaluation_ref, 'evaluation_record'); refsOf(b.crack_refs, 'crack_record');
      check(str(b.branch_id) && ['retained','pruned','rejected','unresolved'].includes(b.status) && str(b.reason), 'Invalid branch audit');
      break;
    case 'crack_record':
      keys(b, ['kind','statement','conflicting_refs','candidate_explanations','effect_on_evaluation','status']);
      check(['empirical_conflict','model_failure','fictional_inconsistency','unknown'].includes(b.kind) && b.status === 'open' && str(b.statement), 'Invalid open crack');
      check(Array.isArray(b.conflicting_refs) && b.conflicting_refs.every(isRef), 'Invalid crack refs');
      break;
    default: throw new Error(`Unsupported record kind: ${kind}`);
  }
}

export function validateRecord(payload) {
  keys(payload, ['schema_version','canonicalization_version','kind','body','provenance','claim_class','refs']);
  check(payload.schema_version === RECORD_SCHEMA && payload.canonicalization_version === CANONICALIZATION_VERSION && KINDS.has(payload.kind), 'Unsupported record version/kind');
  check(CLASSES.has(payload.claim_class), 'Invalid claim class');
  const expectedClass=payload.kind==='world_state'?(payload.body.intelligence_response_ref?'generated_candidate':'declared_world_assumption'):
    ['evaluation_record','branch_audit','crack_record'].includes(payload.kind)?'evaluation_judgment':
    ['transition','intelligence_response'].includes(payload.kind)||payload.kind==='operation'&&['candidate_selection','evaluation_extraction'].includes(payload.body.type)?'generated_candidate':'declared_world_assumption';
  check(payload.claim_class===expectedClass,'One-way evidence: record claim class inconsistent with source and role');
  keys(payload.provenance, ['actor_role','provider','model_or_version','identification_status','input_refs'], ['operation_ref']);
  check(str(payload.provenance.actor_role) && str(payload.provenance.provider) && str(payload.provenance.model_or_version) && str(payload.provenance.identification_status), 'Invalid provenance');
  check(Array.isArray(payload.provenance.input_refs) && payload.provenance.input_refs.every(isRef), 'Invalid provenance refs');
  validateBody(payload.kind, payload.body);
  check(same(payload.refs, sortedRefs(payload.refs)), 'Record refs must be sorted and unique');
  check(same(payload.refs, embeddedRefs({body:payload.body,provenance:payload.provenance})), 'Record refs must equal embedded refs');
  return payload;
}

export function record(kind, body, claim_class, provenance) {
  const payload = {schema_version:RECORD_SCHEMA, canonicalization_version:CANONICALIZATION_VERSION, kind, body, provenance, claim_class,
    refs:embeddedRefs({body,provenance})};
  validateRecord(payload);
  return {id:identity('record',payload),payload};
}
