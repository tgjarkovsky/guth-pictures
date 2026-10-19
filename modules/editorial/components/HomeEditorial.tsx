import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import type { EditorialImage, NormalizedContentData, NormalizedSiteImages, Testimonial } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";

type Props = { locale: string; content: NormalizedContentData; images: NormalizedSiteImages };
type WorkItem = { image: EditorialImage; review?: Testimonial };

const clientPhoto = (t: Testimonial): EditorialImage => ({
  publicId: t.photo ?? "",
  alt: { cs: t.author, en: t.author },
  focal: { desktop: "50% 30%", mobile: "50% 30%" },
});

// Client photos carry their review; without any reviewed photos the admin-picked stories stand in.
function workItems(content: NormalizedContentData, images: NormalizedSiteImages): WorkItem[] {
  const reviewed = content.testimonials.filter((t) => t.photo).map((t) => ({ image: clientPhoto(t), review: t }));
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

// Trailing punctuation of the tagline takes the accent; it stays glued to the last word, so it can't wrap alone.
function Headline({ text }: { text: string }) {
  const mark = /[.!?]$/.test(text) ? text.slice(-1) : "";
  return <h1>{mark ? <>{text.slice(0, -1)}<span className="ed-home-hero__mark">{mark}</span></> : text}</h1>;
}

export function HomeEditorial({ locale, content, images }: Props) {
  const cs = locale !== "en";
  const copy = content.pages.home;
  const work = workItems(content, images);

  return (
    <main className="editorial-home">
      <EditorialNav tone="dark" active="home" />
      <section className="ed-home-hero">
        <Headline text={copy.title} />
        <div className="ed-home-hero__meta">
          {copy.intro && <p>{copy.intro}</p>}
          <nav aria-label={cs ? "Fotografické služby" : "Photography services"} className="ed-service-index">
            <Link href="/sluzby/portretni-foceni"><span>01</span>{copy.creative}</Link>
            <Link href="/firemni-portrety"><span>02</span>{copy.business}</Link>
            <Link href="/sluzby/eventy-a-svatby"><span>03</span>{copy.events}</Link>
          </nav>
        </div>
        <div className="ed-home-hero__image">
          <EditorialImageView image={images.editorial.home.hero} locale={locale} priority sizes="(max-width: 760px) 100vw, 70vw" placeholderLabel={cs ? "Úvodní fotografie bude doplněna" : "Hero photograph coming soon"} />
        </div>
      </section>

      <section id="tvorba" className="ed-home-work">
        {copy.work && <h2>{copy.work}</h2>}
        <div className="ed-home-work__grid">
          {work.map(({ image, review }, index) => (
            <figure key={`${image.publicId}-${index}`} className="ed-home-story" tabIndex={review ? 0 : undefined}>
              <div className="ed-home-story__photo">
                <EditorialImageView image={image} locale={locale} quality="best" sizes={storySizes(index)} placeholderLabel={cs ? "Fotografie bude doplněna" : "Photo coming soon"} />
              </div>
              {review && (
                <figcaption>
                  <blockquote>{review.quote}</blockquote>
                  <span>{review.author}{review.role && `, ${review.role}`}</span>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
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
