"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useActionState, useState } from "react";
import { saveContentAction, type ContentEditorState } from "@/features/content/admin-actions";
import { suggestGreeklishSlug } from "@/features/content/core";
import { articleTemplateCatalog, type ArticleTemplateKey } from "@/features/content/template-catalog";
import { articleTemplateKeys } from "@/lib/content-template-keys";
import { EditorialHtmlComposer } from "./editorial-html-composer";

type InitialContent = { id?: number; kind: "page" | "post"; articleTemplate: ArticleTemplateKey; title: string; slug: string; excerpt: string; bodyHtml: string; seoTitle: string; seoDescription: string; categories: string; featuredMediaExternalId: string; galleryMediaExternalIds: string; publicationStatus: "draft" | "published" | "scheduled" | "archived"; scheduledFor: string };
type MediaChoice = { externalId: string; src: string; alt: string; filename: string; width: number | null; height: number | null };
const initialState: ContentEditorState = {};
const steps = ["Template", "Βασικά", "Περιεχόμενο", "SEO & media", "Δημοσίευση"] as const;

export function ContentEditor({ initial, mediaLibrary = [], clearDraftKey }: { initial: InitialContent; mediaLibrary?: MediaChoice[]; clearDraftKey?: string }) {
  const [state, action, pending] = useActionState(saveContentAction, initialState);
  const [step, setStep] = useState(1);
  const [articleTemplate, setArticleTemplate] = useState<ArticleTemplateKey>(initial.articleTemplate);
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);
  const [featuredMediaExternalId, setFeaturedMediaExternalId] = useState(initial.featuredMediaExternalId);
  const [galleryMediaExternalIds, setGalleryMediaExternalIds] = useState(() => initial.galleryMediaExternalIds.split(",").map((value) => value.trim()).filter(Boolean));

  return <form action={action} className="article-editor" noValidate data-wizard-step={step}>
    {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
    <input type="hidden" name="articleTemplate" value={articleTemplate} />
    <header className="article-editor__heading">
      <div><Link href="/admin/content" className="article-editor__back">← Όλο το περιεχόμενο</Link><p>Συντακτικό περιβάλλον / {initial.id ? "Επεξεργασία" : "Νέο άρθρο"}</p><h1>{initial.id ? "Επεξεργασία ιστορίας" : "Γράψε μια νέα ιστορία."}</h1></div>
      <div className="article-editor__heading-status"><span>Βήμα 0{step} / 05</span><strong>{initial.publicationStatus}</strong></div>
    </header>
    {state.error ? <p className="article-editor__error" role="alert">{state.error}</p> : null}
    <nav className="article-editor__wizard-progress" aria-label="Βήματα επεξεργασίας περιεχομένου">
      {steps.map((label, index) => <button key={label} type="button" onClick={() => setStep(index + 1)} aria-current={step === index + 1 ? "step" : undefined}><span>0{index + 1}</span>{label}</button>)}
    </nav>
    <div className="article-editor__canvas">
      <section className="article-editor__panel" hidden={step !== 1}>
        <p className="article-editor__eyebrow">Δομή ιστορίας</p><h2>Επίλεξε template άρθρου.</h2>
        <div className="admin-template-picker">
          {articleTemplateKeys.map((key) => { const item = articleTemplateCatalog[key]; const selected = articleTemplate === key; return <button key={key} type="button" className="admin-template-picker__card" data-selected={selected || undefined} onClick={() => setArticleTemplate(key)} aria-pressed={selected}>
            <span className={`admin-template-picker__visual admin-template-picker__visual--${item.visual}`} aria-hidden="true"><i /><i /><i /><i /></span>
            <span className="admin-template-picker__copy"><strong>{item.label}</strong><small>{item.description}</small></span>
            <span className="admin-template-picker__check" aria-hidden="true"><Check /></span>
          </button>; })}
        </div>
      </section>
      <section className="article-editor__panel" hidden={step !== 2}>
        <p className="article-editor__eyebrow">Τίτλος / ιστορία</p><h2>Τα βασικά του περιεχομένου.</h2>
        <div className="article-editor__two-cols"><label>Τύπος<select name="kind" defaultValue={initial.kind}><option value="post">Άρθρο</option><option value="page">Σελίδα</option></select></label><label>Slug<input name="slug" value={slug} onChange={(event) => { setSlug(event.target.value); setSlugTouched(true); }} required maxLength={191} placeholder="titlos-arthrou" /><small>ASCII πρόταση από τον τίτλο. Μπορείτε να την αλλάξετε.</small></label></div>
        <label>Τίτλος<input className="article-editor__title-input" name="title" value={title} onChange={(event) => { const nextTitle = event.target.value; setTitle(nextTitle); if (!slugTouched) setSlug(nextTitle.trim() ? suggestGreeklishSlug(nextTitle) : ""); }} required maxLength={300} lang="el" spellCheck placeholder="Ποια ιστορία θέλετε να πείτε;" /></label>
        <label>Σύντομη περιγραφή<textarea name="excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={4} maxLength={1000} lang="el" spellCheck placeholder="Μια σύντομη εισαγωγή για τις κάρτες και την αρχική σελίδα." /></label>
      </section>
      <section className="article-editor__panel" hidden={step !== 3}>
        <p className="article-editor__eyebrow">Κύριο κείμενο</p><div className="article-editor__content-heading"><div><h2>Περιεχόμενο άρθρου</h2><p>HTML περιεχόμενο από τον ασφαλή editor της Alana FC.</p></div><span>ARTICLE / BODY</span></div>
        <EditorialHtmlComposer initialValue={initial.bodyHtml} draftKey={initial.id ? `content-${initial.id}` : "new-content"} clearDraftKey={clearDraftKey} />
        <label>Κατηγορίες, χωρισμένες με κόμμα<input name="categories" defaultValue={initial.categories} placeholder="Ακαδημία, Αγώνες, Ανακοινώσεις" /></label>
      </section>
      <section className="article-editor__panel" hidden={step !== 4}>
        <p className="article-editor__eyebrow">Αναζήτηση & κοινοποίηση</p><h2>SEO και εικόνες.</h2>
        <div className="article-editor__two-cols"><label>SEO τίτλος<input name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} maxLength={300} lang="el" spellCheck /></label><label>SEO περιγραφή<textarea name="seoDescription" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} rows={4} maxLength={500} lang="el" spellCheck /></label></div>
        <div className="article-editor__seo-preview"><span>ΠΡΟΕΠΙΣΚΟΠΗΣΗ ΑΝΑΖΗΤΗΣΗΣ</span><strong>{seoTitle || title || "Τίτλος άρθρου"}</strong><small>alanafc.gr/news/{slug || "slug"}</small><p>{seoDescription || excerpt || "Σύντομη περιγραφή του άρθρου."}</p></div>
        <input type="hidden" name="featuredMediaExternalId" value={featuredMediaExternalId} /><input type="hidden" name="galleryMediaExternalIds" value={galleryMediaExternalIds.join(",")} />
        <div className="article-media-picker">
          <header><div><strong>Βιβλιοθήκη media</strong><p>Επιλέξτε κεντρική εικόνα ή προσθέστε εικόνες στη συλλογή.</p></div><span>{mediaLibrary.length} διαθέσιμες</span></header>
          {mediaLibrary.length ? <div className="article-media-picker__grid">{mediaLibrary.map((item) => { const featured = featuredMediaExternalId === item.externalId; const gallerySelected = galleryMediaExternalIds.includes(item.externalId); return <article key={item.externalId} data-featured={featured || undefined} data-gallery={gallerySelected || undefined}>
            <Image src={item.src} alt={item.alt} width={item.width || 640} height={item.height || 420} sizes="(max-width: 760px) 50vw, 16vw" />
            <div><strong title={item.filename}>{item.alt}</strong><small>{item.externalId}</small></div>
            <footer><button type="button" aria-pressed={featured} onClick={() => setFeaturedMediaExternalId(featured ? "" : item.externalId)}>{featured ? "Κεντρική ✓" : "Ως κεντρική"}</button><button type="button" aria-pressed={gallerySelected} onClick={() => setGalleryMediaExternalIds((current) => gallerySelected ? current.filter((id) => id !== item.externalId) : [...current, item.externalId].slice(0, 40))}>{gallerySelected ? "Συλλογή ✓" : "+ Συλλογή"}</button></footer>
          </article>; })}</div> : <p className="article-media-picker__empty">Δεν υπάρχουν ακόμη έτοιμα media στη βιβλιοθήκη.</p>}
        </div>
      </section>
      <section className="article-editor__panel article-editor__review" hidden={step !== 5}>
        <p className="article-editor__eyebrow">Τελικός έλεγχος</p><h2>{title || "Χωρίς τίτλο"}</h2>
        <dl><div><dt>Template</dt><dd>{articleTemplateCatalog[articleTemplate].label}</dd></div><div><dt>Διεύθυνση</dt><dd>/news/{slug || "—"}</dd></div><div><dt>Απόσπασμα</dt><dd>{excerpt || "Δεν έχει συμπληρωθεί"}</dd></div><div><dt>SEO</dt><dd>{seoTitle && seoDescription ? "Συμπληρωμένο" : "Χρειάζεται έλεγχο"}</dd></div><div><dt>Κατάσταση</dt><dd>{initial.publicationStatus}</dd></div></dl>
        <label>Προγραμματισμός<input type="datetime-local" name="scheduledFor" defaultValue={initial.scheduledFor} /></label>
        <div className="article-editor__actions">
          <button name="intent" value="save" disabled={pending}>Αποθήκευση πρόχειρου</button><button name="intent" value="publish" disabled={pending}>Δημοσίευση</button><button name="intent" value="schedule" disabled={pending}>Προγραμματισμός</button>
          {initial.publicationStatus === "published" || initial.publicationStatus === "scheduled" ? <button name="intent" value="unpublish" disabled={pending}>Απόσυρση</button> : null}{initial.id ? <button className="is-danger" name="intent" value="archive" disabled={pending}>Αρχειοθέτηση</button> : null}
        </div>
      </section>
    </div>
    <footer className="article-editor__wizard-navigation"><button type="button" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1}><ChevronLeft aria-hidden="true" />Προηγούμενο</button><span>Βήμα {step} από 5</span>{step < 5 ? <button type="button" onClick={() => setStep((value) => Math.min(5, value + 1))}>Επόμενο<ChevronRight aria-hidden="true" /></button> : <span />}</footer>
  </form>;
}
