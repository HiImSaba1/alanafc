import Link from "next/link";
import { Pencil } from "lucide-react";
import { DeleteContentButton } from "@/components/admin/delete-content-button";
import { requireAdmin } from "@/features/admin-auth/session";
import { articleTemplateCatalog } from "@/features/content/template-catalog";
import { adminContentCount, adminContentList, type AdminContentFilters } from "@/features/content/queries";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;
const kinds = new Set(["page", "post"]);
const statuses = new Set(["draft", "published", "scheduled", "archived"]);

function hrefFor(filters: { query?: string; kind?: string; status?: string }, page: number) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/content?${query}` : "/admin/content";
}

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const admin = await requireAdmin();
  const values = await searchParams;
  const query = typeof values.q === "string" ? values.q.trim().slice(0, 100) : "";
  const rawKind = typeof values.kind === "string" ? values.kind : "";
  const rawStatus = typeof values.status === "string" ? values.status : "";
  const rawPage = typeof values.page === "string" ? Number(values.page) : 1;
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const filters: AdminContentFilters = {
    ...(query ? { query } : {}),
    ...(kinds.has(rawKind) ? { kind: rawKind as "page" | "post" } : {}),
    ...(statuses.has(rawStatus) ? { status: rawStatus as "draft" | "published" | "scheduled" | "archived" } : {}),
  };
  const [content, total] = await Promise.all([adminContentList({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }), adminContentCount(filters)]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const preserved = { query, kind: filters.kind, status: filters.status };

  return <main className="admin-content admin-content-archive">
    <header><div><p className="eyebrow">ALANA FC · ΔΙΑΧΕΙΡΙΣΗ</p><h1>Περιεχόμενο</h1><span>{total} αποτελέσματα</span></div><div className="admin-content__header-actions"><Link href="/admin">Πίσω</Link><Link href="/admin/content/new">Νέο άρθρο</Link></div></header>
    <form className="admin-content-filters" action="/admin/content" method="get">
      <label><span>Αναζήτηση</span><input type="search" name="q" defaultValue={query} placeholder="Τίτλος ή slug" /></label>
      <label><span>Τύπος</span><select name="kind" defaultValue={filters.kind || ""}><option value="">Όλοι οι τύποι</option><option value="post">Άρθρα</option><option value="page">Σελίδες</option></select></label>
      <label><span>Κατάσταση</span><select name="status" defaultValue={filters.status || ""}><option value="">Όλες</option><option value="draft">Πρόχειρα</option><option value="published">Δημοσιευμένα</option><option value="scheduled">Προγραμματισμένα</option><option value="archived">Αρχειοθετημένα</option></select></label>
      <button type="submit">Εφαρμογή</button><Link href="/admin/content">Καθαρισμός</Link>
    </form>
    <div className="admin-content__table"><div className="admin-content__row is-heading"><span>Τίτλος</span><span>Template</span><span>Τύπος</span><span>Κατάσταση</span><span>Ενημέρωση</span><span>Ενέργειες</span></div>{content.map((item) => <div className="admin-content__row" key={item.id}><Link className="admin-content__title-link" href={`/admin/content/${item.id}`}><strong>{item.title}</strong></Link><span>{articleTemplateCatalog[item.articleTemplate].label}</span><span>{item.kind === "post" ? "Άρθρο" : "Σελίδα"}</span><span className={`admin-status admin-status--${item.publicationStatus}`}>{item.publicationStatus}</span><time dateTime={item.updatedAt.toISOString()}>{new Intl.DateTimeFormat("el-GR", { dateStyle: "short" }).format(item.updatedAt)}</time><div className="admin-content__row-actions"><Link href={`/admin/content/${item.id}`} aria-label={`Επεξεργασία: ${item.title}`} title="Επεξεργασία"><Pencil aria-hidden="true" /></Link>{admin.role === "owner" ? <DeleteContentButton id={item.id} title={item.title} /> : null}</div></div>)}</div>
    {!content.length ? <div className="admin-content-empty"><strong>Δεν βρέθηκε περιεχόμενο.</strong><p>Αλλάξτε τα φίλτρα ή δημιουργήστε ένα νέο άρθρο.</p></div> : null}
    {pages > 1 ? <nav className="admin-content-pagination" aria-label="Σελιδοποίηση περιεχομένου"><Link href={hrefFor(preserved, Math.max(1, safePage - 1))} aria-disabled={safePage === 1}>← Προηγούμενα</Link><span>Σελίδα {safePage} από {pages}</span><Link href={hrefFor(preserved, Math.min(pages, safePage + 1))} aria-disabled={safePage === pages}>Επόμενα →</Link></nav> : null}
  </main>;
}
