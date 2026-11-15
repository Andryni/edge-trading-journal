import { z } from "zod";
import { currentUser, sameOrigin, jsonError, readBody } from "../../../lib/auth";
import { coachConfiguration, CoachProviderError, requestCoach } from "../../../lib/coach-provider";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET() {
  try {
    const { provider, model } = coachConfiguration(process.env);
    return Response.json({ configured: true, provider, model }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ configured: false, provider: "", model: "" }, { headers: { "Cache-Control": "no-store" } });
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (!(await currentUser())) return jsonError(new Error("Connexion requise."), 401);
    const config = coachConfiguration(process.env);
    const body = z.object({ question: z.string().min(1).max(2000), summary: z.string().max(30000) }).parse(await readBody(request, 50000));
    const text = await requestCoach(config, body.question, body.summary);
    return Response.json({ text }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return jsonError(e, e instanceof CoachProviderError ? e.httpStatus : e instanceof z.ZodError ? 400 : 502);
  }
}
