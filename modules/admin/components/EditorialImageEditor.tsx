"use client";

import { useState } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { EditorialImage, EditorialImages, Testimonial, TestimonialService } from "@/modules/admin/lib/content";
import { mergeReferences, splitReferences, type Reference } from "@/modules/admin/lib/references";
import { AdminPreview, type PreviewFocus } from "@/modules/admin/preview/AdminPreview";
import type { PreviewPage, PreviewPick } from "@/modules/admin/preview/protocol";
import { FocalPicker } from "./FocalPicker";
import { ReferenceEditor } from "./ReferenceEditor";
import { TreeLayout } from "./TreeLayout";

type Slot = {
  label: string;
  read: (data: EditorialImages) => EditorialImage;
  write: (data: EditorialImages, image: EditorialImage) => void;
  index?: number;
  group?: (data: EditorialImages) => EditorialImage[];
  resizable?: boolean;
};

const single = (label: string, read: Slot["read"], write: Slot["write"]): Slot => ({ label, read, write });
const list = (
  label: string,
  data: EditorialImages,
  read: (value: EditorialImages) => EditorialImage[],
  resizable = false,
): Slot[] => read(data).map((_, index) => ({
  ...single(
    `${label} ${index + 1}`,
    (value) => read(value)[index],
    (value, image) => { read(value)[index] = image; },
  ),
  index,
  group: read,
  resizable,
}));

// Only slots the site renders. Homepage stories and business headshots are a fallback the site
// shows only while no client reference has a photo; they stay in KV but are not edited here.
function imageSlots(data: EditorialImages): Slot[] {
  return [
    single("Homepage — hero", (v) => v.home.hero, (v, image) => { v.home.hero = image; }),
    single("Homepage — fotograf", (v) => v.home.photographer, (v, image) => { v.home.photographer = image; }),
    single("Portréty — hero", (v) => v.portrait.hero, (v, image) => { v.portrait.hero = image; }),
    // The portrait gallery grid takes any count; other lists have a fixed layout.
    ...list("Portréty — galerie", data, (v) => v.portrait.gallery, true),
    single("Business — hero", (v) => v.business.hero, (v, image) => { v.business.hero = image; }),
    single("Eventy — hero", (v) => v.events.hero, (v, image) => { v.events.hero = image; }),
    ...list("Eventy — reportáž", data, (v) => v.events.reportage),
  ];
}

// Where each slot lives on the site (first matching label prefix wins).
const TARGETS: [prefix: string, page: PreviewPage, selector: string][] = [
  ["Homepage — hero", "home", ".ed-home-hero"],
  ["Homepage — vybrané příběhy", "home", ".ed-home-work"],
  ["Homepage — fotograf", "home", ".ed-home-about"],
  ["Portréty — hero", "portrety", ".ed-portrait-hero"],
  ["Portréty —", "portrety", ".ed-portrait-gallery"],
  ["Business — hero", "business", ".ed-business-hero"],
  ["Business —", "business", ".ed-business-headshots"],
  ["Eventy — hero", "eventy", ".ed-events-hero"],
  ["Eventy — reportáž 4", "eventy", ".ed-events-wide"],
  ["Eventy —", "eventy", ".ed-events-strip"],
];
const groupLabel = (label: string) => label.replace(/ \d+$/, "");
const targetOf = (label: string) => TARGETS.find(([prefix]) => label.startsWith(prefix))!;

// Client photos with reviews, listed in the tree right after the page's hero.
const REF_ITEMS: { id: string; service: TestimonialService; after: string }[] = [
  { id: "Homepage — vybrané příběhy", service: "creative", after: "Homepage — hero" },
  { id: "Business — headshoty", service: "business", after: "Business — hero" },
];
const LOCALES = ["cs", "en"] as const;

