import {record} from './recordSchemas.js';
import {sha256,parseStrictJson} from './canonicalJson.js';

const bytesPart = (value) => {
  if (!value || !Buffer.isBuffer(value.bytes) || typeof value.content_type !== 'string' || typeof value.encoding !== 'string') throw new Error('Adapter-boundary bytes, content type and encoding required');
  return {content_type:value.content_type,encoding:value.encoding,base64:value.bytes.toString('base64'),sha256:sha256(value.bytes)};
};

// The caller owns the exact bytes passed into and returned from the adapter.
// Provider transport bytes are outside this boundary.
export async function captureAdapter(store, adapter, {request_id, request_bytes, content_type = 'application/json', request_encoding='utf-8', input_refs = []}) {
  if (!Buffer.isBuffer(request_bytes) || typeof adapter?.invoke !== 'function') throw new Error('Replaceable intelligence adapter and request bytes required');
  let result;
  try { result=await adapter.invoke({request_id, bytes:Buffer.from(request_bytes), content_type}); }
  catch (error) { result={bytes:Buffer.alloc(0),content_type:'application/octet-stream',encoding:'unknown',completion_status:'error',provider:adapter.provider??'unknown',model:adapter.model??'unknown',identification_status:adapter.identification_status??'unknown'}; }
  if (!result || !Buffer.isBuffer(result.bytes)) throw new Error('Adapter must return exact response bytes');
  const body = {request_id, request:bytesPart({bytes:request_bytes,content_type,encoding:request_encoding}),
    response:bytesPart(result),completion_status:result.completion_status,
    provider:result.provider,model:result.model,identification_status:result.identification_status};
  if (result.usage !== undefined) body.usage = result.usage;
  const output = record('intelligence_response',body,'generated_candidate',{
    actor_role:'external_intelligence',provider:result.provider,model_or_version:result.model,
    identification_status:result.identification_status,input_refs
  });
  await store.put(output);
  return output;
}

export function extractCandidate(response, method = 'fixture-json-v1') {
  if (response.payload.kind !== 'intelligence_response') throw new Error('Response required');
  if (response.payload.body.completion_status !== 'complete') throw new Error('Incomplete intelligence response');
  if (method !== 'fixture-json-v1') throw new Error('Unsupported extraction method');
  if (response.payload.body.response.content_type !== 'application/json' || response.payload.body.response.encoding !== 'utf-8') throw new Error('Invalid candidate content type or encoding');
  const bytes = Buffer.from(response.payload.body.response.base64,'base64');
  const candidate = parseStrictJson(bytes);
  if (!candidate || Array.isArray(candidate) || typeof candidate !== 'object' ||
      Object.keys(candidate).sort().join(',') !== 'description,external_inscription_available,private_recall_after_exchanges') throw new Error('Invalid structured candidate fields');
  if (!Number.isSafeInteger(candidate.private_recall_after_exchanges) || candidate.private_recall_after_exchanges < 0 ||
      typeof candidate.external_inscription_available !== 'boolean' || typeof candidate.description !== 'string' || !candidate.description.trim()) throw new Error('Invalid structured candidate');
  return {candidate:{description:candidate.description,private_recall_after_exchanges:candidate.private_recall_after_exchanges,
    external_inscription_available:candidate.external_inscription_available},method,source_response_ref:response.id};
}

export function extractEvaluation(response) {
  if (response.payload.kind !== 'intelligence_response') throw new Error('Evaluator response required');
  const body=response.payload.body;
  if (body.completion_status !== 'complete') throw new Error('Incomplete evaluator response');
  if (body.response.content_type !== 'application/json' || body.response.encoding !== 'utf-8') throw new Error('Invalid evaluator content type or encoding');
  const judgment=parseStrictJson(Buffer.from(body.response.base64,'base64'));
  if (!judgment || Array.isArray(judgment) || typeof judgment !== 'object' ||
      Object.keys(judgment).sort().join(',') !== 'judgment,limitations,rationale,uncertainty,verdict' ||
      !['retain','limited','reject','retain_negative_finding'].includes(judgment.verdict) ||
      ![judgment.judgment,judgment.rationale,judgment.uncertainty].every(x=>typeof x==='string' && x.trim()) ||
      !Array.isArray(judgment.limitations) || !judgment.limitations.every(x=>typeof x==='string' && x.trim())) throw new Error('Invalid structured evaluator judgment');
  return judgment;
}
