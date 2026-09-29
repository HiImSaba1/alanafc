import Image from "next/image";
import Link from "next/link";
import { Download, ImageOff } from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteMediaButton } from "@/components/admin/delete-media-button";
import { requireAdmin } from "@/features/admin-auth/session";
import { replaceMediaFileAction, updateMediaMetadataAction } from "@/features/content/media-actions";
import { adminMediaById, preferredMediaUrl } from "@/features/content/queries";

export const dynamic = "force-dynamic";

type Derivative = { width?: number; publicPath?: string; byteSize?: number };

function fileSize(value?: number | null) {
  if (!value) return "Άγνωστο μέγεθος";
  return value >= 1024 * 1024
    ? `${(value / 1024 / 1024).toFixed(2)} MB`
    : `${Math.max(1, Math.round(value / 1024))} KB`;
}

export default async function AdminMediaDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ replaced?: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { replaced } = await searchParams;
  const item = await adminMediaById(Number(id));
  if (!item) notFound();
  const src = preferredMediaUrl(item);
  const derivatives = Array.isArray(item.derivativeManifest)
    ? (item.derivativeManifest as Derivative[]).filter(
        (entry): entry is Required<Pick<Derivative, "publicPath">> & Derivative =>
          typeof entry.publicPath === "string" && entry.publicPath.startsWith("/"),
      )
    : [];

  return <main className="admin-media admin-media-detail">
    <header>
      <div><p className="eyebrow">ALANA FC · MEDIA #{item.id}</p><h1>{item.altText || item.filename}</h1><span>{item.status} · {item.mimeType || "Άγνωστος τύπος"}</span></div>
      <Link href="/admin/media">Πίσω στη βιβλιοθήκη</Link>
    </header>
    {replaced === "1" ? <p className="admin-media__success" role="status">Το αρχείο αντικαταστάθηκε και δημιουργήθηκαν νέα βελτιστοποιημένα WebP μεγέθη.</p> : null}
    <section className="admin-media-detail__layout">
      <div className="admin-media-detail__visual">
        <div className="admin-media-detail__preview">{src ? <Image src={src} alt={item.altText || "Προεπισκόπηση media"} fill priority sizes="(max-width: 900px) 100vw, 62vw" /> : <span><ImageOff aria-hidden="true" />Δεν υπάρχει διαθέσιμο αρχείο</span>}</div>
        <dl className="admin-media-detail__facts">
          <div><dt>Αρχείο</dt><dd>{item.filename}</dd></div>
          <div><dt>Διαστάσεις</dt><dd>{item.width && item.height ? `${item.width} × ${item.height}px` : "Άγνωστες"}</dd></div>
          <div><dt>Μέγεθος</dt><dd>{fileSize(item.byteSize)}</dd></div>
          <div><dt>External ID</dt><dd>{item.externalId}</dd></div>
        </dl>
      </div>
      <aside className="admin-media-detail__sidebar">
        <section><div className="admin-media-detail__section-heading"><div><p className="eyebrow">SEO METADATA</p><span className="admin-media-detail__section-title">Περιγραφή εικόνας</span></div><p>Βελτιώστε την προσβασιμότητα και την εμφάνιση της εικόνας στις μηχανές αναζήτησης.</p></div><form action={updateMediaMetadataAction}><input type="hidden" name="id" value={item.id} /><label>Alt text<input name="altText" defaultValue={item.altText || ""} required minLength={3} maxLength={500} lang="el" spellCheck /></label><label>Λεζάντα<textarea name="caption" defaultValue={item.caption || ""} rows={4} maxLength={1000} lang="el" spellCheck /></label><label>Credit<input name="credit" defaultValue={item.credit || ""} maxLength={255} lang="el" spellCheck /></label><button type="submit">Αποθήκευση metadata</button></form></section>
        <section><div className="admin-media-detail__section-heading"><div><p className="eyebrow">ΧΡΗΣΗ</p><span className="admin-media-detail__section-title">{item.usedBy.length ? `Χρησιμοποιείται σε ${item.usedBy.length}` : "Δεν χρησιμοποιείται"}</span></div><p>{item.usedBy.length ? "Σελίδες και άρθρα που συνδέονται με αυτό το αρχείο." : "Το αρχείο δεν είναι συνδεδεμένο με δημοσιευμένο ή πρόχειρο περιεχόμενο. Μπορεί να διαγραφεί χωρίς να αφήσει κενό σε άρθρο ή σελίδα."}</p></div>{item.usedBy.length ? <ul>{item.usedBy.map((entry) => <li key={entry.id}><Link href={`/admin/content/${entry.id}`}>{entry.title}</Link></li>)}</ul> : null}</section>
        {admin.role === "owner" ? <DeleteMediaButton id={item.id} label={item.altText || item.filename} disabled={item.usedBy.length > 0} /> : <p className="admin-media__protected">Η οριστική διαγραφή απαιτεί λογαριασμό ιδιοκτήτη.</p>}
      </aside>
    </section>
    {admin.role === "owner" && item.externalId.startsWith("native-media-") ? <details className="admin-media-replace"><summary>Αντικατάσταση αρχείου</summary><form action={replaceMediaFileAction}><input type="hidden" name="id" value={item.id} /><label>Νέα εικόνα<input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif,image/tiff" required /><small>Το media ID και όλες οι συνδέσεις με άρθρα διατηρούνται. Τα προηγούμενα WebP διαγράφονται μόνο μετά την επιτυχημένη αντικατάσταση.</small></label><button type="submit">Αντικατάσταση και βελτιστοποίηση</button></form></details> : null}
    <section className="admin-media-detail__variants"><header><div><p className="eyebrow">ΠΑΡΑΓΟΜΕΝΑ ΑΡΧΕΙΑ</p><h2>WebP μεγέθη</h2></div><span>{derivatives.length} εκδόσεις</span></header>{derivatives.length ? <div>{derivatives.map((entry) => <a key={entry.publicPath} href={entry.publicPath} download><span><strong>{entry.width ? `${entry.width}px` : "WebP"}</strong><small>{entry.publicPath.split("/").pop()} · {fileSize(entry.byteSize)}</small></span><Download aria-hidden="true" /></a>)}</div> : <p>Δεν υπάρχουν τοπικά SEO derivatives για αυτό το legacy αρχείο.</p>}</section>
  </main>;
}
