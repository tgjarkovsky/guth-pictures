"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { EditorialImage } from "@/modules/admin/lib/content";

type Point = { x: number; y: number };

const THUMB = "c_fill,ar_4:5,g_auto,w_420,q_auto,f_auto";
const MIN_DISTANCE = 150;
const VISIBLE_MS = 900;
const FADE_MS = 700; // keep in sync with the opacity transition in globals.css
const CYCLE_MS = 1500;
// Where the first photos land (share of the hero), so it isn't just text before the visitor moves.
const INTRO: [number, number][] = [[0.2, 0.42], [0.52, 0.64], [0.8, 0.4]];

export const farEnough = (a: Point, b: Point, min: number) => Math.hypot(a.x - b.x, a.y - b.y) >= min;

const query = (q: string) => window.matchMedia?.(q).matches ?? false;

// Decorative: portraits appear under the cursor (a tap on touch screens) and fade away again.
// Listens on the parent section, so the layer itself never intercepts clicks.
export function HeroTrail({ images }: { images: EditorialImage[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    const hero = layer?.parentElement;
    if (!layer || !hero) return;
    const photos = [...layer.querySelectorAll("img")];
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const busy = new Set<HTMLImageElement>();
    let next = 0;
    let last: Point = { x: -999, y: -999 };

    const later = (fn: () => void, ms: number) => {
      const timer = setTimeout(() => { timers.delete(timer); fn(); }, ms);
      timers.add(timer);
    };
    // A photo is reused only once it has faded out completely, otherwise it would jump while still visible.
    const pick = () => {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[(next + i) % photos.length];
        if (!busy.has(photo)) {
          next = (next + i + 1) % photos.length;
          return photo;
        }
      }
    };
    const show = (x: number, y: number) => {
      const photo = pick();
      if (!photo) return false;
      busy.add(photo);
      photo.style.left = `${x}px`;
      photo.style.top = `${y}px`;
      photo.classList.add("on");
      later(() => photo.classList.remove("on"), VISIBLE_MS);
      later(() => busy.delete(photo), VISIBLE_MS + FADE_MS);
      return true;
    };
    const local = (e: MouseEvent): Point => {
      const rect = hero.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const spot = (fx: number, fy: number) => show(hero.clientWidth * fx, hero.clientHeight * fy);

    // The distance check uses client coordinates, so the layout is only measured when a photo is shown.
    const onMove = (e: MouseEvent) => {
      const point = { x: e.clientX, y: e.clientY };
      if (!farEnough(last, point, MIN_DISTANCE)) return;
      const at = local(e);
      if (show(at.x, at.y)) last = point;
    };
    const onTap = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") show(local(e).x, local(e).y);
    };

    if (query("(prefers-reduced-motion: reduce)")) {
      INTRO.forEach(([fx, fy], i) => {
        photos[i]?.style.setProperty("left", `${fx * 100}%`);
        photos[i]?.style.setProperty("top", `${fy * 100}%`);
        photos[i]?.classList.add("on");
      });
      return;
    }

    INTRO.forEach(([fx, fy], i) => later(() => spot(fx, fy), 500 + i * 450));
    const fine = query("(pointer: fine)");
    if (fine) hero.addEventListener("mousemove", onMove);
    const cycle = fine ? undefined : setInterval(() => spot(0.2 + Math.random() * 0.6, 0.35 + Math.random() * 0.4), CYCLE_MS);
    hero.addEventListener("pointerdown", onTap);

    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("pointerdown", onTap);
      clearInterval(cycle);
      timers.forEach(clearTimeout);
    };
  }, [images]);

  if (images.length === 0) return null;
  return (
    <div ref={ref} className="ed-trail" aria-hidden="true">
      {images.map((image, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={image.publicId} src={cloudinaryUrl(image.publicId, THUMB)} alt="" decoding="async" style={{ "--r": `${((i % 3) - 1) * 5}deg` } as CSSProperties} />
      ))}
    </div>
  );
}
