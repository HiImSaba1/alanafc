"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { logoutAction } from "@/features/admin-auth/actions";

const links = [
  { href: "/admin", label: "Επισκόπηση" },
  { href: "/admin/content", label: "Περιεχόμενο" },
  { href: "/admin/content/new", label: "Νέο άρθρο" },
  { href: "/admin/media", label: "Βιβλιοθήκη media" },
  { href: "/admin/site", label: "Ιστοσελίδα & αρχική" },
  { href: "/admin/site/registrations", label: "Σελίδα εγγραφών" },
  { href: "/admin/guide", label: "Οδηγός διαχείρισης" },
  { href: "/admin/users", label: "Χρήστες admin", ownerOnly: true },
  { href: "/admin/registrations", label: "Εγγραφές" },
  { href: "/admin/messages", label: "Επικοινωνία" },
  { href: "/admin/notifications", label: "Ειδοποιήσεις" },
  { href: "/admin/activity", label: "Ιστορικό ενεργειών", ownerOnly: true },
  { href: "/admin/redirects", label: "Ανακατευθύνσεις", ownerOnly: true },
] as const;

export function AdminWorkspaceShell({ children, role }: { children: ReactNode; role: "owner" | "editor" | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  if (pathname === "/admin/login") return children;
  const closeOnMobile = () => { if (window.matchMedia("(max-width: 760px)").matches) setOpen(false); };

  return <div className="admin-workspace" data-menu-open={open || undefined}>
    <button className="admin-workspace__scrim" type="button" aria-label="Κλείσιμο μενού διαχείρισης" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
    <aside id="admin-navigation-panel" aria-label="Πλευρικό μενού διαχείρισης">
      <div className="admin-workspace__aside-heading"><Link href="/admin" className="admin-wordmark" onClick={closeOnMobile}>ALANA FC</Link><span>ACADEMY CMS</span></div>
      <nav aria-label="Διαχείριση ιστοσελίδας">
        {links.filter((item) => !("ownerOnly" in item) || !item.ownerOnly || role === "owner").map((item, index) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={closeOnMobile}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</Link>)}
      </nav>
      <footer className="admin-workspace__account">
        <button className="admin-workspace__panel-toggle" type="button" aria-label="Κλείσιμο μενού διαχείρισης" aria-controls="admin-navigation-panel" aria-expanded={open} onClick={() => setOpen(false)}><ChevronLeft aria-hidden="true" /></button>
        <div><strong>AlanaFC</strong><span>Διαχειριστής ιστοσελίδας</span></div>
        <form action={logoutAction}><button type="submit"><LogOut aria-hidden="true" /> Αποσύνδεση</button></form>
      </footer>
    </aside>
    <button className="admin-workspace__open-toggle" type="button" aria-label="Άνοιγμα μενού διαχείρισης" aria-controls="admin-navigation-panel" aria-expanded={open} onClick={() => setOpen(true)}><ChevronRight aria-hidden="true" /></button>
    <div className="admin-workspace__main">{children}</div>
  </div>;
}
