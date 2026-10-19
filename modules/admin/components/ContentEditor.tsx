"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { ContentData, Testimonial, TestimonialService } from "@/modules/admin/lib/content";
import {
  CONTENT_TREE, allSections, dirtySections, fieldLabel, findFieldByText, getAt, leaves, searchSections, setAt,
} from "@/modules/admin/lib/content-tree";
import { defaultPageCopy } from "@/modules/admin/lib/page-copy";
import { AdminPreview, type PreviewFocus } from "@/modules/admin/preview/AdminPreview";
import type { PreviewPage } from "@/modules/admin/preview/protocol";
import { ContactEmailForm } from "./ContactEmailForm";
import { Field } from "./FormParts";
import { PageCopyEditor } from "./PageCopyEditor";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";
import { ServiceFields } from "./ServiceFields";
import { TreeLayout, focusField } from "./TreeLayout";

type Locale = "cs" | "en";
const LOCALES: Locale[] = ["cs", "en"];
const LONG_FIELDS = new Set(["o-mne.bio", "lightTesterPromo.desc"]);
const SECTIONS = allSections(CONTENT_TREE);
const sectionById = (id: string) => SECTIONS.find(({ section }) => section.id === id) ?? SECTIONS[0];

const emptyTestimonial = (): Testimonial => ({ id: crypto.randomUUID(), quote: "", author: "", role: "", photo: "" });

const emptyContent = (): ContentData => ({
  home: { title: "", subtitle: "" },
  "o-mne": { title: "", subtitle: "", bio: "" },
  lightTesterPromo: { title: "", desc: "" },
  editorial: { eventsTitle: "" },
  sluzby: {
    portraits: { title: "", desc: "", packages: [], note: "" },
    weddings: { title: "", desc: "", packages: [], note: "" },
    business: { title: "", desc: "", packages: [], extras: [], note: "" },
  },
  testimonials: [],
});

const emptyBoth = (): Record<Locale, ContentData> => ({ cs: emptyContent(), en: emptyContent() });

