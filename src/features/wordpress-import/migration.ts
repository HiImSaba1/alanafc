import { createHash } from "node:crypto";
import { basename } from "node:path";
import { XMLParser } from "fast-xml-parser";
import sanitizeHtml from "sanitize-html";
import { normalizeGreekTitleConjunctions, removeLegacyEmojiImages } from "@/features/content/core";

export type MigrationRisk =
  | "active-content"
  | "duplicate-conflict"
  | "foreign-canonical"
  | "missing-slug"
  | "missing-title"
  | "suspected-spam";

export type MigrationTaxonomy = { taxonomy: string; slug: string; name: string };
export type MigratableContent = {
  externalId: string;
  kind: "page" | "post";
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  authorName: string;
  sourceStatus: string;
  sourceUrl: string;
  checksum: string;
  featuredMediaExternalId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  taxonomies: MigrationTaxonomy[];
  risks: MigrationRisk[];
};
export type MigratableMedia = {
  externalId: string;
  parentExternalId: string | null;
  filename: string;
  sourceUrl: string;
  title: string;
  altText: string;
  caption: string;
  credit: string | null;
  checksum: string;
  risks: MigrationRisk[];
};
export type LegacyFormReference = {
  externalId: string;
  title: string;
  sourceStatus: string;
  checksum: string;
};
export type ParsedMigrationSource = {
  source: { title: string; siteUrl: string; language: string };
  contents: MigratableContent[];
  media: MigratableMedia[];
  forms: LegacyFormReference[];
};

const ACTIVE_CONTENT = /<script\b|<iframe\b|javascript\s*:|\son(?:error|load|click)\s*=/i;
const SPAM_CONTENT = /casino|betting|withdrawal|escort|porn|viagra|onlyfans|crypto\s*casino|free\s*spins|online\s*slots|slots?\s|poker|stoix|book\s+of\s+dead|bonus\s+buy|sugar\s+rush|pamestoixima|rtp\b/i;
const SHORTCODE = /\[(?:\/?)(?:vc_[\w-]+|pofo_[\w-]+|rev_slider(?:_vc)?|contact-form-7|gallery|caption)(?:\s[^\]]*)?\]/gi;

function arrayOf<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

function textOf(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  const record = recordOf(value);
  return record ? textOf(record["#text"]) : "";
}

function decodedText(value: unknown): string {
  return sanitizeHtml(textOf(value), { allowedTags: [], allowedAttributes: {} }).trim();
}

function normalizedSlug(value: string, fallback: string): string {
  const decoded = (() => { try { return decodeURIComponent(value); } catch { return value; } })();
  const slug = decoded.trim().replace(/^\/+|\/+$/g, "").toLocaleLowerCase("el-GR")
    .replace(/\s+/g, "-").replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/-{2,}/g, "-");
  return slug || fallback;
}

export function stripLegacyBuilderShortcodes(value: string): string {
  return value.replace(SHORTCODE, "").replace(/\[\/?[\w-]+(?:\s[^\]]*)?\]/g, "").trim();
}

