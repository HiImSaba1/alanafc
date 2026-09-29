"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/features/admin-auth/session";
import { db } from "@/lib/db";
import { auditEvents, legacyRedirects } from "@/lib/db/schema";

const redirectSchema = z.object({ sourcePath: z.string().trim().min(2).max(240), targetPath: z.string().trim().min(2).max(500) });

function internalPath(value: string, source = false) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("?") || value.includes("#")) throw new Error("Χρησιμοποιήστε μόνο εσωτερική διαδρομή χωρίς domain, query ή anchor.");
  const path = value.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  if (/^\/(?:admin|api|_next)(?:\/|$)/i.test(path)) throw new Error("Δεν επιτρέπονται ανακατευθύνσεις ιδιωτικών ή συστημικών διαδρομών.");
  if (source) {
    const segments = path.split("/").filter(Boolean);
    if (segments.length > 1 && !(segments.length === 2 && segments[0] === "news")) throw new Error("Η αρχική διαδρομή πρέπει να είναι /palio-url ή /news/palio-url.");
  }
  return path;
}

export async function createManualRedirect(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Μόνο ο ιδιοκτήτης μπορεί να δημιουργήσει ανακατευθύνσεις.");
  const parsed = redirectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Ελέγξτε τις διαδρομές ανακατεύθυνσης.");
  const sourcePath = internalPath(parsed.data.sourcePath, true);
  const targetPath = internalPath(parsed.data.targetPath);
  if (sourcePath === targetPath) throw new Error("Η αρχική και η τελική διαδρομή πρέπει να διαφέρουν.");
  await db.transaction(async (transaction) => {
    const existingSource = await transaction.select({ id: legacyRedirects.id }).from(legacyRedirects).where(eq(legacyRedirects.sourcePath, sourcePath)).limit(1);
    if (existingSource[0]) throw new Error("Υπάρχει ήδη ανακατεύθυνση για αυτή την αρχική διαδρομή.");
    const targetRedirect = await transaction.select({ targetPath: legacyRedirects.targetPath }).from(legacyRedirects).where(eq(legacyRedirects.sourcePath, targetPath)).limit(1);
    if (targetRedirect[0]) throw new Error(`Ο προορισμός ανακατευθύνει ήδη προς ${targetRedirect[0].targetPath}. Χρησιμοποιήστε τον τελικό προορισμό.`);
    await transaction.update(legacyRedirects).set({ targetPath }).where(eq(legacyRedirects.targetPath, sourcePath));
    await transaction.insert(legacyRedirects).values({ sourcePath, targetPath, statusCode: 308, sourceExternalId: "manual" });
    await transaction.insert(auditEvents).values({ actorUserId: admin.id, action: "redirect.created", entityType: "redirect", entityId: sourcePath, requestId: randomUUID() });
  });
  revalidatePath("/admin/redirects"); revalidatePath("/admin/activity");
  redirect("/admin/redirects?created=1");
}

export async function deleteManualRedirect(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Μόνο ο ιδιοκτήτης μπορεί να διαγράψει ανακατευθύνσεις.");
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) throw new Error("Μη έγκυρη ανακατεύθυνση.");
  await db.transaction(async (transaction) => {
    const item = (await transaction.select().from(legacyRedirects).where(eq(legacyRedirects.id, id.data)).limit(1))[0];
    if (!item) throw new Error("Η ανακατεύθυνση δεν βρέθηκε.");
    if (item.sourceExternalId !== "manual") throw new Error("Οι ανακατευθύνσεις εισαγωγής προστατεύονται από διαγραφή.");
    await transaction.delete(legacyRedirects).where(eq(legacyRedirects.id, item.id));
    await transaction.insert(auditEvents).values({ actorUserId: admin.id, action: "redirect.deleted", entityType: "redirect", entityId: item.sourcePath, requestId: randomUUID() });
  });
  revalidatePath("/admin/redirects"); revalidatePath("/admin/activity");
  redirect("/admin/redirects?deleted=1");
}
