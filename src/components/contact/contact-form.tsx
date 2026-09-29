"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { EditorialButton } from "@/components/ui/editorial-button";
import { submitContact, type ContactState } from "@/features/contact/actions";

const initialState: ContactState = { status: "idle" };

function ErrorText({ id, errors }: { id: string; errors?: string[] }) {
  return errors?.[0] ? <span id={id} className="registration-form__error" aria-live="polite">{errors[0]}</span> : null;
}

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error") formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  if (state.status === "success") return <div className="registration-success" role="status"><p className="eyebrow">Το μήνυμα καταχωρήθηκε</p><h2>Ευχαριστούμε.</h2><p>{state.message}</p><p>Κωδικός μηνύματος: <strong>{state.reference}</strong></p></div>;

  return <form ref={formRef} action={action} className="registration-form contact-form" noValidate aria-busy={pending}>
    <div className="registration-form__trap" aria-hidden="true"><label>Ιστοσελίδα<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="registration-form__grid">
      <label>Ονοματεπώνυμο *<input name="senderName" autoComplete="name" required aria-invalid={Boolean(state.errors?.senderName)} aria-describedby={state.errors?.senderName ? "sender-name-error" : undefined} /><ErrorText id="sender-name-error" errors={state.errors?.senderName} /></label>
      <label>Email *<input name="senderEmail" type="email" autoComplete="email" required aria-invalid={Boolean(state.errors?.senderEmail)} aria-describedby={state.errors?.senderEmail ? "sender-email-error" : undefined} /><ErrorText id="sender-email-error" errors={state.errors?.senderEmail} /></label>
      <label>Τηλέφωνο<input name="senderPhone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={Boolean(state.errors?.senderPhone)} aria-describedby={state.errors?.senderPhone ? "sender-phone-error" : undefined} /><ErrorText id="sender-phone-error" errors={state.errors?.senderPhone} /></label>
      <label>Θέμα *<input name="subject" required aria-invalid={Boolean(state.errors?.subject)} aria-describedby={state.errors?.subject ? "contact-subject-error" : undefined} /><ErrorText id="contact-subject-error" errors={state.errors?.subject} /></label>
      <label className="registration-form__wide">Μήνυμα *<textarea name="message" rows={7} required aria-invalid={Boolean(state.errors?.message)} aria-describedby={state.errors?.message ? "contact-message-error" : undefined} /><ErrorText id="contact-message-error" errors={state.errors?.message} /></label>
      <label className="registration-form__wide registration-form__consent"><input type="checkbox" name="privacyConsent" value="yes" required aria-invalid={Boolean(state.errors?.privacyConsent)} aria-describedby={state.errors?.privacyConsent ? "contact-privacy-error" : undefined} /><span>Έχω διαβάσει και αποδέχομαι την <Link href="/privacy">πολιτική απορρήτου</Link> και συναινώ στην επεξεργασία των στοιχείων μου για την απάντηση στο μήνυμα. *</span><ErrorText id="contact-privacy-error" errors={state.errors?.privacyConsent} /></label>
    </div>
    {state.status === "error" ? <p className="registration-form__summary" role="alert">{state.message}</p> : null}
    <EditorialButton type="submit" label={pending ? "Αποστολή…" : "Αποστολή μηνύματος"} arrow="right" disabled={pending} />
  </form>;
}
