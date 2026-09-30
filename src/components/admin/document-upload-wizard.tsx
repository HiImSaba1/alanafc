"use client";

import { FileText, ListChecks } from "lucide-react";
import { useState, type ReactNode } from "react";

export function DocumentUploadWizard({ uploadStep, publishStep, startAtPublish = false }: { uploadStep: ReactNode; publishStep: ReactNode; startAtPublish?: boolean }) {
  const [step, setStep] = useState<1 | 2>(startAtPublish ? 2 : 1);

  return <section className="admin-document-wizard">
    <div className="admin-document-wizard__tabs" role="tablist" aria-label="Βήματα διαχείρισης εγγράφου">
      <button type="button" role="tab" id="document-upload-tab" aria-selected={step === 1} aria-controls="document-upload-panel" onClick={() => setStep(1)}><span><b>01</b> Ανέβασμα PDF</span><FileText aria-hidden="true" /></button>
      <button type="button" role="tab" id="document-publish-tab" aria-selected={step === 2} aria-controls="document-publish-panel" onClick={() => setStep(2)}><span><b>02</b> Προσθήκη στη σελίδα</span><ListChecks aria-hidden="true" /></button>
    </div>
    <div id="document-upload-panel" role="tabpanel" aria-labelledby="document-upload-tab" hidden={step !== 1}>{uploadStep}</div>
    <div id="document-publish-panel" role="tabpanel" aria-labelledby="document-publish-tab" hidden={step !== 2}>{publishStep}</div>
  </section>;
}
