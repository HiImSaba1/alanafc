import { and, desc, eq, like, or, sql } from "drizzle-orm";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/features/admin-auth/session";
import { db } from "@/lib/db";
import { academyRegistrations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;
const statuses = new Set(["new", "contacted", "completed", "archived"]);
const statusLabels = { new: "Νέα", contacted: "Έγινε επικοινωνία", completed: "Ολοκληρωμένη", archived: "Αρχειοθετημένη" } as const;

function pageHref(query: string, status: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/admin/registrations?${value}` : "/admin/registrations";
}

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  const values = await searchParams;
  const query = typeof values.q === "string" ? values.q.trim().slice(0, 100) : "";
  const rawStatus = typeof values.status === "string" ? values.status : "";
  const status = statuses.has(rawStatus) ? rawStatus as keyof typeof statusLabels : undefined;
  const requestedPage = typeof values.page === "string" ? Number(values.page) : 1;
  const conditions = [];
  if (query) conditions.push(or(like(academyRegistrations.reference, `%${query}%`), like(academyRegistrations.childName, `%${query}%`), like(academyRegistrations.guardianName, `%${query}%`), like(academyRegistrations.guardianEmail, `%${query}%`), like(academyRegistrations.guardianPhone, `%${query}%`))!);
  if (status) conditions.push(eq(academyRegistrations.status, status));
  const where = conditions.length ? and(...conditions) : undefined;
  const totals = await db.select({ total: sql<number>`COUNT(*)` }).from(academyRegistrations).where(where);
  const total = Number(totals[0]?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1, pages);
  const registrations = await db.select().from(academyRegistrations).where(where).orderBy(desc(academyRegistrations.submittedAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
  return <main className="admin-content"><header><div><p className="eyebrow">ALANA FC · ΔΙΑΧΕΙΡΙΣΗ</p><h1>Εγγραφές 2026–2027</h1><p>{total} εκδηλώσεις ενδιαφέροντος</p></div><div className="admin-content__header-actions">{admin.role === "owner" ? <a href="/api/admin/exports/registrations" download>Εξαγωγή CSV</a> : null}<Link href="/admin">Πίσω</Link></div></header>
    <form className="admin-private-list-filters" action="/admin/registrations" method="get"><label><span>Αναζήτηση</span><div><Search aria-hidden="true" /><input type="search" name="q" defaultValue={query} placeholder="Παιδί, κηδεμόνας, email ή κωδικός" /></div></label><label><span>Κατάσταση</span><select name="status" defaultValue={status || ""}><option value="">Όλες</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button type="submit">Εφαρμογή</button><Link href="/admin/registrations">Καθαρισμός</Link></form>
    <div className="admin-content__table admin-registrations"><div className="admin-content__row is-heading"><span>Παιδί / Κηδεμόνας</span><span>Τμήμα</span><span>Κατάσταση</span><span>Υποβολή</span></div>{registrations.length ? registrations.map((item) => <Link className="admin-content__row" href={`/admin/registrations/${item.id}`} key={item.id}><span><strong>{item.childName}</strong><small>{item.guardianName} · {item.reference}</small></span><span>{item.preferredGroup}</span><span><b className={`admin-status admin-status--${item.status}`}>{statusLabels[item.status]}</b>{item.emailStatus === "failed" ? <small className="admin-email-failed">Email σε αναμονή</small> : null}</span><span>{new Intl.DateTimeFormat("el-GR", { dateStyle: "short", timeStyle: "short" }).format(item.submittedAt)}</span></Link>) : <p className="admin-empty">Δεν βρέθηκαν εγγραφές με αυτά τα φίλτρα.</p>}</div>
    {pages > 1 ? <nav className="admin-content-pagination" aria-label="Σελιδοποίηση εγγραφών"><Link href={pageHref(query, status, Math.max(1, page - 1))} aria-disabled={page === 1}>← Προηγούμενες</Link><span>Σελίδα {page} από {pages}</span><Link href={pageHref(query, status, Math.min(pages, page + 1))} aria-disabled={page === pages}>Επόμενες →</Link></nav> : null}
  </main>;
}
