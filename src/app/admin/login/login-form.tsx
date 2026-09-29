"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/features/admin-auth/actions";
import { EditorialButton } from "@/components/ui/editorial-button";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="flex min-h-[50svh] flex-col justify-center bg-zinc-950 px-6 py-16 text-white sm:px-10 lg:min-h-svh lg:px-[10vw]">
      <p data-login-reveal className="mb-10 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-white/50">Ιδιωτικός χώρος / Εξουσιοδοτημένη πρόσβαση</p>
      <div className="space-y-8">
        <label data-login-reveal className="block" htmlFor="username">
          <span className="mb-2 block text-xs uppercase tracking-wider text-white/70">Όνομα χρήστη</span>
          <input id="username" name="username" autoComplete="username" required className="w-full border-0 border-b border-white/30 bg-transparent py-3 text-2xl text-white outline-none transition focus:border-[#f7d488]" />
        </label>
        <label data-login-reveal className="block" htmlFor="password">
          <span className="mb-2 block text-xs uppercase tracking-wider text-white/70">Κωδικός πρόσβασης</span>
          <input id="password" name="password" type="password" autoComplete="current-password" minLength={12} required className="w-full border-0 border-b border-white/30 bg-transparent py-3 text-2xl text-white outline-none transition focus:border-[#f7d488]" />
        </label>
        {state.error ? <p role="alert" className="border-l-2 border-red-400 pl-3 text-sm leading-6 text-red-300">{state.error}</p> : null}
        <div data-login-reveal><EditorialButton type="submit" disabled={pending} label={pending ? "Σύνδεση…" : "Είσοδος στη διαχείριση"} arrow="right" variant="light" className="w-full" /></div>
      </div>
    </form>
  );
}
