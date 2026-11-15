import "server-only";
import { cookies } from "next/headers";
export const cloudEnabled = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
export function cloudConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, ""), key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase n’est pas configuré.");
  return {url,key};
}
type Session = {access_token:string;refresh_token:string;expires_in:number;user:{id:string;email:string}};
const confirmationUrl = "https://edge-tradingjournal.vercel.app/auth/confirm";
function authError(code: string, fallback: string) {
  const messages: Record<string,string> = {
    invalid_credentials: "Adresse email ou mot de passe incorrect.",
    email_not_confirmed: "Confirme ton adresse email avant de te connecter. Tu peux demander un nouveau lien ici.",
    email_address_not_authorized: "L’envoi de confirmation n’est pas encore disponible pour cette adresse. Contacte l’administrateur d’EDGE.",
    over_email_send_rate_limit: "Trop d’emails ont été demandés. Patiente avant de réessayer.",
    over_request_rate_limit: "Trop de tentatives. Patiente avant de réessayer.",
    email_exists: "Cette adresse possède déjà un compte. Essaie de te connecter.",
    weak_password: "Choisis un mot de passe plus long et moins prévisible.",
    signup_disabled: "Les inscriptions sont temporairement fermées.",
  };
  return messages[code] ?? fallback;
}
export async function supabaseRequest(path:string, options:RequestInit = {}, token?:string) {
  const {url,key}=cloudConfig();
  const response=await fetch(url+path,{...options,cache:"no-store",signal:AbortSignal.timeout(20000),headers:{apikey:key,...(token?{Authorization:`Bearer ${token}`} : {}),"Content-Type":"application/json",...options.headers}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(authError(data.error_code ?? data.code ?? "",data.msg ?? data.message ?? data.error_description ?? "Le service est temporairement indisponible."));
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
  const session:Session=await supabaseRequest(register?"/auth/v1/signup?redirect_to="+encodeURIComponent(confirmationUrl):"/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})});
  if(register&&!session.access_token)return {user:null,confirmationRequired:true};
  if(!session.access_token||!session.user)throw new Error("La connexion n’a pas abouti. Réessaie dans un instant.");
  await setSession(session);return {user:{id:session.user.id,email:session.user.email},confirmationRequired:false};
}
export async function cloudResendConfirmation(email:string) {
  await supabaseRequest("/auth/v1/resend?redirect_to="+encodeURIComponent(confirmationUrl),{method:"POST",body:JSON.stringify({type:"signup",email})});
}
export async function cloudLogout() {
  const jar=await cookies(),token=jar.get("edge-sb-access")?.value;
  if(token)await supabaseRequest("/auth/v1/logout",{method:"POST"},token).catch(()=>{});
  jar.delete("edge-sb-access");jar.delete("edge-sb-refresh");
}
