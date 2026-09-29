"use client";

import { Trash2 } from "lucide-react";
import { deleteMediaAction } from "@/features/content/media-actions";

export function DeleteMediaButton({ id, label, disabled, iconOnly = false }: { id: number; label: string; disabled: boolean; iconOnly?: boolean }) {
  return <form action={deleteMediaAction} onSubmit={(event) => { if (!window.confirm(`Οριστική διαγραφή του media «${label}» και όλων των τοπικών αρχείων του;`)) event.preventDefault(); }}><input type="hidden" name="id" value={id} /><button className="admin-media__delete" data-icon-only={iconOnly || undefined} type="submit" disabled={disabled} aria-label={`Οριστική διαγραφή: ${label}`} title={disabled ? "Το media χρησιμοποιείται σε περιεχόμενο" : "Οριστική διαγραφή"}><Trash2 aria-hidden="true" />{iconOnly ? <span className="sr-only">Διαγραφή</span> : " Διαγραφή"}</button></form>;
}
