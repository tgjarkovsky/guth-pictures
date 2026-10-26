---
name: pose-pack
description: Generuje chybějící návrhy póz pro klienty v brandovém stylu přes Gemini v Chromu uživatele (předplatné, bez API) a skládá je do lokální HTML galerie. Použij, když uživatel chce vygenerovat pózy, doplnit pose pack nebo přidat nové pózy.
---

# Pose pack

Soubory: `tools/pose-pack/style.md` (zamčený styl), `tools/pose-pack/poses.json` (seznam),
výstup `output/poses/<id>.jpg` + `output/poses/index.html`.

## Postup

1. Chybějící pózy = položky v `poses.json` bez `output/poses/<id>.jpg`. Nové pózy nejdřív
   přidej do `poses.json` (`id`, `tags` viz `style.md`, `shot`, `direction` anglicky, `label` česky).
2. Načti nástroje claude-in-chrome jedním ToolSearch, zavolej `tabs_context_mcp`, otevři nový
   tab na `https://gemini.google.com/app`. Nepřihlášený → zastav a řekni uživateli.
3. **Pravidlo: každé 2 pózy = nový chat.** Ve chatu s víc obrázky stahuje Gemini špatné
   soubory (viz krok 5). První zpráva začíná „Generate an image.“ + stylový blok ze
   `style.md` + póza. Druhá póza ve stejném chatu: „Generate another image in exactly the
   same illustration style, palette and line as the previous one, a different person.“ +
   framing + `direction`.
   **Povinné: každý nový chat dostane k první zprávě referenční obrázek** pro jednotný styl:
   `output/poses/business-01.jpg` (schválená kotva). Nahraj ho přes `file_upload` na file
   input Gemini (najdi ho `find`, na tlačítko „+“ neklikej, otevřelo by nativní dialog)
   a připiš „Match this exact illustration style, line and palette.“ Bez reference
   negeneruj. Když `file_upload` cestu odmítne, zastav a požádej uživatele, ať obrázek
   do chatu přetáhne sám.
4. Generování trvá 30 s až 3 min. Před odesláním si ulož počet obrázků
   (`img` s `naturalWidth > 500`) do `window.__n`, pak čekej `javascript_tool` smyčkou, dokud
   počet nestoupne. Jedno JS volání max ~40 s (CDP timeout 45 s) a v jednom `browser_batch`
   max 2 takové smyčky, jinak batch vyprší.
5. Stažení: poslední obrázek `scrollIntoView({block:'start'})`, najeď na něj myší (tlačítka
   se renderují až po hoveru) a klikni na ikonu stažení vpravo nahoře (screenshot ověří
   pozici). `find` u delšího chatu vrací tlačítko špatného obrázku, nevěř mu.
   JS `.click()` stažení nespustí. Plná velikost se připravuje ~10–20 s, pak:
   ```bash
   f=$(find ~/Downloads -maxdepth 1 -name 'Gemini_Generated_Image_*' -mmin -2 | head -1)
   [ -n "$f" ] && mv "$f" output/poses/<id>.jpg
   ```
   Gemini ukládá `.jfif` (JPEG), proto `.jpg`. Prázdné `f` = stažení neproběhlo.
   **Pozor:** v chatu s více obrázky stáhne „plná velikost“ občas jiný (dřívější) obrázek,
   i když klikneš u správného. md5 to neodhalí (každé stažení je jinak zakódované).
   Proto pravidlo 2 pózy na chat (krok 3) a každý stažený soubor hned zkontroluj přes Read,
   jestli sedí k `direction` (`.jfif` Read nenačte jako obrázek, čti až přejmenovaný `.jpg`).
   Export náhledu přes JS nejde (fetch blob selže, canvas je tainted).
   Chrome může po prvních staženích blokovat „více souborů“ z gemini.google.com: povolení
   musí dát uživatel (ikona v adresním řádku nebo nastavení webu), Claude ho neměnit.
6. Odmítnutí, limit nebo UI, které nereaguje po 2 pokusech → stop, nahlas co je hotovo.
   Limit předplatného (Plus) se ukáže jako „Limit se vám resetuje v …“ nad inputem, bylo to
   po ~11 obrázcích. Duplicity md5 nepozná, jediná spolehlivá kontrola je vizuální (Read).
7. `node tools/pose-pack/build-gallery.mjs` a otevři `output/poses/index.html` v prohlížeči.

Selektory v Gemini UI se mění. Hledej podle textu nebo role (`find`, `read_page`), ne podle
uložených selektorů. Záloha: chatgpt.com stejným postupem.
