import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { adminSessions, adminUsers, auditEvents } from "@/lib/db/schema";
import { createSessionToken, hashSessionToken, SESSION_COOKIE, SESSION_DURATION_SECONDS, sessionExpiry } from "./core";

export type CurrentAdmin = { id: number; username: string; displayName: string; role: "owner" | "editor" };

export async function createAdminSession(userId: number) {
  const token = createSessionToken();
  const expiresAt = sessionExpiry();
  await db.insert(adminSessions).values({ id: randomUUID(), userId, tokenHash: hashSessionToken(token), expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
    priority: "high",
  });
}

export async function currentAdmin(): Promise<CurrentAdmin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db.select({
    id: adminUsers.id,
    username: adminUsers.username,
    displayName: adminUsers.displayName,
    role: adminUsers.role,
  }).from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(
      eq(adminSessions.tokenHash, hashSessionToken(token)),
      gt(adminSessions.expiresAt, new Date()),
      eq(adminUsers.status, "active"),
    )).limit(1);
  return rows[0] ?? null;
}

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function destroyAdminSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashSessionToken(token)));
  store.delete(SESSION_COOKIE);
}

export async function audit(action: string, actorUserId: number | null, entityType?: string, entityId?: string) {
  await db.insert(auditEvents).values({ actorUserId, action, entityType, entityId, requestId: randomUUID() });
}
