import { requireAdmin } from "@/features/admin-auth/session";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { academyRegistrations, contactMessages } from "@/lib/db/schema";
import Link from "next/link";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const newRegistrations = (await db.select({ value: count() }).from(academyRegistrations).where(eq(academyRegistrations.status, "new")))[0]?.value ?? 0;
  const newMessages = (await db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.status, "new")))[0]?.value ?? 0;
  const failedRegistrationEmails = (await db.select({ value: count() }).from(academyRegistrations).where(eq(academyRegistrations.emailStatus, "failed")))[0]?.value ?? 0;
  const failedMessageEmails = (await db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.emailStatus, "failed")))[0]?.value ?? 0;
  const notificationCount = newRegistrations + newMessages + failedRegistrationEmails + failedMessageEmails;
  return (
    <main className="admin-dashboard">
      <header><p className="eyebrow">Ασφαλής χώρος διαχείρισης</p><h1>Καλώς ήρθες, {admin.displayName}.</h1><span>{admin.role} · Alana FC Academy</span></header>
      <section aria-label="Ενότητες διαχείρισης">
          {[
            { label: "Περιεχόμενο", value: "Άρθρα & σελίδες", href: "/admin/content", note: "Σύνταξη, SEO και δημοσίευση." },
            { label: "Εγγραφές", value: `${newRegistrations} νέες`, href: "/admin/registrations", note: "Αιτήματα για τη σεζόν 2026–2027." },
            { label: "Σελίδα εγγραφών", value: "Κείμενα & τμήματα", href: "/admin/site/registrations", note: "Αλλαγή K6–K16, καρτελών και φόρμας." },
            { label: "Ιστοσελίδα & αρχική", value: "Κείμενα & εικόνες", href: "/admin/site", note: "Slider, menu, footer, testimonials και χορηγοί." },
            { label: "Οδηγός", value: "Βήμα προς βήμα", href: "/admin/guide", note: "Αναλυτικές οδηγίες για κάθε ενότητα του admin." },
            ...(admin.role === "owner" ? [{ label: "Χρήστες", value: "Owner & editors", href: "/admin/users", note: "Περιορισμένοι λογαριασμοί χωρίς κοινόχρηστο owner password." }] : []),
            { label: "Επικοινωνία", value: `${newMessages} νέα`, href: "/admin/messages", note: "Μηνύματα από τη δημόσια φόρμα." },
            { label: "Ειδοποιήσεις", value: `${notificationCount} ενεργές`, href: "/admin/notifications", note: "Νέες υποβολές και αποτυχίες email." },
          ].map((item, index) => <Link href={item.href} key={item.label}><span>0{index + 1}</span><strong>{item.value}</strong><div><b>{item.label}</b><p>{item.note}</p></div></Link>)}
      </section>
      <Link className="admin-dashboard__create" href="/admin/content/new">Νέο άρθρο <span>↗</span></Link>
    </main>
  );
}
