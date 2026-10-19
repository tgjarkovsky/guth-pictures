"use client";

import { useState } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { EditorialImage, EditorialImages } from "@/modules/admin/lib/content";
import { AdminPreview, type PreviewFocus } from "@/modules/admin/preview/AdminPreview";
import type { PreviewPage, PreviewPick } from "@/modules/admin/preview/protocol";
import { FocalPicker } from "./FocalPicker";
import { TreeLayout } from "./TreeLayout";

type Slot = {
  label: string;
  read: (data: EditorialImages) => EditorialImage;
  write: (data: EditorialImages, image: EditorialImage) => void;
  index?: number;
  group?: (data: EditorialImages) => EditorialImage[];
};

const single = (label: string, read: Slot["read"], write: Slot["write"]): Slot => ({ label, read, write });
const list = (
  label: string,
  data: EditorialImages,
  read: (value: EditorialImages) => EditorialImage[],
): Slot[] => read(data).map((_, index) => ({
  ...single(
    `${label} ${index + 1}`,
    (value) => read(value)[index],
    (value, image) => { read(value)[index] = image; },
  ),
  index,
  group: read,
}));

function imageSlots(data: EditorialImages): Slot[] {
  return [
    single("Homepage — hero", (v) => v.home.hero, (v, image) => { v.home.hero = image; }),
    ...list("Homepage — příběh", data, (v) => v.home.stories),
    single("Homepage — fotograf", (v) => v.home.photographer, (v, image) => { v.home.photographer = image; }),
    single("Homepage — Focení 101", (v) => v.home.tools.foceni101, (v, image) => { v.home.tools.foceni101 = image; }),
    single("Homepage — plánovač světla", (v) => v.home.tools.lightPlanner, (v, image) => { v.home.tools.lightPlanner = image; }),
    single("Portréty — hero", (v) => v.portrait.hero, (v, image) => { v.portrait.hero = image; }),
    ...list("Portréty — galerie", data, (v) => v.portrait.gallery),
    single("Business — hero", (v) => v.business.hero, (v, image) => { v.business.hero = image; }),
    ...list("Business — headshot", data, (v) => v.business.headshots),
    single("Eventy — hero", (v) => v.events.hero, (v, image) => { v.events.hero = image; }),
    ...list("Eventy — reportáž", data, (v) => v.events.reportage),
  ];
}

// Where each slot lives on the site (first matching label prefix wins).
const TARGETS: [prefix: string, page: PreviewPage, selector: string][] = [
  ["Homepage — hero", "home", ".ed-home-hero"],
  ["Homepage — příběh", "home", ".ed-home-work"],
  ["Homepage — fotograf", "home", ".ed-home-about"],
  ["Homepage —", "home", ".ed-home-tools"],
  ["Portréty — hero", "portrety", ".ed-portrait-hero"],
  ["Portréty —", "portrety", ".ed-portrait-gallery"],
  ["Business — hero", "business", ".ed-business-hero"],
  ["Business —", "business", ".ed-business-headshots"],
  ["Eventy — hero", "eventy", ".ed-events-hero"],
  ["Eventy — reportáž 4", "eventy", ".ed-events-wide"],
  ["Eventy —", "eventy", ".ed-events-strip"],
];
const targetOf = (label: string) => TARGETS.find(([prefix]) => label.startsWith(prefix))!;

const EMPTY_IMAGE: EditorialImage = { publicId: "", alt: { cs: "", en: "" }, focal: { desktop: "50% 50%", mobile: "50% 50%" } };
const groupOf = (label: string) => label.split(" — ")[0];
const shortLabel = (label: string) => {
  const name = label.split(" — ")[1] ?? label;
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export function EditorialImageEditor({ editorial, photos }: { editorial: EditorialImages; photos: GalleryPhoto[] }) {
  const [data, setData] = useState(editorial);
  const [saved, setSaved] = useState(editorial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const slots = imageSlots(data);
  const [selected, setSelected] = useState(slots[0].label);
  const [page, setPage] = useState<PreviewPage>("home");
  const [locale, setLocale] = useState<"cs" | "en">("cs");
  const [focus, setFocus] = useState<PreviewFocus | null>(null);
  const slot = slots.find((s) => s.label === selected) ?? slots[0];
  const image = slot.read(data);
  const isDirty = (s: Slot) => JSON.stringify(s.read(data)) !== JSON.stringify(s.read(saved));
  const dirtyCount = slots.filter(isDirty).length;

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

  async function save() {
    setStatus("saving");
    try {
      const response = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editorial: data }),
      });
      setStatus(response.ok ? "ok" : "error");
      if (response.ok) setSaved(data);
    } catch {
      setStatus("error");
    }
  }

  const groups = [...new Set(slots.map((s) => groupOf(s.label)))].map((title) => ({
    title,
    items: slots.filter((s) => groupOf(s.label) === title).map((s) => {
      const id = s.read(data).publicId;
      return {
        id: s.label,
        label: shortLabel(s.label),
        dirty: isDirty(s),
        thumb: id ? cloudinaryUrl(id, "w_48,h_48,c_fill,q_auto,f_auto") : undefined,
      };
    }),
  }));

  return <TreeLayout
    groups={groups}
    selected={slot.label}
    onSelect={select}
    preview={<AdminPreview page={page} onPageChange={setPage} locale={locale} onLocaleChange={setLocale} editorial={data} focus={focus} onPick={pick} />}
  >
    <article className="space-y-4">
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
    </article>
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
