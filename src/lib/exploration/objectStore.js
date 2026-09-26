import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { canonicalBytes, identity, parseStrictJson } from './canonicalJson.js';
import { validateRecord, RECORD_SCHEMA, CRYSTAL_SCHEMA } from './recordSchemas.js';
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
      if (!['R0','R1'].includes(rule.payload.body.name) || rule.payload.body.constraint_refs.length!==body.constraint_refs.length ||
          rule.payload.body.constraint_refs.some((v,i)=>v.id!==body.constraint_refs[i].id)) throw new Error('World state rule/constraint inheritance mismatch');
      for (const reference of body.constraint_refs) {
        const constraint=await this.verifyRef(reference);
        if (constraint.payload.body.predicate==='private_recall_max_v1' &&
            (constraint.payload.body.parameters.maximum !== (rule.payload.body.name==='R0'?3:4) ||
             body.private_recall_after_exchanges>constraint.payload.body.parameters.maximum))
          throw new Error('World state fails mechanical private recall predicate');
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
    if (reference.schema_version !== (reference.kind === 'crystal' ? CRYSTAL_SCHEMA : RECORD_SCHEMA)) throw new Error('Unsupported reference version');
    const obj = await this.get(reference.id);
    if (reference.kind === 'crystal' ? !!obj.payload.kind : obj.payload.kind !== reference.kind) throw new Error('Reference kind mismatch');
    return obj;
  }
}
