import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import process from "node:process";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { z } from "zod";
import { normalizeUsername } from "../src/features/admin-auth/core";
import { hashAdminPassword } from "../src/features/admin-auth/password";
import { adminSessions, adminUsers, auditEvents } from "../src/lib/db/schema";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const inputSchema = z.object({
  username: z.string().trim().min(2).max(120),
  displayName: z.string().trim().min(2).max(120),
  password: z.string().min(14).max(200),
});

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is missing.");
  const url = new URL(databaseUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const expectedDatabase = process.env.DATABASE_NAME?.trim() || "next_alanafcacademy";
  if (database !== expectedDatabase) {
    throw new Error("Admin credential sync is restricted to the configured DATABASE_NAME.");
  }

  const input = inputSchema.parse({
    username: process.env.ADMIN_USERNAME,
    displayName: process.env.ADMIN_DISPLAY_NAME ?? "Alana FC Owner",
    password: process.env.ADMIN_PASSWORD,
  });
  const username = normalizeUsername(input.username);
  const passwordHash = await hashAdminPassword(input.password);
  const connection = await mysql.createConnection(databaseUrl);

  try {
    const database = drizzle(connection);
    const owner = (await database.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.role, "owner")).limit(1))[0];

    await connection.beginTransaction();
    let ownerId: number;
    if (owner) {
      ownerId = owner.id;
      await database.update(adminUsers).set({
        username,
        displayName: input.displayName,
        passwordHash,
        status: "active",
        failedLoginCount: 0,
        lockedUntil: null,
      }).where(eq(adminUsers.id, ownerId));
      await database.delete(adminSessions).where(eq(adminSessions.userId, ownerId));
      await database.insert(auditEvents).values({ actorUserId: ownerId, action: "admin.owner.credentials_synced", entityType: "admin_user", entityId: String(ownerId), requestId: randomUUID() });
    } else {
      const [result] = await database.insert(adminUsers).values({ username, displayName: input.displayName, passwordHash, role: "owner", status: "active" });
      ownerId = result.insertId;
      await database.insert(auditEvents).values({ actorUserId: ownerId, action: "admin.owner.created_by_sync", entityType: "admin_user", entityId: String(ownerId), requestId: randomUUID() });
    }
    await connection.commit();
    process.stdout.write("Owner credentials synchronized from .env.local. Password was not logged. Existing owner sessions were invalidated.\n");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof z.ZodError
    ? "ADMIN_USERNAME, ADMIN_DISPLAY_NAME or ADMIN_PASSWORD is invalid. ADMIN_PASSWORD must contain at least 14 characters."
    : error instanceof Error ? error.message : String(error);
  process.stderr.write(`Admin credential sync failed: ${message}\n`);
  process.exitCode = 1;
});
