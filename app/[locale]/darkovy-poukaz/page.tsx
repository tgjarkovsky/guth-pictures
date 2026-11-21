import type { Metadata } from "next";
import { ogImage } from "@/lib/config";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";
import { getVoucherCopy } from "@/modules/vouchers/copy";
import { VoucherOrderForm } from "@/modules/vouchers/components/VoucherOrderForm";
import { isPaymentConfigured } from "@/modules/vouchers/lib/config";
import { formatCzk } from "@/modules/vouchers/lib/dates";
import { activeProducts, getVoucherSettings } from "@/modules/vouchers/lib/settings";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getVoucherCopy(locale).meta;
  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `/${locale}/darkovy-poukaz`,
      languages: { cs: "/cs/darkovy-poukaz", en: "/en/darkovy-poukaz", "x-default": "/cs/darkovy-poukaz" },
    },
    openGraph: {
      title: t.title,
      description: t.description,
      url: `/${locale}/darkovy-poukaz`,
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      type: "website",
      siteName: "Guth Pictures",
      images: [{ url: `/api/vouchers/sample/${locale}`, width: 992, height: 699 }, ogImage],
    },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: [`/api/vouchers/sample/${locale}`] },
  };
}

export default async function VoucherPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw === "en" ? "en" : "cs";
  const copy = getVoucherCopy(locale);
  const settings = await getVoucherSettings();
  const products = activeProducts(settings);
  const open = settings.enabled && isPaymentConfigured() && products.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ...products.map((p) => ({
        "@type": "Product",
        name: `${locale === "cs" ? "Dárkový poukaz" : "Gift voucher"}: ${p.name[locale]}`,
        description: p.details[locale].join(", "),
        brand: { "@type": "Brand", name: "Guth Pictures" },
        offers: { "@type": "Offer", price: p.priceCzk, priceCurrency: "CZK", availability: open ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
      })),
      {
        "@type": "FAQPage",
        mainEntity: copy.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  };

  return (
    <EditorialSubpage active="voucher" className="ed-voucher">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="ed-voucher-hero">
        <div className="ed-voucher-hero__copy">
          <p className="ed-voucher-kicker">{settings.christmas ? copy.kickerXmas : copy.kicker}</p>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <a href="#objednat" className="ed-voucher-cta">{copy.cta}</a>
        </div>
        <figure className="ed-voucher-hero__art">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG, not a Cloudinary asset */}
          <img src={`/api/vouchers/sample/${locale}`} width={992} height={699} alt={locale === "cs" ? "Ukázka dárkového poukazu" : "Gift voucher sample"} />
        </figure>
      </section>

      <section className="ed-voucher-steps" aria-labelledby="voucher-steps">
        <h2 id="voucher-steps">{copy.stepsTitle}</h2>
        <ol>
          {copy.steps.map(([title, text], i) => (
            <li key={title}>
              <span>0{i + 1}</span>
              <strong>{title}</strong> {text}
            </li>
          ))}
        </ol>
        {settings.christmas && <p className="ed-voucher-note">{copy.xmasNote}</p>}
      </section>

      <section id="objednat" className="ed-voucher-order" aria-labelledby="voucher-order">
        <h2 id="voucher-order">{copy.orderTitle}</h2>
        {open ? (
          <VoucherOrderForm
            locale={locale}
            copy={copy.form}
            products={products.map((p) => ({ id: p.id, name: p.name[locale], details: p.details[locale], price: formatCzk(p.priceCzk, locale), featured: p.featured }))}
          />
        ) : (
          <p className="ed-secondary-empty">{copy.unavailable}</p>
        )}
      </section>

      <section className="ed-secondary-faq">
        <h2>{copy.faqTitle}</h2>
        <div className="divide-y divide-[var(--color-border)]">
          {copy.faq.map(([q, a]) => (
            <details key={q} className="py-4 group">
              <summary className="cursor-pointer text-lg font-semibold list-none flex justify-between items-center">
                {q}
                <span aria-hidden className="ml-4 text-[var(--color-text-muted)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[var(--color-text-muted)] leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </EditorialSubpage>
  );
}
