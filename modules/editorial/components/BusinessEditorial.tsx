import { ContactForm } from "@/components/ContactForm";
import type { NormalizedSiteImages, ServiceContent, Testimonial } from "@/modules/admin/lib/content";
import type { Copy } from "@/modules/business-portraits/copy";
import { EditorialImageView } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";
import { RevealPhone } from "./RevealPhone";
import { WorkGrid } from "./WorkGrid";
import { reviewedWork, type WorkItem } from "./work-items";

type Props = { locale: string; copy: Copy; business: ServiceContent; images: NormalizedSiteImages; testimonials: Testimonial[]; email: string };

// Reviewed business clients first; until there are any, the admin headshots that have a photo.
function workItems(testimonials: Testimonial[], images: NormalizedSiteImages): WorkItem[] {
  const reviewed = reviewedWork(testimonials, "business");
  return reviewed.length > 0 ? reviewed : images.editorial.business.headshots.filter((image) => image.publicId).map((image) => ({ image }));
}

const headshotSizes = () => "(max-width: 760px) 82vw, (min-width: 1440px) 460px, 33vw";

export function BusinessEditorial({ locale, copy, business, images, testimonials, email }: Props) {
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: copy.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  const placeholder = copy.placeholder;
  const work = workItems(testimonials, images);
  return <main className="editorial-business">
    <EditorialNav tone="dark" active="business" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className="ed-business-hero"><div><p className="ed-kicker">{copy.eyebrow}</p><h1>{copy.heroTitle}</h1><p>{copy.heroSubtitle}</p><a className="ed-biz-button" href="#kontakt">{copy.heroCta}</a></div><figure><EditorialImageView image={images.editorial.business.hero} locale={locale} priority sizes="(max-width:760px) 100vw, 50vw" placeholderLabel={placeholder} /></figure></header>
    {work.length > 0 && <section className="ed-business-headshots"><h2>{copy.headshotsTitle}</h2><p>{copy.headshotsDesc}</p><WorkGrid items={work} locale={locale} sizes={work.map(headshotSizes)} placeholderLabel={placeholder} /></section>}
    <section className="ed-business-process"><h2>{copy.stepsTitle}</h2><ol>{copy.steps.map((step, i) => <li key={step.title}><span>0{i + 1}</span><h3>{step.title}</h3><p>{step.desc}</p></li>)}</ol></section>
    <section className="ed-business-pricing"><h2>{copy.pricingTitle}</h2><div>{business.packages.map((pkg) => <article key={pkg.id ?? pkg.name}><h3>{pkg.name}</h3><strong>{pkg.price}</strong><p>{pkg.duration}</p><ul>{pkg.includes.map((item) => <li key={item}>{item}</li>)}</ul><a className="ed-biz-button" href={`?package=${encodeURIComponent(pkg.name)}&service=${encodeURIComponent(business.title)}#kontakt`}>{copy.select}</a></article>)}</div>{business.note && <p>{business.note}</p>}</section>
    <section className="ed-business-faq"><h2>{copy.faqTitle}</h2><div>{copy.faq.map(({ q, a }) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
    <section id="kontakt" className="ed-business-contact"><div><h2>{copy.contactTitle}</h2><p>{copy.contactSubtitle}</p><a className="ed-business-email" href={`mailto:${email}`}>{email}</a><RevealPhone label={locale === "en" ? "Show phone number" : "Zobrazit telefon"} /></div><ContactForm /></section>
  </main>;
}
