"use client";

import { useMemo, useState } from "react";
import { messageClass, useAdminAction } from "@/modules/admin/components/useAdminAction";
import type { OrderStatus, VoucherOrder, VoucherSettings } from "../lib/types";

type Props = {
  initialOrders: VoucherOrder[];
  initialSettings: VoucherSettings;
  setup: { label: string; ok: boolean }[];
};

const STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: "čeká na platbu", cls: "bg-amber-900/40 text-amber-300" },
  paid: { label: "zaplaceno", cls: "bg-green-900/40 text-green-300" },
  redeemed: { label: "uplatněno", cls: "bg-blue-900/40 text-blue-300" },
  expired: { label: "vypršelo", cls: "bg-white/10 text-gray-400" },
  cancelled: { label: "storno", cls: "bg-red-900/40 text-red-300" },
};

const czk = (n: number) => `${new Intl.NumberFormat("cs-CZ").format(n)} Kč`;
const dt = (iso?: string) => (iso ? new Date(iso).toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const d = (iso?: string) => (iso ? iso.split("-").reverse().map(Number).join(". ") : "");

export function AdminVouchers({ initialOrders, initialSettings, setup }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"orders" | "settings">("orders");
  const runner = useAdminAction();

  const stats = useMemo(() => {
    const sold = orders.filter((o) => o.status === "paid" || o.status === "redeemed");
    return {
      sold: sold.length,
      revenue: sold.reduce((sum, o) => sum + (o.paidAmount ?? o.product.priceCzk), 0),
      pending: orders.filter((o) => o.status === "pending").length,
      open: orders.filter((o) => o.status === "paid").length,
    };
  }, [orders]);

  const visible = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return [o.vs, o.code, o.invoiceNumber, o.buyer.name, o.buyer.email, o.recipient.name].some((v) => v?.toLowerCase().includes(q));
  });

  async function refresh() {
    const res = await fetch("/api/admin/vouchers", { cache: "no-store" });
    if (res.ok) setOrders((await res.json()).orders);
  }

  function runCheck() {
    runner.run("/api/admin/vouchers/run", { method: "POST" }, {
      onSuccess: (r) => {
        void refresh();
        if (r.skipped) return `Chyba: ${r.skipped}`;
        const parts = [`plateb na účtu: ${r.checkedPayments}`, `nově zaplaceno: ${r.paid}`, `odesláno: ${r.delivered}`];
        if (r.reminded) parts.push(`upomínky: ${r.reminded}`);
        if (r.expired) parts.push(`vypršelo: ${r.expired}`);
        return r.errors.length ? `Chyba: ${r.errors.join("; ")}` : `Hotovo — ${parts.join(", ")}`;
      },
    });
  }

  const missing = setup.filter((s) => !s.ok);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Dárkové poukazy</h1>
          <p className="text-sm text-gray-400 mt-1">
            Platby se párují automaticky každých 10 minut podle variabilního symbolu. Poukaz se pak sám odešle e-mailem.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setTab("orders")} className={`px-3 py-1.5 border ${tab === "orders" ? "border-white" : "border-white/20"}`}>Objednávky</button>
          <button onClick={() => setTab("settings")} className={`px-3 py-1.5 border ${tab === "settings" ? "border-white" : "border-white/20"}`}>Nastavení</button>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="border border-amber-700/60 bg-amber-950/30 p-4 text-sm">
          <p className="font-medium text-amber-300">Nastavení není kompletní (viz docs/vouchers-setup.md):</p>
          <ul className="mt-2 list-disc pl-5 text-amber-200/80">{missing.map((m) => <li key={m.label}>{m.label}</li>)}</ul>
        </div>
      )}

      {tab === "orders" ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Prodáno" value={String(stats.sold)} />
            <Stat label="Tržby" value={czk(stats.revenue)} />
            <Stat label="Čeká na platbu" value={String(stats.pending)} />
            <Stat label="Neuplatněné" value={String(stats.open)} />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button onClick={runCheck} disabled={runner.busy} className="px-4 py-2 bg-white text-black text-sm font-medium disabled:opacity-50">
              {runner.busy ? "Kontroluju…" : "Zkontrolovat platby teď"}
            </button>
            <select value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | "all")} className="bg-transparent border border-white/20 px-3 py-2 text-sm">
              <option value="all">Všechny stavy</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hledat VS, kód, jméno, e-mail…" className="flex-1 min-w-48 bg-transparent border border-white/20 px-3 py-2 text-sm" />
            <a href="/api/admin/vouchers/preview" target="_blank" className="text-sm underline text-gray-300">Náhled poukazu</a>
          </div>
          {runner.message && <p className={`text-sm ${messageClass(runner.message)}`}>{runner.message}</p>}

          {visible.length === 0 ? (
            <p className="text-sm text-gray-500">Zatím žádné objednávky.</p>
          ) : (
            <div className="grid gap-3">
              {visible.map((o) => <OrderRow key={o.id} order={o} onChange={(u) => setOrders((all) => all.map((x) => (x.id === u.id ? u : x)))} />)}
            </div>
          )}
        </>
      ) : (
        <SettingsForm initial={initialSettings} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

function OrderRow({ order: o, onChange }: { order: VoucherOrder; onChange: (o: VoucherOrder) => void }) {
  const { busy, message, run } = useAdminAction();
  const [open, setOpen] = useState(false);
  const s = STATUS[o.status];

  function act(action: string, confirmText?: string, extra: Record<string, unknown> = {}) {
    if (confirmText && !confirm(confirmText)) return;
    run(`/api/admin/vouchers/${o.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) }, {
      onSuccess: (data) => {
        onChange(data.order);
        return data.order.lastError ? `Chyba: ${data.order.lastError}` : "Uloženo";
      },
    });
  }

  return (
    <div className="border border-white/10 px-4 py-3">
      <button onClick={() => setOpen(!open)} className="w-full flex flex-wrap items-center justify-between gap-2 text-left">
        <div>
          <div className="font-medium flex flex-wrap items-center gap-2">
            {o.product.name}
            <span className="text-gray-400 font-normal">· {czk(o.product.priceCzk)}</span>
            {o.code && <code className="text-xs text-gray-300">{o.code}</code>}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            VS {o.vs} · {o.buyer.name} → {o.recipient.name} · {dt(o.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {o.paymentIssue && <span className="px-2 py-0.5 bg-red-900/40 text-red-300">nedoplatek</span>}
          {o.lastError && <span className="px-2 py-0.5 bg-red-900/40 text-red-300">chyba odeslání</span>}
          {o.invoiceError && <span className="px-2 py-0.5 bg-red-900/40 text-red-300">chyba faktury</span>}
          {o.status === "paid" && !o.sentToBuyerAt && !o.lastError && <span className="px-2 py-0.5 bg-white/10 text-gray-300">odesílá se</span>}
          <span className={`px-2 py-0.5 ${s.cls}`}>{s.label}</span>
        </div>
      </button>

      {open && (
        <div className="mt-4 grid gap-4 text-sm">
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-gray-300">
            <Info k="Kupující" v={`${o.buyer.name} <${o.buyer.email}>`} />
            <Info k="Obdarovaný" v={o.recipient.name} />
            {o.dedication && <Info k="Věnování" v={o.dedication} />}
            <Info k="Jazyk" v={o.locale.toUpperCase()} />
            {o.paidAt && <Info k="Zaplaceno" v={`${dt(o.paidAt)} · ${czk(o.paidAmount ?? 0)} · ${o.paymentRef === "manual" ? "ručně" : o.paymentRef}`} />}
            {o.validUntil && <Info k="Platí do" v={d(o.validUntil)} />}
            {o.invoiceNumber && <Info k="Faktura" v={`${o.invoiceNumber}${o.invoiceSentAt ? ` · posláno ${dt(o.invoiceSentAt)}` : " · zatím neposláno"}`} />}
            {o.invoiceError && <Info k="Chyba faktury" v={`${o.invoiceError} (pokus ${o.invoiceAttempts ?? 0})`} />}
            {o.sentToBuyerAt && <Info k="Posláno kupujícímu" v={dt(o.sentToBuyerAt)} />}
            {o.redeemedAt && <Info k="Uplatněno" v={dt(o.redeemedAt)} />}
            {o.paymentIssue && <Info k="Problém s platbou" v={o.paymentIssue} />}
            {o.lastError && <Info k="Poslední chyba" v={`${o.lastError} (pokus ${o.sendAttempts ?? 0})`} />}
          </dl>

          <div className="flex flex-wrap gap-2">
            {(o.status === "pending" || o.status === "expired") && (
              <Btn busy={busy} onClick={() => act("markPaid", `Označit VS ${o.vs} jako zaplacené a odeslat poukaz?`)}>Označit jako zaplacené</Btn>
            )}
            {o.status === "paid" && <Btn busy={busy} onClick={() => act("redeem", `Uplatnit poukaz ${o.code}?`)}>✓ Uplatnit (focení proběhlo / domluveno)</Btn>}
            {o.status === "redeemed" && <Btn busy={busy} onClick={() => act("unredeem")}>Vrátit uplatnění</Btn>}
            {(o.status === "paid" || o.status === "redeemed") && <Btn busy={busy} onClick={() => act("resend", "Znovu poslat poukaz kupujícímu?")}>Poslat znovu</Btn>}
            {o.code && <a className="px-3 py-1.5 border border-white/20 hover:border-white/50" href={`/api/admin/vouchers/${o.id}/pdf`} target="_blank">PDF poukaz</a>}
            {o.invoiceNumber && <a className="px-3 py-1.5 border border-white/20 hover:border-white/50" href={`/api/admin/vouchers/${o.id}/pdf?doc=invoice`} target="_blank">Faktura</a>}
            {(o.status === "paid" || o.status === "redeemed") && !o.invoiceSentAt && (
              <Btn busy={busy} onClick={() => act("invoice")}>{o.invoiceNumber ? "Poslat fakturu" : "Vystavit fakturu znovu"}</Btn>
            )}
            {o.status !== "cancelled" && o.status !== "redeemed" && (
              <Btn busy={busy} danger onClick={() => act("cancel", o.status === "paid" ? "Stornovat zaplacený poukaz? Peníze je potřeba vrátit ručně z banky." : "Stornovat objednávku?")}>Storno</Btn>
            )}
          </div>
          <NoteEditor initial={o.adminNote ?? ""} busy={busy} onSave={(note) => act("note", undefined, { note })} />
          {message && <p className={messageClass(message)}>{message}</p>}
        </div>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2 py-0.5">
      <dt className="text-gray-500 shrink-0">{k}:</dt>
      <dd className="break-all">{v}</dd>
    </div>
  );
}

function Btn({ children, onClick, busy, danger }: { children: React.ReactNode; onClick: () => void; busy: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={busy} className={`px-3 py-1.5 border disabled:opacity-50 ${danger ? "border-red-800 text-red-300 hover:border-red-500" : "border-white/20 hover:border-white/50"}`}>
      {children}
    </button>
  );
}

function NoteEditor({ initial, busy, onSave }: { initial: string; busy: boolean; onSave: (v: string) => void }) {
  const [note, setNote] = useState(initial);
  return (
    <div className="flex gap-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Poznámka (termín focení, vrácení peněz…)" className="flex-1 bg-transparent border border-white/20 px-3 py-1.5" />
      {note !== initial && <Btn busy={busy} onClick={() => onSave(note)}>Uložit</Btn>}
    </div>
  );
}

function SettingsForm({ initial }: { initial: VoucherSettings }) {
  const [s, setS] = useState(initial);
  const { busy, message, run } = useAdminAction();

  function save() {
    run("/api/admin/vouchers/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) }, {
      onSuccess: (data) => {
        setS({ ...s, ...data.settings });
        return "Uloženo";
      },
    });
  }

  const field = "bg-transparent border border-white/20 px-3 py-1.5 w-full";
  return (
    <div className="space-y-6 text-sm">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex items-center gap-2"><input type="checkbox" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} /> Prodej poukazů zapnutý</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={s.christmas} onChange={(e) => setS({ ...s, christmas: e.target.checked })} /> Vánoční verze (sníh na poukazu, vánoční texty)</label>
        <label className="grid gap-1">Fotka na poukazu (Cloudinary ID nebo celá https URL)<input className={field} value={s.photoPublicId} onChange={(e) => setS({ ...s, photoPublicId: e.target.value })} /></label>
        <label className="grid gap-1">Platnost (měsíce)<input type="number" min={1} max={36} className={field} value={s.validityMonths} onChange={(e) => setS({ ...s, validityMonths: Number(e.target.value) })} /></label>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Balíčky</h2>
        <p className="text-gray-400">
          Poukazy se prodávají na balíčky <strong>kreativního portrétu</strong>. Ceny, délku a obsah měníš v{" "}
          <a href="/admin/obsah" className="underline">Texty → Služby → Portréty</a>, poukazy se přizpůsobí samy.
        </p>
        <ul className="divide-y divide-white/10 border border-white/10">
          {s.products.map((p) => (
            <li key={p.id} className="px-3 py-2 flex justify-between gap-4">
              <span>{p.name.cs} <span className="text-gray-500">· {p.details.cs.join(" · ")}</span></span>
              <span className="tabular-nums">{czk(p.priceCzk)}</span>
            </li>
          ))}
          {s.products.length === 0 && <li className="px-3 py-2 text-amber-300">Kreativní portrét nemá žádný balíček s cenou — poukazy se neprodávají.</li>}
        </ul>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={busy} className="px-4 py-2 bg-white text-black font-medium disabled:opacity-50">{busy ? "Ukládám…" : "Uložit nastavení"}</button>
        <a href="/api/admin/vouchers/preview" target="_blank" className="underline text-gray-300">Náhled poukazu (po uložení)</a>
        {message && <span className={messageClass(message)}>{message}</span>}
      </div>
    </div>
  );
}
