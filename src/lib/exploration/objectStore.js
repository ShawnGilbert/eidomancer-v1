import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { canonicalBytes, identity, parseStrictJson } from './canonicalJson.js';
import { validateRecord, RECORD_SCHEMA, GENERIC_RECORD_SCHEMA, CRYSTAL_SCHEMA } from './recordSchemas.js';
import {validateFactTypes,validateValidator,runValidator} from './fictionalValidators.js';
import {validateCrystal} from './crystalValidator.js';

const ADDRESS = /^(record|crystal):sha256:([a-f0-9]{64})$/;
export class ObjectStore {
  constructor(root) { if (!path.isAbsolute(root)) throw new Error('Store root must be absolute'); this.root = root; }
  location(id) {
    const match = ADDRESS.exec(id);
    if (!match) throw new Error('Invalid content address');
    return path.join(this.root, 'objects', match[1], match[2].slice(0, 2), `${match[2]}.json`);
  }
  async put(object) {
    const kind = object?.payload?.kind ? 'record' : 'crystal';
    if (identity(kind, object.payload) !== object.id) throw new Error('Object hash mismatch');
    if (kind === 'record') validateRecord(object.payload);
    else validateCrystal(object.payload);
    if (object.payload.kind === 'world_state') {
      const body=object.payload.body;
      const rule=await this.verifyRef(body.rule_set_ref);
      if(object.payload.schema_version===GENERIC_RECORD_SCHEMA){
        const seed=await this.verifyRef(body.seed_ref);
        if(seed.payload.schema_version!==GENERIC_RECORD_SCHEMA || seed.payload.body.profile!=='fictional.generic.v1' ||
           rule.payload.schema_version!==GENERIC_RECORD_SCHEMA || rule.payload.body.name!=='fictional.generic' || rule.payload.body.version!=='1' ||
           rule.payload.body.constraint_refs.length!==body.constraint_refs.length ||
           rule.payload.body.constraint_refs.some((v,i)=>v.id!==body.constraint_refs[i].id) ||
           seed.payload.body.constraint_refs.some((v,i)=>v.id!==body.constraint_refs[i]?.id))throw new Error('Generic World state rule/constraint inheritance mismatch');
        validateFactTypes(seed.payload.body.fact_types,body.facts);
        if(body.intelligence_response_ref){
          if(!body.creator_operation_ref)throw new Error('Generic generated state requires extraction operation');
          const [response,selection]=await Promise.all([this.verifyRef(body.intelligence_response_ref),this.verifyRef(body.creator_operation_ref)]);
          if(response.payload.body.completion_status!=='complete'||response.payload.body.response.content_type!=='application/json'||
             response.payload.body.response.encoding!=='utf-8'||selection.payload.body.type!=='candidate_selection'||
             !selection.payload.body.input_refs.some(x=>x.id===response.id))throw new Error('Generic generated state extraction mismatch');
          const candidate=parseStrictJson(Buffer.from(response.payload.body.response.base64,'base64'));
          if(!candidate||Array.isArray(candidate)||typeof candidate!=='object'||Object.keys(candidate).sort().join(',')!=='description,facts'||
             candidate.description!==body.description||!canonicalBytes(candidate.facts).equals(canonicalBytes(body.facts)))
            throw new Error('Generic generated state differs from captured candidate');
        }else if(body.creator_operation_ref)throw new Error('Generic state operation requires generation response');
        for(const reference of body.constraint_refs){
          const constraint=await this.verifyRef(reference);
          if(constraint.payload.body.check_mode==='mechanical'){
            validateValidator(constraint.payload.body.predicate,constraint.payload.body.parameters,seed.payload.body.fact_types);
            if(!runValidator(constraint,body.facts,seed.payload.body.fact_types).passed)throw new Error('Generic World state fails mechanical predicate');
          }
        }
      } else if (!['R0','R1'].includes(rule.payload.body.name) || rule.payload.body.constraint_refs.length!==body.constraint_refs.length ||
          rule.payload.body.constraint_refs.some((v,i)=>v.id!==body.constraint_refs[i].id)) throw new Error('World state rule/constraint inheritance mismatch');
      if(object.payload.schema_version===RECORD_SCHEMA)for (const reference of body.constraint_refs) {
        const constraint=await this.verifyRef(reference);
        if (constraint.payload.body.predicate==='private_recall_max_v1' &&
            (constraint.payload.body.parameters.maximum !== (rule.payload.body.name==='R0'?3:4) ||
             body.private_recall_after_exchanges>constraint.payload.body.parameters.maximum))
          throw new Error('World state fails mechanical private recall predicate');
      }
    }
    if(object.payload.kind==='transition' && object.payload.schema_version===GENERIC_RECORD_SCHEMA){
      const body=object.payload.body;
      const [prior,rule,response,selection]=await Promise.all([this.verifyRef(body.from_state_ref),this.verifyRef(body.rule_set_ref),
        this.verifyRef(body.intelligence_response_ref),this.verifyRef(body.operation_ref)]);
      if(rule.payload.body.name!=='fictional.generic'||prior.payload.body.rule_set_ref.id!==rule.id||
         prior.payload.body.seed_ref.schema_version!==GENERIC_RECORD_SCHEMA||selection.payload.body.type!=='candidate_selection'||
         !selection.payload.body.input_refs.some(x=>x.id===response.id)||response.payload.body.completion_status!=='complete'||
         response.payload.body.response.content_type!=='application/json'||response.payload.body.response.encoding!=='utf-8')
        throw new Error('Generic transition origin mismatch');
      const seed=await this.verifyRef(prior.payload.body.seed_ref);
      const candidate=parseStrictJson(Buffer.from(response.payload.body.response.base64,'base64'));
      if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||
         Object.keys(candidate).sort().join(',')!=='description,facts'||typeof candidate.description!=='string'||!candidate.description.trim())
        throw new Error('Invalid generic transition candidate');
      validateFactTypes(seed.payload.body.fact_types,candidate.facts);
      const constraints=await Promise.all(rule.payload.body.constraint_refs.map(x=>this.verifyRef(x)));
      const expected=constraints.filter(x=>x.payload.body.check_mode==='mechanical').map(x=>runValidator(x,candidate.facts,seed.payload.body.fact_types));
      if(!canonicalBytes(expected).equals(canonicalBytes(body.checks))||body.status!==(expected.every(x=>x.passed)?'accepted':'rejected'))
        throw new Error('Generic transition check results differ from executed validators');
      if(body.to_state_ref){const successor=await this.verifyRef(body.to_state_ref);
        if(successor.payload.body.description!==candidate.description||!canonicalBytes(successor.payload.body.facts).equals(canonicalBytes(candidate.facts))||
          successor.payload.body.creator_operation_ref?.id!==selection.id||successor.payload.body.intelligence_response_ref?.id!==response.id)
          throw new Error('Generic transition successor differs from candidate');
      }
    }
    const bytes = canonicalBytes(object.payload);
    const destination = this.location(object.id);
    await fs.mkdir(path.dirname(destination), {recursive:true});
    const temporary = `${destination}.${randomUUID()}.tmp`;
    const handle=await fs.open(temporary,'wx');
    try {await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}
    try {
      // link is exclusive; rename could silently replace a prior immutable object.
      try { await fs.link(temporary, destination); }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const existing = await fs.readFile(destination);
        if (!existing.equals(bytes)) throw new Error('Immutable object collision');
      }
      const check = await fs.readFile(destination);
      if (!check.equals(bytes)) throw new Error('Object write verification failed');
    } finally { await fs.unlink(temporary).catch(() => {}); }
    return object.id;
  }
  async get(id) {
    const bytes = await fs.readFile(this.location(id));
    const payload = parseStrictJson(bytes);
    const kind = id.startsWith('record:') ? 'record' : 'crystal';
    if (!bytes.equals(canonicalBytes(payload)) || identity(kind,payload) !== id) throw new Error('Object integrity failure');
    if (kind === 'record') validateRecord(payload);
    else validateCrystal(payload);
    return {id,payload};
  }
  async has(id) { try { await fs.access(this.location(id)); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } }
  async verifyRef(reference) {
    if (!(reference.kind === 'crystal' ? reference.schema_version===CRYSTAL_SCHEMA : [RECORD_SCHEMA,GENERIC_RECORD_SCHEMA].includes(reference.schema_version))) throw new Error('Unsupported reference version');
    const obj = await this.get(reference.id);
    if(obj.payload.schema_version!==reference.schema_version)throw new Error('Reference schema version mismatch');
    if (reference.kind === 'crystal' ? !!obj.payload.kind : obj.payload.kind !== reference.kind) throw new Error('Reference kind mismatch');
    return obj;
  }
}
