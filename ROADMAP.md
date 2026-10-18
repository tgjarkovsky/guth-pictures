# Roadmap

Plán na období od října 2026 do ledna 2027. Aktualizovat, když se změní priority.

## Vize

guthpictures.eu je hlavní zdroj zakázek pražského portrétního fotografa. Na příští tři měsíce je cíl jediný: **víc poptávek**. Web má návštěvníka přesvědčit fotkami a důkazem kvality, snadno ho dovést ke kontaktu a dát fotografovi vědět, odkud poptávky chodí.

Back office (galerie, admin, stories) je hotový a funguje. Rozvíjí se jen tam, kde pomáhá získat nebo udržet klienta.

## Uživatelé

1. **Firemní klient (HR, marketing, majitel firmy)** hledá portréty pro tým nebo web. Rozhoduje se podle ukázek, ceny a toho, jak jednoduchý je průběh focení. Hlavní cílovka.
2. **Jednotlivec, který chce kreativní / osobní portrét.** Rozhoduje se podle stylu a pocitu z fotek, často přijde z Instagramu.
3. **Páry a pořadatelé eventů.** Služba je zatím ve stavu „Připravujeme“.
4. **Stávající klient** v galerii vybírá a stahuje fotky. Musí to fungovat bez chyb, ale nové funkce tu teď nejsou priorita.
5. **Fotograf jako admin** spravuje obsah, fotky, galerie a stories. Chce co nejméně ruční práce.

## Směry

Pořadí služeb ve všech směrech: firemní portréty > kreativní portrét > eventy a svatby.

### 1. Konverze webu

Návštěvník, který už na webu je, má poptávku odeslat snadno a fotograf o ní má vědět.

- Měřit odeslání kontaktního formuláře jako událost ve Vercel Analytics (`track()` z `@vercel/analytics`) se zdrojovou stránkou a službou. Bez toho nejde poznat, co funguje.
- Kontaktní formulář na stránce služby předvyplní službu (firemní / kreativní / event), aby poptávka přišla roztříděná.
- Na `/firemni-portrety` jasná cesta „cena → poptávka“: u každého balíčku tlačítko, které otevře formulář s vybraným balíčkem.
- Po odeslání formuláře potvrzení s tím, co bude dál a do kdy se fotograf ozve.
- Zkontrolovat CTA na mobilu: kontakt dosažitelný z každé stránky služby bez dlouhého scrollování.

### 2. Důkaz kvality

Firemní klient potřebuje vidět, že to fotograf umí a že s ním mají jiní dobrou zkušenost.

- Obnovit sekci referencí (v KV zůstala, web ji teď nevykresluje) jako editovatelnou z adminu, nejdřív na `/firemni-portrety`.
- Případové studie firemních focení: pár fotek, zadání, průběh, výsledek. Jako typ článku v blogu nebo samostatný blok na stránce služby.
- Loga / jména firem, pro které fotograf fotil (jen se souhlasem), editovatelná v adminu.

### 3. SEO a blog

Přivést lidi, kteří hledají „firemní portréty Praha“ a podobné dotazy.

- Doplnit strukturovaná data `Service` + `Offer` s cenami balíčků na `/firemni-portrety` (stránky v `/sluzby/*` je už mají, firemní portréty ne).
- Články cílené na dotazy firemních klientů (příprava týmu na focení, co si obléct, jak velký tým zvládnu za den) s odkazem na `/firemni-portrety`.
- Každý článek končí CTA na relevantní službu, ne obecný kontakt.
- Hlídat, aby metadata a OG obrázky stránek služeb byly v CS i EN vyplněné a odlišné.

### 4. Instagram

Instagram přivádí hlavně zájemce o kreativní portrét.

- Stories pipeline má dávat odkaz na konkrétní stránku služby, ne jen na homepage.
- Měřit návštěvy z Instagramu (UTM v odkazech ze stories a z bio) a spojit je s měřením formuláře ze směru 1.
- Rozšířit výběr fotek pro stories i na fotky z firemních focení.

### 5. Spuštění eventů a svateb

Až budou fotky do portfolia. Do té doby jen příprava.

- Připravit stránku `/sluzby/eventy-a-svatby` tak, aby se „Připravujeme“ dalo vypnout jedním přepínačem v adminu, bez zásahu do kódu.
- Ceník a FAQ editovatelné v adminu stejně jako u ostatních služeb.

### 6. Údržba a spolehlivost

- Light Tester a Focení 101: jen opravy a výkon, žádné nové funkce.
- Klientská galerie: opravovat chyby (např. výběr, který drží fotky smazané po syncu z Lightroomu), nové funkce jen na vyžádání.
- Testy pro každou opravu chyby.

## Co ne

- **Brand-shoot-prep** (`tools/brand-shoot-prep`, návrhy brandového focení) je odložený. Nerozvíjet, nenavrhovat nové funkce.
- **Další jazyky.** Web zůstává jen v češtině a angličtině.
- **Larpy** nejsou cílovka. Žádné nové stránky, sekce ani SEO pro larpy; zůstávají jen jako vedlejší součást portfolia.
- **Nové funkce Light Testeru a Focení 101.** Jen údržba.
- **Redesign.** Vizuální směr (editorial, Syne + Epilogue) je schválený, neměnit ho bez zadání.
