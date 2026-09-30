"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/features/admin-auth/session";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { documentSettingsKey, documentSettingsSchema } from "./document-settings";

export async function updateDocumentSettings(formData: FormData) {
  const admin = await requireAdmin();
  const count = Math.min(Math.max(Number(formData.get("documentCount")) || 0, 0), 40);
  const documents = Array.from({ length: count }, (_, index) => ({
    id: String(formData.get(`document.${index}.id`) ?? `document-${index + 1}`),
    enabled: formData.get(`document.${index}.enabled`) === "on",
    title: formData.get(`document.${index}.title`),
    description: formData.get(`document.${index}.description`),
    mediaExternalId: formData.get(`document.${index}.mediaExternalId`),
    buttonLabel: formData.get(`document.${index}.buttonLabel`),
  }));
  const parsed = documentSettingsSchema.safeParse({ eyebrow: formData.get("eyebrow"), title: formData.get("title"), intro: formData.get("intro"), documents });
  if (!parsed.success) throw new Error("Ελέγξτε ότι τα στοιχεία της σελίδας και των εγγράφων έχουν συμπληρωθεί σωστά.");
  await db.insert(siteSettings).values({ settingKey: documentSettingsKey, valueJson: parsed.data, updatedByUserId: admin.id })
    .onDuplicateKeyUpdate({ set: { valueJson: parsed.data, updatedByUserId: admin.id } });
  await audit("site.documents.updated", admin.id, "site_setting", documentSettingsKey);
  revalidatePath("/useful-documents");
  revalidatePath("/admin/site/documents");
  revalidatePath("/sitemap.xml");
  redirect("/admin/site/documents?saved=1");
}
