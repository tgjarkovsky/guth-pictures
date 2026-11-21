# Dárkové poukazy — nastavení

Prodej poukazů běží na `/cs/darkovy-poukaz`. Zákazník vybere balíček, zaplatí QR platbou a web sám
spáruje platbu na Fio účtu podle variabilního symbolu. Pak vygeneruje PDF poukaz, ve Fakturáčku vystaví zaplacenou fakturu a obojí pošle kupujícímu e-mailem.
Správa je v adminu pod **Klienti → Poukazy**.

Dokud nejsou vyplněné `VOUCHER_IBAN` a `AUTH_SECRET`, stránka místo formuláře ukazuje „prodej je pozastavený“.

## 1. Fio banka — token pro čtení plateb (5 min)

1. Přihlas se do Fio internetbankingu → **Nastavení → API** → **Přidat nový token**.
2. Účet: podnikatelský účet, na který chceš přijímat platby. Oprávnění: **jen pohyby / pouze pro čtení** (žádné zadávání plateb).
   Platnost: max. (180 dní). Fio pošle potvrzení přes SMS / aplikaci.
3. Token vlož do Vercelu jako `FIO_API_TOKEN` (Settings → Environment Variables → Production).
4. Do `VOUCHER_IBAN` dej IBAN účtu (`CZ…`, bez mezer) a do `VOUCHER_ACCOUNT_LABEL` číslo účtu, jak ho mají lidé vidět (`2900000000/2010`).

> Token po 180 dnech vyprší. Do kalendáře si dej připomínku na obnovení. Bez tokenu platby jen ručně označíš v adminu.

## 2. Resend — odesílání e-mailů (10 min)

1. Založ účet na resend.com (free: 3 000 e-mailů/měsíc).
2. **Domains → Add domain** → `guthpictures.eu` → region `eu-west-1`.
3. Resend ukáže 3–4 DNS záznamy (MX a TXT pro `send.guthpictures.eu`, DKIM `resend._domainkey`). Vlož je u správce domény a počkej na „Verified“.
4. **API Keys → Create** (oprávnění *Sending access*, jen pro tuto doménu) → do Vercelu jako `RESEND_API_KEY`.
5. Volitelně uprav `VOUCHER_FROM_EMAIL` (výchozí `Guth Pictures <poukazy@guthpictures.eu>`) a `VOUCHER_NOTIFY_EMAIL` (kam chodí „Prodán poukaz“, výchozí kontaktní e-mail webu).
   Odpovědi zákazníků jdou na kontaktní e-mail webu.

## 3. Faktury z Fakturáčku

Faktury se vystavují v tvém Fakturáčku přes jeho API (`POST /api/external/invoices`). Je to stejná číselná řada jako u ostatních faktur, faktura je rovnou zaplacená k datu připsání platby a do příjmů pro přiznání se započítá sama.

1. Vygeneruj token: `openssl rand -base64 32`.
2. Ve Vercelu **Fakturáčku** ho nastav jako `EXTERNAL_API_TOKEN` a spusť migraci `npm run db:migrate` (přidává sloupec `external_ref`).
3. Ve Vercelu **guth-pictures** nastav `FAKTURACEK_API_TOKEN` (stejná hodnota) a `FAKTURACEK_URL` (adresa Fakturáčku, např. `https://fakturacek.vercel.app`).

Údaje dodavatele (jméno, IČO, adresa, „nejsem plátce DPH“) bere faktura z nastavení Fakturáčku.

Když Fakturáček zrovna neodpovídá, poukaz odejde stejně a faktura přijde zákazníkovi v samostatném e-mailu, jakmile se ji podaří vystavit (zkouší se každých 10 minut, po 5 nezdarech ti přijde upozornění). V adminu je u objednávky tlačítko „Vystavit fakturu znovu“.

## 4. Automatická kontrola plateb (GitHub Actions)

Workflow `.github/workflows/vouchers-cron.yml` volá každých 10 minut `/api/cron/vouchers`. Žádné secrets v GitHubu nepotřebuje: job si od GitHubu vyžádá krátkodobý OIDC token a endpoint ověří podpis, repozitář `tgjarkovsky/guth-pictures`, větev `main` a audience `guthpictures.eu` (`lib/github-oidc.ts`). Ručně jde endpoint volat s `Authorization: Bearer <CRON_SECRET>`.

GitHub občas spustí plánovaný běh se zpožděním. Kdykoli můžeš v adminu kliknout na **Zkontrolovat platby teď**.

## 5. Ověření před spuštěním

1. Admin → Poukazy → **Nastavení**: zkontroluj balíčky, ceny, fotku (Cloudinary ID) a vánoční přepínač, pak klikni na **Náhled poukazu**.
2. Objednej na webu nejlevnější poukaz na svůj e-mail a zaplať ho (třeba z jiného účtu).
3. Do ~10 minut ti má přijít poukaz a doklad a v adminu má být stav „zaplaceno“.
4. Objednávku v adminu **stornuj** a peníze si pošli zpátky.

## Jak to běží

| Stav | Co se děje |
| --- | --- |
| čeká na platbu | Po 3 dnech přijde zákazníkovi připomínka, po 10 dnech objednávka vyprší. Platba, která dorazí později, objednávku obnoví. |
| zaplaceno | Vystaví se kód `GP-XXXX-XXXX` a platnost (12 měsíců), ve Fakturáčku zaplacená faktura. Kupujícímu hned odejde e-mail s poukazem a fakturou. Poukaz obdarovanému předává kupující sám. |
| uplatněno | Označíš v adminu, když je focení domluvené nebo proběhlo. |
| storno | Ruční. Peníze vracíš z banky sám. |

Nedoplatek (přijde méně, než je cena) se neoznačí jako zaplacený. Přijde ti e-mail a v adminu je štítek „nedoplatek“.

Obdarovaný zadá kód na `guthpictures.eu/poukaz` (nebo naskenuje QR z poukazu), web ověří platnost
a otevře kontaktní formulář s předvyplněným kódem.

## Právní minimum (neplátce DPH)

- Ke každému prodeji vznikne ve Fakturáčku faktura (uhrazeno). U prodeje nemusíš nic dělat, příjem se do přiznání započítá podle data zaplacení spolu s ostatními fakturami.
- VOP mají sekci 10 „Dárkové poukazy“ (platnost, 14 dní na odstoupení, přenosnost), zásady ochrany osobních údajů zmiňují Resend, Fio a Neon.
