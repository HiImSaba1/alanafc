"use client";

import { Trash2 } from "lucide-react";
import { deleteContactMessage } from "@/features/contact/actions";
import { deleteRegistration } from "@/features/registrations/actions";

export function DeletePrivateSubmissionButton({ kind, id, reference }: { kind: "registration" | "contact"; id: number; reference: string }) {
  const action = kind === "registration" ? deleteRegistration : deleteContactMessage;
  const label = kind === "registration" ? "εγγραφή" : "μήνυμα";
  return <form action={action} className="admin-private-delete" onSubmit={(event) => { if (!window.confirm(`Οριστική διαγραφή για ${label} ${reference}; Τα προσωπικά δεδομένα δεν μπορούν να ανακτηθούν.`)) event.preventDefault(); }}>
    <input type="hidden" name="id" value={id} />
    <button type="submit"><Trash2 aria-hidden="true" /> Οριστική διαγραφή</button>
  </form>;
}
