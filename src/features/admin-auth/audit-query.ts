import "server-only";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers, auditEvents } from "@/lib/db/schema";

export type AuditFilters = { query?: string; entityType?: string; limit?: number; offset?: number };

function auditConditions(filters: AuditFilters) {
  const conditions = [];
  if (filters.query) conditions.push(or(like(auditEvents.action, `%${filters.query}%`), like(auditEvents.entityId, `%${filters.query}%`), like(adminUsers.displayName, `%${filters.query}%`))!);
  if (filters.entityType) conditions.push(eq(auditEvents.entityType, filters.entityType));
  return conditions.length ? and(...conditions) : undefined;
}

export async function adminAuditLog(filters: AuditFilters = {}) {
  const where = auditConditions(filters);
  const [items, totals] = await Promise.all([
    db.select({ id: auditEvents.id, action: auditEvents.action, entityType: auditEvents.entityType, entityId: auditEvents.entityId, requestId: auditEvents.requestId, createdAt: auditEvents.createdAt, actorName: adminUsers.displayName, actorUsername: adminUsers.username })
      .from(auditEvents).leftJoin(adminUsers, eq(auditEvents.actorUserId, adminUsers.id)).where(where)
      .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id)).limit(filters.limit ?? 40).offset(filters.offset ?? 0),
    db.select({ total: sql<number>`COUNT(*)` }).from(auditEvents).leftJoin(adminUsers, eq(auditEvents.actorUserId, adminUsers.id)).where(where),
  ]);
  return { items, total: Number(totals[0]?.total ?? 0) };
}
