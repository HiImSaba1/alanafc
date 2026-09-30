"use client";

import { useEffect } from "react";

const repeaters = {
  homepageSectionCount: { prefix: "homepageSection", maximum: 6, label: "", locked: true },
  registrationSectionCount: { prefix: "registrationSection", maximum: 2, label: "", locked: true },
  heroCount: { prefix: "hero", maximum: 6, label: "Προσθήκη slide" },
  serviceCount: { prefix: "service", maximum: 6, label: "Προσθήκη κάρτας" },
  testimonialCount: { prefix: "testimonial", maximum: 10, label: "Προσθήκη μαρτυρίας" },
  sponsorCount: { prefix: "sponsor", maximum: 8, label: "Προσθήκη χορηγού" },
  navigationCount: { prefix: "navigation", maximum: 10, label: "Προσθήκη συνδέσμου" },
  programCount: { prefix: "program", maximum: 8, label: "Προσθήκη προγράμματος" },
  documentCount: { prefix: "document", maximum: 40, label: "Προσθήκη εγγράφου" },
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
    const cardIndex = item.querySelector<HTMLElement>(":scope > details > summary > span:first-child");
    if (cardIndex && /^\d+$/.test(cardIndex.textContent?.trim() || "")) cardIndex.textContent = String(index + 1).padStart(2, "0");
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
        const orderingHelp = list.closest("details")?.querySelector<HTMLElement>("summary p");
        if (orderingHelp?.textContent?.startsWith("Σύρετε")) orderingHelp.textContent = "Χρησιμοποιήστε τα κουμπιά Πάνω/Κάτω για να αλλάξετε τη σειρά.";
        list.querySelectorAll<HTMLElement>(":scope > fieldset").forEach((item) => {
          if (item.querySelector(":scope > .admin-repeat-actions")) return;
          const actions = document.createElement("div");
          actions.className = "admin-repeat-actions";
          actions.innerHTML = `<span>Αλλαγή σειράς</span><button type="button" data-repeat-up aria-label="Μετακίνηση πάνω">↑ Πάνω</button><button type="button" data-repeat-down aria-label="Μετακίνηση κάτω">↓ Κάτω</button>${"locked" in config && config.locked ? "" : '<button type="button" data-repeat-remove>Διαγραφή</button>'}`;
          item.prepend(actions);
        });
        renumber(list, countInput, config.prefix);
        const items = Array.from(list.querySelectorAll<HTMLElement>(":scope > fieldset"));
        items.forEach((item, index) => {
          const up = item.querySelector<HTMLButtonElement>("[data-repeat-up]");
          const down = item.querySelector<HTMLButtonElement>("[data-repeat-down]");
          if (up) up.disabled = index === 0;
          if (down) down.disabled = index === items.length - 1;
        });
      };

      const add = document.createElement("button");
      add.type = "button";
      add.className = "admin-repeat-add";
      add.textContent = `+ ${config.label}`;
      if (!("locked" in config && config.locked)) list.after(add);
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
        const moveUp = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-repeat-up]");
        const moveDown = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-repeat-down]");
        const item = (event.target as HTMLElement).closest<HTMLElement>("fieldset");
        if (item?.parentElement === list && moveUp && item.previousElementSibling) {
          list.insertBefore(item, item.previousElementSibling);
          enhance();
          item.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        if (item?.parentElement === list && moveDown && item.nextElementSibling) {
          list.insertBefore(item.nextElementSibling, item);
          enhance();
          item.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-repeat-remove]");
        if (!button) return;
        const items = list.querySelectorAll(":scope > fieldset");
        if (items.length <= 1) return;
        button.closest("fieldset")?.remove();
        enhance();
      };
      add.addEventListener("click", onAdd);
      list.addEventListener("click", onClick);
      cleanups.push(() => { add.remove(); list.removeEventListener("click", onClick); });
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);
  return null;
}
