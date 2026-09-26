import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import {ObjectStore,createSession,fork,evolve,evaluate,declareProcedure,openCrack,audit,extendSession,crystallize,retrieveCrystal} from '../src/lib/exploration/index.js';

function scripted(recall,description) {
  return {async invoke({bytes}) { if(!Buffer.isBuffer(bytes))throw new Error('Missing request bytes');return {bytes:Buffer.from(JSON.stringify({private_recall_after_exchanges:recall,external_inscription_available:true,description}),'utf8'),content_type:'application/json',encoding:'utf-8',completion_status:'complete',provider:'fixture',model:'scripted',identification_status:'test_double'};}};
}
export async function runMemoryVillage(root) {
  const store=new ObjectStore(resolve(root));
  const session=await createSession(store,{purpose:'Explore obligations in a village with three-exchange memory',description:'Villagers forget private obligations after three exchanges; public inscriptions are available',budgets:{calls:3,branches:2,depth:2}});
  await fork(session,[{id:'B1',intent:'Public ledger'},{id:'B2',intent:'Unexplained private recall on fourth exchange'}]);
  const procedure=await declareProcedure(store);
  await evolve(session,'B1',scripted(3,'Shared public ledger records obligations'),'mv-b1');
  await evolve(session,'B2',scripted(4,'Private recall survives fourth exchange without a rule change'),'mv-b2');
  await evaluate(session,'B1',procedure,{verdict:'limited',rationale:'Ledger preserves obligations but authority is contested',uncertainty:'Institutional legitimacy unresolved',limitations:['Fictional system only']});
  await evaluate(session,'B2',procedure,{verdict:'reject',rationale:'Fourth recall violates R0',uncertainty:'Cause unknown',limitations:['No valid successor under R0']});
  await openCrack(session,'B2','Fourth-exchange private recall conflicts with unchanged R0');
  await audit(session,'B1','retained','Conditional useful ledger model');await audit(session,'B2','pruned','Hard R0 predicate failed');
  const parent=await crystallize(session,procedure,{question:'How can obligations persist past private forgetting?',intended_reuse:'Extend ledger and memory constraints in this fictional world',consequence:'A contestable shared ledger can hold obligations after private recall expires',why_retained:'Evaluated ledger path is coherent with R0 despite contested authority'});
  const parentBytes=await readFile(store.location(parent.id));
  const restarted=new ObjectStore(resolve(root));const parentRetrieval=await retrieveCrystal(restarted,parent.id);
  const descendantSession=await extendSession(restarted,parent,{budgets:{calls:2,branches:2,depth:1}});
  await fork(descendantSession,[{id:'B3',intent:'Witness recalls four exchanges under R1'},{id:'B4',intent:'Alternate institution not explored in this bounded region'}]);
  const revisedProcedure=await declareProcedure(restarted);
  await evolve(descendantSession,'B3',scripted(4,'A witness recalls obligations through a fourth exchange under R1'),'mv-b3');
  await evaluate(descendantSession,'B3',revisedProcedure,{verdict:'limited',rationale:'Four-exchange recall is valid under displaced R1',uncertainty:'Witness authority remains contingent',limitations:['R1 is a fictional displaced rule']});
  await audit(descendantSession,'B3','retained','Useful alternative under explicitly displaced R1');
  const descendant=await crystallize(descendantSession,revisedProcedure,{question:'What changes when private recall lasts four exchanges?',intended_reuse:'Explore witness authority under revised fictional rules',consequence:'Four-exchange witnesses can contest the public ledger under R1',why_retained:'An evaluated consequence of explicit rule displacement',limitations:['Earlier B2 failure under R0 remains unchanged']});
  const descendantRetrieval=await retrieveCrystal(new ObjectStore(resolve(root)),descendant.id);
  const parentBytesUnchanged=parentBytes.equals(await readFile(store.location(parent.id)));
  return {store:restarted,parent,descendant,parentRetrieval,descendantRetrieval,parentBytesUnchanged,b2:session.branches.get('B2'),descendantSession};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
  const root=process.argv[2];if(!root)throw new Error('Pass an absolute object-store directory');
  const result=await runMemoryVillage(root);
  console.log(JSON.stringify({parent_id:result.parent.id,parent_status:result.parentRetrieval.status,parent_references:result.parentRetrieval.references.length,
    descendant_id:result.descendant.id,descendant_status:result.descendantRetrieval.status,descendant_references:result.descendantRetrieval.references.length,
    parent_bytes_unchanged:result.parentBytesUnchanged,b2_transition_id:result.b2.transition.id,b2_crack_id:result.b2.crack.id,b2_audit_id:result.b2.audit.id},null,2));
}
