import { articleTemplateKeys, type ArticleTemplateKey } from "@/lib/content-template-keys";
export type { ArticleTemplateKey } from "@/lib/content-template-keys";

export const articleTemplateCatalog: Record<ArticleTemplateKey, { label: string; description: string; visual: string }> = {
  longform: { label: "Εκτενές άρθρο", description: "Ανάλυση, άποψη και μεγάλης διάρκειας αφήγηση.", visual: "essay" },
  gallery: { label: "Φωτογραφική ιστορία", description: "Εικόνες, λεζάντες και οπτική αφήγηση.", visual: "gallery" },
  interview: { label: "Συνέντευξη", description: "Ερωτήσεις, απαντήσεις και ανθρώπινες ιστορίες.", visual: "interview" },
  cinematic: { label: "Κινηματογραφικό", description: "Μεγάλη εικόνα και διαδοχικά αφηγηματικά κεφάλαια.", visual: "cinematic" },
  sidebar: { label: "Εφημερίδα με sidebar", description: "Καθαρό άρθρο με σταθερή στήλη σχετικών πληροφοριών.", visual: "sidebar" },
};

export function isArticleTemplateKey(value: unknown): value is ArticleTemplateKey {
  return typeof value === "string" && articleTemplateKeys.includes(value as ArticleTemplateKey);
}
