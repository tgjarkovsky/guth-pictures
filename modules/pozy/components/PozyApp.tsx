"use client";

import { useEffect, useRef, useState } from "react";
import { filterPoses, filterToQuery, uniqueValues, type Pose, type PoseFilter } from "../filter";

const shotLabels: Record<string, string> = {
  headshot: "Detail tváře",
  "three-quarter": "Do pasu / ke kolenům",
  seated: "Vsedě",
  full: "Celá postava",
  hands: "Ruce",
};

type ChipsProps = { label: string; options: string[]; value?: string; format?: (v: string) => string; onChange: (v?: string) => void };

function Chips({ label, options, value, format = (v) => v, onChange }: ChipsProps) {
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm transition-colors ${
      active
        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)]"
        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
    }`;
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={!value} className={chip(!value)} onClick={() => onChange(undefined)}>
        vše
      </button>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} className={chip(value === o)} onClick={() => onChange(o)}>
          {format(o)}
        </button>
      ))}
    </div>
  );
}

type Pick = { slug: string; ids: string[]; note?: string };

export function PozyApp({ poses, initial, pick }: { poses: Pose[]; initial: PoseFilter; pick?: Pick }) {
  const [filter, setFilter] = useState(initial);
  const [liked, setLiked] = useState(() => new Set(pick?.ids));
  const toggle = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const update = (next: PoseFilter) => {
    setFilter(next);
    window.history.replaceState(null, "", window.location.pathname + filterToQuery(next));
  };
  const visible = filterPoses(poses, filter);

  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-24 pt-28 text-[var(--color-text)]">
      <h1 className="text-3xl font-medium">Pózy na focení</h1>
      <p className="mt-2 max-w-xl text-[var(--color-text-muted)]">
        {pick
          ? "Projdi si pózy a označ ty, které se ti líbí. Na konci mi výběr pošli, na focení tě jimi provedu."
          : "Projdi si pózy a vyber, co se ti líbí. Na focení tě jimi provedu, nemusíš nic nacvičovat."}
      </p>
      <div className="mt-8 space-y-3">
        <Chips label="Typ focení" options={uniqueValues(poses.flatMap((p) => p.tags))} value={filter.tag} onChange={(tag) => update({ ...filter, tag })} />
        <Chips label="Záběr" options={uniqueValues(poses.map((p) => p.shot))} value={filter.shot} format={(s) => shotLabels[s] ?? s} onChange={(shot) => update({ ...filter, shot })} />
      </div>
      {visible.length === 0 ? (
        <p className="mt-10 text-[var(--color-text-muted)]">Pro tuhle kombinaci tu zatím nic není. Zkus jiný záběr.</p>
      ) : (
        <Carousel key={filterToQuery(filter)} poses={visible} liked={pick ? liked : undefined} onToggle={toggle} />
      )}
      {pick && <SendPicks slug={pick.slug} ids={poses.filter((p) => liked.has(p.id)).map((p) => p.id)} initialNote={pick.note} />}
    </main>
  );
}

function SendPicks({ slug, ids, initialNote = "" }: { slug: string; ids: string[]; initialNote?: string }) {
  const [note, setNote] = useState(initialNote);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const send = async () => {
    setStatus("sending");
    const res = await fetch(`/api/pozy/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, note }),
    }).catch(() => null);
    setStatus(res?.ok ? "ok" : "error");
  };

  return (
    <section aria-label="Odeslat výběr" className="mx-auto mt-12 max-w-[520px] space-y-3">
      <p className="text-[var(--color-text-muted)]">Vybráno: {ids.length}</p>
      <label className="block">
        <span className="text-sm text-[var(--color-text-muted)]">Poznámka (nepovinné)</span>
        <textarea
          value={note}
          maxLength={1000}
          rows={3}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--color-border)] bg-transparent p-2"
        />
      </label>
      <button
        type="button"
        disabled={status === "sending"}
        onClick={send}
        className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-[var(--color-bg)] disabled:opacity-50"
      >
        {status === "sending" ? "Odesílám…" : "Odeslat výběr"}
      </button>
      <p aria-live="polite" className="text-sm">
        {status === "ok" && "Díky, výběr mám. Můžeš ho klidně ještě upravit a poslat znovu."}
        {status === "error" && "Odeslání se nepovedlo, zkus to prosím znovu."}
      </p>
    </section>
  );
}

