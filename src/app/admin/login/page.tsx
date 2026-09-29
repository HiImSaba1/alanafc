import { redirect } from "next/navigation";
import { currentAdmin } from "@/features/admin-auth/session";
import { LoginForm } from "./login-form";
import { LoginVisual } from "./login-visual";
import { LoginEntrance } from "./login-entrance";

export default async function AdminLoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return (
    <LoginEntrance>
      <div className="min-w-0 overflow-hidden"><LoginVisual /></div>
      <LoginForm />
    </LoginEntrance>
  );
}
