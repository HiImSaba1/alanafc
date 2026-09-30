import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { defaultOwnerContentSettings, ownerContentSettingsSchema, type OwnerContentSettings } from "./owner-content-contract";

export const ownerContentSettingsKey = "owner_public_content";

export async function getOwnerContentSettings(): Promise<OwnerContentSettings> {
  try {
    const row = (await db.select({ value: siteSettings.valueJson }).from(siteSettings).where(eq(siteSettings.settingKey, ownerContentSettingsKey)).limit(1))[0];
    const stored = row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? row.value as Partial<OwnerContentSettings> : {};
    const parsed = ownerContentSettingsSchema.safeParse({
      ...defaultOwnerContentSettings,
      ...stored,
      site: { ...defaultOwnerContentSettings.site, ...stored.site },
      homepage: { ...defaultOwnerContentSettings.homepage, ...stored.homepage },
    });
    return parsed.success ? parsed.data : defaultOwnerContentSettings;
  } catch {
    return defaultOwnerContentSettings;
  }
}
