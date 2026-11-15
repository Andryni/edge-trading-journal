import { z } from "zod";
import { newJournal, journalSchema } from "@edge/core";
import {cloudEnabled,cloudSession,supabaseRequest} from "../../../lib/cloud";
import { db } from "../../../lib/db";
import {
  currentUser,
  sameOrigin,
  jsonError,
  readBody,
} from "../../../lib/auth";
import { saveJournal } from "../../../lib/repository";
export const runtime = "nodejs";
export async function GET() {
  if(cloudEnabled()){
    try{const session=await cloudSession();if(!session)return jsonError(new Error("Connexion requise."),401);
      await supabaseRequest("/rest/v1/rpc/edge_claim_legacy_journal",{method:"POST",body:"{}"},session.token);
      const rows=await supabaseRequest(`/rest/v1/edge_journals?select=data,revision&user_id=eq.${session.user.id}`,{},session.token);
      const document=rows[0]??{data:newJournal(),revision:0};if(JSON.stringify(document).length>4000000)return jsonError(new Error("Utilise le transport Supabase direct pour ce journal volumineux."),413);
      return Response.json(document,{headers:{"Cache-Control":"no-store"}});
    }catch(e){return jsonError(e,503);}
  }
  const user = await currentUser();
  if (!user) return jsonError(new Error("Connexion requise."), 401);
  const document = await db.journalDocument.findUnique({
    where: { userId: user.id },
  });
  return Response.json(
    {
      data: document ? JSON.parse(document.data) : newJournal(),
      revision: document?.revision ?? 0,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const user = await currentUser();
    if (!user) return jsonError(new Error("Connexion requise."), 401);
    const body = z
      .object({ revision: z.number().int().nonnegative(), data: z.unknown() })
      .parse(await readBody(request,cloudEnabled()?4000000:32000000));
    if(cloudEnabled()){
      const session=await cloudSession();if(!session)return jsonError(new Error("Connexion requise."),401);
      const data=journalSchema.parse(body.data);
      const revision=await supabaseRequest("/rest/v1/rpc/edge_save_journal",{method:"POST",body:JSON.stringify({expected_revision:body.revision,document:data})},session.token);
      return Response.json({revision},{headers:{"Cache-Control":"no-store"}});
    }
    return Response.json(await saveJournal(user.id, body.revision, body.data));
  } catch (e) {
    return jsonError(
      e,
      e instanceof Error && e.message === "CONFLICT" ? 409 : 400,
    );
  }
}
