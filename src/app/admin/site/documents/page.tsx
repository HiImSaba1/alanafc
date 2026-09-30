import Link from "next/link";
import { ArrowLeft, ChevronDown, Eye, FileText, Save, Upload } from "lucide-react";
import { DynamicSettingsListEnhancer } from "@/components/admin/dynamic-settings-list-enhancer";
import { DocumentUploadWizard } from "@/components/admin/document-upload-wizard";
import { requireAdmin } from "@/features/admin-auth/session";
import { uploadDocumentAction } from "@/features/content/media-actions";
import { adminDocumentLibrary } from "@/features/content/queries";
import { updateDocumentSettings } from "@/features/site-settings/document-actions";
import { getDocumentSettings } from "@/features/site-settings/document-settings";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const [settings, library, params] = await Promise.all([getDocumentSettings(), adminDocumentLibrary(), searchParams]);
  const saved = params.saved === "1";
  const uploaded = params.uploaded === "1";
  const uploadedExternalId = typeof params.document === "string" ? params.document : "";
  const uploadedDocument = library.find((item) => item.externalId === uploadedExternalId);
  const storedDocuments = settings.documents.length ? settings.documents : [{ id: "document-1", enabled: false, title: "", description: "", mediaExternalId: "", buttonLabel: "Προβολή εγγράφου" }];
  const editableDocuments = uploadedDocument && !storedDocuments.some((item) => item.mediaExternalId === uploadedDocument.externalId)
    ? [...storedDocuments.filter((item) => item.mediaExternalId || item.title), { id: `document-${uploadedDocument.externalId}`, enabled: true, title: uploadedDocument.title, description: uploadedDocument.description, mediaExternalId: uploadedDocument.externalId, buttonLabel: "Προβολή εγγράφου" }]
    : storedDocuments;

  return <main className="admin-site-settings">
    <header className="admin-documents-header"><div><p className="eyebrow">ALANA FC · ΙΣΤΟΣΕΛΙΔΑ</p><h1>Χρήσιμα έγγραφα</h1><p>Ανεβάστε PDF και δημιουργήστε τις κάρτες που εμφανίζονται στη δημόσια σελίδα.</p></div><Link className="admin-header-button" href="/admin/site"><span>Πίσω</span><ArrowLeft aria-hidden="true" /></Link></header>
    {saved ? <p className="admin-media__success" role="status">Οι αλλαγές αποθηκεύτηκαν και δημοσιεύτηκαν.</p> : null}
    {uploaded ? <p className="admin-media__success" role="status">Το PDF ανέβηκε με ασφάλεια και προστέθηκε αυτόματα σε νέα κάρτα παρακάτω. Ελέγξτε τα στοιχεία και πατήστε Αποθήκευση και δημοσίευση.</p> : null}

    <DocumentUploadWizard startAtPublish={uploaded}
      uploadStep={<><div className="admin-repeat-list admin-repeat-list--documents admin-repeat-list--upload"><fieldset><div className="admin-repeat-actions"><span>Νέο αρχείο PDF</span></div><details className="admin-settings-panel" open><summary><span>01</span><div><h2>Μεταφόρτωση PDF</h2><p>Πρώτα ανεβάστε ένα πραγματικό αρχείο PDF έως 10 MB.</p></div><ChevronDown aria-hidden="true" /></summary>
      <form action={uploadDocumentAction} className="admin-site-settings__fields">
        <input type="hidden" name="returnTo" value="documents" />
        <label className="is-wide">Αρχείο PDF<input type="file" name="document" accept="application/pdf,.pdf" required /><small>Προτείνεται συμπιεσμένο αρχείο για γρήγορη λήψη. Το σύστημα ελέγχει το περιεχόμενο και όχι μόνο την κατάληξη.</small></label>
        <label>Τίτλος εγγράφου<input name="title" minLength={3} maxLength={191} required /></label>
        <label className="is-wide">Σύντομη περιγραφή<textarea name="description" rows={3} maxLength={1000} /></label>
        <button type="submit"><Upload aria-hidden="true" /> Μεταφόρτωση PDF</button>
      </form></details></fieldset></div>
      <details className="admin-settings-panel" open><summary><span>02</span><div><h2>Ανεβασμένα PDF</h2><p>Όλα τα διαθέσιμα έγγραφα της βιβλιοθήκης.</p></div><ChevronDown aria-hidden="true" /></summary>
        {library.length ? <div className="admin-repeat-list admin-repeat-list--documents admin-document-library">{library.map((item, index) => { const storedUsage = settings.documents.some((document) => document.mediaExternalId === item.externalId); const pendingUsage = uploadedExternalId === item.externalId; return <fieldset key={item.externalId}><div className="admin-repeat-actions"><span><FileText aria-hidden="true" /> Ανεβασμένο PDF</span></div><details className="admin-settings-panel"><summary><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{item.title}</h2><p>{pendingUsage ? "Νέα κάρτα έτοιμη για αποθήκευση" : storedUsage ? "Χρησιμοποιείται στη σελίδα" : "Δεν έχει προστεθεί στη δημόσια σελίδα"}</p></div><ChevronDown aria-hidden="true" /></summary><div className="admin-site-settings__fields"><div className="is-wide"><strong>{item.filename}</strong><p>{item.description || "Δεν έχει προστεθεί περιγραφή."}</p><small>{(Number(item.byteSize || 0) / 1024 / 1024).toFixed(2)} MB</small></div><a className="admin-document-library__view" href={item.src} target="_blank" rel="noreferrer"><span>Προβολή PDF</span><Eye aria-hidden="true" /></a></div></details></fieldset>; })}</div> : <div className="admin-content-empty"><strong>Δεν έχουν ανέβει PDF.</strong><p>Χρησιμοποιήστε την κάρτα Μεταφόρτωση PDF για το πρώτο αρχείο.</p></div>}
      </details></>}
      publishStep={<form action={updateDocumentSettings}>
      <DynamicSettingsListEnhancer />
      <div className="admin-repeat-list admin-repeat-list--documents admin-repeat-list--page-copy"><fieldset><div className="admin-repeat-actions"><span>Περιεχόμενο δημόσιας σελίδας</span></div><details className="admin-settings-panel" open>
        <summary><span>02</span><div><h2>Κείμενα σελίδας</h2><p>Τίτλος και εισαγωγή της δημόσιας σελίδας.</p></div><ChevronDown aria-hidden="true" /></summary>
        <div className="admin-site-settings__fields"><label>Μικρός τίτλος<input name="eyebrow" defaultValue={settings.eyebrow} required /></label><label>Κύριος τίτλος<input name="title" defaultValue={settings.title} required /></label><label className="is-wide">Εισαγωγή<textarea name="intro" rows={4} defaultValue={settings.intro} required /></label></div>
      </details></fieldset></div>

      <details className="admin-settings-panel" open>
        <summary><span>03</span><div><h2>Κάρτες εγγράφων</h2><p>Ενεργοποιήστε, ταξινομήστε με Πάνω/Κάτω και συνδέστε κάθε κάρτα με ένα PDF.</p></div><ChevronDown aria-hidden="true" /></summary>
        <input type="hidden" name="documentCount" value={editableDocuments.length} />
        <div className="admin-repeat-list admin-repeat-list--documents">{editableDocuments.map((document, index) => <fieldset key={document.id}><details className="admin-settings-panel"><summary><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{document.title || `Νέο έγγραφο ${index + 1}`}</h2><p>{document.enabled ? "Ενεργό στη δημόσια σελίδα" : "Ανενεργό · δεν εμφανίζεται δημόσια"}</p></div><ChevronDown aria-hidden="true" /></summary><input type="hidden" name={`document.${index}.id`} defaultValue={document.id} /><div className="admin-site-settings__fields"><label className="admin-setting-toggle"><input type="checkbox" name={`document.${index}.enabled`} defaultChecked={document.enabled} /> Ενεργό</label><label>Τίτλος<input name={`document.${index}.title`} defaultValue={document.title} maxLength={191} /></label><label>Κείμενο κουμπιού<input name={`document.${index}.buttonLabel`} defaultValue={document.buttonLabel} required /></label><label className="is-wide">Περιγραφή<textarea name={`document.${index}.description`} rows={3} defaultValue={document.description} maxLength={1000} /></label><label className="is-wide">Αρχείο PDF<select name={`document.${index}.mediaExternalId`} defaultValue={document.mediaExternalId}><option value="">Επιλέξτε PDF</option>{library.map((item) => <option key={item.externalId} value={item.externalId}>{item.title} · {(Number(item.byteSize || 0) / 1024 / 1024).toFixed(2)} MB</option>)}</select></label></div></details></fieldset>)}</div>
      </details>

      <div className="admin-site-settings__submit"><button type="submit"><Save aria-hidden="true" /> Αποθήκευση και δημοσίευση</button><p>Οι ενεργές κάρτες εμφανίζονται αμέσως στη σελίδα Χρήσιμα Έγγραφα.</p></div>
    </form>} />
  </main>;
}
