"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
type MediaOption = { externalId: string; src: string; alt: string; filename: string; width: number | null; height: number | null };
export function MediaPathPicker({ name, defaultValue, media, label = "Εικόνα" }: { name: string; defaultValue: string; media: MediaOption[]; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null); const [selected, setSelected] = useState(defaultValue);
  return <label>{label}<span className="admin-media-picker__field"><input name={name} value={selected} onChange={(event) => setSelected(event.target.value)} required /><button type="button" onClick={() => dialog.current?.showModal()} aria-label={`Επιλογή για ${label}`}><ImageIcon aria-hidden="true" /></button></span><dialog ref={dialog} className="admin-media-picker"><header><strong>Επιλογή εικόνας</strong><button type="button" onClick={() => dialog.current?.close()} aria-label="Κλείσιμο"><X /></button></header><div>{media.map((item) => <button type="button" key={item.externalId} onClick={() => { setSelected(item.src); dialog.current?.close(); }} data-selected={selected === item.src || undefined}><span><Image src={item.src} alt="" fill sizes="160px" /></span><strong>{item.alt}</strong><small>{item.width && item.height ? `${item.width} × ${item.height}` : item.filename}</small></button>)}</div></dialog></label>;
}

export function MediaPickerEnhancer({ media }: { media: MediaOption[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [activeName, setActiveName] = useState<string | null>(null);
  useEffect(() => {
    const buttons: HTMLButtonElement[] = [];
    const enhance = () => document.querySelectorAll<HTMLInputElement>('input[list="owner-media-options"]').forEach((input) => {
        if (input.parentElement?.querySelector("[data-media-picker-trigger]")) return;
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.mediaPickerTrigger = "true";
        button.className = "admin-media-picker-trigger";
        button.textContent = "Επιλογή από πολυμέσα";
        button.addEventListener("click", () => { setActiveName(input.name); dialog.current?.showModal(); });
        input.insertAdjacentElement("afterend", button);
        buttons.push(button);
      });
    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); buttons.forEach((button) => button.remove()); };
  }, []);
  const select = (src: string) => {
    const input = activeName ? document.querySelector<HTMLInputElement>(`input[name="${CSS.escape(activeName)}"]`) : null;
    if (input) { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set; setter?.call(input, src); input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true })); }
    dialog.current?.close();
  };
  return <dialog ref={dialog} className="admin-media-picker"><header><strong>Επιλογή εικόνας</strong><button type="button" onClick={() => dialog.current?.close()} aria-label="Κλείσιμο"><X /></button></header><div>{media.map((item) => <button type="button" key={item.externalId} onClick={() => select(item.src)}><span><Image src={item.src} alt="" fill sizes="160px" /></span><strong>{item.alt}</strong><small>{item.width && item.height ? `${item.width} × ${item.height}` : item.filename}</small></button>)}</div></dialog>;
}
