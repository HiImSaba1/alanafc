"use client";

import { Trash2 } from "lucide-react";
import { deleteContentAction } from "@/features/content/admin-actions";

export function DeleteContentButton({ id, title }: { id: number; title: string }) {
  return <form action={deleteContentAction} onSubmit={(event) => { if (!window.confirm(`Οριστική διαγραφή του «${title}»; Η ενέργεια δεν αναιρείται.`)) event.preventDefault(); }}>
    <input type="hidden" name="id" value={id} />
    <button type="submit" aria-label={`Οριστική διαγραφή: ${title}`} title="Οριστική διαγραφή"><Trash2 aria-hidden="true" /></button>
  </form>;
}
