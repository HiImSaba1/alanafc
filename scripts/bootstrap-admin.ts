import { existsSync } from "node:fs";
import process from "node:process";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { z } from "zod";
import { adminUsers, auditEvents } from "../src/lib/db/schema";
import { normalizeUsername } from "../src/features/admin-auth/core";
import { hashAdminPassword } from "../src/features/admin-auth/password";
import { randomUUID } from "node:crypto";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const inputSchema = z.object({
  username: z.string().trim().min(2).max(120),
  displayName: z.string().trim().min(2).max(120),
  password: z.string().min(14).max(200),
});

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing.");
  const input = inputSchema.parse({
    username: process.env.ADMIN_USERNAME,
    displayName: process.env.ADMIN_DISPLAY_NAME ?? "Alana FC Owner",
    password: process.env.ADMIN_PASSWORD,
  });
  const connection = await mysql.createConnection(url);
  try {
    const database = drizzle(connection);
    const owners = await database.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.role, "owner")).limit(1);
    if (owners.length > 0) throw new Error("An owner account already exists; bootstrap is intentionally one-time only.");
    const passwordHash = await hashAdminPassword(input.password);
    const username = normalizeUsername(input.username);
    await database.insert(adminUsers).values({
      username,
      displayName: input.displayName,
      passwordHash,
      role: "owner",
    });
    const createdOwner = (await database.select({ id: adminUsers.id }).from(adminUsers)
      .where(eq(adminUsers.username, username)).limit(1))[0];
    if (!createdOwner) throw new Error("Owner verification failed after insert.");
    const ownerId = createdOwner.id;
    await database.insert(auditEvents).values({ actorUserId: ownerId, action: "admin.owner.bootstrapped", entityType: "admin_user", entityId: String(ownerId), requestId: randomUUID() });
    process.stdout.write("Owner account created successfully. Password was not logged.\n");
  } finally {
    await connection.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Admin bootstrap failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
