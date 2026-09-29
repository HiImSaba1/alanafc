"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/features/admin-auth/session";
import { db } from "@/lib/db";
import { academyRegistrations, auditEvents } from "@/lib/db/schema";
import { registrationDuplicateWindowMinutes, registrationFormData, registrationRateLimit, registrationRateWindowMinutes, registrationReference, registrationSchema, registrationStatuses, registrationSubmissionDecision, registrationWindowStart, type RegistrationInput } from "./core";
import { sendRegistrationEmails } from "./mail";
import { getRegistrationSettings, registrationGroupOptions } from "@/features/site-settings/registration-settings";

export type RegistrationState = { status: "idle" | "success" | "error"; message?: string; reference?: string; errors?: Record<string, string[]> };

export async function submitRegistration(_state: RegistrationState, formData: FormData): Promise<RegistrationState> {
  const parsed = registrationSchema.safeParse(registrationFormData(formData));
  if (!parsed.success) return { status: "error", message: "Ελέγξτε τα πεδία της φόρμας.", errors: parsed.error.flatten().fieldErrors };
  const registrationSettings = await getRegistrationSettings();
  if (!registrationSettings.isOpen) return { status: "error", message: registrationSettings.closedMessage };
  const allowedGroups = registrationGroupOptions(registrationSettings);
  if (!allowedGroups.includes(parsed.data.preferredGroup)) return { status: "error", message: "Το επιλεγμένο τμήμα δεν είναι πλέον διαθέσιμο.", errors: { preferredGroup: ["Επιλέξτε ένα διαθέσιμο τμήμα."] } };

  const now = new Date();
  try {
    const [recentDuplicate] = await db.select({ reference: academyRegistrations.reference })
      .from(academyRegistrations)
      .where(and(
        eq(academyRegistrations.season, "2026-2027"),
        eq(academyRegistrations.childName, parsed.data.childName),
        eq(academyRegistrations.childBirthYear, parsed.data.childBirthYear),
        eq(academyRegistrations.guardianEmail, parsed.data.guardianEmail),
        gte(academyRegistrations.submittedAt, registrationWindowStart(now, registrationDuplicateWindowMinutes)),
      ))
      .orderBy(desc(academyRegistrations.submittedAt))
      .limit(1);
    if (recentDuplicate) return { status: "success", reference: recentDuplicate.reference, message: "Η εκδήλωση ενδιαφέροντος είχε ήδη καταχωρηθεί. Δεν δημιουργήθηκε δεύτερη υποβολή." };
    const recentEmailSubmissions = await db.select({ id: academyRegistrations.id })
      .from(academyRegistrations)
      .where(and(
        eq(academyRegistrations.guardianEmail, parsed.data.guardianEmail),
        gte(academyRegistrations.submittedAt, registrationWindowStart(now, registrationRateWindowMinutes)),
      ))
      .limit(registrationRateLimit);
    const decision = registrationSubmissionDecision(0, recentEmailSubmissions.length);
    if (decision === "rate-limited") return { status: "error", message: "Έχουν γίνει πολλές υποβολές σε σύντομο χρονικό διάστημα. Δοκιμάστε ξανά αργότερα ή επικοινωνήστε τηλεφωνικά μαζί μας." };
  } catch {
    return { status: "error", message: "Δεν ήταν δυνατός ο ασφαλής έλεγχος της υποβολής. Δοκιμάστε ξανά σε λίγο." };
  }

  const reference = registrationReference();
  let registrationId: number;
  try {
    const [result] = await db.insert(academyRegistrations).values({
      reference, season: "2026-2027", childName: parsed.data.childName, childBirthYear: parsed.data.childBirthYear,
      preferredGroup: parsed.data.preferredGroup, guardianName: parsed.data.guardianName,
      guardianRelationship: parsed.data.guardianRelationship, guardianEmail: parsed.data.guardianEmail,
      guardianPhone: parsed.data.guardianPhone, address: parsed.data.address || null, notes: parsed.data.notes || null,
      photoPreference: parsed.data.photoPreference, privacyConsentAt: now,
    });
    registrationId = result.insertId;
  } catch {
    return { status: "error", message: "Δεν ήταν δυνατή η ασφαλής καταχώρηση. Δοκιμάστε ξανά σε λίγο." };
  }
  await audit("registration.created", null, "academy_registration", String(registrationId));

  try {
    await sendRegistrationEmails(parsed.data, reference);
    await db.update(academyRegistrations).set({ emailStatus: "sent", emailError: null }).where(eq(academyRegistrations.reference, reference));
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Άγνωστο σφάλμα αποστολής";
    await db.update(academyRegistrations).set({ emailStatus: "failed", emailError: message }).where(eq(academyRegistrations.reference, reference));
    await audit("registration.email.failed", null, "academy_registration", String(registrationId));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/notifications");
  return { status: "success", reference, message: "Η εκδήλωση ενδιαφέροντος καταχωρήθηκε. Θα επικοινωνήσουμε σύντομα μαζί σας." };
}

export async function updateRegistrationStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!Number.isInteger(id) || id < 1 || !registrationStatuses.includes(status as (typeof registrationStatuses)[number])) throw new Error("Μη έγκυρη ενημέρωση εγγραφής.");
  await db.update(academyRegistrations).set({ status: status as (typeof registrationStatuses)[number] }).where(eq(academyRegistrations.id, id));
  await audit("registration.status.updated", admin.id, "academy_registration", String(id));
  revalidatePath("/admin/registrations");
  redirect(`/admin/registrations/${id}`);
}

