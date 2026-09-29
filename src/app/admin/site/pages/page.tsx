import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/session";
import { db } from "@/lib/db";
import { contentEntries } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const pageDefinitions = [
  { slug: "about-us", title: "Η Ακαδημία", publicHref: "/about-us", description: "Κύριο κείμενο, hero, SEO και εικόνες παρουσίασης." },
  { slug: "coaching-staff", title: "Προπονητές", publicHref: "/coaching-staff", description: "Παρουσίαση προπονητικής ομάδας και σχετικό φωτογραφικό υλικό." },
  { slug: "our-facilities", title: "Εγκαταστάσεις", publicHref: "/our-facilities", description: "Περιγραφή εγκαταστάσεων, hero και gallery." },
  { slug: "sportclub-alana", title: "Sports Club", publicHref: "/sportclub-alana", description: "Περιεχόμενο, εικόνες και SEO του Sports Club." },
  { slug: "contact-us", title: "Επικοινωνία", publicHref: "/contact-us", description: "Κείμενο επικοινωνίας και δημόσια παρουσίαση της φόρμας." },
] as const;

export default async function StructuredPagesAdminPage() {
  await requireAdmin();
  const slugs = pageDefinitions.map((page) => page.slug);
  const records = await db.select({ id: contentEntries.id, slug: contentEntries.slug, updatedAt: contentEntries.updatedAt, publicationStatus: contentEntries.publicationStatus })
    .from(contentEntries).where(and(eq(contentEntries.kind, "page"), inArray(contentEntries.slug, slugs)));
  const bySlug = new Map(records.map((record) => [record.slug, record]));
  return <main className="admin-content admin-structured-pages">
    <header><div><p className="eyebrow">ALANA FC · ΙΣΤΟΣΕΛΙΔΑ</p><h1>Εσωτερικές σελίδες</h1><p>Ανοίξτε τη σελίδα που θέλετε και αλλάξτε κείμενο, hero, gallery ή SEO από τον έτοιμο editor.</p></div><div className="admin-content__header-actions"><Link href="/admin/guide">Οδηγός</Link><Link href="/admin/site">Πίσω</Link></div></header>
    <section className="admin-structured-pages__grid">{pageDefinitions.map((page, index) => {
      const record = bySlug.get(page.slug);
      return <article key={page.slug}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{page.title}</h2><p>{page.description}</p>{record ? <small>{record.publicationStatus === "published" ? "Δημοσιευμένη" : "Πρόχειρη"} · ενημέρωση {new Intl.DateTimeFormat("el-GR", { dateStyle: "short" }).format(record.updatedAt)}</small> : <small>Δεν βρέθηκε εγγραφή περιεχομένου</small>}</div><div>{record ? <Link href={`/admin/content/${record.id}`}>Επεξεργασία</Link> : <Link href="/admin/content/new">Δημιουργία</Link>}<Link href={page.publicHref} target="_blank">Προβολή</Link></div></article>;
    })}</section>
  </main>;
}
