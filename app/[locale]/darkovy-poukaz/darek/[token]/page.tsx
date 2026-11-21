import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";
import { getVoucherCopy } from "@/modules/vouchers/copy";
import { FlipCard } from "@/modules/vouchers/components/FlipCard";
import { formatDate } from "@/modules/vouchers/lib/dates";
import { voucherLineDetails } from "@/modules/vouchers/lib/portrait-products";
import { orderIdFromGiftToken } from "@/modules/vouchers/lib/service";
import { getOrder } from "@/modules/vouchers/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; token: string }> }): Promise<Metadata> {
  const { locale, token } = await params;
  const t = getVoucherCopy(locale).gift;
  const img = `/api/vouchers/gift/${token}/front.png`;
  return {
    title: t.title,
    robots: { index: false, follow: false },
    openGraph: { title: t.title, description: t.lead, images: [{ url: img, width: 930, height: 1311 }] },
    twitter: { card: "summary_large_image", title: t.title, images: [img] },
  };
}

export default async function GiftPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale: raw, token } = await params;
  const locale = raw === "en" ? "en" : "cs";
  const t = getVoucherCopy(locale).gift;
  const id = await orderIdFromGiftToken(token);
  const order = id ? await getOrder(id) : null;
  if (!order || !order.code || !order.validUntil || (order.status !== "paid" && order.status !== "redeemed")) notFound();
  const base = `/api/vouchers/gift/${token}`;

  return (
    <EditorialSubpage active="voucher" className="ed-voucher">
      <section className="ed-gift">
        <div className="ed-gift__card">
          <FlipCard
            front={`${base}/front.png`}
            back={`${base}/back.png`}
            label={t.flip}
            alt={[locale === "cs" ? "Dárkový poukaz — přední strana" : "Gift voucher — front", locale === "cs" ? "Dárkový poukaz — zadní strana" : "Gift voucher — back"]}
          />
        </div>
        <div className="ed-gift__text">
          <h1>{t.title}</h1>
          <p className="ed-voucher-pay__lead">{t.lead}</p>
          {order.dedication && <blockquote className="ed-gift__dedication">„{order.dedication}“</blockquote>}
          {order.status === "redeemed" ? (
            <p className="ed-voucher-pay__lead">{t.redeemed}</p>
          ) : (
            <div className="ed-voucher-actions">
              <a href={`/${locale}/darkovy-poukaz/uplatnit?kod=${order.code}`} className="ed-voucher-cta">{t.book}</a>
              <a href={`${base}/poukaz.pdf`} className="ed-voucher-link">{t.download}</a>
            </div>
          )}
          <dl className="ed-gift__meta">
            <div><dt>{order.product.name}</dt><dd>{voucherLineDetails(order.product.details).join(" · ")}</dd></div>
            <div><dt>{t.code}</dt><dd>{order.code}</dd></div>
            <div><dt>{t.validUntil}</dt><dd>{formatDate(order.validUntil, locale)}</dd></div>
          </dl>
        </div>
      </section>
    </EditorialSubpage>
  );
}
