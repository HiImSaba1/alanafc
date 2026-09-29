import { desc } from "drizzle-orm";
import { audit, requireAdmin } from "@/features/admin-auth/session";
import { createCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
const EXPORT_LIMIT = 10_000;

export async function GET() {
  const admin = await requireAdmin();
  if (admin.role !== "owner") return new Response("Forbidden", { status: 403 });
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.submittedAt)).limit(EXPORT_LIMIT);
  const csv = createCsv(
    ["Κωδικός", "Όνομα", "Email", "Τηλέφωνο", "Θέμα", "Μήνυμα", "Συναίνεση απορρήτου", "Κατάσταση", "Κατάσταση email", "Υποβολή", "Ενημέρωση"],
    rows.map((item) => [item.reference, item.senderName, item.senderEmail, item.senderPhone, item.subject, item.message, item.privacyConsentAt, item.status, item.emailStatus, item.submittedAt, item.updatedAt]),
  );
  await audit("contact.exported", admin.id, "contact_message", `count:${rows.length}`);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="alanafc-contact-messages-${day}.csv"`, "Cache-Control": "private, no-store" } });
}
