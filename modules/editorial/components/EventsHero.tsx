"use client";

import { useEffect, useState } from "react";
import type { EditorialImage } from "@/modules/admin/lib/content";
import type { PageCopy } from "@/modules/admin/lib/page-copy";
import { EditorialImageView } from "./EditorialImage";

type Side = "conference" | "wedding";
type Props = {
  locale: string;
  copy: PageCopy["events"];
  title: string;
  tags: Record<Side, string>;
  conference: EditorialImage;
  wedding: EditorialImage;
};

const PLACEHOLDER = {
  cs: { conference: "Konferenční fotografie bude doplněna", wedding: "Svatební fotografie bude doplněna" },
  en: { conference: "Conference photo coming soon", wedding: "Wedding photo coming soon" },
};

const other = (side: Side): Side => (side === "conference" ? "wedding" : "conference");

export function EventsHero({ locale, copy, title, tags, conference, wedding }: Props) {
  const placeholder = locale === "en" ? PLACEHOLDER.en : PLACEHOLDER.cs;
  const [active, setActive] = useState<Side>("conference");
  const [hovering, setHovering] = useState(false);
  // The dimmed half's label pulses as a hint until the visitor reaches that half once.
  const [explored, setExplored] = useState(false);
  const choose = (side: Side) => {
    if (side !== active) setExplored(true);
    setActive(side);
  };

  // Without a pointer resting on a half, the word alternates on its own (touch screens, idle desktop).
  useEffect(() => {
    if (hovering || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive(other), 4000);
    return () => clearInterval(id);
  }, [hovering]);

  const half = (side: Side, image: EditorialImage, index: string) => (
    <figure className={`ed-events-half ed-events-half--${side}`} onPointerEnter={() => { setHovering(true); choose(side); }}>
      <EditorialImageView image={image} locale={locale} priority sizes="(max-width: 760px) 100vw, 70vw" placeholderLabel={placeholder[side]} />
      <figcaption>
        <button type="button" aria-pressed={active === side} onClick={() => choose(side)}>
          <span aria-hidden="true" className="ed-events-hint-arrow">←</span>
          <span className="ed-events-hint-index">{index}</span> {tags[side]}
          <span aria-hidden="true" className="ed-events-hint-arrow">→</span>
        </button>
      </figcaption>
    </figure>
  );

  return (
    <header className="ed-events-hero" data-active={active} data-explored={explored || undefined} onPointerLeave={() => setHovering(false)}>
      {half("conference", conference, "01")}
      {half("wedding", wedding, "02")}
      <div className="ed-events-hero-card">
        <span className="ed-events-kicker">{copy.kicker}</span>
        <h1>
          <span className="ed-sr-only">{copy.heroLead} {copy.heroBoth}</span>
          <span aria-hidden="true">
            {copy.heroLead}{" "}
            <span className="ed-events-word">
              <span data-side="conference">{copy.heroConference}</span>
              <span data-side="wedding">{copy.heroWedding}</span>
              <span className="ed-events-word-static">{copy.heroBoth}</span>
            </span>
          </span>
        </h1>
        <p>{title}</p>
        <a href="#kontakt">{copy.cta}</a>
      </div>
    </header>
  );
}
