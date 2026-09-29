import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { OwnerSponsor } from "@/features/site-settings/owner-content-contract";

export function AcademySponsors({ sponsors }: { sponsors: OwnerSponsor[] }) {
  return <section className="academy-sponsors" aria-labelledby="academy-sponsors-title">
    <header><h2 id="academy-sponsors-title">Οι χορηγοί μας.</h2><p className="eyebrow">Partners</p></header>
    <div className="academy-sponsors__grid">
      {sponsors.map((sponsor) => <a key={sponsor.name} href={sponsor.href} target="_blank" rel="noreferrer" aria-label={`${sponsor.name} — άνοιγμα σε νέα καρτέλα`}>
        <span className="academy-sponsors__logo"><Image src={sponsor.image} alt={`Λογότυπο ${sponsor.name}`} fill sizes="(max-width: 767px) 100vw, 33vw" className="object-contain" /></span>
        <span><strong>{sponsor.name}</strong><ArrowUpRight aria-hidden="true" /></span>
      </a>)}
    </div>
  </section>;
}
