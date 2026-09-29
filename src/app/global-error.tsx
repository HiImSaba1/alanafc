"use client";

import Link from "next/link";
import { useEffect } from "react";
import { runtimeErrorReference, runtimeRecoveryCopy } from "@/lib/runtime-recovery";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const reference = runtimeErrorReference(error);

  return (
    <html lang="el">
      <body style={{ margin: 0, background: "#f2eee6", color: "#050505", fontFamily: "Arial, sans-serif" }}>
        <main role="alert" style={{ minHeight: "100vh", display: "grid", placeContent: "center", gap: "24px", padding: "32px" }}>
          <p style={{ margin: 0, color: "#ae8d4b", fontWeight: 800, textTransform: "uppercase" }}>{runtimeRecoveryCopy.eyebrow}</p>
          <h1 style={{ maxWidth: "760px", margin: 0, fontSize: "clamp(2rem, 6vw, 5rem)", lineHeight: 1 }}>{runtimeRecoveryCopy.title}</h1>
          <p style={{ maxWidth: "620px", margin: 0, color: "#525252", lineHeight: 1.5 }}>{runtimeRecoveryCopy.description}</p>
          {reference ? <p style={{ margin: 0, fontSize: "14px" }}>Κωδικός αναφοράς: {reference}</p> : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <button type="button" onClick={reset} style={{ border: 0, background: "#050505", color: "#fff", padding: "14px 18px", cursor: "pointer", fontWeight: 750 }}>{runtimeRecoveryCopy.retry}</button>
            <Link href="/" style={{ border: "1px solid #050505", color: "#050505", padding: "14px 18px", fontWeight: 750, textDecoration: "none" }}>{runtimeRecoveryCopy.home}</Link>
            <Link href="/contact-us" style={{ color: "#050505", padding: "14px 4px", fontWeight: 750 }}>{runtimeRecoveryCopy.contact}</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
