"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentData } from "@/modules/admin/lib/content";
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
const LONG_FIELDS = new Set(["o-mne.bio"]);
const SECTIONS = allSections(CONTENT_TREE);
const sectionById = (id: string) => SECTIONS.find(({ section }) => section.id === id) ?? SECTIONS[0];

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

export function ContentEditor() {
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

  // References are edited in Fotky; take the stored ones fresh so this save never reverts them.
  async function saveLocale(l: Locale) {
    const stored = await fetch(`/api/admin/content?locale=${l}`);
    if (!stored.ok) return false;
    const payload: ContentData = { ...data[l], testimonials: (await stored.json()).testimonials ?? [] };
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
