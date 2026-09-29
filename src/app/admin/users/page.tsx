import { asc } from "drizzle-orm";
import Link from "next/link";
import { createEditorAccount, toggleEditorAccount } from "@/features/admin-auth/user-management-actions";
import { requireAdmin } from "@/features/admin-auth/session";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const owner = await requireAdmin();
  if (owner.role !== "owner") return <main className="admin-content"><h1>Δεν έχετε πρόσβαση.</h1><Link href="/admin">Πίσω</Link></main>;
  const users = await db.select({ id: adminUsers.id, username: adminUsers.username, displayName: adminUsers.displayName, email: adminUsers.email, role: adminUsers.role, status: adminUsers.status, lastLoginAt: adminUsers.lastLoginAt }).from(adminUsers).orderBy(asc(adminUsers.role), asc(adminUsers.displayName));
  return <main className="admin-content admin-users"><header><div><p className="eyebrow">ALANA FC · ΑΣΦΑΛΕΙΑ</p><h1>Χρήστες admin</h1><p>Δημιουργήστε περιορισμένο editor χωρίς να μοιραστείτε τον owner κωδικό.</p></div><div className="admin-content__header-actions"><Link href="/admin/guide">Οδηγός</Link><Link href="/admin">Πίσω</Link></div></header>
    {(await searchParams).created === "1" ? <p className="admin-media__success">Ο λογαριασμός editor δημιουργήθηκε.</p> : null}
    <section className="admin-users__create"><h2>Νέος editor</h2><form action={createEditorAccount}><label>Όνομα χρήστη<input name="username" required minLength={3} autoComplete="off" /></label><label>Εμφανιζόμενο όνομα<input name="displayName" required /></label><label>Email<input type="email" name="email" /></label><label>Προσωρινός κωδικός<input type="password" name="password" required minLength={12} autoComplete="new-password" /></label><button type="submit">Δημιουργία editor</button></form><p>Ο editor μπορεί να διαχειρίζεται περιεχόμενο, αλλά όχι χρήστες, ιστορικό owner ή ευαίσθητες ρυθμίσεις.</p></section>
    <section className="admin-users__list">{users.map((user) => <article key={user.id}><div><strong>{user.displayName}</strong><span>{user.username} · {user.role}</span><small>{user.email || "Χωρίς email"}</small></div><div><b>{user.status === "active" ? "Ενεργός" : "Απενεργοποιημένος"}</b><small>{user.lastLoginAt ? `Τελευταία σύνδεση ${new Intl.DateTimeFormat("el-GR", { dateStyle: "short" }).format(user.lastLoginAt)}` : "Δεν έχει συνδεθεί"}</small></div>{user.role === "editor" ? <form action={toggleEditorAccount}><input type="hidden" name="id" value={user.id} /><input type="hidden" name="status" value={user.status === "active" ? "disabled" : "active"} /><button type="submit">{user.status === "active" ? "Απενεργοποίηση" : "Ενεργοποίηση"}</button></form> : <span>Owner account</span>}</article>)}</section>
  </main>;
}
