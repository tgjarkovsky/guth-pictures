import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";
import { getVoucherCopy } from "@/modules/vouchers/copy";
import { FlipCard } from "@/modules/vouchers/components/FlipCard";
import { formatDate } from "@/modules/vouchers/lib/dates";
import { voucherLineDetails } from "@/modules/vouchers/lib/portrait-products";
import { orderIdFromGiftToken } from "@/modules/vouchers/lib/service";
import { sampleOrder } from "@/modules/vouchers/lib/sample";
import { getOrder } from "@/modules/vouchers/lib/store";
import type { VoucherOrder } from "@/modules/vouchers/lib/types";

/** /darkovy-poukaz/darek/ukazka?balicek=… — the page with a made-up order, for the admin only. */
const PREVIEW = "ukazka";

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

export default async function GiftPage({ params, searchParams }: { params: Promise<{ locale: string; token: string }>; searchParams: Promise<{ balicek?: string }> }) {
  const { locale: raw, token } = await params;
  const locale = raw === "en" ? "en" : "cs";
  const t = getVoucherCopy(locale).gift;
  let order: VoucherOrder | null = null;
  let files: { front: string; back: string; pdf: string };
  if (token === PREVIEW) {
    if (!(await isAuthenticated())) notFound();
    const balicek = (await searchParams).balicek ?? "";
    order = await sampleOrder(locale, balicek);
    const q = `?locale=${locale}&balicek=${encodeURIComponent(balicek)}`;
    files = { front: `/api/admin/vouchers/preview/front.png${q}`, back: `/api/admin/vouchers/preview/back.png${q}`, pdf: `/api/admin/vouchers/preview${q}` };
  } else {
    const id = await orderIdFromGiftToken(token);
    order = id ? await getOrder(id) : null;
    const base = `/api/vouchers/gift/${token}`;
    files = { front: `${base}/front.png`, back: `${base}/back.png`, pdf: `${base}/poukaz.pdf` };
  }
  if (!order || !order.code || !order.validUntil || (order.status !== "paid" && order.status !== "redeemed")) notFound();

  return (
    <EditorialSubpage active="voucher" className="ed-voucher">
      <section className="ed-gift">
        <div className="ed-gift__card">
          <FlipCard
            front={files.front}
            back={files.back}
            label={t.flip}
            alt={[locale === "cs" ? "Dárkový poukaz — přední strana" : "Gift voucher — front", locale === "cs" ? "Dárkový poukaz — zadní strana" : "Gift voucher — back"]}
          />
        </div>
        <div className="ed-gift__text">
          {token === PREVIEW && <p className="ed-voucher-kicker">{locale === "cs" ? "Náhled s ukázkovými daty · vidíš jen ty" : "Preview with sample data · only you can see this"}</p>}
          <h1>{t.title}</h1>
          <p className="ed-voucher-pay__lead">{t.lead}</p>
          {order.dedication && <blockquote className="ed-gift__dedication">„{order.dedication}“</blockquote>}
          {order.status === "redeemed" ? (
            <p className="ed-voucher-pay__lead">{t.redeemed}</p>
          ) : (
            <div className="ed-voucher-actions">
              <a href={`/${locale}/darkovy-poukaz/uplatnit?kod=${order.code}`} className="ed-voucher-cta">{t.book}</a>
              <a href={files.pdf} className="ed-voucher-link">{t.download}</a>
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
