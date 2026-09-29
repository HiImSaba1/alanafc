import sanitizeHtml from "sanitize-html";

const GREEK_TO_LATIN: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m",
  ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
};

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const shortened = value.slice(0, max - 1).replace(/\s+\S*$/, "").trim();
  return `${shortened || value.slice(0, max - 1).trim()}…`;
}

export function seoSlug(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("el-GR")
    .split("").map((character) => GREEK_TO_LATIN[character] ?? character).join("")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/_{2,}/g, "_") || "academy";
}

export function buildContentSeo(input: {
  title: string;
  excerpt?: string | null;
  bodyHtml?: string | null;
  explicitTitle?: string | null;
  explicitDescription?: string | null;
}) {
  const title = compact(input.explicitTitle || `${input.title} | Alana FC Academy`);
  const plainBody = compact(sanitizeHtml(input.bodyHtml || "", { allowedTags: [] }));
  const descriptionSource = compact(input.explicitDescription || input.excerpt || plainBody || `Νέα και πληροφορίες από την Alana FC Academy.`);
  return {
    title: truncate(title, 60),
    description: truncate(descriptionSource, 155),
    imageName: seoSlug(input.title),
  };
}

export function buildSeoImageFilename(input: { seoName: string; imageNumber: string | number; width: number }): string {
  return `alanafc_${seoSlug(input.seoName)}_img_${input.imageNumber}_${input.width}w.webp`;
}
