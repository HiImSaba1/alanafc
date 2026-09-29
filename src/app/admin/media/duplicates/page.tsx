import Image from "next/image";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { requireAdmin } from "@/features/admin-auth/session";
import { adminDuplicateMediaGroups, preferredMediaUrl } from "@/features/content/queries";

export const dynamic = "force-dynamic";

export default async function DuplicateMediaPage() {
  await requireAdmin();
  const groups = await adminDuplicateMediaGroups();
  return <main className="admin-media admin-media-duplicates">
    <header><div><p className="eyebrow">ALANA FC · MEDIA</p><h1>Έλεγχος διπλότυπων</h1><span>{groups.length} ομάδες με ίδιο SHA-256</span></div><Link href="/admin/media">Πίσω στη βιβλιοθήκη</Link></header>
    <p className="admin-media-duplicates__notice">Τα αρχεία εμφανίζονται μόνο για έλεγχο. Εξετάστε τη χρήση κάθε αντιγράφου πριν από οποιαδήποτε διαγραφή.</p>
    {groups.map((group, index) => <section key={group.sha256} className="admin-media-duplicates__group"><header><div><span>Ομάδα {String(index + 1).padStart(2, "0")}</span><strong>{group.items.length} αντίγραφα</strong></div><code>{group.sha256}</code></header><div>{group.items.map((item) => { const src = preferredMediaUrl(item); return <article key={item.id} data-unused={item.usedBy.length === 0 || undefined}><div>{src ? <Image src={src} alt={item.altText || item.filename} fill sizes="(max-width: 680px) 100vw, 25vw" /> : <span>Δεν υπάρχει προεπισκόπηση</span>}<b className="admin-media-duplicates__usage">{item.usedBy.length ? `Σε χρήση · ${item.usedBy.length}` : "Υποψήφιο για καθαρισμό"}</b></div><strong>{item.filename}</strong><small>{item.width && item.height ? `${item.width} × ${item.height}` : "Άγνωστες διαστάσεις"}</small>{item.usedBy.length ? <ul>{item.usedBy.slice(0, 3).map((entry) => <li key={entry.id}><Link href={`/admin/content/${entry.id}`}>{entry.title}</Link></li>)}</ul> : <p>Δεν συνδέεται με άρθρο ή σελίδα.</p>}<nav aria-label={`Ενέργειες για ${item.filename}`}>{src ? <a href={src} target="_blank" rel="noreferrer"><Eye aria-hidden="true" />Προβολή</a> : null}<Link href={`/admin/media/${item.id}`}><Pencil aria-hidden="true" />{item.usedBy.length ? "Έλεγχος χρήσης" : "Έλεγχος πριν τη διαγραφή"}</Link></nav></article>; })}</div></section>)}
    {!groups.length ? <div className="admin-content-empty"><strong>Δεν βρέθηκαν διπλότυπα.</strong><p>Κανένα διαθέσιμο checksum δεν αντιστοιχεί σε περισσότερα από ένα media.</p></div> : null}
  </main>;
}
