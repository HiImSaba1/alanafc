export const runtimeRecoveryCopy = {
  eyebrow: "Προσωρινό πρόβλημα",
  title: "Κάτι δεν πήγε όπως περιμέναμε.",
  description: "Η σελίδα δεν μπόρεσε να ολοκληρώσει τη φόρτωσή της. Δοκιμάστε ξανά ή επιστρέψτε στην αρχική σελίδα.",
  retry: "Δοκιμάστε ξανά",
  home: "Επιστροφή στην αρχική",
  contact: "Επικοινωνήστε μαζί μας",
} as const;

export function runtimeErrorReference(error: Error & { digest?: string }) {
  return error.digest?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || null;
}
