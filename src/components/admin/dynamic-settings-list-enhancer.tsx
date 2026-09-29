"use client";

import { useEffect } from "react";

const repeaters = {
  heroCount: { prefix: "hero", maximum: 6, label: "Προσθήκη slide" },
  serviceCount: { prefix: "service", maximum: 6, label: "Προσθήκη κάρτας" },
  testimonialCount: { prefix: "testimonial", maximum: 10, label: "Προσθήκη μαρτυρίας" },
  sponsorCount: { prefix: "sponsor", maximum: 8, label: "Προσθήκη χορηγού" },
  navigationCount: { prefix: "navigation", maximum: 10, label: "Προσθήκη συνδέσμου" },
  programCount: { prefix: "program", maximum: 8, label: "Προσθήκη προγράμματος" },
} as const;

function renumber(list: HTMLElement, countInput: HTMLInputElement, prefix: string) {
  const items = Array.from(list.querySelectorAll<HTMLElement>(":scope > fieldset"));
  items.forEach((item, index) => {
    item.dataset.repeatIndex = String(index);
    item.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[name]").forEach((field) => {
      field.name = field.name.replace(new RegExp(`^${prefix}\\.\\d+\\.`), `${prefix}.${index}.`);
    });
    const legend = item.querySelector("legend");
    if (legend) legend.textContent = `${legend.textContent?.replace(/\s+\d+$/, "") || "Στοιχείο"} ${index + 1}`;
  });
  countInput.value = String(items.length);
}

function clearClone(item: HTMLElement) {
  item.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select").forEach((field) => {
    if (field instanceof HTMLInputElement && field.type === "checkbox") field.checked = true;
    else if (field instanceof HTMLInputElement && field.type === "radio") field.checked = false;
    else if (field instanceof HTMLInputElement && field.name.endsWith(".id")) field.value = `stage-${Date.now()}`;
    else field.value = "";
  });
}

export function DynamicSettingsListEnhancer() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    Object.entries(repeaters).forEach(([countName, config]) => {
      const countInput = document.querySelector<HTMLInputElement>(`input[name="${countName}"]`);
      const list = countInput?.nextElementSibling;
      if (!countInput || !(list instanceof HTMLElement) || !list.classList.contains("admin-repeat-list")) return;

      const enhance = () => {
        list.querySelectorAll<HTMLElement>(":scope > fieldset").forEach((item) => {
          item.draggable = true;
          if (item.querySelector(":scope > .admin-repeat-actions")) return;
          const actions = document.createElement("div");
          actions.className = "admin-repeat-actions";
          actions.innerHTML = '<span title="Σύρετε για αλλαγή σειράς">↕ Αλλαγή σειράς</span><button type="button" data-repeat-remove>Διαγραφή</button>';
          item.prepend(actions);
        });
        renumber(list, countInput, config.prefix);
      };

      const add = document.createElement("button");
      add.type = "button";
      add.className = "admin-repeat-add";
      add.textContent = `+ ${config.label}`;
      list.after(add);
      enhance();

      const onAdd = () => {
        const items = list.querySelectorAll<HTMLElement>(":scope > fieldset");
        if (!items.length || items.length >= config.maximum) return;
        const clone = items[items.length - 1].cloneNode(true) as HTMLElement;
        clone.querySelector(":scope > .admin-repeat-actions")?.remove();
        clone.querySelectorAll("[data-media-picker-trigger]").forEach((button) => button.remove());
        clearClone(clone);
        list.append(clone);
        enhance();
        clone.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      const onClick = (event: Event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-repeat-remove]");
        if (!button) return;
        const items = list.querySelectorAll(":scope > fieldset");
        if (items.length <= 1) return;
        button.closest("fieldset")?.remove();
        enhance();
      };
      const onDragStart = (event: DragEvent) => {
        const fieldset = (event.target as HTMLElement).closest<HTMLElement>("fieldset");
        if (!fieldset || fieldset.parentElement !== list || !event.dataTransfer) return;
        event.dataTransfer.setData("text/plain", fieldset.dataset.repeatIndex || "0");
        event.dataTransfer.effectAllowed = "move";
        fieldset.dataset.dragging = "true";
      };
      const onDragEnd = () => list.querySelector<HTMLElement>("[data-dragging]")?.removeAttribute("data-dragging");
      const onDragOver = (event: DragEvent) => { event.preventDefault(); };
      const onDrop = (event: DragEvent) => {
        event.preventDefault();
        const source = list.querySelector<HTMLElement>("[data-dragging]");
        const target = (event.target as HTMLElement).closest<HTMLElement>("fieldset");
        if (!source || !target || target.parentElement !== list || source === target) return;
        const box = target.getBoundingClientRect();
        list.insertBefore(source, event.clientY > box.top + box.height / 2 ? target.nextSibling : target);
        source.removeAttribute("data-dragging");
        renumber(list, countInput, config.prefix);
      };
      add.addEventListener("click", onAdd);
      list.addEventListener("click", onClick);
      list.addEventListener("dragstart", onDragStart);
      list.addEventListener("dragend", onDragEnd);
      list.addEventListener("dragover", onDragOver);
      list.addEventListener("drop", onDrop);
      cleanups.push(() => { add.remove(); list.removeEventListener("click", onClick); list.removeEventListener("dragstart", onDragStart); list.removeEventListener("dragend", onDragEnd); list.removeEventListener("dragover", onDragOver); list.removeEventListener("drop", onDrop); });
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);
  return null;
}
