import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {ObjectStore,createSession,createGenericSession,forkGeneric,evolveGeneric,declareGenericProcedure,evaluateGeneric,auditGeneric,openGenericCrack,crystallizeGeneric,retrieveCrystal,record} from '../src/lib/exploration/index.js';

const world={purpose:'Explore a fictional canal',description:'Two canals share a single water gate.',facts:{water:4,gate_open:false},
  fact_types:{water:'integer',gate_open:'boolean'},budgets:{calls:2,branches:2,depth:1},
  constraints:[{statement:'Water cannot exceed six units',strength:'hard',check_mode:'mechanical',predicate:'integer_max_v1',parameters:{fact:'water',maximum:6}},
    {statement:'Water cannot be negative',strength:'hard',check_mode:'mechanical',predicate:'integer_min_v1',parameters:{fact:'water',minimum:0}},
    {statement:'Opening the gate requires a plausible account',strength:'hard',check_mode:'intelligence_judgment',predicate:'none',parameters:{}},
    {statement:'The gate may make a sound',strength:'soft',check_mode:'unverified',predicate:'none',parameters:{}}]};
const create=async (config=world)=>{const store=new ObjectStore(await mkdtemp(path.join(tmpdir(),'eidomancer-generic-')));
  const session=await createGenericSession(store,config);await forkGeneric(session,[{id:'B1',intent:'Explore coordination'},{id:'B2',intent:'Explore failure'}]);return {store,session};};
const candidate=(facts={water:5,gate_open:true})=>({description:'Water moves through the open gate.',facts});
const adapter=(body=candidate(),onRequest=()=>{})=>({async invoke(input){onRequest(input);return {bytes:Buffer.from(typeof body==='string'?body:JSON.stringify(body)),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider:'fixture',model:'scripted',identification_status:'test_double'};}});
const judgment={verdict:'retain',rationale:'Coherent conditional outcome',uncertainty:'Timing unclear',limitations:['Fictional'],judgment:'Plausible under the declared rules'};

test('generic profile has only its declared constraints; resolved request and two exact mechanical checks',async()=>{
  const {store,session}=await create();let request;
  const branch=await evolveGeneric(session,'B1',adapter(candidate(),input=>{request=Buffer.from(input.bytes)}),'g-1');
  const envelope=JSON.parse(request.toString());assert.equal(envelope.schema_version,'eidomancer.generic.generation-request.v1');
  assert.equal(envelope.constraint_records.length,4);assert.deepEqual(envelope.current_state.body.facts,{water:4,gate_open:false});
  assert.equal(request.toString('base64'),branch.response.payload.body.request.base64);
  assert.equal(request.toString().includes('private_recall'),false);assert.equal(request.toString().includes('inscription'),false);
  assert.deepEqual(branch.transition.payload.body.checks.map(x=>x.validator_id),['integer_max_v1','integer_min_v1']);
  assert.equal(branch.transition.payload.body.checks.every(x=>x.passed),true);
  assert.equal(branch.transition.payload.body.checks.every(x=>x.constraint_ref.schema_version==='eidomancer.record.schema.v0.2'),true);
  assert.equal(branch.transition.payload.body.limitations.some(x=>x.includes('not mechanically')),true);
  assert.equal((await store.get(branch.successor.id)).payload.body.facts.water,5);
});

test('zero mechanical checks never imply mechanical pass; evaluation, audit and Crystal retain truth',async()=>{
  const config={...world,constraints:world.constraints.slice(2)};const {store,session}=await create(config);
  const branch=await evolveGeneric(session,'B1',adapter(),'g-1');assert.deepEqual(branch.transition.payload.body.checks,[]);
  const procedure=await declareGenericProcedure(session,{name:'Canal review',criteria:[{constraint_index:0,question:'Is the gate account plausible?'}]});
  const evaluation=await evaluateGeneric(session,'B1',procedure,judgment);
  assert.equal(evaluation.payload.body.results.some(x=>x.kind==='mechanical'),false);
  assert.equal(evaluation.payload.body.results[0].constraint_ref.id,session.constraints[0].id);
  assert.equal(evaluation.payload.body.results[1].kind,'unverified');
  await auditGeneric(session,'B1','retained','Evaluated conditional outcome');
  const crystal=await crystallizeGeneric(session,procedure,{question:'What changes at the gate?',intended_reuse:'Fictional extension',consequence:'Gate operation depends on timing',why_retained:'Evaluated conditional consequence'});
  assert.equal((await retrieveCrystal(store,crystal.id)).status,'complete');
  assert.equal(crystal.payload.purpose.scope,'Bounded fictional world');
  assert.deepEqual(crystal.payload.constraints.map(c=>c.verification),['intelligence_judgment','unverified']);
});

