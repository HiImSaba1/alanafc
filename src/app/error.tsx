"use client";

import { useEffect } from "react";
import { EditorialButton } from "@/components/ui/editorial-button";
import { runtimeErrorReference, runtimeRecoveryCopy } from "@/lib/runtime-recovery";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const reference = runtimeErrorReference(error);

  return (
    <main id="main-content" className="runtime-error" role="alert">
      <p className="eyebrow">{runtimeRecoveryCopy.eyebrow}</p>
      <div className="runtime-error__body">
        <p className="runtime-error__mark" aria-hidden="true">!</p>
        <div>
          <h1>{runtimeRecoveryCopy.title}</h1>
          <p>{runtimeRecoveryCopy.description}</p>
          {reference ? <p className="runtime-error__reference">Κωδικός αναφοράς: {reference}</p> : null}
          <div className="runtime-error__actions">
            <EditorialButton type="button" label={runtimeRecoveryCopy.retry} arrow="right" onClick={reset} />
            <EditorialButton href="/" label={runtimeRecoveryCopy.home} arrow="left" variant="outline" />
          </div>
        </div>
      </div>
    </main>
  );
}
