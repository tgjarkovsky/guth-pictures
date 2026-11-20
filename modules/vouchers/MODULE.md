# vouchers — dárkové poukazy

Prodej poukazů na focení: objednávka → QR platba → automatické párování přes Fio API → PDF poukaz + faktura z Fakturáčku e-mailem (Resend).
Nastavení pro provoz: [`docs/vouchers-setup.md`](../../docs/vouchers-setup.md).

## Soubory

- `copy.ts` — texty stránek CS/EN.
- `lib/types.ts` — `VoucherOrder`, `VoucherSettings`, `VoucherProduct`.
- `lib/settings.ts` — balíčky a přepínače v KV (`voucher:settings`), výchozí hodnoty.
- `lib/store.ts` — objednávky v KV: `voucher:order:{id}`, indexy `voucher:vs:{vs}`, `voucher:code:{code}`, seznam `voucher:orders`, čítač VS, zámek běhu.
- `lib/service.ts` — přechody stavů (`markPaid`, `deliver`), `applyPayments` a `runVoucherJobs` (jeden idempotentní průchod pro cron i tlačítko v adminu), podepsané odkazy na objednávku.
- `lib/fio.ts` — výpis příchozích plateb (endpoint `periods`, bezstavový, posledních 21 dní).
- `lib/spayd.ts` — řetězec QR platby.
- `lib/design.tsx` + `lib/render.tsx` — vzhled poukazu (satori přes `next/og`) → PNG → PDF (`pdf-lib`). Fonty v `fonts/` (přibalené přes `outputFileTracingIncludes`).
- `lib/fakturacek.ts` — faktura ve Fakturáčku (`POST /api/external/invoices`, idempotentní přes `externalRef = voucher:<id>`) a stažení jejího PDF.
- `lib/email.ts` — e-maily: pokyny k platbě, připomínka, poukaz (s fakturou) kupujícímu, samostatná faktura, notifikace fotografovi.

## Stránky a API

- `/[locale]/darkovy-poukaz` — prodejní stránka + formulář; `/objednavka/[token]` — QR platba a stav; `/uplatnit?kod=` — ověření kódu a rezervace.
- `/poukaz` → přesměrování na uplatnění (krátký odkaz na poukazu).
- `POST /api/vouchers/order`, `GET /api/vouchers/order/[token]` (+ `/pdf`), `GET /api/vouchers/sample/[locale]` (ukázkový obrázek).
- `GET /api/cron/vouchers` (Bearer `CRON_SECRET`) — volá `.github/workflows/vouchers-cron.yml` každých 10 min.
- Admin: `/admin/poukazy`, `/api/admin/vouchers/*`.

## Pravidla

- Kontrola plateb je idempotentní: platba se páruje podle VS a stavu objednávky, ne podle kurzoru, takže opakovaný běh nic nepošle dvakrát.
- Fio dovolí 1 dotaz za 30 s na token, souběh hlídá zámek `voucher:lock`.
- Odkaz na objednávku je `id.hmac` (AUTH_SECRET), bez něj se k objednávce nedá dostat.
- Poukaz nikdy nečeká na fakturu: když Fakturáček neodpoví, poukaz odejde a faktura dorazí samostatně v dalším běhu.
