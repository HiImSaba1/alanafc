import { desc, like, or, sql } from "drizzle-orm";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { DeleteRedirectButton } from "@/components/admin/delete-redirect-button";
import { requireAdmin } from "@/features/admin-auth/session";
import { createManualRedirect } from "@/features/content/redirect-actions";
import { db } from "@/lib/db";
import { legacyRedirects } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 40;

function pageHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/admin/redirects?${value}` : "/admin/redirects";
}

export default async function AdminRedirectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") redirect("/admin");
  const values = await searchParams;
  const created = values.created === "1";
  const deleted = values.deleted === "1";
  const query = typeof values.q === "string" ? values.q.trim().slice(0, 150) : "";
  const requestedPage = typeof values.page === "string" ? Number(values.page) : 1;
  const where = query ? or(like(legacyRedirects.sourcePath, `%${query}%`), like(legacyRedirects.targetPath, `%${query}%`), like(legacyRedirects.sourceExternalId, `%${query}%`)) : undefined;
  const totals = await db.select({ total: sql<number>`COUNT(*)` }).from(legacyRedirects).where(where);
  const total = Number(totals[0]?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1, pages);
  const items = await db.select().from(legacyRedirects).where(where).orderBy(desc(legacyRedirects.createdAt), desc(legacyRedirects.id)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
  const date = new Intl.DateTimeFormat("el-GR", { dateStyle: "short", timeStyle: "short" });

  return <main className="admin-content admin-redirects">
    <header><div><p className="eyebrow">ALANA FC · SEO</p><h1>Ανακατευθύνσεις</h1><p>{total} μόνιμες διαδρομές</p></div><div className="admin-content__header-actions"><Link href="/admin">Πίσω</Link></div></header>
    {created || deleted ? <p className="admin-redirects__success" role="status">{created ? "Η ανακατεύθυνση δημιουργήθηκε." : "Η χειροκίνητη ανακατεύθυνση διαγράφηκε."}</p> : null}
    <details className="admin-redirects__create"><summary>+ Νέα χειροκίνητη ανακατεύθυνση</summary><form action={createManualRedirect}><label>Από<input name="sourcePath" required maxLength={240} placeholder="/palio-url" /></label><label>Προς<input name="targetPath" required maxLength={500} placeholder="/news/teliko-url" /></label><button type="submit">Δημιουργία 308</button></form><p>Μόνο εσωτερικές δημόσιες διαδρομές χωρίς domain, query ή anchor. Χρησιμοποιήστε πάντα τον τελικό προορισμό.</p></details>
    <form className="admin-redirects__filters" action="/admin/redirects" method="get"><label><span>Αναζήτηση URL ή external ID</span><div><Search aria-hidden="true" /><input type="search" name="q" defaultValue={query} placeholder="/news/palio-url" /></div></label><button type="submit">Αναζήτηση</button><Link href="/admin/redirects">Καθαρισμός</Link></form>
    <section className="admin-redirects__list" aria-label="Μόνιμες ανακατευθύνσεις">{items.map((item) => <article key={item.id}><div><span>Από</span><code>{item.sourcePath}</code></div><div><span>Προς</span><code>{item.targetPath}</code></div><div><strong>{item.statusCode}</strong><small>{item.sourceExternalId === "manual" ? "Χειροκίνητη" : item.sourceExternalId || "Χωρίς external ID"}</small><time dateTime={item.createdAt.toISOString()}>{date.format(item.createdAt)}</time></div><div className="admin-redirects__actions"><a href={item.targetPath} target="_blank" rel="noreferrer" aria-label={`Έλεγχος προορισμού ${item.targetPath}`} title="Άνοιγμα προορισμού"><ExternalLink aria-hidden="true" /></a>{item.sourceExternalId === "manual" ? <DeleteRedirectButton id={item.id} sourcePath={item.sourcePath} /> : null}</div></article>)}</section>
    {!items.length ? <div className="admin-content-empty"><strong>Δεν βρέθηκαν ανακατευθύνσεις.</strong><p>Δοκιμάστε διαφορετικό URL ή external ID.</p></div> : null}
    {pages > 1 ? <nav className="admin-content-pagination" aria-label="Σελιδοποίηση ανακατευθύνσεων"><Link href={pageHref(query, Math.max(1, page - 1))} aria-disabled={page === 1}>← Προηγούμενες</Link><span>Σελίδα {page} από {pages}</span><Link href={pageHref(query, Math.min(pages, page + 1))} aria-disabled={page === pages}>Επόμενες →</Link></nav> : null}
  </main>;
}
