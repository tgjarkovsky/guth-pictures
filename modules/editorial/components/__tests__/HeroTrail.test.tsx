import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EditorialImage } from "@/modules/admin/lib/content";
import { farEnough, HeroTrail } from "../HeroTrail";

const photo = (id: string): EditorialImage => ({
  publicId: id,
  alt: { cs: "x", en: "x" },
  focal: { desktop: "50% 50%", mobile: "50% 50%" },
});
const images = ["a", "b", "c", "d"].map((id) => photo(`portfolio/${id}`));

function media({ reduce = false, fine = true } = {}) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("reduce") ? reduce : query.includes("fine") ? fine : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
}

function setup(list = images) {
  const view = render(<section data-testid="hero"><HeroTrail images={list} /></section>);
  const hero = view.getByTestId("hero");
  const shown = () => hero.querySelectorAll("img.on").length;
  return { hero, shown, ...view };
}

beforeEach(() => { vi.useFakeTimers(); media(); });
afterEach(() => { vi.useRealTimers(); });

describe("farEnough", () => {
  it("compares the distance of two points with the minimum", () => {
    expect(farEnough({ x: 0, y: 0 }, { x: 100, y: 100 }, 140)).toBe(true);
    expect(farEnough({ x: 0, y: 0 }, { x: 100, y: 0 }, 140)).toBe(false);
  });
});

describe("HeroTrail", () => {
  it("renders a decorative layer with one cropped thumbnail per image", () => {
    const { container } = setup();
    const layer = container.querySelector(".ed-trail");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    const imgs = [...container.querySelectorAll("img")];
    expect(imgs).toHaveLength(4);
    expect(imgs[0].getAttribute("alt")).toBe("");
    expect(imgs[0].getAttribute("src")).toMatch(/c_fill.*w_\d+.*portfolio\/a$/);
  });

  it("renders nothing without photos", () => {
    const { container } = setup([]);
    expect(container.querySelector(".ed-trail")).toBeNull();
  });

  it("introduces itself with a few photos before any input", () => {
    const { shown } = setup();
    expect(shown()).toBe(0);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(shown()).toBeGreaterThan(0);
  });

  it("drops a photo under the mouse after a long enough move, and ignores tiny moves", () => {
    const { hero, shown } = setup();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(shown()).toBe(0);
    fireEvent.mouseMove(hero, { clientX: 300, clientY: 300 });
    expect(shown()).toBe(1);
    fireEvent.mouseMove(hero, { clientX: 310, clientY: 305 });
    expect(shown()).toBe(1);
    fireEvent.mouseMove(hero, { clientX: 600, clientY: 300 });
    expect(shown()).toBe(2);
  });

  it("lets each photo fade out again", () => {
    const { hero, shown } = setup();
    act(() => { vi.advanceTimersByTime(5000); });
    fireEvent.mouseMove(hero, { clientX: 300, clientY: 300 });
    expect(shown()).toBe(1);
    act(() => { vi.advanceTimersByTime(1500); });
    expect(shown()).toBe(0);
  });

  it("shows a photo where a finger taps", () => {
    media({ fine: false });
    const { hero, shown } = setup();
    act(() => { vi.advanceTimersByTime(100); });
    const before = shown();
    const tap = Object.assign(new Event("pointerdown", { bubbles: true }), { pointerType: "touch", clientX: 50, clientY: 50 });
    act(() => { hero.dispatchEvent(tap); });
    expect(shown()).toBe(before + 1);
  });

  it("on touch screens keeps cycling photos by itself", () => {
    media({ fine: false });
    const { shown } = setup();
    act(() => { vi.advanceTimersByTime(4000); });
    expect(shown()).toBeGreaterThan(0);
  });

  it("with reduced motion shows three still photos and never moves them", () => {
    media({ reduce: true });
    const { hero, shown } = setup();
    expect(shown()).toBe(3);
    fireEvent.mouseMove(hero, { clientX: 300, clientY: 300 });
    act(() => { vi.advanceTimersByTime(5000); });
    expect(shown()).toBe(3);
  });
});
