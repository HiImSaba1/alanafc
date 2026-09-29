import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

export const registrationSettingsKey = "registration_page";
export const registrationUnknownGroup = "Δεν γνωρίζω ακόμη";

const programSchema = z.object({
  id: z.string().trim().min(1).max(80),
  groups: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
  title: z.string().trim().min(2).max(120),
  text: z.string().trim().min(10).max(1000),
  points: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
  image: z.string().trim().startsWith("/").max(500),
});

export const registrationSettingsSchema = z.object({
  isOpen: z.boolean(),
  closedMessage: z.string().trim().min(10).max(600),
  successMessage: z.string().trim().min(10).max(600),
  guardianEmailMessage: z.string().trim().min(10).max(1000),
  notificationRecipients: z.array(z.string().trim().email().max(191)).min(1).max(5),
  season: z.string().trim().min(4).max(40),
  statusText: z.string().trim().min(2).max(120),
  titleLines: z.array(z.string().trim().min(1).max(100)).length(3),
  intro: z.string().trim().min(10).max(600),
  sectionTitle: z.string().trim().min(2).max(160),
  sectionEyebrow: z.string().trim().min(2).max(120),
  sectionIntro: z.string().trim().min(10).max(600),
  programs: z.array(programSchema).min(1).max(8),
});

export type RegistrationSettings = z.infer<typeof registrationSettingsSchema>;

export const defaultRegistrationSettings: RegistrationSettings = {
  isOpen: true,
  closedMessage: "Οι online εκδηλώσεις ενδιαφέροντος έχουν προσωρινά κλείσει. Επικοινωνήστε μαζί μας τηλεφωνικά για περισσότερες πληροφορίες.",
  successMessage: "Η εκδήλωση ενδιαφέροντος καταχωρήθηκε. Θα επικοινωνήσουμε σύντομα μαζί σας.",
  guardianEmailMessage: "Σας ευχαριστούμε θερμά και σας συγχαίρουμε για την απόφασή σας να κάνετε το πρώτο βήμα ώστε το παιδί σας να γνωρίσει την Alana FC Academy.",
  notificationRecipients: ["f.c.alana@hotmail.com", "alanafcmedia@gmail.com"],
  season: "Σεζόν 2026–2027",
  statusText: "Οι εγγραφές είναι ανοιχτές",
  titleLines: ["Το επόμενο", "βήμα αρχίζει", "στο γήπεδο."],
  intro: "Συμπληρώστε την εκδήλωση ενδιαφέροντος και η ομάδα μας θα επικοινωνήσει μαζί σας για το κατάλληλο τμήμα.",
  sectionTitle: "Μία διαδρομή για κάθε στάδιο.",
  sectionEyebrow: "Τμήματα K6 έως K16",
  sectionIntro: "Η τελική ένταξη σε τμήμα επιβεβαιώνεται από την Ακαδημία μετά την επικοινωνία με την οικογένεια.",
  programs: [
    { id: "first-steps", groups: ["K6", "K8"], title: "Πρώτα βήματα", text: "Γνωριμία με την μπάλα, κίνηση, συνεργασία και χαρά του παιχνιδιού μέσα σε ένα ασφαλές και ενθαρρυντικό περιβάλλον.", points: ["Παιχνίδι και κίνηση", "Βασικές δεξιότητες", "Αγάπη για την ομάδα"], image: "/programma_proponisewn_alana.jpg" },
    { id: "development", groups: ["K10", "K12"], title: "Τεχνική ανάπτυξη", text: "Σταδιακή εξέλιξη της τεχνικής, της αντίληψης και της συνεργασίας, με προπόνηση προσαρμοσμένη στις ανάγκες του σταδίου ανάπτυξης.", points: ["Ατομική τεχνική", "Ποδοσφαιρική αντίληψη", "Συνεργασία"], image: "/programma_proponisewn_alana.jpg" },
    { id: "progression", groups: ["K14", "K16"], title: "Αγωνιστική εξέλιξη", text: "Εμβάθυνση στα τεχνικά, τακτικά, σωματικά και νοητικά χαρακτηριστικά του αθλητή, με υπευθυνότητα και σταθερή αναπτυξιακή κατεύθυνση.", points: ["Τακτική κατανόηση", "Συνέπεια και ευθύνη", "Αγωνιστικές εμπειρίες"], image: "/programma_proponisewn_alana.jpg" },
  ],
};

export function registrationGroupOptions(settings: RegistrationSettings) {
  return [...new Set(settings.programs.flatMap((program) => program.groups)), registrationUnknownGroup];
}

export async function getRegistrationSettings(): Promise<RegistrationSettings> {
  try {
    const row = (await db.select({ value: siteSettings.valueJson }).from(siteSettings).where(eq(siteSettings.settingKey, registrationSettingsKey)).limit(1))[0];
    const stored = row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? row.value as Partial<RegistrationSettings> : {};
    const parsed = registrationSettingsSchema.safeParse({ ...defaultRegistrationSettings, ...stored });
    return parsed.success ? parsed.data : defaultRegistrationSettings;
  } catch {
    return defaultRegistrationSettings;
  }
}
