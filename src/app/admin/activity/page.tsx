import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { adminAuditLog } from "@/features/admin-auth/audit-query";
import { requireAdmin } from "@/features/admin-auth/session";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 40;
const entityTypes = new Set(["admin_user", "content", "post", "page", "media", "academy_registration", "contact_message", "site_setting"]);

const actionLabels: Record<string, string> = {
  "admin.login.succeeded": "Επιτυχής σύνδεση διαχειριστή",
  "admin.login.rejected": "Αποτυχημένη σύνδεση",
  "admin.logout": "Αποσύνδεση διαχειριστή",
  "content.created": "Δημιουργία περιεχομένου",
  "content.updated": "Ενημέρωση περιεχομένου",
  "content.draft": "Αποθήκευση προσχεδίου",
  "content.published": "Δημοσίευση περιεχομένου",
  "content.scheduled": "Προγραμματισμός δημοσίευσης",
  "content.archived": "Αρχειοθέτηση περιεχομένου",
  "site.registration.updated": "Ενημέρωση σελίδας εγγραφών",
  "content.deleted": "Διαγραφή περιεχομένου",
  "content.revision_restored": "Επαναφορά έκδοσης",
  "media.uploaded": "Μεταφόρτωση media",
  "media.metadata_updated": "Ενημέρωση metadata",
  "media.file_replaced": "Αντικατάσταση αρχείου",
  "media.deleted": "Διαγραφή media",
  "registration.created": "Νέα εκδήλωση ενδιαφέροντος",
  "registration.status.updated": "Ενημέρωση κατάστασης εγγραφής",
  "registration.email.retried": "Επανάληψη email εγγραφής",
  "registration.email.failed": "Αποτυχία email εγγραφής",
  "registration.exported": "Εξαγωγή εγγραφών CSV",
  "registration.deleted": "Οριστική διαγραφή εγγραφής",
  "contact.created": "Νέο μήνυμα επικοινωνίας",
  "contact.status.updated": "Ενημέρωση μηνύματος",
  "contact.email.retried": "Επανάληψη email επικοινωνίας",
  "contact.email.failed": "Αποτυχία email επικοινωνίας",
  "contact.exported": "Εξαγωγή μηνυμάτων CSV",
  "contact.deleted": "Οριστική διαγραφή μηνύματος",
  "redirect.created": "Δημιουργία ανακατεύθυνσης",
  "redirect.deleted": "Διαγραφή ανακατεύθυνσης",
};

function pageHref(query: string, entityType: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (entityType) params.set("type", entityType);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/admin/activity?${value}` : "/admin/activity";
}

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") redirect("/admin");
  const values = await searchParams;
  const query = typeof values.q === "string" ? values.q.trim().slice(0, 100) : "";
  const rawType = typeof values.type === "string" ? values.type : "";
  const entityType = entityTypes.has(rawType) ? rawType : undefined;
  const rawPage = typeof values.page === "string" ? Number(values.page) : 1;
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const { items, total } = await adminAuditLog({ ...(query ? { query } : {}), ...(entityType ? { entityType } : {}), limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const date = new Intl.DateTimeFormat("el-GR", { dateStyle: "short", timeStyle: "medium" });

  return <main className="admin-content admin-activity">
    <header><div><p className="eyebrow">ALANA FC · ΑΣΦΑΛΕΙΑ</p><h1>Ιστορικό ενεργειών</h1><p>{total} καταγεγραμμένες ενέργειες</p></div><div className="admin-content__header-actions"><Link href="/admin">Πίσω</Link></div></header>
    <form className="admin-activity__filters" action="/admin/activity" method="get"><label><span>Αναζήτηση</span><div><Search aria-hidden="true" /><input type="search" name="q" defaultValue={query} placeholder="Ενέργεια, χρήστης ή ID" /></div></label><label><span>Τύπος</span><select name="type" defaultValue={entityType || ""}><option value="">Όλοι οι τύποι</option><option value="content">Περιεχόμενο</option><option value="post">Άρθρα</option><option value="page">Σελίδες</option><option value="media">Media</option><option value="academy_registration">Εγγραφές</option><option value="contact_message">Επικοινωνία</option><option value="admin_user">Διαχειριστές</option></select></label><button type="submit">Εφαρμογή</button><Link href="/admin/activity">Καθαρισμός</Link></form>
    <section className="admin-activity__list" aria-label="Καταγεγραμμένες ενέργειες">{items.map((item) => <article key={item.id}><time dateTime={item.createdAt.toISOString()}>{date.format(item.createdAt)}</time><div><strong>{actionLabels[item.action] || item.action}</strong><span>{item.actorName || "Σύστημα"}{item.actorUsername ? ` · ${item.actorUsername}` : ""}</span></div><div><span>{item.entityType || "system"}</span><strong>{item.entityId || "—"}</strong></div><code title={item.requestId}>{item.requestId.slice(0, 8)}</code></article>)}</section>
    {!items.length ? <div className="admin-content-empty"><strong>Δεν βρέθηκαν ενέργειες.</strong><p>Αλλάξτε τα φίλτρα αναζήτησης.</p></div> : null}
    {pages > 1 ? <nav className="admin-content-pagination" aria-label="Σελιδοποίηση ιστορικού"><Link href={pageHref(query, entityType, Math.max(1, safePage - 1))} aria-disabled={safePage === 1}>← Προηγούμενα</Link><span>Σελίδα {safePage} από {pages}</span><Link href={pageHref(query, entityType, Math.min(pages, safePage + 1))} aria-disabled={safePage === pages}>Επόμενα →</Link></nav> : null}
  </main>;
}
