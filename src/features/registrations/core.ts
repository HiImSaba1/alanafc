import { z } from "zod";

export const registrationGroups = ["K6", "K8", "K10", "K12", "K14", "K16", "Δεν γνωρίζω ακόμη"] as const;
export const registrationStatuses = ["new", "contacted", "completed", "archived"] as const;
export const registrationDuplicateWindowMinutes = 10;
export const registrationRateWindowMinutes = 15;
export const registrationRateLimit = 3;

const phonePattern = /^[+\d][\d\s().-]{7,24}$/;

export const registrationSchema = z.object({
  childName: z.string().trim().min(3, "Συμπληρώστε το ονοματεπώνυμο του παιδιού.").max(191),
  childBirthYear: z.coerce.number().int().min(2008, "Ελέγξτε το έτος γέννησης.").max(new Date().getFullYear() - 3, "Ελέγξτε το έτος γέννησης."),
  preferredGroup: z.string().trim().min(1, "Επιλέξτε τμήμα ενδιαφέροντος.").max(40),
  guardianName: z.string().trim().min(3, "Συμπληρώστε το ονοματεπώνυμο κηδεμόνα.").max(191),
  guardianRelationship: z.string().trim().min(2, "Συμπληρώστε τη σχέση με το παιδί.").max(80),
  guardianEmail: z.email("Συμπληρώστε έγκυρη διεύθυνση email.").trim().toLowerCase().max(191),
  guardianPhone: z.string().trim().regex(phonePattern, "Συμπληρώστε έγκυρο τηλέφωνο.").max(40),
  address: z.string().trim().max(255).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  photoPreference: z.enum(["yes", "no"]),
  privacyConsent: z.literal("yes", { error: "Απαιτείται αποδοχή της πολιτικής απορρήτου." }),
  website: z.string().max(0, "Η υποβολή απορρίφθηκε."),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function registrationReference(now = new Date(), random = crypto.randomUUID()) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `AL-${date}-${random.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

export function registrationWindowStart(now: Date, minutes: number) {
  return new Date(now.getTime() - minutes * 60_000);
}

export function registrationSubmissionDecision(recentDuplicateCount: number, recentEmailCount: number) {
  if (recentDuplicateCount > 0) return "duplicate" as const;
  if (recentEmailCount >= registrationRateLimit) return "rate-limited" as const;
  return "accept" as const;
}

export function registrationFormData(formData: FormData) {
  return {
    childName: formData.get("childName"), childBirthYear: formData.get("childBirthYear"),
    preferredGroup: formData.get("preferredGroup"), guardianName: formData.get("guardianName"),
    guardianRelationship: formData.get("guardianRelationship"), guardianEmail: formData.get("guardianEmail"),
    guardianPhone: formData.get("guardianPhone"), address: formData.get("address") || "",
    notes: formData.get("notes") || "", photoPreference: formData.get("photoPreference"),
    privacyConsent: formData.get("privacyConsent"), website: formData.get("website") || "",
  };
}
