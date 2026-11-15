const assert=require('node:assert/strict'),{build}=require('esbuild');
(async()=>{
  await build({entryPoints:['apps/web/lib/cloud.ts'],bundle:true,platform:'node',format:'cjs',outfile:'scripts/.generated-cloud-auth.cjs',plugins:[{name:'server-test-boundary',setup(b){b.onResolve({filter:/^(server-only|next\/headers)$/},a=>({path:a.path,namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:a.path==='server-only'?'':'export async function cookies(){return {set:(...args)=>globalThis.__cookieWrites.push(args)}}',loader:'js'}));}}]});
  process.env.SUPABASE_URL='https://auth.example.invalid';process.env.SUPABASE_PUBLISHABLE_KEY='test-key';global.__cookieWrites=[];
  const auth=require('./.generated-cloud-auth.cjs'),requests=[];
  let result={id:'unconfirmed',email:'qa@example.invalid'};
  global.fetch=async(url,init)=>{requests.push({url,init});return Response.json(result);};
  assert.deepEqual(await auth.cloudLogin('qa@example.invalid','example-password',true),{user:null,confirmationRequired:true});
  assert.equal(global.__cookieWrites.length,0);
  assert.equal(new URL(requests.at(-1).url).searchParams.get('redirect_to'),'https://edge-tradingjournal.vercel.app/auth/confirm');
  await auth.cloudResendConfirmation('qa@example.invalid');
  assert.equal(new URL(requests.at(-1).url).pathname,'/auth/v1/resend');assert.equal(JSON.parse(requests.at(-1).init.body).type,'signup');
  result={access_token:'test-access',refresh_token:'test-refresh',expires_in:3600,user:{id:'qa',email:'qa@example.invalid'}};
  assert.deepEqual(await auth.cloudLogin('qa@example.invalid','example-password',false),{user:{id:'qa',email:'qa@example.invalid'},confirmationRequired:false});assert.equal(global.__cookieWrites.length,2);
  global.fetch=async()=>Response.json({error_code:'email_not_confirmed',msg:'Email not confirmed'},{status:400});
  await assert.rejects(()=>auth.cloudLogin('qa@example.invalid','example-password',false),/Confirme ton adresse email/);
  console.log('PASS: signup awaits confirmation without creating a session; canonical redirects for signup and resend; verified login sets cookies; unconfirmed login gives a French error. No email sent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
