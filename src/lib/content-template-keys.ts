export const articleTemplateKeys = ["longform", "gallery", "interview", "cinematic", "sidebar"] as const;
export type ArticleTemplateKey = (typeof articleTemplateKeys)[number];
