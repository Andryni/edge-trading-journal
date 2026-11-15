import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { newJournal } from "@edge/core";
import { db } from "../../../lib/db";
import {
  currentUser,
  hashPassword,
  verifyPassword,
  tokenHash,
  SESSION_COOKIE,
  sameOrigin,
  jsonError,
  readBody,
} from "../../../lib/auth";
export const runtime = "nodejs";
import {cloudEnabled,cloudLogin,cloudLogout} from "../../../lib/cloud";
// Limitation en mémoire par origine. Une installation distante demandera un rate limiter partagé.
const attempts = new Map<string, { count: number; since: number }>();
export async function GET() {
  const user = await currentUser();
  return Response.json(
    { user: user ? { id: user.id, email: user.email } : null, backend: cloudEnabled() ? "supabase" : "local" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const key = request.headers.get("host") ?? "local";
    const record = attempts.get(key);
    if (!cloudEnabled() && record && Date.now() - record.since < 60000 && record.count >= 15)
      return jsonError(
        new Error("Trop de tentatives. Réessaie dans une minute."),
        429,
      );
    if (!record || Date.now() - record.since >= 60000)
      attempts.set(key, { count: 1, since: Date.now() });
    else record.count++;
    const body = z
      .object({
        action: z.enum(["login", "register"]),
        email: z
          .string()
          .email()
          .max(200)
          .transform((s) => s.trim().toLowerCase()),
        password: z
          .string()
          .min(10, "Mot de passe : 10 caractères minimum.")
          .max(200),
      })
      .parse(await readBody(request, 10000));
    if(cloudEnabled())return Response.json({user:await cloudLogin(body.email,body.password,body.action === "register")},{headers:{"Cache-Control":"no-store"}});
    let user = await db.user.findUnique({ where: { email: body.email } });
    if (body.action === "register") {
      if (user)
        return jsonError(
          new Error("Cette adresse possède déjà un compte local."),
          409,
        );
      user = await db.user.create({
        data: {
          email: body.email,
          passwordHash: hashPassword(body.password),
          document: { create: { data: JSON.stringify(newJournal()) } },
        },
      });
    } else if (
      !user?.passwordHash ||
      !verifyPassword(body.password, user.passwordHash)
    )
      return jsonError(new Error("Adresse ou mot de passe incorrect."), 401);
    if (!user) return jsonError(new Error("Utilisateur introuvable."), 401);
    const token = randomBytes(32).toString("hex");
    await db.authSession.create({
      data: {
        id: tokenHash(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: 30 * 86400,
    });
    return Response.json({ user: { id: user.id, email: user.email } });
  } catch (e) {
    return jsonError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    if(cloudEnabled()){await cloudLogout();return Response.json({ok:true});}
    const c = await cookies();
    const token = c.get(SESSION_COOKIE)?.value;
    if (token)
      await db.authSession.deleteMany({ where: { id: tokenHash(token) } });
    c.delete(SESSION_COOKIE);
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
