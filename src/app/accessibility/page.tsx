import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { publicPageMetadata } from "@/features/seo/public-metadata";

export const metadata: Metadata = publicPageMetadata({ title: "Προσβασιμότητα", description: "Η δέσμευση της Alana FC Academy για μία ευανάγνωστη, προσβάσιμη και λειτουργική ψηφιακή εμπειρία για όλους.", path: "/accessibility" });
export default function AccessibilityPage() {
  return <LegalPage eyebrow="Προσβασιμότητα" title="Μία εμπειρία για όλους"><h2>Η δέσμευσή μας</h2><p>Σχεδιάζουμε την ιστοσελίδα με ευανάγνωστα ελληνικά, πλοήγηση μέσω πληκτρολογίου, εμφανή εστίαση, σωστή σημασιολογία και σεβασμό στην προτίμηση μειωμένης κίνησης.</p><p>Αν συναντήσετε εμπόδιο, ενημερώστε μας στο <a href="mailto:f.c.alana@hotmail.com">f.c.alana@hotmail.com</a>.</p></LegalPage>;
}
