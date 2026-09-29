"use client";

import Image from "next/image";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { ParallaxMedia } from "@/components/motion";
import { EditorialButton } from "@/components/ui/editorial-button";
import { siteConfig } from "@/lib/site";

export function PrivacyMap() {
  const [enabled, setEnabled] = useState(false);

  return (
    <section className="contact-location" aria-labelledby="contact-location-title">
      <header>
        <div>
          <h2 id="contact-location-title">Ελάτε στο γήπεδο.</h2>
          <p className="eyebrow">Η τοποθεσία μας</p>
        </div>
        <address>{siteConfig.address}</address>
      </header>

      <div className="contact-location__map">
        {enabled ? (
          <iframe
            title="Χάρτης τοποθεσίας Alana FC Academy"
            src={siteConfig.mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer"
            allowFullScreen
          />
        ) : (
          <div className="contact-location__consent">
            <ParallaxMedia className="contact-location__image" strength={8}>
              <Image src="/alana_fc_academy_images_wordpress/alana_corner_flag.jpg" alt="Το γήπεδο της Alana FC Academy" fill sizes="100vw" className="object-cover" />
            </ParallaxMedia>
            <span className="contact-location__overlay" aria-hidden="true" />
            <div>
              <MapPin aria-hidden="true" />
              <h3>Δείτε τη διαδρομή.</h3>
              <p>Ο διαδραστικός χάρτης παρέχεται από τη Google και φορτώνεται μόνο εφόσον το επιλέξετε.</p>
              <button type="button" className="editorial-button editorial-button--light" onClick={() => setEnabled(true)}>
                <span className="editorial-button__fill" aria-hidden="true" />
                <span className="editorial-button__label"><span>Φόρτωση χάρτη</span><span aria-hidden="true">Φόρτωση χάρτη</span></span>
                <span className="editorial-button__arrow" aria-hidden="true"><MapPin /></span>
              </button>
            </div>
          </div>
        )}
      </div>

      <footer>
        <p>Μπορείτε επίσης να ανοίξετε την τοποθεσία απευθείας στην εφαρμογή χαρτών της συσκευής σας.</p>
        <EditorialButton href={siteConfig.mapDirectionsUrl} label="Οδηγίες πρόσβασης" arrow="up-right" variant="outline" target="_blank" rel="noreferrer" />
      </footer>
    </section>
  );
}
