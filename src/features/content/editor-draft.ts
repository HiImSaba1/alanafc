export type EditorialDraft = { bodyHtml: string; savedAt: string };

export function parseEditorialDraft(raw: string | null, currentBodyHtml: string): EditorialDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<EditorialDraft>;
    if (typeof value.bodyHtml !== "string" || value.bodyHtml.length > 2_000_000 || value.bodyHtml === currentBodyHtml) return null;
    if (typeof value.savedAt !== "string" || Number.isNaN(Date.parse(value.savedAt))) return null;
    return { bodyHtml: value.bodyHtml, savedAt: value.savedAt };
  } catch {
    return null;
  }
}
