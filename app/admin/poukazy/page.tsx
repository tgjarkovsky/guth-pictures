import { AdminShell } from "@/modules/admin/components/AdminShell";
import { AdminVouchers } from "@/modules/vouchers/components/AdminVouchers";
import { isFakturacekConfigured, isPaymentConfigured, voucherConfig } from "@/modules/vouchers/lib/config";
import { getVoucherSettings } from "@/modules/vouchers/lib/settings";
import { listOrders } from "@/modules/vouchers/lib/store";

export const dynamic = "force-dynamic";

export default async function PoukazyPage() {
  const c = voucherConfig();
  const [orders, settings] = await Promise.all([listOrders().catch(() => []), getVoucherSettings()]);
  const setup = [
    { label: "Bankovní účet (VOUCHER_IBAN)", ok: isPaymentConfigured() },
    { label: "Fio API token (automatické párování)", ok: Boolean(c.fioToken) },
    { label: "Resend (odesílání e-mailů)", ok: Boolean(c.resendKey) },
    { label: "Fakturáček (FAKTURACEK_URL, FAKTURACEK_API_TOKEN) — faktury", ok: isFakturacekConfigured() },
    { label: "CRON_SECRET", ok: Boolean(process.env.CRON_SECRET) },
  ];
  return (
    <AdminShell>
      <AdminVouchers initialOrders={orders} initialSettings={settings} setup={setup} />
    </AdminShell>
  );
}
