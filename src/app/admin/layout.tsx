import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminWorkspaceShell } from "@/components/admin/admin-workspace-shell";
import { currentAdmin } from "@/features/admin-auth/session";

export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true, nocache: true } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await currentAdmin();
  return <AdminWorkspaceShell role={admin?.role ?? null}>{children}</AdminWorkspaceShell>;
}
