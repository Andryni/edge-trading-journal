"use client";
function database(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open("edge-private-captures",1);r.onupgradeneeded=()=>r.result.createObjectStore("blobs");r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function cacheCapture(reference:string,blob:Blob){const db=await database();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction("blobs","readwrite");tx.objectStore("blobs").put(blob,reference);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
export async function captureBlob(reference:string):Promise<Blob>{
  const cached=await (async()=>{const db=await database();try{return await new Promise<Blob|undefined>((resolve,reject)=>{const tx=db.transaction("blobs");const r=tx.objectStore("blobs").get(reference);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}})().catch(()=>undefined);
  if(cached)return cached;
  const response=await fetch(reference,{cache:"no-store"});if(!response.ok)throw new Error("Capture privée indisponible. Connecte-toi et réessaie.");
  const blob=await response.blob();if(!blob.type.startsWith("image/"))throw new Error("La capture reçue n’est pas une image.");
  await cacheCapture(reference,blob).catch(()=>{});return blob;
}
