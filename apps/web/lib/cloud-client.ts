"use client";
import {journalSchema,newJournal,type Journal} from "@edge/core";
import {cacheCapture} from "./attachment-cache";
type Transport={url:string;key:string;token:string;userId:string};
async function json(response:Response){const value=await response.json();if(!response.ok)throw new Error(value.error ?? value.message ?? "Synchronisation indisponible.");return value;}
export async function cloudTransport():Promise<Transport|null>{return (await json(await fetch("/api/cloud",{cache:"no-store",signal:AbortSignal.timeout(20000)}))).cloud;}
const headers=(t:Transport)=>({apikey:t.key,Authorization:`Bearer ${t.token}`,"Content-Type":"application/json"});
export async function readRemoteJournal(){
  const transport=await cloudTransport();
  if(!transport)return json(await fetch("/api/journal",{cache:"no-store",signal:AbortSignal.timeout(20000)}));
  await json(await fetch(`${transport.url}/rest/v1/rpc/edge_claim_legacy_journal`,{method:"POST",headers:headers(transport),body:"{}",signal:AbortSignal.timeout(20000)}));
  const rows=await json(await fetch(`${transport.url}/rest/v1/edge_journals?select=data,revision&user_id=eq.${transport.userId}`,{headers:headers(transport),cache:"no-store",signal:AbortSignal.timeout(20000)}));
  return rows[0] ?? {data:newJournal(),revision:0};
}
export async function listCloudVersions(){const t=await cloudTransport();if(!t)return [];return json(await fetch(`${t.url}/rest/v1/edge_journal_versions?select=revision,created_at&order=revision.desc`,{headers:headers(t),cache:"no-store"}));}
export async function readCloudVersion(revision:number):Promise<Journal>{const t=await cloudTransport();if(!t)throw new Error("Historique distant indisponible.");const rows=await json(await fetch(`${t.url}/rest/v1/edge_journal_versions?select=data&revision=eq.${revision}`,{headers:headers(t),cache:"no-store"}));if(!rows[0])throw new Error("Cette révision n’est plus disponible.");return journalSchema.parse(rows[0].data);}
async function uploadImage(data:string,transport:Transport){
  const blob=await (await fetch(data)).blob();
  const digest=[...new Uint8Array(await crypto.subtle.digest("SHA-256",await blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,"0")).join("");
  const cacheKey=`edge-capture:${transport.userId}:${digest}`;
  const cached=sessionStorage.getItem(cacheKey);if(cached)return cached;
  const extension=blob.type==="image/png"?"png":blob.type==="image/webp"?"webp":"jpeg";
  const signed=await json(await fetch("/api/attachments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({extension}),signal:AbortSignal.timeout(20000)}));
  const response=await fetch(signed.url,{method:"PUT",headers:{"Content-Type":blob.type,"cache-control":"max-age=3600"},body:blob,signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw new Error("La capture n’a pas pu être transférée. La copie locale est conservée.");
  const reference="/api/attachments?path="+signed.path;
  await cacheCapture(reference,blob).catch(()=>{});
  sessionStorage.setItem(cacheKey,reference);return reference;
}
async function separateImages(value:unknown,t:Transport):Promise<unknown>{
  if(typeof value==="string"&&/^data:image\/(png|jpeg|webp);base64,/.test(value))return uploadImage(value,t);
  if(Array.isArray(value)){const output=[];for(const item of value)output.push(await separateImages(item,t));return output;}
  if(value&&typeof value==="object"){const output:Record<string,unknown>={};for(const [key,item] of Object.entries(value))output[key]=await separateImages(item,t);return output;}
  return value;
}
export async function writeRemoteJournal(data:Journal,revision:number):Promise<{revision:number;data?:Journal}>{
  const transport=await cloudTransport();
  if(!transport)return json(await fetch("/api/journal",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data,revision})}));
  const document=journalSchema.parse(await separateImages(data,transport));
  const response=await fetch(`${transport.url}/rest/v1/rpc/edge_save_journal`,{method:"POST",headers:headers(transport),body:JSON.stringify({expected_revision:revision,document}),signal:AbortSignal.timeout(60000)});
  const result=await response.json();
  if(!response.ok)throw new Error(result.message?.includes("CONFLICT")?"CONFLICT":result.message ?? "Synchronisation Supabase refusée.");
  return {revision:Number(result),data:document};
}
