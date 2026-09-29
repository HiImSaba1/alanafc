import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeletePrivateSubmissionButton } from "@/components/admin/delete-private-submission-button";
import { requireAdmin } from "@/features/admin-auth/session";
import { retryContactEmail, updateContactStatus } from "@/features/contact/actions";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function AdminMessagePage({ params }: Props) {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const item = (await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1))[0];
  if (!item) notFound();
  const fields = [
    ["Αποστολέας", item.senderName], ["Email", item.senderEmail], ["Τηλέφωνο", item.senderPhone || "—"],
    ["Υποβλήθηκε", new Intl.DateTimeFormat("el-GR", { dateStyle: "long", timeStyle: "short" }).format(item.submittedAt)],
    ["Μήνυμα", item.message], ["Κατάσταση email", item.emailStatus],
  ];
  return <main className="admin-content">
    <header><div><p className="eyebrow">ΜΗΝΥΜΑ · {item.reference}</p><h1>{item.subject}</h1></div><div className="admin-content__header-actions"><Link href="/admin/messages">Πίσω στα μηνύματα</Link><a href={`mailto:${item.senderEmail}?subject=${encodeURIComponent(`Απάντηση: ${item.subject} (${item.reference})`)}`}>Απάντηση με email</a></div></header>
    <section className="admin-registration-detail">
      <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <form action={updateContactStatus} className="admin-registration-status"><input type="hidden" name="id" value={item.id} /><label>Κατάσταση<select name="status" defaultValue={item.status}><option value="new">Νέο</option><option value="read">Διαβάστηκε</option><option value="replied">Απαντήθηκε</option><option value="archived">Αρχειοθετήθηκε</option></select></label><button type="submit">Αποθήκευση κατάστασης</button></form>
      {item.emailStatus === "failed" ? <aside className="admin-email-warning"><strong>Το μήνυμα αποθηκεύτηκε, αλλά το email απέτυχε.</strong><p>{item.emailError || "Δεν καταγράφηκε λεπτομέρεια σφάλματος."}</p><form action={retryContactEmail}><input type="hidden" name="id" value={item.id} /><button type="submit">Επανάληψη αποστολής</button></form></aside> : null}
      {admin.role === "owner" ? <DeletePrivateSubmissionButton kind="contact" id={item.id} reference={item.reference} /> : null}
    </section>
  </main>;
}
