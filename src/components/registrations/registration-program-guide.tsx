"use client";

import Image from "next/image";
import { useState } from "react";
import { ParallaxMedia } from "@/components/motion";
import { EditorialButton } from "@/components/ui/editorial-button";
type RegistrationProgramSettings = {
  sectionTitle: string;
  sectionEyebrow: string;
  sectionIntro: string;
  programs: Array<{ id: string; groups: string[]; title: string; text: string; points: string[]; image: string }>;
};

export function RegistrationProgramGuide({ settings }: { settings: RegistrationProgramSettings }) {
  const programs = settings.programs;
  const [selected, setSelected] = useState(0);
  const program = programs[selected];
  const selectAndFocus = (index: number) => {
    const next = (index + programs.length) % programs.length;
    setSelected(next);
    requestAnimationFrame(() => document.getElementById(`program-tab-${programs[next].id}`)?.focus());
  };

  return (
    <section className="registration-programs" aria-labelledby="registration-programs-title">
      <header>
        <div>
          <h2 id="registration-programs-title">{settings.sectionTitle}</h2>
          <p className="eyebrow">{settings.sectionEyebrow}</p>
        </div>
        <p>{settings.sectionIntro}</p>
      </header>

      <div className="registration-programs__tabs" role="tablist" aria-label="Αναπτυξιακά στάδια">
        {programs.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`program-tab-${item.id}`}
            aria-controls={`program-panel-${item.id}`}
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") { event.preventDefault(); selectAndFocus(index + 1); }
              if (event.key === "ArrowLeft") { event.preventDefault(); selectAndFocus(index - 1); }
              if (event.key === "Home") { event.preventDefault(); selectAndFocus(0); }
              if (event.key === "End") { event.preventDefault(); selectAndFocus(programs.length - 1); }
            }}
          >
            <span>0{index + 1}</span>
            <strong>{Array.isArray(item.groups) ? item.groups.join(" · ") : item.groups}</strong>
            <small>{item.title}</small>
          </button>
        ))}
      </div>

      <article
        key={program.id}
        id={`program-panel-${program.id}`}
        role="tabpanel"
        aria-labelledby={`program-tab-${program.id}`}
        className="registration-programs__panel"
      >
        <ParallaxMedia className="registration-programs__media" strength={9} disabled>
          <Image src={program.image} alt={`Πρόγραμμα προπονήσεων τμημάτων ${program.groups.join(", ")} της Alana FC Academy`} width={1600} height={1100} sizes="(max-width: 767px) 100vw, 48vw" />
        </ParallaxMedia>
        <div>
          <p className="eyebrow">{program.groups.join(" · ")}</p>
          <h3>{program.title}</h3>
          <p>{program.text}</p>
          <ul>{program.points.map((point) => <li key={point}>{point}</li>)}</ul>
          <EditorialButton href="#registration-form" label="Εκδήλωση ενδιαφέροντος" arrow="right" variant="outline" />
        </div>
      </article>
    </section>
  );
}