export async function retryRegistrationEmail(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new Error("Μη έγκυρη εγγραφή.");
  const item = (await db.select().from(academyRegistrations).where(eq(academyRegistrations.id, id)).limit(1))[0];
  if (!item) throw new Error("Η εγγραφή δεν βρέθηκε.");
  await db.update(academyRegistrations).set({ emailStatus: "pending", emailError: null }).where(eq(academyRegistrations.id, id));
  try {
    await sendRegistrationEmails({ childName: item.childName, childBirthYear: item.childBirthYear, preferredGroup: item.preferredGroup as RegistrationInput["preferredGroup"], guardianName: item.guardianName, guardianRelationship: item.guardianRelationship, guardianEmail: item.guardianEmail, guardianPhone: item.guardianPhone, address: item.address || "", notes: item.notes || "", photoPreference: item.photoPreference, privacyConsent: "yes", website: "" }, item.reference);
    await db.update(academyRegistrations).set({ emailStatus: "sent" }).where(eq(academyRegistrations.id, id));
    await audit("registration.email.retried", admin.id, "academy_registration", String(id));
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Άγνωστο σφάλμα αποστολής";
    await db.update(academyRegistrations).set({ emailStatus: "failed", emailError: message }).where(eq(academyRegistrations.id, id));
  }
  revalidatePath("/admin/notifications"); revalidatePath(`/admin/registrations/${id}`); redirect(`/admin/registrations/${id}`);
}

export async function deleteRegistration(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Μόνο ο ιδιοκτήτης μπορεί να διαγράψει εγγραφές.");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new Error("Μη έγκυρη εγγραφή.");
  await db.transaction(async (transaction) => {
    const item = (await transaction.select({ reference: academyRegistrations.reference }).from(academyRegistrations).where(eq(academyRegistrations.id, id)).limit(1))[0];
    if (!item) throw new Error("Η εγγραφή δεν βρέθηκε.");
    await transaction.insert(auditEvents).values({ actorUserId: admin.id, action: "registration.deleted", entityType: "academy_registration", entityId: item.reference, requestId: randomUUID() });
    await transaction.delete(academyRegistrations).where(eq(academyRegistrations.id, id));
  });
  revalidatePath("/admin"); revalidatePath("/admin/registrations"); revalidatePath("/admin/notifications"); revalidatePath("/admin/activity");
  redirect("/admin/registrations");
}
