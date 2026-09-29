import type { ReactNode } from "react";
import { AnimatedLines, StaggerReveal } from "@/components/motion";

export function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <main id="main-content" className="legal-page"><header><p className="eyebrow">{eyebrow}</p><AnimatedLines as="h1">{title}</AnimatedLines></header><div className="legal-page__layout"><aside><span>Πληροφορίες</span><small>ALANA FC · 2026</small></aside><StaggerReveal className="legal-page__body">{children}</StaggerReveal></div></main>;
}
