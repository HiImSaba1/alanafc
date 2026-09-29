"use client";

import { Trash2 } from "lucide-react";
import { deleteManualRedirect } from "@/features/content/redirect-actions";

export function DeleteRedirectButton({ id, sourcePath }: { id: number; sourcePath: string }) {
  return <form action={deleteManualRedirect} onSubmit={(event) => { if (!window.confirm(`Διαγραφή της χειροκίνητης ανακατεύθυνσης ${sourcePath};`)) event.preventDefault(); }}><input type="hidden" name="id" value={id} /><button type="submit" aria-label={`Διαγραφή ανακατεύθυνσης ${sourcePath}`} title="Διαγραφή χειροκίνητης ανακατεύθυνσης"><Trash2 aria-hidden="true" /></button></form>;
}
