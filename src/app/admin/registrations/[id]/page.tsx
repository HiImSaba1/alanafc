import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeletePrivateSubmissionButton } from "@/components/admin/delete-private-submission-button";
import { requireAdmin } from "@/features/admin-auth/session";
import { retryRegistrationEmail, updateRegistrationStatus } from "@/features/registrations/actions";
import { db } from "@/lib/db";
import { academyRegistrations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type AdminRegistrationPageProps = { params: Promise<{ id: string }> };

export default async function AdminRegistrationPage({ params }: AdminRegistrationPageProps) {
  const admin = await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const item = (await db.select().from(academyRegistrations).where(eq(academyRegistrations.id, id)).limit(1))[0];
  if (!item) notFound();
  const fields = [["Κωδικός", item.reference], ["Παιδί", item.childName], ["Έτος γέννησης", item.childBirthYear], ["Τμήμα", item.preferredGroup], ["Κηδεμόνας", item.guardianName], ["Σχέση", item.guardianRelationship], ["Email", item.guardianEmail], ["Τηλέφωνο", item.guardianPhone], ["Διεύθυνση", item.address || "—"], ["Συναίνεση φωτογραφιών", item.photoPreference === "yes" ? "Ναι" : "Όχι"], ["Σημειώσεις", item.notes || "—"], ["Κατάσταση email", item.emailStatus]] as const;
  return <main className="admin-content"><header><div><p className="eyebrow">ΕΓΓΡΑΦΗ · {item.reference}</p><h1>{item.childName}</h1></div><div className="admin-content__header-actions"><Link href="/admin/registrations">Πίσω στις εγγραφές</Link></div></header>
    <section className="admin-registration-detail"><dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <form action={updateRegistrationStatus} className="admin-registration-status"><input type="hidden" name="id" value={item.id} /><label>Κατάσταση<select name="status" defaultValue={item.status}><option value="new">Νέα</option><option value="contacted">Έγινε επικοινωνία</option><option value="completed">Ολοκληρωμένη</option><option value="archived">Αρχειοθετημένη</option></select></label><button type="submit">Αποθήκευση κατάστασης</button></form>
      {item.emailStatus === "failed" ? <aside className="admin-email-warning"><strong>Η εγγραφή αποθηκεύτηκε, αλλά το email απέτυχε.</strong><p>{item.emailError || "Δεν καταγράφηκε λεπτομέρεια σφάλματος."}</p><form action={retryRegistrationEmail}><input type="hidden" name="id" value={item.id} /><button type="submit">Επανάληψη αποστολής</button></form></aside> : null}
      {admin.role === "owner" ? <DeletePrivateSubmissionButton kind="registration" id={item.id} reference={item.reference} /> : null}
    </section>
  </main>;
}
