import { desc } from "drizzle-orm";
import { audit, requireAdmin } from "@/features/admin-auth/session";
import { createCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { academyRegistrations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
const EXPORT_LIMIT = 10_000;

export async function GET() {
  const admin = await requireAdmin();
  if (admin.role !== "owner") return new Response("Forbidden", { status: 403 });
  const rows = await db.select().from(academyRegistrations).orderBy(desc(academyRegistrations.submittedAt)).limit(EXPORT_LIMIT);
  const csv = createCsv(
    ["Κωδικός", "Σεζόν", "Παιδί", "Έτος γέννησης", "Τμήμα", "Κηδεμόνας", "Σχέση", "Email", "Τηλέφωνο", "Διεύθυνση", "Σημειώσεις", "Φωτογραφίες", "Συναίνεση απορρήτου", "Κατάσταση", "Κατάσταση email", "Υποβολή", "Ενημέρωση"],
    rows.map((item) => [item.reference, item.season, item.childName, item.childBirthYear, item.preferredGroup, item.guardianName, item.guardianRelationship, item.guardianEmail, item.guardianPhone, item.address, item.notes, item.photoPreference, item.privacyConsentAt, item.status, item.emailStatus, item.submittedAt, item.updatedAt]),
  );
  await audit("registration.exported", admin.id, "academy_registration", `count:${rows.length}`);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="alanafc-registrations-${day}.csv"`, "Cache-Control": "private, no-store" } });
}
