"use client";

import { History } from "lucide-react";
import { restoreContentRevisionAction } from "@/features/content/admin-actions";

type Revision = { revisionNumber: number; changeSummary: string; createdAt: Date; editorName: string | null };

export function ContentRevisionHistory({ contentId, revisions, restored }: { contentId: number; revisions: Revision[]; restored?: string }) {
  return <aside className="content-revisions" aria-labelledby="content-revisions-title">
    <header><div><History aria-hidden="true" /><div><strong id="content-revisions-title">Ιστορικό αποθηκεύσεων</strong><p>Κάθε αποθήκευση κρατά την προηγούμενη έκδοση.</p></div></div>{restored ? <span role="status">Επαναφέρθηκε η έκδοση #{restored}</span> : null}</header>
    {revisions.length ? <ol>{revisions.map((revision) => <li key={revision.revisionNumber}><div><strong>#{revision.revisionNumber} · {revision.editorName || "Συντάκτης"}</strong><span>{revision.changeSummary}</span><time dateTime={revision.createdAt.toISOString()}>{new Intl.DateTimeFormat("el-GR", { dateStyle: "short", timeStyle: "short" }).format(revision.createdAt)}</time></div><form action={restoreContentRevisionAction} onSubmit={(event) => { if (!window.confirm(`Επαναφορά έκδοσης #${revision.revisionNumber}; Η τρέχουσα έκδοση θα κρατηθεί ως checkpoint.`)) event.preventDefault(); }}><input type="hidden" name="id" value={contentId} /><input type="hidden" name="revisionNumber" value={revision.revisionNumber} /><button type="submit">Επαναφορά</button></form></li>)}</ol> : <p className="content-revisions__empty">Δεν υπάρχουν ακόμη παλαιότερες εκδόσεις.</p>}
  </aside>;
}
