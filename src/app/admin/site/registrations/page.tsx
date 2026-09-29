import Link from "next/link";
import { ChevronDown, Save } from "lucide-react";
import { DynamicSettingsListEnhancer } from "@/components/admin/dynamic-settings-list-enhancer";
import { MediaPickerEnhancer } from "@/components/admin/media-path-picker";
import { requireAdmin } from "@/features/admin-auth/session";
import { adminMediaLibrary } from "@/features/content/queries";
import { updateRegistrationSettings } from "@/features/site-settings/actions";
import { getRegistrationSettings } from "@/features/site-settings/registration-settings";

export const dynamic = "force-dynamic";

export default async function RegistrationSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const saved = (await searchParams).saved === "1";
  const [settings, media] = await Promise.all([getRegistrationSettings(), adminMediaLibrary(120)]);
  return <main className="admin-content admin-site-settings">
    <header><div><p className="eyebrow">ALANA FC · ΔΙΑΧΕΙΡΙΣΗ</p><h1>Σελίδα εγγραφών</h1><p>Ανοίξτε μόνο την ενότητα που θέλετε να αλλάξετε.</p></div><div className="admin-content__header-actions"><Link href="/eggrafes-2026-2027" target="_blank">Προβολή σελίδας</Link><Link href="/admin/site">Πίσω στις σελίδες</Link></div></header>
    {saved ? <p className="admin-media__success" role="status">Οι αλλαγές αποθηκεύτηκαν και δημοσιεύτηκαν στη σελίδα εγγραφών.</p> : null}
    <form action={updateRegistrationSettings} className="admin-editor admin-site-settings__form admin-settings-accordion">
      <datalist id="owner-media-options">{media.map((item) => <option key={item.externalId} value={item.src}>{item.alt}</option>)}</datalist>
      <DynamicSettingsListEnhancer />
      <MediaPickerEnhancer media={media.map((item) => ({ externalId: item.externalId, src: item.src, alt: item.alt, filename: item.filename, width: item.width, height: item.height }))} />
      <details className="admin-settings-panel"><summary><span>00</span><div><h2>Λειτουργία φόρμας & email</h2><p>Άνοιγμα/κλείσιμο, μηνύματα και παραλήπτες ειδοποιήσεων.</p></div><ChevronDown aria-hidden="true" /></summary><div className="admin-site-settings__fields"><label className="admin-setting-toggle"><input type="checkbox" name="isOpen" defaultChecked={settings.isOpen} /> Οι online εγγραφές είναι ανοιχτές</label><label className="is-wide">Μήνυμα όταν είναι κλειστές<textarea name="closedMessage" rows={3} defaultValue={settings.closedMessage} required /></label><label className="is-wide">Μήνυμα επιτυχίας<textarea name="successMessage" rows={3} defaultValue={settings.successMessage} required /></label><label className="is-wide">Κείμενο ευχαριστήριου email<textarea name="guardianEmailMessage" rows={4} defaultValue={settings.guardianEmailMessage} required /></label><label className="is-wide">Παραλήπτες ειδοποίησης<textarea name="notificationRecipients" rows={3} defaultValue={settings.notificationRecipients.join("\n")} required /><small>Ένα email ανά γραμμή. Δεν εμφανίζονται SMTP κωδικοί.</small></label></div></details>
      <details className="admin-settings-panel"><summary><span>01</span><div><h2>Κεντρικό μήνυμα</h2><p>Κείμενα της πρώτης ενότητας της σελίδας.</p></div><ChevronDown aria-hidden="true" /></summary><div className="admin-site-settings__fields">
        <label>Σεζόν<input name="season" defaultValue={settings.season} required /></label>
        <label>Κατάσταση εγγραφών<input name="statusText" defaultValue={settings.statusText} required /></label>
        {settings.titleLines.map((line, index) => <label key={index}>Τίτλος · γραμμή {index + 1}<input name={`titleLine${index + 1}`} defaultValue={line} required /></label>)}
        <label className="is-wide">Εισαγωγικό κείμενο<textarea name="intro" rows={3} defaultValue={settings.intro} required /></label>
      </div></details>
      <details className="admin-settings-panel"><summary><span>02</span><div><h2>Παρουσίαση τμημάτων</h2><p>Τα τμήματα που γράφονται στις ομάδες εμφανίζονται αυτόματα και στο dropdown της φόρμας.</p></div><ChevronDown aria-hidden="true" /></summary><div className="admin-site-settings__fields">
        <label>Τίτλος ενότητας<input name="sectionTitle" defaultValue={settings.sectionTitle} required /></label>
        <label>Μικρός τίτλος<input name="sectionEyebrow" defaultValue={settings.sectionEyebrow} required /></label>
        <label className="is-wide">Επεξήγηση<textarea name="sectionIntro" rows={3} defaultValue={settings.sectionIntro} required /></label>
      </div></details>
      <input type="hidden" name="programCount" value={settings.programs.length} />
      <div className="admin-repeat-list admin-repeat-list--programs">{settings.programs.map((program, index) => <fieldset key={program.id}><details className="admin-settings-panel"><summary><span>{String(index + 3).padStart(2, "0")}</span><div><h2>{program.title}</h2><p>Καρτέλα προγράμματος {index + 1}</p></div><ChevronDown aria-hidden="true" /></summary><input type="hidden" name={`program.${index}.id`} value={program.id} /><div className="admin-site-settings__fields">
        <label>Τμήματα<input name={`program.${index}.groups`} defaultValue={program.groups.join(", ")} required /><small>Χωρίστε τα με κόμμα, π.χ. K6, K7, K8.</small></label>
        <label>Τίτλος<input name={`program.${index}.title`} defaultValue={program.title} required /></label>
        <label className="is-wide">Περιγραφή<textarea name={`program.${index}.text`} rows={4} defaultValue={program.text} required /></label>
        <label className="is-wide">Σημεία<textarea name={`program.${index}.points`} rows={3} defaultValue={program.points.join("\n")} required /><small>Ένα σημείο ανά γραμμή.</small></label>
        <label className="is-wide">Διαδρομή εικόνας<input list="owner-media-options" name={`program.${index}.image`} defaultValue={program.image} required /><small>Για νέα εικόνα: πρώτα ανεβάστε τη στα media και κρατήστε την περίπου 250–300 KB.</small></label>
      </div></details></fieldset>)}</div>
      <div className="admin-site-settings__submit"><button type="submit"><Save aria-hidden="true" /> Αποθήκευση και δημοσίευση</button><p>Οι αλλαγές εφαρμόζονται αμέσως. Δεν απαιτείται δεύτερο κουμπί δημοσίευσης.</p></div>
    </form>
  </main>;
}
