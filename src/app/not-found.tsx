import type { Metadata } from "next";
import { EditorialButton } from "@/components/ui/editorial-button";

export const metadata: Metadata = {
  title: "Η σελίδα δεν βρέθηκε",
};

export default function NotFound() {
  return (
    <main id="main-content" className="not-found-page">
      <p className="eyebrow">Σφάλμα · 404</p>
      <div className="not-found-page__body">
        <p className="not-found-page__code" aria-hidden="true">404</p>
        <div>
          <h1>Η σελίδα βγήκε εκτός γηπέδου.</h1>
          <p>Ο σύνδεσμος μπορεί να έχει αλλάξει ή η σελίδα να μην είναι πλέον διαθέσιμη. Επιστρέψτε στην αρχική ή δείτε τα τελευταία νέα της Ακαδημίας.</p>
          <nav aria-label="Επιλογές ανάκτησης σελίδας">
            <EditorialButton href="/" label="Επιστροφή στην αρχική" arrow="left" />
            <EditorialButton href="/news" label="Δείτε τα νέα" arrow="right" variant="outline" />
          </nav>
        </div>
      </div>
    </main>
  );
}
