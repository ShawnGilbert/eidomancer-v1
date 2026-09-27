// Explicit, versioned predicates over bounded integer facts. Declared prose is never compiled.
const number=(value)=>Number.isSafeInteger(value);
const registry={
  integer_max_v1:{key:'maximum',evaluate:(observed,limit)=>observed<=limit},
  integer_min_v1:{key:'minimum',evaluate:(observed,limit)=>observed>=limit}
};
export function validateValidator(predicate,parameters,fact_types){
  const spec=registry[predicate];
  if(!spec)throw new Error('Unsupported fictional validator ID/version');
  if(!parameters || Object.keys(parameters).sort().join(',')!==['fact',spec.key].sort().join(',') ||
     typeof parameters.fact!=='string' || fact_types[parameters.fact]!=='integer' || !number(parameters[spec.key]))
    throw new Error('Invalid fictional validator parameters or fact type');
  return spec;
}
export function runValidator(constraint,facts,fact_types){
  const {predicate,parameters}=constraint.payload.body;
  const spec=validateValidator(predicate,parameters,fact_types);
  const observed=facts[parameters.fact];
  if(!number(observed))throw new Error('Invalid validator input');
  return {validator_id:predicate,constraint_ref:{kind:'constraint',id:constraint.id,schema_version:constraint.payload.schema_version,required:true},
    inputs:{fact:parameters.fact,observed,limit:parameters[spec.key]},passed:spec.evaluate(observed,parameters[spec.key])};
}
export function validateFactTypes(types,facts){
  if(!types||Array.isArray(types)||typeof types!=='object'||Object.getPrototypeOf(types)!==Object.prototype||
     Object.keys(types).length>16||!facts||Array.isArray(facts)||typeof facts!=='object'||Object.getPrototypeOf(facts)!==Object.prototype||
     Object.keys(types).sort().join(',')!==Object.keys(facts).sort().join(','))throw new Error('Invalid bounded fictional facts');
  for(const [key,type] of Object.entries(types)){
    if(!/^[a-z][a-z0-9_]{0,39}$/.test(key)||!['integer','boolean'].includes(type)||
       !(type==='integer'?number(facts[key]):typeof facts[key]==='boolean'))throw new Error('Invalid fictional fact or type');
  }
}
