import {cloudEnabled,cloudConfig,cloudSession} from "../../../lib/cloud";
import {jsonError} from "../../../lib/auth";
export const runtime="nodejs";
export async function GET(){
  if(!cloudEnabled())return Response.json({cloud:null},{headers:{"Cache-Control":"no-store"}});
  const session=await cloudSession();if(!session)return jsonError(new Error("Connexion requise."),401);
  return Response.json({cloud:{...cloudConfig(),token:session.token,userId:session.user.id}},{headers:{"Cache-Control":"no-store"}});
}
