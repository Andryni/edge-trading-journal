import {cloudSession,supabaseRequest,cloudConfig} from "../../../lib/cloud";
import {sameOrigin,jsonError,readBody} from "../../../lib/auth";
import {z} from "zod";
export const runtime="nodejs";
const pathSchema=z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpeg|png|webp)$/i);
export async function POST(request:Request){try{
  sameOrigin(request);const session=await cloudSession();if(!session)return jsonError(new Error("Connexion requise."),401);
  const {extension}=z.object({extension:z.enum(["jpeg","png","webp"])}).parse(await readBody(request,1000));
  const path=`${session.user.id}/${crypto.randomUUID()}.${extension}`;
  const signed=await supabaseRequest(`/storage/v1/object/upload/sign/edge-captures/${path}`,{method:"POST",body:"{}"},session.token);
  const {url}=cloudConfig();
  return Response.json({path,url:url+"/storage/v1"+signed.url},{headers:{"Cache-Control":"no-store"}});
}catch(e){return jsonError(e);}}
export async function GET(request:Request){try{
  const session=await cloudSession();if(!session)return jsonError(new Error("Connexion requise."),401);
  const path=pathSchema.parse(new URL(request.url).searchParams.get("path"));
  if(!path.startsWith(session.user.id+"/"))return jsonError(new Error("Capture privée."),403);
  const signed=await supabaseRequest(`/storage/v1/object/sign/edge-captures/${path}`,{method:"POST",body:JSON.stringify({expiresIn:120})},session.token);
  const {url}=cloudConfig();
  return new Response(null,{status:307,headers:{Location:url+"/storage/v1"+signed.signedURL,"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
}catch(e){return jsonError(e);}}
