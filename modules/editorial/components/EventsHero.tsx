"use client";

import { useEffect, useState } from "react";
import type { EditorialImage } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";

type Side = "conference" | "wedding";
type Props = { locale: string; kicker: string; title: string; cta: string; conference: EditorialImage; wedding: EditorialImage };

const COPY = {
  cs: { lead: "Fotím", conference: "konference.", wedding: "svatby.", both: "konference a svatby", conferenceTag: "Konference", weddingTag: "Svatby", conferencePh: "Konferenční fotografie bude doplněna", weddingPh: "Svatební fotografie bude doplněna" },
  en: { lead: "I photograph", conference: "conferences.", wedding: "weddings.", both: "conferences and weddings", conferenceTag: "Conferences", weddingTag: "Weddings", conferencePh: "Conference photo coming soon", weddingPh: "Wedding photo coming soon" },
};

const other = (side: Side): Side => (side === "conference" ? "wedding" : "conference");

export function EventsHero({ locale, kicker, title, cta, conference, wedding }: Props) {
  const t = locale === "en" ? COPY.en : COPY.cs;
  const [active, setActive] = useState<Side>("conference");
  const [hovering, setHovering] = useState(false);

  // Without a pointer resting on a half, the word alternates on its own (touch screens, idle desktop).
  useEffect(() => {
    if (hovering || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive(other), 4000);
    return () => clearInterval(id);
  }, [hovering]);

  const half = (side: Side, image: EditorialImage, tag: string, placeholder: string, index: string) => (
    <figure className={`ed-events-half ed-events-half--${side}`} onPointerEnter={() => { setHovering(true); setActive(side); }}>
      <EditorialImageView image={image} locale={locale} priority sizes="(max-width: 760px) 100vw, 70vw" placeholderLabel={placeholder} />
      <figcaption><span>{index}</span> {tag}</figcaption>
    </figure>
  );

  return (
    <header className="ed-events-hero" data-active={active} onPointerLeave={() => setHovering(false)}>
      {half("conference", conference, t.conferenceTag, t.conferencePh, "01")}
      {half("wedding", wedding, t.weddingTag, t.weddingPh, "02")}
      <div className="ed-events-hero-card">
        <span className="ed-events-kicker">{kicker}</span>
        <h1>
          <span className="ed-sr-only">{t.lead} {t.both}</span>
          <span aria-hidden="true">
            {t.lead}{" "}
            <span className="ed-events-word">
              <span data-side="conference">{t.conference}</span>
              <span data-side="wedding">{t.wedding}</span>
              <span className="ed-events-word-static">{t.both}</span>
            </span>
          </span>
        </h1>
        <p>{title}</p>
        <a href="#kontakt">{cta}</a>
      </div>
    </header>
  );
}
