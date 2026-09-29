"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { bulkDeleteMediaAction } from "@/features/content/media-actions";

export function BulkDeleteMediaForm() {
  const [selectedCount, setSelectedCount] = useState(0);
  const checkboxes = useCallback(() => [...document.querySelectorAll<HTMLInputElement>('input[name="mediaIds"][form="bulk-media-delete"]:not(:disabled)')], []);
  const updateSelectedCount = useCallback(() => setSelectedCount(checkboxes().filter((input) => input.checked).length), [checkboxes]);

  useEffect(() => {
    document.addEventListener("change", updateSelectedCount);
    return () => document.removeEventListener("change", updateSelectedCount);
  }, [updateSelectedCount]);

  function setAll(checked: boolean) {
    for (const input of checkboxes()) input.checked = checked;
    updateSelectedCount();
  }

  return <form
    id="bulk-media-delete"
    className="admin-media__bulk-delete"
    action={bulkDeleteMediaAction}
    onSubmit={(event) => {
      const selected = new FormData(event.currentTarget).getAll("mediaIds").length;
      if (!selected) {
        event.preventDefault();
        window.alert("Επιλέξτε τουλάχιστον μία εικόνα που δεν χρησιμοποιείται.");
        return;
      }
      if (!window.confirm(`Οριστική διαγραφή ${selected} επιλεγμένων media και όλων των τοπικών αρχείων τους;`)) event.preventDefault();
    }}
  >
    <div className="admin-media__bulk-copy"><span>Επιλέξτε εικόνες που δεν χρησιμοποιούνται και διαγράψτε τις μαζί.</span><strong aria-live="polite">{selectedCount} επιλεγμένα</strong></div>
    <div className="admin-media__bulk-controls"><button type="button" onClick={() => setAll(true)}>Επιλογή όλων</button><button type="button" onClick={() => setAll(false)} disabled={selectedCount === 0}>Καθαρισμός</button><button type="submit" disabled={selectedCount === 0}><Trash2 aria-hidden="true" />Διαγραφή επιλεγμένων</button></div>
  </form>;
}
