import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { siteUrl, ogImage } from "@/lib/config";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { PortraitEditorial } from "@/modules/editorial/components/PortraitEditorial";
import { BrandEditorial } from "@/modules/editorial/components/BrandEditorial";
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
  const [content, images] = await Promise.all([getContent(locale), getImages()]);
  const copy = service === "portretni-foceni" ? content.pages.portrait : content.pages.brand;
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
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\u003c") }} />
      <BrandEditorial locale={locale} content={content} images={images} />
    </>
  );
}
