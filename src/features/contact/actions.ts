"use server";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/features/admin-auth/session";
import { db } from "@/lib/db";
import { auditEvents, contactMessages } from "@/lib/db/schema";
import { contactDuplicateWindowMinutes, contactFormData, contactRateLimit, contactRateWindowMinutes, contactReference, contactSchema, contactStatuses, contactSubmissionDecision, contactWindowStart } from "./core";
import { sendContactEmails } from "./mail";
export type ContactState = { status: "idle" | "success" | "error"; message?: string; reference?: string; errors?: Record<string, string[]> };
export async function submitContact(_state: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = contactSchema.safeParse(contactFormData(formData));
  if (!parsed.success) return { status: "error", message: "Ελέγξτε τα πεδία της φόρμας.", errors: parsed.error.flatten().fieldErrors };

  const now = new Date();
  try {
    const [recentDuplicate] = await db.select({ reference: contactMessages.reference })
      .from(contactMessages)
      .where(and(
        eq(contactMessages.senderEmail, parsed.data.senderEmail),
        eq(contactMessages.subject, parsed.data.subject),
        eq(contactMessages.message, parsed.data.message),
        gte(contactMessages.submittedAt, contactWindowStart(now, contactDuplicateWindowMinutes)),
      ))
      .orderBy(desc(contactMessages.submittedAt))
      .limit(1);
    if (recentDuplicate) return { status: "success", reference: recentDuplicate.reference, message: "Το ίδιο μήνυμα είχε ήδη καταχωρηθεί. Δεν δημιουργήθηκε δεύτερη υποβολή." };
    const recentEmailSubmissions = await db.select({ id: contactMessages.id })
      .from(contactMessages)
      .where(and(
        eq(contactMessages.senderEmail, parsed.data.senderEmail),
        gte(contactMessages.submittedAt, contactWindowStart(now, contactRateWindowMinutes)),
      ))
      .limit(contactRateLimit);
    if (contactSubmissionDecision(0, recentEmailSubmissions.length) === "rate-limited") return { status: "error", message: "Έχουν σταλεί πολλά μηνύματα σε σύντομο χρονικό διάστημα. Δοκιμάστε ξανά αργότερα ή επικοινωνήστε τηλεφωνικά μαζί μας." };
  } catch {
    return { status: "error", message: "Δεν ήταν δυνατός ο ασφαλής έλεγχος του μηνύματος. Δοκιμάστε ξανά σε λίγο." };
  }

  const reference = contactReference();
  let id: number;
  try {
    const [result] = await db.insert(contactMessages).values({
      reference, senderName: parsed.data.senderName, senderEmail: parsed.data.senderEmail,
      senderPhone: parsed.data.senderPhone || null, subject: parsed.data.subject,
      message: parsed.data.message, privacyConsentAt: now,
    });
    id = result.insertId;
  } catch {
    return { status: "error", message: "Δεν ήταν δυνατή η ασφαλής καταχώρηση. Δοκιμάστε ξανά σε λίγο." };
  }
  await audit("contact.created", null, "contact_message", String(id));
  try {
    await sendContactEmails(parsed.data, reference);
    await db.update(contactMessages).set({ emailStatus: "sent", emailError: null }).where(eq(contactMessages.id, id));
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Άγνωστο σφάλμα αποστολής";
    await db.update(contactMessages).set({ emailStatus: "failed", emailError: message }).where(eq(contactMessages.id, id));
    await audit("contact.email.failed", null, "contact_message", String(id));
  }
  revalidatePath("/admin");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/notifications");
  return { status: "success", reference, message: "Το μήνυμά σας καταχωρήθηκε. Θα σας απαντήσουμε σύντομα." };
}
export async function updateContactStatus(formData: FormData) { const admin = await requireAdmin(); const id = Number(formData.get("id")); const status = String(formData.get("status")); if (!Number.isInteger(id) || id < 1 || !contactStatuses.includes(status as (typeof contactStatuses)[number])) throw new Error("Μη έγκυρη ενημέρωση μηνύματος."); await db.update(contactMessages).set({ status: status as (typeof contactStatuses)[number] }).where(eq(contactMessages.id, id)); await audit("contact.status.updated", admin.id, "contact_message", String(id)); revalidatePath("/admin/messages"); redirect(`/admin/messages/${id}`); }
export async function retryContactEmail(formData: FormData) { const admin = await requireAdmin(); const id = Number(formData.get("id")); if (!Number.isInteger(id) || id < 1) throw new Error("Μη έγκυρο μήνυμα."); const item = (await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1))[0]; if (!item) throw new Error("Το μήνυμα δεν βρέθηκε."); await db.update(contactMessages).set({ emailStatus: "pending", emailError: null }).where(eq(contactMessages.id, id)); try { await sendContactEmails({ senderName: item.senderName, senderEmail: item.senderEmail, senderPhone: item.senderPhone || "", subject: item.subject, message: item.message, privacyConsent: "yes", website: "" }, item.reference); await db.update(contactMessages).set({ emailStatus: "sent" }).where(eq(contactMessages.id, id)); await audit("contact.email.retried", admin.id, "contact_message", String(id)); } catch (error) { const message = error instanceof Error ? error.message.slice(0, 500) : "Άγνωστο σφάλμα αποστολής"; await db.update(contactMessages).set({ emailStatus: "failed", emailError: message }).where(eq(contactMessages.id, id)); } revalidatePath("/admin/notifications"); revalidatePath(`/admin/messages/${id}`); redirect(`/admin/messages/${id}`); }

export async function deleteContactMessage(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Μόνο ο ιδιοκτήτης μπορεί να διαγράψει μηνύματα.");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new Error("Μη έγκυρο μήνυμα.");
  await db.transaction(async (transaction) => {
    const item = (await transaction.select({ reference: contactMessages.reference }).from(contactMessages).where(eq(contactMessages.id, id)).limit(1))[0];
    if (!item) throw new Error("Το μήνυμα δεν βρέθηκε.");
    await transaction.insert(auditEvents).values({ actorUserId: admin.id, action: "contact.deleted", entityType: "contact_message", entityId: item.reference, requestId: randomUUID() });
    await transaction.delete(contactMessages).where(eq(contactMessages.id, id));
  });
  revalidatePath("/admin"); revalidatePath("/admin/messages"); revalidatePath("/admin/notifications"); revalidatePath("/admin/activity");
  redirect("/admin/messages");
}
