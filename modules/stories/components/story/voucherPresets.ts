/** Hotové texty pro šablonu P (reklama na dárkový poukaz). Cena a odkaz se doplní na kartě. */
export type VoucherPreset = { name: string; kicker: string; headline: string; sub: string };

export const VOUCHER_PRESETS: Record<"cs" | "en", VoucherPreset[]> = {
  cs: [
    { name: "Vánoce", kicker: "Vánoční dárek", headline: "Darujte\nfotky, které\nzůstanou.", sub: "Dárkový poukaz na portrétní focení v Praze." },
    { name: "Ne další svetr", kicker: "Dárek, který zůstane", headline: "Ne další\nsvetr.", sub: "Darujte focení a fotky, ke kterým se bude vracet roky." },
    { name: "Pro mámu", kicker: "Dárek pro mámu", headline: "Pro mámu,\nkterá není\nna žádné fotce.", sub: "Je vždycky ta, kdo fotí. Tentokrát bude před objektivem." },
    { name: "Na poslední chvíli", kicker: "Na poslední chvíli", headline: "Dárek\ndo pár\nminut.", sub: "Zaplatíte QR kódem a poukaz vám hned přijde e-mailem." },
    { name: "Zážitek", kicker: "Zážitek místo věci", headline: "Zážitek,\nne další\nvěc.", sub: "Kreativní portrétní focení v Praze. S vedením póz, bez stresu." },
  ],
  en: [
    { name: "Christmas", kicker: "Christmas gift", headline: "Give\nphotos that\nstay.", sub: "A gift voucher for a portrait session in Prague." },
    { name: "Not another sweater", kicker: "A gift that stays", headline: "Not another\nsweater.", sub: "Give a photo session and pictures they'll come back to for years." },
    { name: "For mum", kicker: "A gift for mum", headline: "For the mum\nwho's in\nno photos.", sub: "She's always the one taking them. This time she's in front of the lens." },
    { name: "Last minute", kicker: "Last minute", headline: "A gift\nin minutes.", sub: "Pay by QR code and the voucher lands in your inbox right away." },
    { name: "Experience", kicker: "An experience, not a thing", headline: "An experience,\nnot another\nthing.", sub: "A creative portrait session in Prague. Relaxed, with posing guidance." },
  ],
};