const arrow =
  "absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--glass-bg)] text-xl text-[var(--color-text)] backdrop-blur transition-opacity disabled:pointer-events-none disabled:opacity-0";

// Native scroll-snap does the swipe; arrows, keys and thumbnails just scroll the track.
function Carousel({ poses, liked, onToggle }: { poses: Pose[]; liked?: Set<string>; onToggle: (id: string) => void }) {
  const track = useRef<HTMLUListElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const current = () => (track.current ? Math.round(track.current.scrollLeft / track.current.clientWidth) : 0);
  const go = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: Math.max(0, Math.min(poses.length - 1, i)) * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(current() - 1);
      if (e.key === "ArrowRight") go(current() + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const thumb = thumbs.current?.children[index] as HTMLElement | undefined;
    const strip = thumbs.current;
    if (thumb && strip) strip.scrollTo({ left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2, behavior: "smooth" });
  }, [index]);

  const pose = poses[index];
  return (
    <section aria-roledescription="carousel" aria-label="Pózy" className="mt-10">
      <div className="relative mx-auto max-w-[640px]">
        <button type="button" aria-label="Předchozí póza" className={`${arrow} left-0`} disabled={index === 0} onClick={() => go(index - 1)}>
          ←
        </button>
        <ul
          ref={track}
          onScroll={() => setIndex(current())}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {poses.map((p, i) => (
            <li key={p.id} aria-roledescription="slide" aria-label={`${i + 1} z ${poses.length}`} className="w-full shrink-0 snap-center px-12">
              {/* Local static file — the global next/image loader is Cloudinary-only */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/poses/${p.id}.jpg`}
                alt={p.label}
                loading={i < 2 ? "eager" : "lazy"}
                draggable={false}
                className="mx-auto aspect-[4/5] w-[min(100%,calc(62vh*0.8))] rounded bg-[var(--color-bg-overlay)] object-cover"
              />
            </li>
          ))}
        </ul>
        <button type="button" aria-label="Další póza" className={`${arrow} right-0`} disabled={index === poses.length - 1} onClick={() => go(index + 1)}>
          →
        </button>
      </div>

      <div aria-live="polite" className="mx-auto mt-5 max-w-[520px] px-12 text-center">
        <p className="font-mono text-xs tracking-widest text-[var(--color-text-ghost)]">
          {String(index + 1).padStart(2, "0")} / {String(poses.length).padStart(2, "0")}
        </p>
        <p className="mt-2 text-lg">{pose.label}</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{shotLabels[pose.shot] ?? pose.shot}</p>
        {liked && (
          <button
            type="button"
            aria-pressed={liked.has(pose.id)}
            onClick={() => onToggle(pose.id)}
            className={`mt-4 rounded-full border px-4 py-2 text-sm transition-colors ${
              liked.has(pose.id)
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {liked.has(pose.id) ? "♥ Líbí se mi" : "♡ Líbí se mi"}
          </button>
        )}
      </div>

      <div ref={thumbs} className="relative mx-auto mt-8 flex max-w-[640px] gap-2 [&>:first-child]:ml-auto [&>:last-child]:mr-auto overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {poses.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`Póza ${i + 1}: ${p.label}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={`relative shrink-0 overflow-hidden rounded transition-opacity ${i === index ? "opacity-100 ring-2 ring-[var(--color-accent)]" : "opacity-40 hover:opacity-80"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/poses/${p.id}.jpg`} alt="" loading="lazy" className="aspect-[4/5] w-14 object-cover" />
            {liked?.has(p.id) && (
              <span aria-hidden className="absolute right-0.5 top-0.5 text-xs text-[var(--color-accent)]">♥</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
