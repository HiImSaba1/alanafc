"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { MAX_FAILED_LOGINS, nextFailureState, normalizeUsername } from "./core";
import { hashAdminPassword, verifyAdminPassword } from "./password";
import { audit, createAdminSession, currentAdmin, destroyAdminSession } from "./session";

const loginSchema = z.object({ username: z.string().trim().min(2).max(120), password: z.string().min(12).max(200) });
export type LoginState = { error?: string };

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ username: formData.get("username"), password: formData.get("password") });
  if (!parsed.success) return { error: "Ελέγξτε το όνομα χρήστη και τον κωδικό σας." };

  const username = normalizeUsername(parsed.data.username);
  const user = (await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1))[0];
  if (!user) {
    await hashAdminPassword(parsed.data.password);
    await audit("admin.login.rejected", null);
    return { error: "Τα στοιχεία σύνδεσης δεν είναι σωστά ή ο λογαριασμός είναι προσωρινά κλειδωμένος." };
  }
  if (user.status !== "active" || (user.lockedUntil && user.lockedUntil > new Date())) {
    await hashAdminPassword(parsed.data.password);
    await audit("admin.login.rejected", user.id);
    return { error: "Τα στοιχεία σύνδεσης δεν είναι σωστά ή ο λογαριασμός είναι προσωρινά κλειδωμένος." };
  }

  const valid = await verifyAdminPassword(user.passwordHash, parsed.data.password);
  if (!valid) {
    const failure = nextFailureState(user.failedLoginCount);
    await db.update(adminUsers).set(failure).where(eq(adminUsers.id, user.id));
    await audit(failure.lockedUntil ? "admin.login.locked" : "admin.login.failed", user.id);
    return { error: `Τα στοιχεία σύνδεσης δεν είναι σωστά. Μετά από ${MAX_FAILED_LOGINS} αποτυχίες εφαρμόζεται προσωρινό κλείδωμα.` };
  }

  await db.update(adminUsers).set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await createAdminSession(user.id);
  await audit("admin.login.succeeded", user.id);
  redirect("/admin");
}

export async function logoutAction() {
  const admin = await currentAdmin();
  await destroyAdminSession();
  if (admin) await audit("admin.logout", admin.id);
  redirect("/admin/login");
}
