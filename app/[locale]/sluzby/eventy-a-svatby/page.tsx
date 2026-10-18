import type { Metadata } from "next";
import { siteUrl, ogImage } from "@/lib/config";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { EventsEditorial } from "@/modules/editorial/components/EventsEditorial";

const path = "/sluzby/eventy-a-svatby";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { pages } = await getContent(locale);
  return {
    title: pages.events.metaTitle,
    description: pages.events.metaDescription,
    alternates: { canonical: `/${locale}${path}`, languages: { cs: `/cs${path}`, en: `/en${path}`, "x-default": `/cs${path}` } },
    openGraph: {
      title: pages.events.metaTitle,
      description: pages.events.metaDescription,
      url: `/${locale}${path}`,
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      type: "website",
      siteName: "Guth Pictures",
      images: [ogImage],
    },
    twitter: { card: "summary_large_image", title: pages.events.metaTitle, description: pages.events.metaDescription, images: [ogImage.url] },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [content, images] = await Promise.all([getContent(locale), getImages()]);
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: locale === "en" ? "Events & weddings photography" : "Fotografování eventů a svateb",
    provider: { "@type": "Person", name: "Guth Pictures" },
    areaServed: "CZ",
    url: `${siteUrl}/${locale}${path}`,
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd).replace(/</g, "\\u003c") }} />
    <EventsEditorial locale={locale} content={content} images={images} />
  </>;
}
