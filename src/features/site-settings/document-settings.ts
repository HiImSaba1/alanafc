import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

export const documentSettingsKey = "useful_documents_page";

const documentItemSchema = z.object({
  id: z.string().trim().min(1).max(80),
  enabled: z.boolean(),
  title: z.string().trim().max(191),
  description: z.string().trim().max(1000),
  mediaExternalId: z.string().trim().max(64),
  buttonLabel: z.string().trim().min(2).max(80),
}).superRefine((item, context) => {
  if (!item.enabled) return;
  if (item.title.length < 2) context.addIssue({ code: "custom", path: ["title"], message: "Το ενεργό έγγραφο χρειάζεται τίτλο." });
  if (!item.mediaExternalId.startsWith("native-document-")) context.addIssue({ code: "custom", path: ["mediaExternalId"], message: "Το ενεργό έγγραφο χρειάζεται αρχείο PDF." });
});

export const documentSettingsSchema = z.object({
  eyebrow: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(191),
  intro: z.string().trim().min(10).max(1000),
  documents: z.array(documentItemSchema).max(40),
});

export type DocumentSettings = z.infer<typeof documentSettingsSchema>;

export const defaultDocumentSettings: DocumentSettings = {
  eyebrow: "ALANA FC ACADEMY · ΕΝΗΜΕΡΩΣΗ",
  title: "Χρήσιμα έγγραφα",
  intro: "Βρείτε συγκεντρωμένα έντυπα και έγγραφα που αφορούν τους αθλητές και τις οικογένειές τους.",
  documents: [],
};

export async function getDocumentSettings(): Promise<DocumentSettings> {
  try {
    const row = (await db.select({ value: siteSettings.valueJson }).from(siteSettings).where(eq(siteSettings.settingKey, documentSettingsKey)).limit(1))[0];
    const stored = row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? row.value as Partial<DocumentSettings> : {};
    const parsed = documentSettingsSchema.safeParse({ ...defaultDocumentSettings, ...stored });
    return parsed.success ? parsed.data : defaultDocumentSettings;
  } catch {
    return defaultDocumentSettings;
  }
}