test('invalid validators and malformed candidates fail closed; failed check has no successor',async()=>{
  for(const predicate of ['not_registered_v1','integer_max_v9'])await assert.rejects(create({...world,constraints:[{...world.constraints[0],predicate}]}),/validator|predicate|Unsupported/i);
  for(const body of ['{bad',JSON.stringify({...candidate(),extra:1}),JSON.stringify(candidate({water:'five',gate_open:true})),
    JSON.stringify(candidate({water:5}))]){const {session}=await create();await assert.rejects(evolveGeneric(session,'B1',adapter(body),'g-1'));assert.equal(session.branches.get('B1').transition,undefined);}
  const {session}=await create();const failed=await evolveGeneric(session,'B1',adapter(candidate({water:7,gate_open:true})),'g-1');
  assert.equal(failed.successor,undefined);assert.equal(failed.transition.payload.body.status,'rejected');
  const procedure=await declareGenericProcedure(session,{name:'Canal review',criteria:[{constraint_index:2,question:'Is this plausible?'}]});
  await evaluateGeneric(session,'B1',procedure,{...judgment,verdict:'reject'});
  const crack=await openGenericCrack(session,'B1','Water exceeds six units',0);
  assert.equal(crack.payload.body.conflicting_refs.some(x=>x.id===session.constraints[0].id),true);
  const audit=await auditGeneric(session,'B1','pruned','Failed water maximum');assert.equal(audit.payload.body.status,'pruned');
});

test('generic replay identities stable with exact captured evaluator provenance',async()=>{
  const run=async()=>{const {session}=await create();const branch=await evolveGeneric(session,'B1',adapter(),'g-1');
    const procedure=await declareGenericProcedure(session,{name:'Canal review',criteria:[{constraint_index:2,question:'Is this plausible?'}]});
    const evaluation=await evaluateGeneric(session,'B1',procedure,{adapter:adapter(judgment),request_id:'e-1',request_bytes:Buffer.from('Evaluate candidate exactly')});
    assert.notEqual(evaluation.payload.body.intelligence_response_ref.id,branch.response.id);
    return [session.seed.id,branch.response.id,branch.transition.id,evaluation.id];};
  assert.deepEqual(await run(),await run());
});

test('direct record writes cannot forge a mechanical result or an invalid successor',async()=>{
  const {store,session}=await create();const branch=await evolveGeneric(session,'B1',adapter(),'g-1');
  const forged=record('transition',{...branch.transition.payload.body,checks:[{...branch.checks[0],passed:false},branch.checks[1]]},
    'generated_candidate',branch.transition.payload.provenance,branch.transition.payload.schema_version);
  await assert.rejects(store.put(forged),/check results differ/);
  const bad=record('world_state',{...branch.successor.payload.body,facts:{water:7,gate_open:true}},'generated_candidate',
    branch.successor.payload.provenance,branch.successor.payload.schema_version);
  await assert.rejects(store.put(bad),/captured candidate|fails mechanical/);
});

test('memory-village legacy profile retains its already preserved content identities',async()=>{
  const store=new ObjectStore(await mkdtemp(path.join(tmpdir(),'eidomancer-legacy-')));
  const session=await createSession(store,{purpose:'Explore consequences under the declared fictional village rules',
    description:'In this fictional village, a person can privately recall an interpersonal exchange through at most three subsequent interpersonal exchanges. After that, its details cannot be privately recalled. The village has one communal inscription room. Each resident may enter it once per day for at most ten minutes. Writing made in that room persists and can be read on later visits. No other durable records exist. Explore consequences under these rules; do not silently change them.',
    budgets:{branches:2,calls:2,depth:1}});
  assert.equal(session.seed.id,'record:sha256:92b96ff5e0aa85a4b11389b3080aa3be9469e9d13b05b88455f4fd79573ba1e8');
  assert.equal(session.initial.id,'record:sha256:7db50e196dbc608ea8fe468c96c9e0d8ab6a932c0d18a5391d437847badeda56');
  assert.equal(session.seed.payload.schema_version,'eidomancer.record.schema.v0.1');
});

test('generic Crystal preserves mixed check modes and rejected branch evidence without R0',async()=>{
  const {store,session}=await create();
  await evolveGeneric(session,'B1',adapter(),'g-1');
  await evolveGeneric(session,'B2',adapter(candidate({water:7,gate_open:true})),'g-2');
  const procedure=await declareGenericProcedure(session,{name:'Canal review',criteria:[{constraint_index:2,question:'Is the account plausible?'}]});
  await evaluateGeneric(session,'B1',procedure,judgment);
  await evaluateGeneric(session,'B2',procedure,{...judgment,verdict:'reject'});
  await openGenericCrack(session,'B2','The described water exceeds the declared maximum',0);
  await auditGeneric(session,'B1','retained','Judged useful within bounded world');
  await auditGeneric(session,'B2','pruned','Failed declared water maximum');
  const crystal=await crystallizeGeneric(session,procedure,{question:'What consequences arise at the gate?',intended_reuse:'Fictional successor',
    consequence:'Gate procedures create scheduling tension',why_retained:'Useful evaluated result'});
  const retrieved=await retrieveCrystal(store,crystal.id);
  assert.equal(retrieved.status,'complete');
  assert.deepEqual(crystal.payload.constraints.map(x=>x.verification),['mechanical','mechanical','intelligence_judgment','unverified']);
  assert.deepEqual(crystal.payload.branches.map(x=>x.status),['retained','pruned']);
  assert.equal(crystal.payload.unresolved_cracks[0].conflicting_refs.some(x=>x.id===session.constraints[0].id),true);
  assert.equal(JSON.stringify(crystal.payload).includes('R0'),false);
  assert.equal(crystal.payload.required_references.some(x=>x.schema_version==='eidomancer.record.schema.v0.2'),true);
});
