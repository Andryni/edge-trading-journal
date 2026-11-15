import { db } from "../../../lib/db";
import {cloudEnabled,supabaseRequest} from "../../../lib/cloud";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    if(cloudEnabled()){await supabaseRequest("/auth/v1/health");return Response.json({status:"ok",storage:"supabase",version:"1.1.0"},{headers:{"Cache-Control":"no-store"}});}
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", storage: "sqlite", version: "1.0.0" });
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Lance npm run setup pour initialiser la base.",
      },
      { status: 503 },
    );
  }
}
