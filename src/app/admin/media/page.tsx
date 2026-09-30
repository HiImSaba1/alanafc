import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Eye, FileSearch2, FileText, ImageOff, Pencil, Search, Trash2 } from "lucide-react";
import { DeleteMediaButton } from "@/components/admin/delete-media-button";
import { BulkDeleteMediaForm } from "@/components/admin/bulk-delete-media-form";
import { requireAdmin } from "@/features/admin-auth/session";
import { updateMediaMetadataAction, uploadDocumentAction, uploadMediaAction } from "@/features/content/media-actions";
import { adminMediaCatalog, adminMediaHealthSummary, preferredMediaUrl } from "@/features/content/queries";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 24;
const statuses = new Set(["ready", "missing", "quarantined"]);
const usageFilters = new Set(["used", "unused"]);
const seoFilters = new Set(["complete", "missing"]);

function pageHref(query: string, status: string | undefined, usage: string | undefined, seo: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status) params.set("status", status);
  if (usage) params.set("usage", usage);
  if (seo) params.set("seo", seo);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/admin/media?${value}` : "/admin/media";
}

function readableImageName(filename: string) {
  const withoutExtension = filename.replace(/\.[a-z0-9]+$/i, "");
  const withoutGeneratedParts = withoutExtension
    .replace(/^alanafc[_-]+/i, "")
    .replace(/[_-]+img[_-]+[a-f0-9-]+(?:[_-]+\d+w)?$/i, "")
    .replace(/[_-]+\d+w$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return withoutGeneratedParts.length >= 3 ? withoutGeneratedParts : "Ποδόσφαιρο και προπόνηση";
}

function suggestedImageMetadata(item: { filename: string; altText: string | null; caption: string | null; credit: string | null; usedBy: Array<{ title: string }> }) {
  const context = item.usedBy[0]?.title?.trim();
  const subject = context || readableImageName(item.filename);
  return {
    altText: item.altText?.trim() || `${subject} — Alana FC Academy`,
    caption: item.caption?.trim() || (context ? `Εικόνα από το άρθρο «${context}».` : `Στιγμιότυπο από την Alana FC Academy.`),
    credit: item.credit?.trim() || "Alana FC Academy",
  };
}

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  const values = await searchParams;
  const uploaded = values.uploaded === "1";
  const uploadedDocument = values.uploaded === "document";
  const bulkDeleted = values.deleted === "bulk";
  const query = typeof values.q === "string" ? values.q.trim().slice(0, 100) : "";
  const rawStatus = typeof values.status === "string" ? values.status : "";
  const status = statuses.has(rawStatus) ? rawStatus as "ready" | "missing" | "quarantined" : undefined;
  const rawUsage = typeof values.usage === "string" ? values.usage : "";
  const usage = usageFilters.has(rawUsage) ? rawUsage as "used" | "unused" : undefined;
  const rawSeo = typeof values.seo === "string" ? values.seo : "";
  const seo = seoFilters.has(rawSeo) ? rawSeo as "complete" | "missing" : undefined;
  const requestedPage = typeof values.page === "string" ? Number(values.page) : 1;
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [{ items, total }, health] = await Promise.all([
    adminMediaCatalog({ ...(query ? { query } : {}), ...(status ? { status } : {}), ...(usage ? { usage } : {}), ...(seo ? { seo } : {}), limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    adminMediaHealthSummary(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pages);

  return <main className="admin-media">
    <header><div><p className="eyebrow">ALANA FC · MEDIA</p><h1>Βιβλιοθήκη media</h1><span>{total} αρχεία</span></div><Link href="/admin">Πίσω</Link></header>
    <nav className="admin-media__health" aria-label="Σύνοψη κατάστασης media"><Link href="/admin/media"><span>Σύνολο</span><strong>{health.total}</strong></Link><Link href="/admin/media?usage=used"><span>Σε χρήση</span><strong>{health.used}</strong></Link><Link href="/admin/media?usage=unused"><span>Για καθαρισμό</span><strong>{health.unused}</strong></Link><Link href="/admin/media?seo=missing"><span>Χωρίς alt text</span><strong>{health.missingAlt}</strong></Link><Link href="/admin/media?status=missing"><span>Μη διαθέσιμα</span><strong>{health.unavailable}</strong></Link><Link href="/admin/media/duplicates"><span>Διπλότυπες ομάδες</span><strong>{health.duplicateGroups}</strong></Link></nav>
    {uploaded ? <p className="admin-media__success" role="status">Η εικόνα ανέβηκε και δημιουργήθηκαν τα SEO WebP μεγέθη.</p> : null}
    {uploadedDocument ? <p className="admin-media__success" role="status">Το PDF ανέβηκε με ασφαλές όνομα και είναι διαθέσιμο στα Χρήσιμα Έγγραφα.</p> : null}
    {bulkDeleted ? <p className="admin-media__success" role="status">Τα επιλεγμένα media διαγράφηκαν οριστικά.</p> : null}
    <details className="admin-media-upload"><summary>+ Νέα εικόνα</summary><form action={uploadMediaAction}><label className="admin-media-upload__file">Αρχείο εικόνας<input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif,image/tiff" required /><small>Προτεινόμενο μέγεθος 250–300 KB για γρήγορη φόρτωση. Επιτρέπονται JPEG, PNG, WebP, AVIF ή TIFF έως 12 MB και το σύστημα δημιουργεί βελτιστοποιημένα WebP.</small></label><label>Alt text<input name="altText" required minLength={3} maxLength={500} lang="el" spellCheck placeholder="Περιγράψτε τι εμφανίζεται στην εικόνα" /></label><label>Λεζάντα<textarea name="caption" rows={3} maxLength={1000} lang="el" spellCheck /></label><label>Credit<input name="credit" maxLength={255} lang="el" spellCheck /></label><button type="submit">Μεταφόρτωση και βελτιστοποίηση</button></form></details>
    <details className="admin-media-upload"><summary>+ Νέο PDF</summary><form action={uploadDocumentAction}><label className="admin-media-upload__file">Αρχείο PDF<input type="file" name="document" accept="application/pdf,.pdf" required /><small>Μόνο έγκυρο PDF έως 10 MB. Το σύστημα ελέγχει την πραγματική υπογραφή του αρχείου.</small></label><label>Τίτλος εγγράφου<input name="title" required minLength={3} maxLength={191} lang="el" spellCheck /></label><label>Περιγραφή<textarea name="description" rows={3} maxLength={1000} lang="el" spellCheck /></label><button type="submit">Μεταφόρτωση PDF</button></form></details>
    <form className="admin-media__filters" action="/admin/media" method="get"><label><span>Αναζήτηση</span><div><Search aria-hidden="true" /><input type="search" name="q" defaultValue={query} placeholder="Όνομα, alt text ή λεζάντα" /></div></label><label><span>Κατάσταση</span><select name="status" defaultValue={status || ""}><option value="">Όλα τα media</option><option value="ready">Έτοιμα</option><option value="missing">Λείπουν</option><option value="quarantined">Σε καραντίνα</option></select></label><label><span>Χρήση</span><select name="usage" defaultValue={usage || ""}><option value="">Όλα</option><option value="unused">Δεν χρησιμοποιούνται</option><option value="used">Χρησιμοποιούνται</option></select></label><label><span>SEO περιγραφή</span><select name="seo" defaultValue={seo || ""}><option value="">Όλες</option><option value="missing">Χωρίς alt text</option><option value="complete">Με alt text</option></select></label><button type="submit">Εφαρμογή</button><Link href="/admin/media">Καθαρισμός</Link></form>
    {admin.role === "owner" && items.some((item) => item.usedBy.length === 0) ? <BulkDeleteMediaForm /> : null}
    <section className="admin-media__grid" aria-label="Αρχεία media">{items.map((item) => { const src = preferredMediaUrl(item); const isPdf = item.mimeType === "application/pdf"; const derivatives = Array.isArray(item.derivativeManifest) ? item.derivativeManifest as Array<{ publicPath?: string }> : []; const seoName = derivatives.find((entry) => entry.publicPath)?.publicPath?.split("/").pop(); const metadata = suggestedImageMetadata(item); return <article key={item.id}>
      <div className="admin-media__preview">{admin.role === "owner" ? <label className="admin-media__select"><input type="checkbox" name="mediaIds" value={item.id} form="bulk-media-delete" disabled={item.usedBy.length > 0} /><span className="sr-only">Επιλογή {item.altText || item.filename} για διαγραφή</span></label> : null}{isPdf && src ? <span><FileText aria-hidden="true" />Έγγραφο PDF</span> : src ? <Image src={src} alt={item.altText || "Προεπισκόπηση χωρίς alt text"} fill sizes="(max-width: 760px) 100vw, 33vw" /> : <span><ImageOff aria-hidden="true" />Δεν υπάρχει διαθέσιμο αρχείο</span>}<b className={`admin-media__status admin-media__status--${item.status}`}>{item.status}</b></div>
      <div className="admin-media__identity"><strong>{item.filename}</strong><span>{isPdf ? "PDF" : item.width && item.height ? `${item.width} × ${item.height}` : "Άγνωστες διαστάσεις"}{item.byteSize ? ` · ${(item.byteSize / 1024 / 1024).toFixed(2)} MB` : ""}</span><small>{isPdf ? "Ασφαλές έγγραφο βιβλιοθήκης" : seoName ? `SEO: ${seoName}` : "Δεν έχει παραχθεί SEO derivative"}</small><div className="admin-media__usage"><b>{item.usedBy.length ? `Χρησιμοποιείται σε ${item.usedBy.length}` : "Δεν χρησιμοποιείται"}</b>{item.usedBy.slice(0, 3).map((entry) => entry.id > 0 ? <Link key={`${entry.id}-${entry.title}`} href={`/admin/content/${entry.id}`}>{entry.title}</Link> : <span key={entry.title}>{entry.title}</span>)}</div></div>
      <div className="admin-media__card-actions">
        {src ? <a href={src} target="_blank" rel="noreferrer" aria-label={`Προβολή αρχείου: ${item.altText || item.filename}`} title="Προβολή αρχείου"><Eye aria-hidden="true" /></a> : <button type="button" disabled aria-label="Το αρχείο δεν είναι διαθέσιμο" title="Το αρχείο δεν είναι διαθέσιμο"><Eye aria-hidden="true" /></button>}
        <Link href={`/admin/media/${item.id}`} aria-label={`Επεξεργασία media: ${item.altText || item.filename}`} title="Επεξεργασία media"><Pencil aria-hidden="true" /></Link>
        {admin.role === "owner" ? <DeleteMediaButton id={item.id} label={item.altText || item.filename} disabled={item.usedBy.length > 0} iconOnly /> : <button type="button" disabled aria-label="Μόνο ο ιδιοκτήτης μπορεί να διαγράψει media" title="Απαιτείται λογαριασμός ιδιοκτήτη"><Trash2 aria-hidden="true" /></button>}
      </div>
      <details className="admin-media__seo">
        <summary aria-label={`SEO metadata για ${item.altText || item.filename}`} title="Άνοιγμα SEO metadata"><span><FileSearch2 aria-hidden="true" /><span className="sr-only">SEO metadata</span></span><ChevronDown aria-hidden="true" /></summary>
        <form action={updateMediaMetadataAction}><input type="hidden" name="id" value={item.id} /><label>Alt text<input name="altText" defaultValue={metadata.altText} required minLength={3} maxLength={500} lang="el" spellCheck /></label><label>Λεζάντα<textarea name="caption" defaultValue={metadata.caption} rows={3} maxLength={1000} lang="el" spellCheck /></label><label>Credit<input name="credit" defaultValue={metadata.credit} maxLength={255} lang="el" spellCheck /></label><small>Οι κενές τιμές συμπληρώθηκαν αυτόματα. Ελέγξτε την περιγραφή πριν την αποθήκευση.</small><button type="submit">Αποθήκευση SEO</button></form>
      </details>
    </article>; })}</section>
    {!items.length ? <div className="admin-content-empty"><strong>Δεν βρέθηκαν media.</strong><p>Δοκιμάστε διαφορετική αναζήτηση ή κατάσταση.</p></div> : null}
    {pages > 1 ? <nav className="admin-content-pagination" aria-label="Σελιδοποίηση media"><Link href={pageHref(query, status, usage, seo, Math.max(1, safePage - 1))} aria-disabled={safePage === 1}>← Προηγούμενα</Link><span>Σελίδα {safePage} από {pages}</span><Link href={pageHref(query, status, usage, seo, Math.min(pages, safePage + 1))} aria-disabled={safePage === pages}>Επόμενα →</Link></nav> : null}
  </main>;
}
