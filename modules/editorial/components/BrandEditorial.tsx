import { ContactForm } from "@/components/ContactForm";
import type { NormalizedContentData, NormalizedSiteImages } from "@/modules/admin/lib/content";
import { ServiceLinks } from "@/modules/homepage/components/ServiceLinks";
import { EditorialImageView } from "./EditorialImage";
import { EditorialSubpage } from "./EditorialSubpage";

type Props = { locale: string; content: NormalizedContentData; images: NormalizedSiteImages };

export function BrandEditorial({ locale, content, images }: Props) {
  const brand = content.pages.brand;
  const work = images.editorial.brand.work.filter((image) => image.publicId);
  return (
    <EditorialSubpage active="services" className="ed-secondary-service">
      <section className="ed-secondary-hero">
        <p>{brand.kicker}</p>
        <h1>{brand.title}</h1>
        <p>{brand.intro}<a href="#kontakt" className="ed-cta">{brand.cta} →</a></p>
      </section>
      {images.editorial.brand.hero.publicId && (
        <figure className="ed-brand-hero-image"><EditorialImageView image={images.editorial.brand.hero} locale={locale} priority quality="best" sizes="(max-width: 1184px) 100vw, 1184px" /></figure>
      )}
      <section className="ed-secondary-faq">
        <h2>{brand.audienceTitle}</h2>
        <p className="ed-prose">{brand.audience}</p>
      </section>
      {work.length > 0 && (
        <section className="ed-secondary-faq ed-brand-work">
          <h2>{brand.workTitle}</h2>
          <div className="ed-brand-work__grid">
            {work.map((image, i) => <figure key={`${image.publicId}-${i}`}><EditorialImageView image={image} locale={locale} sizes="(max-width: 760px) 100vw, 33vw" /></figure>)}
          </div>
        </section>
      )}
      <section className="ed-secondary-faq">
        <h2>{brand.stepsTitle}</h2>
        <ol className="ed-steps">
          {brand.steps.map((step, i) => <li key={step}><span>0{i + 1}</span><p>{step}</p></li>)}
        </ol>
      </section>
      <section className="ed-secondary-faq">
        <h2>{brand.preparationTitle}</h2>
        <p className="ed-prose">{brand.preparation}</p>
        <h2 className="ed-secondary-faq__next">{brand.deliveryTitle}</h2>
        <p className="ed-prose">{brand.delivery}</p>
      </section>
      <section className="ed-secondary-faq">
        <h2>{brand.pricing}</h2>
        <p className="ed-prose">{brand.questions[2]?.a}</p>
      </section>
      <section className="ed-secondary-faq">
        <h2>{brand.faqTitle}</h2>
        <div className="divide-y divide-[var(--color-border)]">
          {brand.questions.map(({ q, a }) => (
            <details key={q} className="py-4 group">
              <summary className="cursor-pointer text-lg font-semibold list-none flex justify-between items-center">
                {q}
                <span aria-hidden className="ml-4 text-[var(--color-text-muted)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[var(--color-text-muted)] leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
        <ServiceLinks locale={locale} pages={content.pages} />
      </section>
      <section id="kontakt" className="ed-secondary-contact">
        <h2>{brand.contactTitle}</h2>
        <ContactForm />
      </section>
    </EditorialSubpage>
  );
}
