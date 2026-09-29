import sanitizeHtml from "sanitize-html";

export type PublicationStatus = "draft" | "published" | "scheduled" | "archived";

const greekPairs: Record<string, string> = { ου: "ou", αι: "ai", ει: "ei", οι: "oi", υι: "yi", μπ: "mp", ντ: "nt", γκ: "gk", γγ: "ng", τσ: "ts", τζ: "tz" };
const greekLetters: Record<string, string> = { α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o" };

export function normalizeGreekTitleConjunctions(value: string): string {
  return value.replace(/&(?:amp|#0*38|#x0*26);|&/gi, " και ").replace(/\s+/g, " ").trim();
}

export function removeLegacyEmojiImages(value: string): string {
  return value.replace(/<img\b[^>]*\bsrc\s*=\s*(["'])https?:\/\/static\.xx\.fbcdn\.net\/images\/emoji\.php[^"']*\1[^>]*>/gi, "");
}

export function suggestGreeklishSlug(title: string): string {
  const normalized = normalizeGreekTitleConjunctions(title).toLocaleLowerCase("el").replace(/(^|\s)και(?=\s|$)/gu, "$1and").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const transliterated = normalized.replace(/ου|αι|ει|οι|υι|μπ|ντ|γκ|γγ|τσ|τζ|[α-ω]/g, (part) => greekPairs[part] ?? greekLetters[part] ?? part);
  return transliterated.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 191).replace(/-+$/g, "") || "arthro";
}

export function conciseGreeklishSlug(title: string, maxLength = 80): string {
  const slug = suggestGreeklishSlug(title);
  if (slug.length <= maxLength) return slug;
  const clipped = slug.slice(0, maxLength + 1);
  const atWordBoundary = clipped.includes("-") ? clipped.replace(/-[^-]*$/, "") : clipped.slice(0, maxLength);
  return atWordBoundary.slice(0, maxLength).replace(/-+$/, "") || "arthro";
}

export function normalizeContentSlug(value: string): string {
  const decoded = (() => { try { return decodeURIComponent(value); } catch { return value; } })();
  return decoded.trim().toLocaleLowerCase("el-GR").replace(/^\/+|\/+$/g, "").replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
}

export function sanitizeEditorHtml(value: string): string {
  return sanitizeHtml(removeLegacyEmojiImages(value), {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "u", "s", "blockquote", "ul", "ol", "li", "h2", "h3", "h4", "h5", "h6", "a", "figure", "figcaption", "img", "table", "thead", "tbody", "tr", "th", "td", "hr"],
    allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height", "loading"], th: ["scope", "colspan", "rowspan"], td: ["colspan", "rowspan"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: { a: (_tag, attributes) => ({ tagName: "a", attribs: { ...attributes, rel: "noopener noreferrer" } }), img: (_tag, attributes) => ({ tagName: "img", attribs: { ...attributes, loading: "lazy" } }) },
  }).trim();
}

export function isPubliclyVisible(input: { migrationStatus: "draft" | "quarantined"; publicationStatus: PublicationStatus; scheduledFor?: Date | null }, now = new Date()): boolean {
  if (input.migrationStatus !== "draft") return false;
  if (input.publicationStatus === "published") return true;
  return input.publicationStatus === "scheduled" && Boolean(input.scheduledFor && input.scheduledFor <= now);
}

export function publicationFromIntent(intent: string, scheduledFor: Date | null): { status: PublicationStatus; scheduledFor: Date | null } {
  if (intent === "publish") return { status: "published", scheduledFor: null };
  if (intent === "schedule") {
    if (!scheduledFor || scheduledFor <= new Date()) throw new Error("Η προγραμματισμένη ημερομηνία πρέπει να είναι στο μέλλον.");
    return { status: "scheduled", scheduledFor };
  }
  if (intent === "archive") return { status: "archived", scheduledFor: null };
  return { status: "draft", scheduledFor: null };
}