export function ContentEditor({ photos = [] }: { photos?: GalleryPhoto[] }) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [locale, setLocale] = useState<Locale>("cs");
  const [data, setData] = useState(emptyBoth);
  const [saved, setSaved] = useState(emptyBoth);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [selected, setSelected] = useState(SECTIONS[0].section.id);
  const [query, setQuery] = useState("");
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<PreviewPage>("home");
  const [previewFocus, setPreviewFocus] = useState<PreviewFocus | null>(null);

  useEffect(() => {
    async function load(url: string) {
      const r = await fetch(url);
      if (r.status === 401) { router.push("/admin/login"); return null; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }

    Promise.all([
      load("/api/admin/content?locale=cs"),
      load("/api/admin/content?locale=en"),
    ]).then(([cs, en]) => {
      if (!cs) return;
      const loaded = { cs, en: en ?? emptyContent() };
      setData(loaded);
      setSaved(structuredClone(loaded));
    }).catch(() => {
      // fetch failed, state stays at empty defaults
    });
  }, [router]);

  const current = data[locale];
  const pageTemplate = useMemo(() => defaultPageCopy(locale), [locale]);
  const dirty = useMemo(() => ({
    cs: dirtySections(CONTENT_TREE, data.cs, saved.cs),
    en: dirtySections(CONTENT_TREE, data.en, saved.en),
  }), [data, saved]);
  const dirtyCount = dirty.cs.size + dirty.en.size;
  const hits = useMemo(() => searchSections(CONTENT_TREE, current, query), [current, query]);
  const { page, section } = sectionById(selected);

  useEffect(() => {
    if (!dirtyCount) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyCount]);

  useEffect(() => {
    if (!pendingFocus) return;
    focusField(editorRef.current, pendingFocus);
    setPendingFocus(null);
  }, [pendingFocus, selected]);

  const groups = CONTENT_TREE.map((p) => ({
    title: p.page,
    items: p.sections.filter((s) => hits.has(s.id)).map((s) => ({
      id: s.id,
      label: s.title,
      dirty: dirty.cs.has(s.id) || dirty.en.has(s.id),
    })),
  }));

  function select(id: string) {
    const target = sectionById(id);
    setSelected(id);
    if (target.page.preview) setPreviewPage(target.page.preview);
    const text = target.section.paths.flatMap((path) => leaves(current, path)).find(([, value]) => value.trim())?.[1];
    if (text) setPreviewFocus({ text });
  }

  function pick({ text }: { text: string }) {
    const hit = findFieldByText(CONTENT_TREE, current, text, previewPage);
    if (!hit) return;
    setQuery("");
    setSelected(hit.sectionId);
    setPendingFocus(hit.path);
  }

  // Focusing a text field scrolls the preview to the field's text.
  function focusPreview(event: React.FocusEvent<HTMLFormElement>) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    if (page.preview) setPreviewPage(page.preview);
    if (field.value.trim()) setPreviewFocus({ text: field.value });
  }

  function switchLocale(next: Locale) {
    setLocale(next);
    setStatus("idle");
  }

  function patch(updater: (d: ContentData) => void) {
    setData((prev) => {
      const copy = structuredClone(prev);
      updater(copy[locale]);
      return copy;
    });
  }

  async function saveLocale(l: Locale) {
    // Drop unfinished testimonial rows (e.g. a freshly-added empty one) so a
    // blank row doesn't make the whole save fail server-side validation.
    const payload: ContentData = {
      ...data[l],
      testimonials: (data[l].testimonials ?? []).filter(
        (t) => t.quote.trim() !== "" && t.author.trim() !== "",
      ),
    };
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: l, data: payload }),
    });
    if (res.ok) setSaved((prev) => ({ ...prev, [l]: structuredClone(data[l]) }));
    return res.ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      const results = await Promise.all(LOCALES.filter((l) => dirty[l].size > 0).map(saveLocale));
      const ok = results.every(Boolean);
      setStatus(ok ? "ok" : "error");
      if (ok) setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    }
  }

  function renderField(path: string) {
    if (path.startsWith("pages.")) {
      if (!current.pages) return null;
      return (
        <PageCopyEditor
          key={path}
          path={path}
          label={fieldLabel(path)}
          value={getAt(current, path)}
          template={getAt({ pages: pageTemplate }, path)}
          onChange={(v) => patch((d) => { d.pages ??= structuredClone(pageTemplate); setAt(d, path, v); })}
        />
      );
    }
    if (path.startsWith("sluzby.")) {
      const service = path.split(".")[1] as keyof ContentData["sluzby"];
      return <ServiceFields key={path} service={service} content={current} patch={patch} />;
    }
    if (path === "testimonials") {
      return (
        <TestimonialEditor
          key={path}
          testimonials={current.testimonials ?? []}
          onChange={(items) => patch((d) => { d.testimonials = items; })}
          photos={photos}
        />
      );
    }
    const value = getAt(current, path);
    return (
      <Field
        key={path}
        path={path}
        label={fieldLabel(path)}
        value={typeof value === "string" ? value : ""}
        onChange={(v) => patch((d) => { setAt(d, path, v); })}
        textarea={LONG_FIELDS.has(path)}
      />
    );
  }

  const tab = (active: boolean) =>
    `px-3 py-1 text-xs font-medium transition-colors ${active ? "bg-white text-black" : "border border-white/20 hover:border-white"}`;

  return (
    <TreeLayout
      groups={groups}
      selected={selected}
      onSelect={select}
      search={{ value: query, onChange: setQuery }}
      preview={
        <AdminPreview
          page={previewPage}
          onPageChange={setPreviewPage}
          locale={locale}
          content={current.pages ? current : undefined}
          focus={previewFocus}
          onPick={pick}
        />
      }
    >
      <div ref={editorRef}>
        <div className="mb-5 flex items-center gap-3">
          <h2 className="flex-1 text-lg font-semibold">
            <span className="text-gray-500 font-normal">{page.page} › </span>{section.title}
          </h2>
          {!section.special && LOCALES.map((l) => (
            <button key={l} type="button" onClick={() => switchLocale(l)} className={tab(locale === l)}>
              {l.toUpperCase()}{dirty[l].size > 0 ? " •" : ""}
            </button>
          ))}
        </div>

        {section.special === "settings" ? (
          <div className="space-y-10">
            <ContactEmailForm />
            <ProfilePhotoUploader />
          </div>
        ) : (
          <form onSubmit={handleSubmit} onFocus={focusPreview} className="space-y-5">
            {section.paths.map(renderField)}
            <div className="sticky bottom-0 z-10 flex items-center gap-4 bg-zinc-950/95 py-3 backdrop-blur">
              <button
                type="submit"
                disabled={status === "saving" || dirtyCount === 0}
                className="px-6 py-2 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {status === "saving" ? "Ukládám…" : dirtyCount ? `Uložit · ${dirtyCount}` : "Vše uloženo"}
              </button>
              {status === "ok" && <span className="text-green-400 text-sm">Uloženo</span>}
              {status === "error" && <span className="text-red-400 text-sm">Chyba při ukládání</span>}
            </div>
          </form>
        )}
      </div>
    </TreeLayout>
  );
}