const MAX_GALLERY = 12; // mirrors MAX_IMAGES in /api/admin/images
const EMPTY_IMAGE: EditorialImage = { publicId: "", alt: { cs: "", en: "" }, focal: { desktop: "50% 50%", mobile: "50% 50%" } };
const groupOf = (label: string) => label.split(" — ")[0];
const shortLabel = (label: string) => {
  const name = label.split(" — ")[1] ?? label;
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export function EditorialImageEditor({ editorial, photos, references }: {
  editorial: EditorialImages;
  photos: GalleryPhoto[];
  references?: { cs: Testimonial[]; en: Testimonial[] };
}) {
  const [data, setData] = useState(editorial);
  const [saved, setSaved] = useState(editorial);
  const [refs, setRefs] = useState<Reference[]>(() => references ? mergeReferences(references.cs, references.en) : []);
  const [savedRefs, setSavedRefs] = useState(refs);
  const refItems = references ? REF_ITEMS : [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const slots = imageSlots(data);
  const [selected, setSelected] = useState(slots[0].label);
  const [page, setPage] = useState<PreviewPage>("home");
  const [locale, setLocale] = useState<"cs" | "en">("cs");
  const [focus, setFocus] = useState<PreviewFocus | null>(null);
  const refItem = refItems.find((r) => r.id === selected);
  const slot = slots.find((s) => s.label === selected) ?? slots[0];
  const image = slot.read(data);
  const isDirty = (s: Slot) => JSON.stringify(s.read(data)) !== JSON.stringify(s.read(saved));
  const ofService = (list: Reference[], service: TestimonialService) => JSON.stringify(list.filter((r) => r.service === service));
  const refsDirty = (service: TestimonialService) => ofService(refs, service) !== ofService(savedRefs, service);
  const dirtyCount = slots.filter(isDirty).length + refItems.filter((r) => refsDirty(r.service)).length;

  function select(label: string) {
    const [, slotPage, selector] = targetOf(label);
    setSelected(label);
    setPickerOpen(false);
    setPage(slotPage);
    setFocus({ selector });
  }

  // A click on a photo in the preview opens the slot that uses it (current page first).
  function pick({ src }: PreviewPick) {
    if (!src) return;
    const ref = refs.find((r) => r.photo && src.includes(r.photo));
    const refTarget = ref && refItems.find((r) => r.service === ref.service);
    if (refTarget) return select(refTarget.id);
    const uses = slots.filter((s) => s.read(data).publicId && src.includes(s.read(data).publicId));
    const hit = uses.find((s) => targetOf(s.label)[1] === page) ?? uses[0];
    if (hit) select(hit.label);
  }

  function update(target: Slot, next: EditorialImage) {
    setData((current) => {
      const copy = structuredClone(current);
      target.write(copy, next);
      return copy;
    });
  }

  function move(target: Slot, offset: -1 | 1) {
    if (target.index === undefined || !target.group) return;
    setData((current) => {
      const next = structuredClone(current);
      const images = target.group!(next);
      const to = target.index! + offset;
      if (to < 0 || to >= images.length) return current;
      [images[target.index!], images[to]] = [images[to], images[target.index!]];
      return next;
    });
  }

  // Adds an empty slot at the end of the group and opens it.
  function add(target: Slot) {
    const length = target.group!(data).length;
    setData((current) => {
      const next = structuredClone(current);
      target.group!(next).push(structuredClone(EMPTY_IMAGE));
      return next;
    });
    setSelected(`${groupLabel(target.label)} ${length + 1}`);
  }

  function remove(target: Slot) {
    setData((current) => {
      const next = structuredClone(current);
      target.group!(next).splice(target.index!, 1);
      return next;
    });
    setSelected(`${groupLabel(target.label)} ${Math.max(1, target.index!)}`);
  }

  // References live in content:<locale>; re-read it right before saving so texts edited elsewhere survive.
  async function saveReferences(locale: "cs" | "en") {
    const current = await fetch(`/api/admin/content?locale=${locale}`);
    if (!current.ok) return false;
    const content = await current.json();
    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, data: { ...content, testimonials: splitReferences(refs, locale) } }),
    });
    return response.ok;
  }

  async function save() {
    setStatus("saving");
    try {
      const response = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editorial: data }),
      });
      if (response.ok) setSaved(data);
      let ok = response.ok;
      if (refItems.some((r) => refsDirty(r.service))) {
        const results = await Promise.all(LOCALES.map(saveReferences));
        if (results.every(Boolean)) setSavedRefs(refs);
        ok &&= results.every(Boolean);
      }
      setStatus(ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  const thumb = (id: string) => (id ? cloudinaryUrl(id, "w_48,h_48,c_fill,q_auto,f_auto") : undefined);
  const groups = [...new Set(slots.map((s) => groupOf(s.label)))].map((title) => ({
    title,
    items: slots.filter((s) => groupOf(s.label) === title).flatMap((s) => [
      { id: s.label, label: shortLabel(s.label), dirty: isDirty(s), thumb: thumb(s.read(data).publicId) },
      ...refItems.filter((r) => r.after === s.label).map((r) => ({
        id: r.id,
        label: shortLabel(r.id),
        dirty: refsDirty(r.service),
        thumb: thumb(refs.find((x) => x.service === r.service && x.photo)?.photo ?? ""),
      })),
    ]),
  }));

  return <TreeLayout
    groups={groups}
    selected={refItem?.id ?? slot.label}
    onSelect={select}
    preview={<AdminPreview page={page} onPageChange={setPage} locale={locale} onLocaleChange={setLocale} editorial={data} focus={focus} onPick={pick} />}
  >
    {refItem ? <article className="space-y-4">
      <h2 className="text-lg font-semibold">
        <span className="text-gray-500 font-normal">{groupOf(refItem.id)} › </span>{shortLabel(refItem.id)}
      </h2>
      <ReferenceEditor service={refItem.service} refs={refs} onChange={setRefs} photos={photos} />
    </article> : <article className="space-y-4">
      <h2 className="text-lg font-semibold">
        <span className="text-gray-500 font-normal">{groupOf(slot.label)} › </span>{shortLabel(slot.label)}
      </h2>
      {image.publicId
        ? <FocalPicker publicId={image.publicId} label={slot.label} focal={image.focal} onChange={(focal) => update(slot, { ...image, focal })} />
        : <div className="aspect-[4/3] bg-zinc-900 grid place-content-center text-sm text-gray-500">Prázdný slot</div>}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={() => setPickerOpen(!pickerOpen)} aria-label={`Změnit fotku: ${slot.label}`} className="px-3 py-1.5 border border-white/20 hover:border-white">
          {pickerOpen ? "Zavřít výběr" : image.publicId ? "Změnit fotku" : "Vybrat fotku"}
        </button>
        <button type="button" aria-label={`Vyprázdnit slot: ${slot.label}`} onClick={() => update(slot, structuredClone(EMPTY_IMAGE))} disabled={!image.publicId} className="text-gray-400 hover:text-white disabled:opacity-30">Vyprázdnit</button>
        {slot.index !== undefined && slot.group && <>
          <button type="button" aria-label={`Posunout nahoru: ${slot.label}`} onClick={() => move(slot, -1)} disabled={slot.index === 0} className="disabled:opacity-30">↑</button>
          <button type="button" aria-label={`Posunout dolů: ${slot.label}`} onClick={() => move(slot, 1)} disabled={slot.index === slot.group(data).length - 1} className="disabled:opacity-30">↓</button>
        </>}
        {slot.resizable && <>
          <button type="button" aria-label={`Odebrat: ${slot.label}`} onClick={() => remove(slot)} disabled={slot.group!(data).length <= 1} className="text-gray-400 hover:text-white disabled:opacity-30">Odebrat</button>
          <button type="button" aria-label={`Přidat fotku: ${groupLabel(slot.label)}`} onClick={() => add(slot)} disabled={slot.group!(data).length >= MAX_GALLERY} className="text-gray-400 hover:text-white disabled:opacity-30">+ Přidat fotku</button>
        </>}
      </div>
      {pickerOpen && <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-96 overflow-y-auto border border-white/10 p-2">
        {photos.map((photo) => <button key={photo.publicId} type="button" aria-label={`Vybrat ${photo.alt.cs || photo.publicId}`} onClick={() => {
          update(slot, { ...image, publicId: photo.publicId, alt: photo.alt });
          setPickerOpen(false);
        }} className={photo.publicId === image.publicId ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"}>
          <img src={cloudinaryUrl(photo.publicId, "w_160,h_160,c_fill,q_auto,f_auto")} alt="" className="aspect-square w-full object-cover" />
        </button>)}
      </div>}
      <div className="grid gap-2 sm:grid-cols-2">
        <input aria-label={`${slot.label} alt CZ`} value={image.alt.cs} onChange={(event) => update(slot, { ...image, alt: { ...image.alt, cs: event.target.value } })} placeholder="Alt text CZ" className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-sm" />
        <input aria-label={`${slot.label} alt EN`} value={image.alt.en} onChange={(event) => update(slot, { ...image, alt: { ...image.alt, en: event.target.value } })} placeholder="Alt text EN" className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-sm" />
      </div>
    </article>}
    <div className="sticky bottom-0 z-10 mt-4 flex items-center gap-3 bg-zinc-950/95 py-3 backdrop-blur">
      <button type="button" onClick={save} disabled={status === "saving"} className="px-4 py-2 bg-white text-black text-sm font-medium disabled:opacity-50">
        Uložit editorialové fotky{dirtyCount > 0 && <span aria-hidden> · {dirtyCount}</span>}
      </button>
      <span aria-live="polite" className={`text-sm ${status === "error" ? "text-red-400" : "text-green-400"}`}>
        {status === "ok" ? "Uloženo" : status === "error" ? "Uložení selhalo" : ""}
      </span>
    </div>
  </TreeLayout>;
}