export function sanitizeMigratedHtml(value: string): string {
  return sanitizeHtml(removeLegacyEmojiImages(stripLegacyBuilderShortcodes(value)), {
    allowedTags: [
      "p", "br", "strong", "em", "b", "i", "u", "s", "blockquote", "ul", "ol", "li",
      "h2", "h3", "h4", "h5", "h6", "a", "figure", "figcaption", "img", "picture", "source",
      "table", "thead", "tbody", "tr", "th", "td", "hr", "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "srcset", "sizes", "alt", "width", "height", "loading"],
      source: ["src", "srcset", "sizes", "type", "media"],
      th: ["scope", "colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    disallowedTagsMode: "discard",
    transformTags: {
      a: (_tagName, attribs) => ({ tagName: "a", attribs: { ...attribs, rel: "noopener noreferrer" } }),
      img: (_tagName, attribs) => ({ tagName: "img", attribs: { ...attribs, loading: attribs.loading || "lazy" } }),
    },
  }).trim();
}

function metaMap(item: Record<string, unknown>): Map<string, string> {
  const result = new Map<string, string>();
  for (const raw of arrayOf(item["wp:postmeta"])) {
    const meta = recordOf(raw);
    const key = textOf(meta?.["wp:meta_key"]).trim();
    if (key && !result.has(key)) result.set(key, textOf(meta?.["wp:meta_value"]).trim());
  }
  return result;
}

function risksFor(title: string, slug: string, html: string, sourceUrl: string): MigrationRisk[] {
  const risks = new Set<MigrationRisk>();
  if (!title) risks.add("missing-title");
  if (!slug) risks.add("missing-slug");
  if (ACTIVE_CONTENT.test(html)) risks.add("active-content");
  if (SPAM_CONTENT.test(`${title} ${html}`)) risks.add("suspected-spam");
  if (sourceUrl && !/^https?:\/\/(?:www\.)?alanafc\.gr(?:\/|$)/i.test(sourceUrl)) risks.add("foreign-canonical");
  return [...risks].sort();
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isoDate(value: string): string | null {
  if (!value || value.startsWith("0000-00-00")) return null;
  const date = new Date(value.endsWith("Z") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function parseMigrationSource(xml: string): ParsedMigrationSource {
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: false, parseTagValue: false, trimValues: false }).parse(xml) as Record<string, unknown>;
  const channel = recordOf(recordOf(parsed.rss)?.channel);
  if (!channel) throw new Error("The source is not a readable WordPress WXR export.");

  const contents: MigratableContent[] = [];
  const media: MigratableMedia[] = [];
  const forms: LegacyFormReference[] = [];

  for (const rawItem of arrayOf(channel.item)) {
    const item = recordOf(rawItem);
    if (!item) continue;
    const externalId = textOf(item["wp:post_id"]).trim();
    const postType = textOf(item["wp:post_type"]).trim();
    const sourceStatus = textOf(item["wp:status"]).trim();
    if (!externalId || !postType || !sourceStatus) continue;
    const title = normalizeGreekTitleConjunctions(decodedText(item.title));
    const sourceUrl = textOf(item.link).trim();
    const originalHtml = textOf(item["content:encoded"]);
    const meta = metaMap(item);

    if (postType === "page" || postType === "post") {
      const rawSlug = textOf(item["wp:post_name"]).trim();
      const slug = normalizedSlug(rawSlug, `${postType}-${externalId}`);
      const bodyHtml = sanitizeMigratedHtml(originalHtml);
      const excerpt = decodedText(item["excerpt:encoded"]);
      const taxonomies = arrayOf(item.category).map((raw): MigrationTaxonomy | null => {
        const category = recordOf(raw);
        const taxonomy = textOf(category?.["@_domain"]).trim();
        const name = decodedText(raw);
        if (!taxonomy || !name) return null;
        return { taxonomy, slug: normalizedSlug(textOf(category?.["@_nicename"]), name), name };
      }).filter((value): value is MigrationTaxonomy => value !== null);
      const risks = risksFor(title, rawSlug, originalHtml, sourceUrl);
      const payload = { externalId, postType, slug, title, excerpt, bodyHtml, sourceStatus, sourceUrl, taxonomies };
      contents.push({
        externalId, kind: postType, slug, title, excerpt, bodyHtml,
        authorName: decodedText(item["dc:creator"]), sourceStatus, sourceUrl,
        checksum: hash(payload), featuredMediaExternalId: meta.get("_thumbnail_id") || null,
        seoTitle: meta.get("_yoast_wpseo_title") || meta.get("rank_math_title") || null,
        seoDescription: meta.get("_yoast_wpseo_metadesc") || meta.get("rank_math_description") || null,
        publishedAt: isoDate(textOf(item["wp:post_date_gmt"]).trim() || textOf(item.pubDate).trim()),
        taxonomies, risks,
      });
      continue;
    }

    if (postType === "attachment") {
      const attachmentUrl = textOf(item["wp:attachment_url"]).trim();
      const filename = (() => { try { return decodeURIComponent(basename(new URL(attachmentUrl).pathname)); } catch { return basename(attachmentUrl); } })();
      const risks = risksFor(title || filename, filename, originalHtml, sourceUrl);
      media.push({ externalId, parentExternalId: textOf(item["wp:post_parent"]).trim() || null, filename, sourceUrl: attachmentUrl, title, altText: meta.get("_wp_attachment_image_alt") || "",
        caption: decodedText(item["excerpt:encoded"]),
        credit: meta.get("_media_credit") || meta.get("media_credit") || null,
        checksum: hash({ externalId, filename, attachmentUrl, title, meta: [...meta] }), risks });
      continue;
    }

    if (postType === "wpcf7_contact_form") {
      forms.push({ externalId, title, sourceStatus, checksum: hash({ externalId, title, sourceStatus, originalHtml, meta: [...meta] }) });
    }
  }

  return {
    source: { title: decodedText(channel.title), siteUrl: textOf(channel["wp:base_site_url"]).trim(), language: textOf(channel.language).trim() },
    contents, media, forms,
  };
}

export function deduplicateByExternalId<T extends { externalId: string; checksum: string; risks: MigrationRisk[] }>(items: T[]) {
  const unique = new Map<string, T>();
  const duplicateIds = new Set<string>();
  const conflictingIds = new Set<string>();
  for (const item of items) {
    const current = unique.get(item.externalId);
    if (!current) { unique.set(item.externalId, item); continue; }
    duplicateIds.add(item.externalId);
    if (current.checksum !== item.checksum) {
      conflictingIds.add(item.externalId);
      unique.set(item.externalId, { ...current, risks: [...new Set([...current.risks, "duplicate-conflict" as const])].sort() });
    }
  }
  return { items: [...unique.values()], duplicateIds: [...duplicateIds].sort(), conflictingIds: [...conflictingIds].sort() };
}