function TestimonialEditor({
  testimonials,
  onChange,
  photos,
}: {
  testimonials: Testimonial[];
  onChange: (items: Testimonial[]) => void;
  photos: GalleryPhoto[];
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  function update(i: number, updater: (t: Testimonial) => void) {
    const next = testimonials.map((t, idx) => {
      if (idx !== i) return t;
      const copy = structuredClone(t);
      updater(copy);
      return copy;
    });
    onChange(next);
  }

  function add() {
    const item = emptyTestimonial();
    setAddedId(item.id);
    onChange([...testimonials, item]);
  }
  function remove(i: number) { onChange(testimonials.filter((_, idx) => idx !== i)); }

  async function uploadPhoto(i: number, file: File, id: string) {
    setUploadingId(id);
    setErrorId(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "site");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const { publicId } = await res.json();
      update(i, (t) => { t.photo = publicId; });
    } catch {
      setErrorId(id); // leave photo unchanged, surface failure
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">Reference se na webu zobrazí jen pokud existuje alespoň jedna.</p>
      {testimonials.map((t, i) => (
        <details key={t.id ?? String(i)} data-path={`testimonials.${i}`} open={t.id === addedId} className="group border border-white/10">
          <summary className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-white/5">
            <span className="text-xs text-gray-500">{i + 1}.</span>
            <span className="truncate flex-1">
              {t.author || <em className="text-gray-500">nová reference</em>}
              {t.quote && <span className="text-gray-500"> · {t.quote}</span>}
            </span>
            <span className="text-gray-500 group-open:rotate-90 transition-transform">›</span>
          </summary>
          <div className="space-y-2 border-t border-white/10 p-3">
          <textarea
            placeholder="Citace / co klient řekl"
            value={t.quote}
            onChange={(e) => update(i, (x) => { x.quote = e.target.value; })}
            rows={3}
            className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Jméno (autor)"
              value={t.author}
              onChange={(e) => update(i, (x) => { x.author = e.target.value; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
            <input
              type="text"
              placeholder="Role / popis (volitelné)"
              value={t.role ?? ""}
              onChange={(e) => update(i, (x) => { x.role = e.target.value; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            Zobrazit na
            <select
              value={t.service ?? "creative"}
              onChange={(e) => update(i, (x) => { x.service = e.target.value as TestimonialService; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            >
              <option value="creative">Homepage (kreativní portrét)</option>
              <option value="business">Business portréty</option>
            </select>
          </label>
          <div className="flex items-center gap-4">
            {t.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cloudinaryUrl(t.photo, "w_64,h_64,c_fill,g_face,q_auto,f_auto")}
                alt={t.author || "Foto reference"}
                className="w-12 h-12 object-cover rounded-full"
              />
            ) : (
              <span className="text-xs text-gray-500">Bez fotky</span>
            )}
            {photos.length > 0 && (
              <button
                type="button"
                onClick={() => setPickerOpenId((cur) => (cur === (t.id ?? String(i)) ? null : (t.id ?? String(i))))}
                className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30"
              >
                {pickerOpenId === (t.id ?? String(i)) ? "Zavřít výběr" : "Vybrat z fotek"}
              </button>
            )}
            <label className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30 cursor-pointer">
              {uploadingId === (t.id ?? String(i)) ? "Nahrávám…" : "Nahrát novou"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadingId === (t.id ?? String(i))}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(i, file, t.id ?? String(i));
                  e.target.value = "";
                }}
              />
            </label>
            {t.photo && (
              <button
                type="button"
                onClick={() => update(i, (x) => { x.photo = ""; })}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Odebrat fotku
              </button>
            )}
            {errorId === (t.id ?? String(i)) && (
              <span className="text-xs text-red-400">Nahrávání selhalo</span>
            )}
          </div>
          {pickerOpenId === (t.id ?? String(i)) && photos.length > 0 && (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mt-2 max-h-64 overflow-y-auto border border-white/10 p-2">
              {photos.map((p) => {
                const selected = t.photo === p.publicId;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.publicId}
                    src={cloudinaryUrl(p.publicId, "w_80,h_80,c_fill,g_face,q_auto,f_auto")}
                    alt=""
                    onClick={() => { update(i, (x) => { x.photo = p.publicId; }); setPickerOpenId(null); }}
                    className={`w-full aspect-square object-cover cursor-pointer transition-opacity hover:opacity-100 ${selected ? "ring-2 ring-white opacity-100" : "opacity-70"}`}
                  />
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={uploadingId === (t.id ?? String(i))}
            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Odebrat referenci
          </button>
          </div>
        </details>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30"
      >
        + Přidat referenci
      </button>
    </div>
  );
}
