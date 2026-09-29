"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import { ParallaxMedia } from "@/components/motion/parallax-media";

type HomeNewsCardProps = {
  href: string;
  image: string;
  imageAlt: string;
  title: string;
  eyebrow: string;
};

export function HomeNewsCard({ href, image, imageAlt, title, eyebrow }: HomeNewsCardProps) {
  const cardRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const card = cardRef.current;

      if (!card) return;

      const media = card.querySelector<HTMLElement>("[data-news-media]");
      const line = card.querySelector<HTMLElement>("[data-news-line]");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (media && !reduceMotion) {
        gsap.fromTo(
          media,
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 1.15,
            ease: "power3.inOut",
            scrollTrigger: { trigger: card, start: "top 88%", once: true },
          },
        );
      }

      const enter = () => {
        if (reduceMotion) return;
        if (line) gsap.killTweensOf(line);
        if (line) gsap.to(line, { scaleX: 1, duration: 0.58, ease: "power3.inOut", overwrite: true });
      };
      const leave = () => {
        if (reduceMotion) return;
        if (line) gsap.killTweensOf(line);
        if (line) gsap.to(line, { scaleX: 0, duration: 0.38, ease: "power3.inOut", overwrite: true });
      };

      card.addEventListener("mouseenter", enter);
      card.addEventListener("mouseleave", leave);
      card.addEventListener("focusin", enter);
      card.addEventListener("focusout", leave);

      return () => {
        card.removeEventListener("mouseenter", enter);
        card.removeEventListener("mouseleave", leave);
        card.removeEventListener("focusin", enter);
        card.removeEventListener("focusout", leave);
      };
    },
    { scope: cardRef },
  );

  return (
    <article ref={cardRef} className="home-news-card">
      <Link href={href} className="home-news-card__link" aria-label={`Διαβάστε: ${title}`}>
        <span className="home-news-card__background" aria-hidden="true" />
        <div className="home-news-card__image" data-news-media>
          <ParallaxMedia className="home-news-card__parallax" strength={10}>
            <Image src={image} alt={imageAlt} fill sizes="(min-width: 1024px) 33vw, 100vw" />
          </ParallaxMedia>
          <span className="home-news-card__overlay" aria-hidden="true" />
        </div>
        <div className="home-news-card__meta">
          <p className="eyebrow">{eyebrow}</p>
          <ArrowUpRight aria-hidden="true" size={20} />
        </div>
        <div className="home-news-card__title">
          <h3>{title}</h3>
          <span className="home-news-card__line" data-news-line aria-hidden="true" />
        </div>
      </Link>
    </article>
  );
}
