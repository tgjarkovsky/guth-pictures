import { Link } from "@/i18n/navigation";

/** One-line promo strip for the home and services pages, shown while voucher sales are on. */
export function VoucherBanner({ locale, christmas }: { locale: string; christmas: boolean }) {
  const cs = locale !== "en";
  const lead = christmas
    ? cs ? "Hledáte vánoční dárek?" : "Looking for a Christmas gift?"
    : cs ? "Hledáte dárek?" : "Looking for a gift?";
  const text = cs
    ? "Darujte portrétní focení. Poukaz v PDF přijde e-mailem do pár minut po zaplacení."
    : "Give a portrait session. The PDF voucher arrives by e-mail minutes after payment.";
  return (
    <aside className="ed-voucher-banner" aria-label={cs ? "Dárkový poukaz" : "Gift voucher"}>
      <p><strong>{lead}</strong> {text}</p>
      <Link href="/darkovy-poukaz">{cs ? "Dárkový poukaz →" : "Gift voucher →"}</Link>
    </aside>
  );
}
