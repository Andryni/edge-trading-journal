import { cookies } from "next/headers";
import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { db } from "./db";
import {cloudEnabled,cloudSession} from "./cloud";
export const SESSION_COOKIE = "edge-session";
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  try {
    const [salt, value] = hash.split(":");
    const input = scryptSync(password, salt, 64);
    const expected = Buffer.from(value, "hex");
    return expected.length === input.length && timingSafeEqual(input, expected);
  } catch {
    return false;
  }
}
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function currentUser() {
  if(cloudEnabled())return (await cloudSession())?.user ?? null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.authSession.findUnique({
    where: { id: tokenHash(token) },
    include: { user: true },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin && new URL(origin).host !== host)
  )
    throw new Error("Origine de requête refusée.");
}
export function jsonError(e: unknown, status = 400) {
  return Response.json(
    { error: e instanceof Error ? e.message : "Erreur inattendue." },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export async function readBody(request: Request, max = 32_000_000) {
  if (Number(request.headers.get("content-length") ?? 0) > max)
    throw new Error("Données trop volumineuses. Maximum 32 Mo.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Corps manquant.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new Error("Données trop volumineuses.");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
