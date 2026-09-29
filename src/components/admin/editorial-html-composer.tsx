"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sanitizeEditorHtml } from "@/features/content/core";
import { parseEditorialDraft, type EditorialDraft } from "@/features/content/editor-draft";

type Wrap = { label: string; before: string; after: string; fallback: string; title: string };
const controls: Wrap[] = [
  { label: "P", before: "<p>", after: "</p>", fallback: "Νέα παράγραφος", title: "Παράγραφος" },
  { label: "H2", before: "<h2>", after: "</h2>", fallback: "Νέος υπότιτλος", title: "Υπότιτλος" },
  { label: "B", before: "<strong>", after: "</strong>", fallback: "έντονο κείμενο", title: "Έντονη γραφή" },
  { label: "I", before: "<em>", after: "</em>", fallback: "πλάγιο κείμενο", title: "Πλάγια γραφή" },
  { label: "“ ”", before: "<blockquote>", after: "</blockquote>", fallback: "Παράθεμα", title: "Παράθεμα" },
  { label: "• Λίστα", before: "<ul>\n  <li>", after: "</li>\n</ul>", fallback: "Στοιχείο λίστας", title: "Λίστα" },
  { label: "↗ Link", before: '<a href="https://">', after: "</a>", fallback: "κείμενο συνδέσμου", title: "Σύνδεσμος" },
];

function plainText(value: string) { return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }

export function EditorialHtmlComposer({ initialValue, draftKey, clearDraftKey }: { initialValue: string; draftKey: string; clearDraftKey?: string }) {
  const [value, setValue] = useState(initialValue);
  const [view, setView] = useState<"write" | "preview">("write");
  const [recovery, setRecovery] = useState<EditorialDraft | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Το τοπικό πρόχειρο ενεργοποιείται αυτόματα.");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const storageKey = `alana-editor-draft:${draftKey}`;
  const text = useMemo(() => plainText(value), [value]);
  const words = text ? text.split(" ").length : 0;
  const minutes = Math.max(1, Math.ceil(words / 210));
  const safePreview = useMemo(() => sanitizeEditorHtml(value), [value]);

  useEffect(() => {
    if (!clearDraftKey) return;
    try { window.localStorage.removeItem(`alana-editor-draft:${clearDraftKey}`); } catch { /* Storage may be unavailable. */ }
  }, [clearDraftKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const candidate = parseEditorialDraft(window.localStorage.getItem(storageKey), initialValue);
        if (candidate) setRecovery(candidate);
        else {
          window.localStorage.removeItem(storageKey);
          setDraftReady(true);
        }
      } catch { setDraftReady(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialValue, storageKey]);

  useEffect(() => {
    if (!draftReady || value === initialValue) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ bodyHtml: value, savedAt: new Date().toISOString() } satisfies EditorialDraft));
        setDraftStatus("Το τοπικό πρόχειρο ενημερώθηκε. Η βάση ενημερώνεται μόνο με Αποθήκευση.");
      } catch { setDraftStatus("Το τοπικό πρόχειρο δεν είναι διαθέσιμο. Αποθηκεύστε στη βάση."); }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftReady, initialValue, storageKey, value]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (value !== initialValue) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [initialValue, value]);

  function insert(control: Wrap) {
    const node = textarea.current;
    if (!node) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const selected = value.slice(start, end) || control.fallback;
    const replacement = `${control.before}${selected}${control.after}`;
    setValue(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    window.requestAnimationFrame(() => { node.focus(); node.setSelectionRange(start + control.before.length, start + control.before.length + selected.length); });
  }

  return <div className="editorial-html-composer">
    <input type="hidden" name="bodyHtml" value={value} />
    {recovery ? <div className="editorial-html-composer__recovery" role="status"><div><strong>Βρέθηκε μη αποθηκευμένο τοπικό πρόχειρο.</strong><span>{new Intl.DateTimeFormat("el-GR", { dateStyle: "short", timeStyle: "short" }).format(new Date(recovery.savedAt))}</span></div><div><button type="button" onClick={() => { setValue(recovery.bodyHtml); setRecovery(null); setDraftReady(true); }}>Επαναφορά</button><button type="button" onClick={() => { try { window.localStorage.removeItem(storageKey); } catch { /* Storage may be unavailable. */ } setRecovery(null); setDraftReady(true); }}>Απόρριψη</button></div></div> : null}
    <header><div role="group" aria-label="Μορφοποίηση άρθρου">{controls.map((control) => <button key={control.title} type="button" title={control.title} aria-label={control.title} onClick={() => insert(control)}>{control.label}</button>)}</div><div role="group" aria-label="Προβολή editor"><button type="button" aria-pressed={view === "write"} onClick={() => setView("write")}>Σύνταξη</button><button type="button" aria-pressed={view === "preview"} onClick={() => setView("preview")}>Προεπισκόπηση</button></div></header>
    {view === "write" ? <label>Περιεχόμενο HTML<textarea ref={textarea} value={value} onChange={(event) => setValue(event.target.value)} rows={22} spellCheck={false} placeholder="<p>Γράψτε το περιεχόμενο του άρθρου…</p>" /></label> : <div className="editorial-html-composer__preview"><span>Προεπισκόπηση καθαρισμένου περιεχομένου</span>{safePreview ? <div className="rich-content" dangerouslySetInnerHTML={{ __html: safePreview }} /> : <p>Το άρθρο δεν έχει ακόμη περιεχόμενο.</p>}</div>}
    <footer><span>{words} λέξεις</span><span>Περίπου {minutes} λεπτά ανάγνωσης</span><span>{value.length.toLocaleString("el-GR")} χαρακτήρες HTML</span><span role="status">{draftStatus}</span></footer>
  </div>;
}
