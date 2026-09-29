"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminSessions, adminUsers } from "@/lib/db/schema";
import { normalizeUsername } from "./core";
import { hashAdminPassword } from "./password";
import { audit, requireAdmin } from "./session";

const editorSchema = z.object({ username: z.string().trim().min(3).max(120), displayName: z.string().trim().min(2).max(120), email: z.string().trim().email().max(191).or(z.literal("")), password: z.string().min(12).max(200) });

async function requireOwner() {
  const admin = await requireAdmin();
  if (admin.role !== "owner") redirect("/admin");
  return admin;
}

export async function createEditorAccount(formData: FormData) {
  const owner = await requireOwner();
  const parsed = editorSchema.safeParse({ username: formData.get("username"), displayName: formData.get("displayName"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) throw new Error("Συμπληρώστε έγκυρα στοιχεία και κωδικό τουλάχιστον 12 χαρακτήρων.");
  const username = normalizeUsername(parsed.data.username);
  const existing = (await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.username, username)).limit(1))[0];
  if (existing) throw new Error("Το όνομα χρήστη χρησιμοποιείται ήδη.");
  const passwordHash = await hashAdminPassword(parsed.data.password);
  await db.insert(adminUsers).values({ username, displayName: parsed.data.displayName, email: parsed.data.email || null, passwordHash, role: "editor", status: "active" });
  await audit("admin.editor.created", owner.id, "admin_user", username);
  revalidatePath("/admin/users");
  redirect("/admin/users?created=1");
}

export async function toggleEditorAccount(formData: FormData) {
  const owner = await requireOwner();
  const id = Number(formData.get("id"));
  const status = formData.get("status") === "active" ? "active" : "disabled";
  if (!Number.isInteger(id) || id < 1 || id === owner.id) throw new Error("Μη έγκυρος λογαριασμός.");
  const target = (await db.select({ id: adminUsers.id, role: adminUsers.role }).from(adminUsers).where(eq(adminUsers.id, id)).limit(1))[0];
  if (!target || target.role !== "editor") throw new Error("Μόνο λογαριασμοί editor μπορούν να αλλάξουν από εδώ.");
  await db.update(adminUsers).set({ status }).where(eq(adminUsers.id, id));
  if (status === "disabled") await db.delete(adminSessions).where(eq(adminSessions.userId, id));
  await audit(`admin.editor.${status}`, owner.id, "admin_user", String(id));
  revalidatePath("/admin/users");
}
