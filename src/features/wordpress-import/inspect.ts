import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const wordpressItemSchema = z.object({
  title: z.unknown().optional(),
  link: z.unknown().optional(),
  pubDate: z.unknown().optional(),
  "dc:creator": z.unknown().optional(),
  "content:encoded": z.unknown().optional(),
  "excerpt:encoded": z.unknown().optional(),
  "wp:post_id": z.unknown(),
  "wp:post_date_gmt": z.unknown().optional(),
  "wp:post_name": z.unknown().optional(),
  "wp:post_parent": z.unknown().optional(),
  "wp:status": z.unknown(),
  "wp:post_type": z.unknown(),
  "wp:attachment_url": z.unknown().optional(),
  "wp:postmeta": z.unknown().optional(),
}).passthrough();

const ACTIVE_CONTENT_PATTERN = /<script\b|javascript\s*:|<iframe\b|\son(?:error|load|click)\s*=/i;
const SUSPICIOUS_CONTENT_PATTERN = /casino|betting|bonus|withdrawal|escort|porn|viagra|onlyfans|crypto\s*casino/i;

export type WordPressRiskFlag = "active-content" | "foreign-canonical" | "missing-title" | "suspected-spam";
export type InspectedWordPressItem = {
  externalId: string;
  postType: string;
  status: string;
  title: string;
  slug: string;
  sourceUrl: string;
  attachmentUrl: string | null;
  parentExternalId: string | null;
  featuredMediaExternalId: string | null;
  checksumSha256: string;
  riskFlags: WordPressRiskFlag[];
};
export type WordPressInspection = {
  source: { title: string; siteUrl: string; wxrVersion: string; language: string };
  totals: {
    items: number;
    clean: number;
    quarantined: number;
    byPostType: Record<string, number>;
    byStatus: Record<string, number>;
    attachmentsWithRemoteUrl: number;
  };
  items: InspectedWordPressItem[];
};

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function textOf(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  const record = recordOf(value);
  return record ? textOf(record["#text"]) : "";
}

function sanitizeLegacyHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["figure", "figcaption", "img", "picture", "source"]),
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "srcset", "sizes", "alt", "width", "height", "loading"],
      source: ["src", "srcset", "sizes", "type", "media"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    disallowedTagsMode: "discard",
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true) },
  });
}

function riskFlagsFor(input: { title: string; html: string; sourceUrl: string }): WordPressRiskFlag[] {
  const flags = new Set<WordPressRiskFlag>();
  if (!input.title.trim()) flags.add("missing-title");
  if (ACTIVE_CONTENT_PATTERN.test(input.html)) flags.add("active-content");
  if (SUSPICIOUS_CONTENT_PATTERN.test(`${input.title} ${input.html}`)) flags.add("suspected-spam");
  if (input.sourceUrl && !/^https?:\/\/(?:www\.)?alanafc\.gr(?:\/|$)/i.test(input.sourceUrl)) {
    flags.add("foreign-canonical");
  }
  return [...flags].sort();
}

function increment(counter: Record<string, number>, key: string): void {
  counter[key || "unknown"] = (counter[key || "unknown"] ?? 0) + 1;
}

export function inspectWordPressExport(xml: string): WordPressInspection {
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: false, parseTagValue: false, trimValues: false })
    .parse(xml) as Record<string, unknown>;
  const channel = recordOf(recordOf(parsed.rss)?.channel);
  if (!channel) throw new Error("The source is not a readable WordPress WXR export.");

  const items: InspectedWordPressItem[] = [];
  for (const rawItem of asArray(channel.item)) {
    const parsedItem = wordpressItemSchema.safeParse(rawItem);
    if (!parsedItem.success) continue;
    const raw = parsedItem.data;
    const externalId = textOf(raw["wp:post_id"]).trim();
    const postType = textOf(raw["wp:post_type"]).trim();
    const status = textOf(raw["wp:status"]).trim();
    if (!externalId || !postType || !status) continue;

    const title = textOf(raw.title).trim();
    const sourceUrl = textOf(raw.link).trim();
    const originalHtml = textOf(raw["content:encoded"]);
    const featuredMeta = asArray(raw["wp:postmeta"]).map(recordOf)
      .find((meta) => textOf(meta?.["wp:meta_key"]) === "_thumbnail_id");
    const checksumInput = {
      externalId,
      postType,
      status,
      title,
      slug: textOf(raw["wp:post_name"]).trim(),
      sourceUrl,
      creator: textOf(raw["dc:creator"]).trim(),
      publishedAt: textOf(raw["wp:post_date_gmt"]).trim() || textOf(raw.pubDate).trim(),
      originalHtml,
      excerpt: textOf(raw["excerpt:encoded"]),
      sanitizedHtml: sanitizeLegacyHtml(originalHtml),
    };

    items.push({
      externalId,
      postType,
      status,
      title,
      slug: checksumInput.slug,
      sourceUrl,
      attachmentUrl: textOf(raw["wp:attachment_url"]).trim() || null,
      parentExternalId: textOf(raw["wp:post_parent"]).trim() || null,
      featuredMediaExternalId: featuredMeta ? textOf(featuredMeta["wp:meta_value"]).trim() || null : null,
      checksumSha256: createHash("sha256").update(JSON.stringify(checksumInput)).digest("hex"),
      riskFlags: riskFlagsFor({ title, html: originalHtml, sourceUrl }),
    });
  }

  const byPostType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const item of items) {
    increment(byPostType, item.postType);
    increment(byStatus, item.status);
  }
  const quarantined = items.filter((item) => item.riskFlags.length > 0).length;
  return {
    source: {
      title: textOf(channel.title).trim(),
      siteUrl: textOf(channel["wp:base_site_url"]).trim(),
      wxrVersion: textOf(channel["wp:wxr_version"]).trim(),
      language: textOf(channel.language).trim(),
    },
    totals: {
      items: items.length,
      clean: items.length - quarantined,
      quarantined,
      byPostType,
      byStatus,
      attachmentsWithRemoteUrl: items.filter((item) => item.postType === "attachment" && item.attachmentUrl).length,
    },
    items,
  };
}

export function safeQuarantineItems(inspection: WordPressInspection) {
  return inspection.items.filter((item) => item.riskFlags.length > 0).map((item) => ({
    externalId: item.externalId,
    postType: item.postType,
    status: item.status,
    title: item.title,
    sourceUrl: item.sourceUrl,
    riskFlags: item.riskFlags,
  }));
}
