import "server-only";
import { cookies } from "next/headers";
export const cloudEnabled = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
export function cloudConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, ""), key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase n’est pas configuré.");
  return {url,key};
}
type Session = {access_token:string;refresh_token:string;expires_in:number;user:{id:string;email:string}};
export async function supabaseRequest(path:string, options:RequestInit = {}, token?:string) {
  const {url,key}=cloudConfig();
  const response=await fetch(url+path,{...options,cache:"no-store",signal:AbortSignal.timeout(20000),headers:{apikey:key,...(token?{Authorization:`Bearer ${token}`} : {}),"Content-Type":"application/json",...options.headers}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.msg ?? data.message ?? data.error_description ?? "Supabase est temporairement indisponible.");
  return data;
}
async function setSession(session:Session) {
  const jar=await cookies();
  const opts={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/"};
  jar.set("edge-sb-access",session.access_token,{...opts,maxAge:session.expires_in});
  jar.set("edge-sb-refresh",session.refresh_token,{...opts,maxAge:30*86400});
}
export async function cloudSession():Promise<{user:{id:string;email:string};token:string}|null> {
  const jar=await cookies();
  let token=jar.get("edge-sb-access")?.value;
  if(token){try{const user=await supabaseRequest("/auth/v1/user",{},token);return {user:{id:user.id,email:user.email},token};}catch{/* Vérification serveur, puis renouvellement. */}}
  const refresh=jar.get("edge-sb-refresh")?.value;if(!refresh)return null;
  try{const session:Session=await supabaseRequest("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:JSON.stringify({refresh_token:refresh})});await setSession(session);return {user:session.user,token:session.access_token};}
  catch{return null;}
}
export async function cloudLogin(email:string,password:string,register:boolean) {
  const session:Session=await supabaseRequest(register?"/auth/v1/signup":"/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})});
  if(!session.access_token)throw new Error("Compte créé : confirme ton adresse dans l’email Supabase, puis connecte-toi ici.");
  await setSession(session);return {id:session.user.id,email:session.user.email};
}
export async function cloudLogout() {
  const jar=await cookies(),token=jar.get("edge-sb-access")?.value;
  if(token)await supabaseRequest("/auth/v1/logout",{method:"POST"},token).catch(()=>{});
  jar.delete("edge-sb-access");jar.delete("edge-sb-refresh");
}
