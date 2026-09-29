"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/features/admin-auth/session";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { registrationSettingsKey, registrationSettingsSchema } from "./registration-settings";

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

export async function updateRegistrationSettings(formData: FormData) {
  const admin = await requireAdmin();
  const count = Math.min(Math.max(Number(formData.get("programCount")) || 0, 1), 8);
  const programs = Array.from({ length: count }, (_, index) => ({
    id: String(formData.get(`program.${index}.id`) ?? `stage-${index + 1}`).trim(),
    groups: lines(formData.get(`program.${index}.groups`)),
    title: String(formData.get(`program.${index}.title`) ?? ""),
    text: String(formData.get(`program.${index}.text`) ?? ""),
    points: lines(formData.get(`program.${index}.points`)),
    image: String(formData.get(`program.${index}.image`) ?? "/programma_proponisewn_alana.jpg"),
  }));
  const parsed = registrationSettingsSchema.safeParse({
    isOpen: formData.get("isOpen") === "on",
    closedMessage: formData.get("closedMessage"),
    successMessage: formData.get("successMessage"),
    guardianEmailMessage: formData.get("guardianEmailMessage"),
    notificationRecipients: lines(formData.get("notificationRecipients")),
    season: formData.get("season"),
    statusText: formData.get("statusText"),
    titleLines: [formData.get("titleLine1"), formData.get("titleLine2"), formData.get("titleLine3")],
    intro: formData.get("intro"),
    sectionTitle: formData.get("sectionTitle"),
    sectionEyebrow: formData.get("sectionEyebrow"),
    sectionIntro: formData.get("sectionIntro"),
    programs,
  });
  if (!parsed.success) throw new Error("Ελέγξτε ότι όλα τα πεδία έχουν συμπληρωθεί σωστά.");

  await db.insert(siteSettings).values({ settingKey: registrationSettingsKey, valueJson: parsed.data, updatedByUserId: admin.id })
    .onDuplicateKeyUpdate({ set: { valueJson: parsed.data, updatedByUserId: admin.id } });
  await audit("site.registration.updated", admin.id, "site_setting", registrationSettingsKey);
  revalidatePath("/eggrafes-2026-2027");
  revalidatePath("/admin/site/registrations");
  redirect("/admin/site/registrations?saved=1");
}
