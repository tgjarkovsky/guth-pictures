import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import { siteUrl, ogImage } from "@/lib/config";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { PortraitEditorial } from "@/modules/editorial/components/PortraitEditorial";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";
import { PhotoGrid } from "@/modules/gallery/components/PhotoGrid";
import { ServiceLinks } from "@/modules/homepage/components/ServiceLinks";
import { isServiceSlug, serviceSlugs } from "@/modules/homepage/lib/service-pages";

type Props = { params: Promise<{ locale: string; service: string }> };
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return serviceSlugs.map((service) => ({ service }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, service } = await params;
  if (!isServiceSlug(service)) notFound();
  const { pages } = await getContent(locale);
  const copy = service === "portretni-foceni" ? pages.portrait : pages.brand;
  const path = `/sluzby/${service}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { cs: `/cs${path}`, en: `/en${path}`, "x-default": `/cs${path}` },
    },
    openGraph: { title: copy.title, description: copy.description, url: `/${locale}${path}`, type: "website", images: [ogImage] },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description, images: [ogImage.url] },
  };
}

export default async function ServicePage({ params }: Props) {
  const { locale, service } = await params;
  if (!isServiceSlug(service)) notFound();
  setRequestLocale(locale);
  const cs = locale !== "en";
  const [content, photos, images] = await Promise.all([
    getContent(locale),
    getGalleryPhotos("portfolio").catch(() => []),
    getImages(),
  ]);
  const copy = service === "portretni-foceni" ? content.pages.portrait : content.pages.brand;
  const portraits = photos.filter((photo) => photo.category === "portréty").slice(0, 8);
  const url = `${siteUrl}/${locale}/sluzby/${service}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", "@id": `${url}#service`, name: copy.title, description: copy.description, url,
        provider: { "@id": `${siteUrl}/#business` }, areaServed: { "@type": "City", name: "Praha" } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: cs ? "Domů" : "Home", item: `${siteUrl}/${locale}` },
        { "@type": "ListItem", position: 2, name: cs ? "Služby" : "Services", item: `${siteUrl}/${locale}/sluzby` },
        { "@type": "ListItem", position: 3, name: copy.title, item: url },
      ] },
    ],
  };
  if (service === "portretni-foceni") {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
        <PortraitEditorial locale={locale} content={content} images={images} />
      </>
    );
  }
  const brand = content.pages.brand;
  return (
    <EditorialSubpage active="services" className="ed-secondary-service">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\u003c") }} />
      <section className="ed-secondary-hero">
        <p>{brand.kicker}</p>
        <h1>{brand.title}</h1>
        <p>{brand.intro}<a href="#kontakt" className="ed-cta">{brand.cta} →</a></p>
      </section>
      <section className="ed-secondary-faq">
        <h2>{brand.audienceTitle}</h2>
        <p className="ed-prose">{brand.audience}</p>
      </section>
      {portraits.length > 0 && (
        <section className="ed-secondary-faq">
          <h2>{brand.workTitle}</h2>
          <PhotoGrid photos={portraits} locale={locale} />
          <Link href="/portfolio" className="ed-prose underline">{brand.workLink} →</Link>
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
        <Link href="/o-mne" className="ed-prose underline">{brand.aboutLink}: Tomáš Guth Jarkovský</Link>
      </section>
    </EditorialSubpage>
  );
}
