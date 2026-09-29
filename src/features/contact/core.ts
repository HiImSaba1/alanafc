import { z } from "zod";

export const contactStatuses = ["new", "read", "replied", "archived"] as const;
export const contactDuplicateWindowMinutes = 10;
export const contactRateWindowMinutes = 15;
export const contactRateLimit = 3;
export const contactSchema = z.object({
  senderName: z.string().trim().min(3, "Συμπληρώστε το ονοματεπώνυμό σας.").max(191),
  senderEmail: z.email("Συμπληρώστε έγκυρη διεύθυνση email.").trim().toLowerCase().max(191),
  senderPhone: z.string().trim().max(40).refine((value) => !value || /^[+\d][\d\s().-]{7,24}$/.test(value), "Συμπληρώστε έγκυρο τηλέφωνο."),
  subject: z.string().trim().min(3, "Συμπληρώστε το θέμα.").max(191),
  message: z.string().trim().min(10, "Το μήνυμα πρέπει να περιέχει τουλάχιστον 10 χαρακτήρες.").max(5000),
  privacyConsent: z.literal("yes", { error: "Απαιτείται αποδοχή της πολιτικής απορρήτου." }),
  website: z.string().max(0, "Η υποβολή απορρίφθηκε."),
});
export type ContactInput = z.infer<typeof contactSchema>;
export function contactReference(now = new Date(), random = crypto.randomUUID()) { return `MSG-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${random.replaceAll("-", "").slice(0, 6).toUpperCase()}`; }
export function contactWindowStart(now: Date, minutes: number) { return new Date(now.getTime() - minutes * 60_000); }
export function contactSubmissionDecision(recentDuplicateCount: number, recentEmailCount: number) {
  if (recentDuplicateCount > 0) return "duplicate" as const;
  if (recentEmailCount >= contactRateLimit) return "rate-limited" as const;
  return "accept" as const;
}
export function contactFormData(formData: FormData) { return { senderName: formData.get("senderName"), senderEmail: formData.get("senderEmail"), senderPhone: formData.get("senderPhone") || "", subject: formData.get("subject"), message: formData.get("message"), privacyConsent: formData.get("privacyConsent"), website: formData.get("website") || "" }; }
