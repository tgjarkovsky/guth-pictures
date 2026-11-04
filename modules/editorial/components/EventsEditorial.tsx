import { ContactForm } from "@/components/ContactForm";
import type { EditorialImage as Photo, NormalizedContentData, NormalizedSiteImages, ServiceContent } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";
import { EventsHero } from "./EventsHero";

type Props = { locale: string; content: NormalizedContentData; images: NormalizedSiteImages };

type ChapterProps = {
  id: string;
  index: string;
  tag: string;
  heading: string;
  text: string;
  service: ServiceContent;
  list?: string[];
  photos: Photo[];
  locale: string;
};

function Chapter({ id, index, tag, heading, text, service, list, photos, locale }: ChapterProps) {
  const placeholder = locale === "en" ? "Photo coming soon" : "Fotografie bude doplněna";
  // Empty slots show as placeholders only until the first photo is picked.
  const shown = photos.some((photo) => photo.publicId) ? photos.filter((photo) => photo.publicId) : photos;
  return (
    <article id={id} className={`ed-events-chapter ed-events-chapter--${id}`}>
      <div className="ed-events-chapter-text">
        <span className="ed-events-kicker">{index} — {tag}</span>
        <h2>{heading}</h2>
        <p>{text}</p>
        {list && list.length > 0 && <ul>{list.map((item) => <li key={item}>{item}</li>)}</ul>}
        <div className="ed-events-prices">
          {service.packages.map((pkg) => (
            <div key={pkg.id ?? pkg.name}>
              <h3>{pkg.name}</h3>
              <strong>{pkg.price}</strong>
              <p>{[pkg.duration, ...pkg.includes].filter(Boolean).join(" · ")}</p>
            </div>
          ))}
        </div>
        {service.note && <p className="ed-events-note">{service.note}</p>}
      </div>
      <div className="ed-events-gallery">
        {shown.map((photo, i) => (
          <figure key={i}>
            <EditorialImageView image={photo} locale={locale} sizes={i === 0 ? "(max-width: 760px) 100vw, 55vw" : "(max-width: 760px) 50vw, 28vw"} placeholderLabel={placeholder} />
          </figure>
        ))}
      </div>
    </article>
  );
}

export function EventsEditorial({ locale, content, images }: Props) {
  const copy = content.pages.events;
  const { conferences, weddings } = content.sluzby;
  const slots = images.editorial.events;
  return <main className="editorial-events" data-world="events"><EditorialNav tone="light" active="events" />
    <EventsHero locale={locale} copy={copy} title={content.editorial.eventsTitle} tags={{ conference: copy.conferenceTag, wedding: copy.weddingTag }} conference={slots.hero} wedding={slots.weddingHero} />
    <nav className="ed-events-chapters" aria-label={copy.kicker}>
      <a href="#konference"><span>01</span> {copy.conferenceTag}</a>
      <a href="#svatby"><span>02</span> {copy.weddingTag}</a>
    </nav>
    <Chapter id="konference" index="01" tag={copy.conferenceTag} heading={copy.conferenceHeading} text={copy.conferenceText} service={conferences} list={copy.conferenceList} photos={slots.reportage} locale={locale} />
    <Chapter id="svatby" index="02" tag={copy.weddingTag} heading={copy.weddingHeading} text={copy.weddingText} service={weddings} photos={slots.weddingGallery} locale={locale} />
    <section id="kontakt" className="ed-events-contact"><h2>{copy.contactTitle}</h2><ContactForm /></section>
  </main>;
}
