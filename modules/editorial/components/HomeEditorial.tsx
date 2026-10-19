import type { CSSProperties } from "react";
import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import type { NormalizedContentData, NormalizedSiteImages } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";
import { reviewedWork, WorkGrid, type WorkItem } from "./WorkGrid";

type Props = { locale: string; content: NormalizedContentData; images: NormalizedSiteImages };

// Without any reviewed photos the admin-picked stories stand in.
function workItems(content: NormalizedContentData, images: NormalizedSiteImages): WorkItem[] {
  const reviewed = reviewedWork(content.testimonials, "creative");
  return reviewed.length > 0 ? reviewed : images.editorial.home.stories.map((image) => ({ image }));
}

// Tiles crop with object-fit: cover, so a 3:2 landscape photo in a tall tile is sized by the tile's height.
// Widths below cover that worst case for the 12-column rhythm in globals.css (column stops at 1440px)
// and for the 4:5 phone tile, so no photo gets upscaled.
const STORY_WIDTHS = [[64, 925], [37, 530], [37, 530], [64, 925], [64, 925], [64, 925]];
const storySizes = (index: number) => {
  const [vw, px] = STORY_WIDTHS[index % 6];
  return `(max-width: 760px) 160vw, (min-width: 1440px) ${px}px, ${vw}vw`;
};

const em = (value: string) => `${Number.isFinite(Number(value)) ? Number(value) : 0}em`;

// Trailing punctuation of the tagline takes the accent; it stays glued to the last word, so it can't wrap alone.
// The last word gets its own line, shifted by hand (admin) so its letters can line up with the line above.
function Headline({ text, shift, shiftMobile }: { text: string; shift: string; shiftMobile: string }) {
  const mark = /[.!?]$/.test(text) ? text.slice(-1) : "";
  const body = mark ? text.slice(0, -1) : text;
  const split = body.lastIndexOf(" ");
  const last = <>{body.slice(split + 1)}{mark && <span className="ed-home-hero__mark">{mark}</span>}</>;
  if (split < 0) return <h1>{last}</h1>;
  const style = { "--shift": em(shift), "--shift-mobile": em(shiftMobile) } as CSSProperties;
  return <h1 style={style}><span>{body.slice(0, split)}</span> <span className="ed-home-hero__line2">{last}</span></h1>;
}

export function HomeEditorial({ locale, content, images }: Props) {
  const cs = locale !== "en";
  const copy = content.pages.home;
  const work = workItems(content, images);

  return (
    <main className="editorial-home">
      <EditorialNav tone="dark" active="home" />
      <section className="ed-home-hero">
        <Headline text={copy.title} shift={copy.titleShift} shiftMobile={copy.titleShiftMobile} />
        <div className="ed-home-hero__meta">
          {copy.intro && <p>{copy.intro}</p>}
          <nav aria-label={cs ? "Fotografické služby" : "Photography services"} className="ed-service-index">
            <Link href="/sluzby/portretni-foceni"><span>01</span>{copy.creative}</Link>
            <Link href="/firemni-portrety"><span>02</span>{copy.business}</Link>          </nav>
        </div>
        <div className="ed-home-hero__image">
          <EditorialImageView image={images.editorial.home.hero} locale={locale} priority sizes="(max-width: 760px) 100vw, 70vw" placeholderLabel={cs ? "Úvodní fotografie bude doplněna" : "Hero photograph coming soon"} />
        </div>
      </section>

      <section id="tvorba" className="ed-home-work">
        {copy.work && <h2>{copy.work}</h2>}
        <WorkGrid items={work} locale={locale} sizes={storySizes} placeholderLabel={cs ? "Fotografie bude doplněna" : "Photo coming soon"} />
      </section>

      <section id="o-mne" className="ed-home-about">
        <div className="ed-home-about__image">
          <EditorialImageView image={images.editorial.home.photographer} locale={locale} sizes="(max-width: 760px) 100vw, 40vw" placeholderLabel={cs ? "Portrét fotografa" : "Photographer portrait"} />
        </div>
        <div className="ed-home-about__text">
          {copy.aboutKicker && <p className="ed-kicker">{copy.aboutKicker}</p>}
          <h2>{copy.about}</h2>
          <p>{content["o-mne"].bio}</p>
          <ol className="ed-home-about__steps">
            {copy.steps.map((step, i) => (
              <li key={step.title}><span>0{i + 1}</span><h3>{step.title}</h3><p>{step.desc}</p></li>
            ))}
          </ol>
          <Link href="/o-mne" className="ed-home-about__link">{copy.aboutLink}</Link>
        </div>
      </section>

      <section id="kontakt" className="ed-home-contact">
        <h2>{copy.contact}</h2>
        <ContactForm />
      </section>
    </main>
  );
}
