import type { Metadata } from "next";
import { EditorialButton } from "@/components/ui/editorial-button";
import { LegalPage } from "@/components/layout/legal-page";
import { preferredMediaUrl, publicDocumentsByExternalIds } from "@/features/content/queries";
import { publicPageMetadata } from "@/features/seo/public-metadata";
import { getDocumentSettings } from "@/features/site-settings/document-settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = publicPageMetadata({ title: "Χρήσιμα έγγραφα", description: "Έντυπα και χρήσιμα έγγραφα της Alana FC Academy για αθλητές και οικογένειες.", path: "/useful-documents" });

export default async function UsefulDocumentsPage() {
  const settings = await getDocumentSettings();
  const enabled = settings.documents.filter((item) => item.enabled);
  const assets = await publicDocumentsByExternalIds(enabled.map((item) => item.mediaExternalId));
  const byExternalId = new Map(assets.map((asset) => [asset.externalId, asset]));
  const documents = enabled.flatMap((item) => {
    const asset = byExternalId.get(item.mediaExternalId);
    const href = preferredMediaUrl(asset ?? null);
    return href ? [{ ...item, href }] : [];
  });

  return <LegalPage eyebrow={settings.eyebrow} title={settings.title}>
    <section data-reveal-item><p>{settings.intro}</p></section>
    {documents.map((document) => <section key={document.id} data-reveal-item>
      <h2>{document.title}</h2>
      {document.description ? <p>{document.description}</p> : null}
      <EditorialButton href={document.href} target="_blank" rel="noreferrer" label={document.buttonLabel} variant="outline" />
    </section>)}
    {!documents.length ? <section data-reveal-item><h2>Δεν υπάρχουν διαθέσιμα έγγραφα.</h2><p>Η ενότητα θα ενημερωθεί σύντομα από την Ακαδημία.</p></section> : null}
  </LegalPage>;
}
