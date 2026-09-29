"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { EditorialButton } from "@/components/ui/editorial-button";
import { submitRegistration, type RegistrationState } from "@/features/registrations/actions";

const initialState: RegistrationState = { status: "idle" };

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  return errors?.[0] ? <span id={id} className="registration-form__error" aria-live="polite">{errors[0]}</span> : null;
}

export function RegistrationForm({ groups, successMessage }: { groups: string[]; successMessage: string }) {
  const [state, action, pending] = useActionState(submitRegistration, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "error") formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  if (state.status === "success") return <div className="registration-success" role="status"><p className="eyebrow">Η υποβολή ολοκληρώθηκε</p><h2>Είμαστε ένα βήμα πιο κοντά.</h2><p>{state.message === "Η εκδήλωση ενδιαφέροντος καταχωρήθηκε. Θα επικοινωνήσουμε σύντομα μαζί σας." ? successMessage : state.message}</p><p>Κωδικός υποβολής: <strong>{state.reference}</strong></p><p className="registration-success__note">Κρατήστε τον κωδικό για την επικοινωνία σας με την Ακαδημία.</p></div>;

  return <form ref={formRef} action={action} className="registration-form" noValidate aria-busy={pending}>
    <div className="registration-form__trap" aria-hidden="true"><label>Ιστοσελίδα<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <fieldset><legend><span>01</span> Στοιχεία παιδιού</legend><div className="registration-form__grid">
      <label>Ονοματεπώνυμο παιδιού *<input name="childName" autoComplete="off" required aria-invalid={Boolean(state.errors?.childName)} aria-describedby={state.errors?.childName ? "child-name-error" : undefined} /><FieldError id="child-name-error" errors={state.errors?.childName} /></label>
      <label>Έτος γέννησης *<input name="childBirthYear" type="number" inputMode="numeric" min="2008" max={new Date().getFullYear() - 3} required aria-invalid={Boolean(state.errors?.childBirthYear)} aria-describedby={state.errors?.childBirthYear ? "child-birth-year-error" : undefined} /><FieldError id="child-birth-year-error" errors={state.errors?.childBirthYear} /></label>
      <label className="registration-form__wide">Τμήμα ενδιαφέροντος *<select name="preferredGroup" defaultValue="" required aria-invalid={Boolean(state.errors?.preferredGroup)} aria-describedby={state.errors?.preferredGroup ? "preferred-group-error" : undefined}><option value="" disabled>Επιλέξτε τμήμα</option>{groups.map((group) => <option key={group}>{group}</option>)}</select><FieldError id="preferred-group-error" errors={state.errors?.preferredGroup} /></label>
    </div></fieldset>
    <fieldset><legend><span>02</span> Στοιχεία κηδεμόνα</legend><div className="registration-form__grid">
      <label>Ονοματεπώνυμο κηδεμόνα *<input name="guardianName" autoComplete="name" required aria-invalid={Boolean(state.errors?.guardianName)} aria-describedby={state.errors?.guardianName ? "guardian-name-error" : undefined} /><FieldError id="guardian-name-error" errors={state.errors?.guardianName} /></label>
      <label>Σχέση με το παιδί *<input name="guardianRelationship" placeholder="π.χ. Μητέρα, Πατέρας" required aria-invalid={Boolean(state.errors?.guardianRelationship)} aria-describedby={state.errors?.guardianRelationship ? "guardian-relationship-error" : undefined} /><FieldError id="guardian-relationship-error" errors={state.errors?.guardianRelationship} /></label>
      <label>Email *<input name="guardianEmail" type="email" autoComplete="email" required aria-invalid={Boolean(state.errors?.guardianEmail)} aria-describedby={state.errors?.guardianEmail ? "guardian-email-error" : undefined} /><FieldError id="guardian-email-error" errors={state.errors?.guardianEmail} /></label>
      <label>Τηλέφωνο *<input name="guardianPhone" type="tel" autoComplete="tel" inputMode="tel" required aria-invalid={Boolean(state.errors?.guardianPhone)} aria-describedby={state.errors?.guardianPhone ? "guardian-phone-error" : undefined} /><FieldError id="guardian-phone-error" errors={state.errors?.guardianPhone} /></label>
      <label className="registration-form__wide">Διεύθυνση κατοικίας <input name="address" autoComplete="street-address" aria-invalid={Boolean(state.errors?.address)} aria-describedby={state.errors?.address ? "address-error" : undefined} /><FieldError id="address-error" errors={state.errors?.address} /></label>
    </div></fieldset>
    <fieldset><legend><span>03</span> Προτιμήσεις & συναίνεση</legend><div className="registration-form__grid">
      <label className="registration-form__wide">Σημειώσεις <textarea name="notes" rows={5} placeholder="Προηγούμενη εμπειρία, ερωτήσεις ή οτιδήποτε χρειάζεται να γνωρίζουμε." aria-invalid={Boolean(state.errors?.notes)} aria-describedby={state.errors?.notes ? "notes-error" : undefined} /><FieldError id="notes-error" errors={state.errors?.notes} /></label>
      <div className="registration-form__choice" role="radiogroup" aria-invalid={Boolean(state.errors?.photoPreference)} aria-labelledby="photo-preference-label" aria-describedby={state.errors?.photoPreference ? "photo-preference-error" : undefined}><p id="photo-preference-label">Επιτρέπετε τη φωτογράφιση και δημοσίευση υλικού από δράσεις της Ακαδημίας;</p><label><input type="radio" name="photoPreference" value="yes" /> Ναι</label><label><input type="radio" name="photoPreference" value="no" defaultChecked /> Όχι</label><FieldError id="photo-preference-error" errors={state.errors?.photoPreference} /></div>
      <label className="registration-form__consent"><input type="checkbox" name="privacyConsent" value="yes" required aria-invalid={Boolean(state.errors?.privacyConsent)} aria-describedby={state.errors?.privacyConsent ? "registration-privacy-error" : undefined} /><span>Έχω διαβάσει και αποδέχομαι την <Link href="/privacy">πολιτική απορρήτου</Link> και συναινώ στην επεξεργασία των στοιχείων για την επικοινωνία σχετικά με την εγγραφή. *</span><FieldError id="registration-privacy-error" errors={state.errors?.privacyConsent} /></label>
    </div></fieldset>
    <p className="registration-form__notice">Η υποβολή αποτελεί εκδήλωση ενδιαφέροντος και όχι οριστική εγγραφή. Δεν ζητάμε ΑΜΚΑ ή άλλο κρατικό αναγνωριστικό online.</p>
    {state.status === "error" ? <p className="registration-form__summary" role="alert">{state.message}</p> : null}
    <EditorialButton type="submit" label={pending ? "Αποστολή…" : "Υποβολή ενδιαφέροντος"} arrow="right" disabled={pending} />
  </form>;
}
