const assert = require('node:assert/strict');
require('esbuild').buildSync({entryPoints:['apps/web/lib/coach-provider.ts'],bundle:true,platform:'node',format:'cjs',outfile:'scripts/.generated-coach-provider.cjs'});
const {coachConfiguration,requestCoach,redactCoachError}=require('./.generated-coach-provider.cjs');
async function main(){
  const key='AIzaSyntheticTestKeyNotARealCredential';
  const config=coachConfiguration({COACH_API_KEY:' '+key+' ',COACH_MODEL:' models/gemini-test ',COACH_API_URL:'"https://generativelanguage.googleapis.com/v1beta/"'});
  assert.equal(config.url,'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'); assert.equal(config.model,'gemini-test');
  const transport=async(url,init)=>{const body=JSON.parse(init.body);assert.equal(body.store,undefined);assert.equal(body.reasoning_effort,'low');assert.equal(init.headers.Authorization,'Bearer '+key);return Response.json({choices:[{message:{content:'Réponse de test'}}]});};
  assert.equal(await requestCoach(config,'Question','{}',transport),'Réponse de test');
  let attempts=0;
  assert.equal(await requestCoach(config,'Question','{}',async()=>++attempts===1?Response.json([{error:{message:'Unavailable'}}],{status:503}):Response.json({choices:[{message:{content:'Recovered'}}]})),'Recovered');
  assert.equal(attempts,2);
  await requestCoach(coachConfiguration({COACH_API_KEY:key,COACH_MODEL:'test'}),'Question','{}',async(url,init)=>{const body=JSON.parse(init.body);assert.equal(body.store,false);assert.equal(body.reasoning_effort,undefined);return Response.json({choices:[{message:{content:'OK'}}]});});
  let logged='';const original=console.error;console.error=(...args)=>{logged+=args.join(' ');};
  try{
    await assert.rejects(requestCoach(config,'Q','{}',async()=>Response.json({error:{message:'Invalid parameter '+key}},{status:400})),e=>e.message.includes('Invalid parameter')&&!e.message.includes(key)); assert(!logged.includes(key));
    await assert.rejects(requestCoach(config,'Q','{}',async()=>Response.json({error:{message:'API key not valid. Please pass a valid API key.'}},{status:400})),/COACH_API_KEY/);
    await assert.rejects(requestCoach(config,'Q','{}',async()=>Response.json([{error:{message:'Unsupported parameter'}}],{status:400})),/Unsupported parameter/);
    let rejected=0;await assert.rejects(requestCoach(config,'Q','{}',async()=>{rejected++;return Response.json({error:{message:'Overloaded'}},{status:503});}),e=>e.httpStatus===503);assert.equal(rejected,2);
    await assert.rejects(requestCoach(config,'Q','{}',async()=>Response.json({error:{message:'Quota exceeded'}},{status:429})),e=>e.httpStatus===429);
    await assert.rejects(requestCoach(config,'Q','{}',async()=>{throw new DOMException('timeout','TimeoutError');}),e=>e.httpStatus===504&&e.message.includes('trop de temps'));
    await assert.rejects(requestCoach(config,'Q','{}',async()=>{throw Error('network '+key);}),e=>!e.message.includes(key)&&e.message.includes('joindre'));
  }finally{console.error=original;}
  assert(!redactCoachError('Bearer '+key,key).includes(key));
  console.log('Coach provider checks passed: payloads, normalization, diagnostics, redaction, quota.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
