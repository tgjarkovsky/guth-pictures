import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EditorialImage } from "@/modules/admin/lib/content";
import { beltPhotos, PhotoBelt } from "../PhotoBelt";

const photo = (id: string): EditorialImage => ({
  publicId: `portfolio/${id}`,
  alt: { cs: "x", en: "x" },
  focal: { desktop: "50% 50%", mobile: "50% 50%" },
});
const four = ["a", "b", "c", "d"].map(photo);

describe("beltPhotos", () => {
  it("repeats a short list in order until it reaches the minimum", () => {
    expect(beltPhotos(four, 8).map((p) => p.publicId.slice(-1))).toEqual(["a", "b", "c", "d", "a", "b", "c", "d"]);
  });

  it("repeats a whole number of rounds, so the seam of the loop stays in order", () => {
    expect(beltPhotos(four.slice(0, 3), 8)).toHaveLength(9);
  });

  it("leaves a long enough list alone and handles an empty one", () => {
    expect(beltPhotos(four, 3)).toHaveLength(4);
    expect(beltPhotos([], 8)).toEqual([]);
  });
});

describe("PhotoBelt", () => {
  it("is a decorative belt made of two identical groups, so it can loop seamlessly", () => {
    const { container } = render(<PhotoBelt images={four} />);
    expect(container.querySelector(".ed-belt")).toHaveAttribute("aria-hidden", "true");
    const groups = [...container.querySelectorAll(".ed-belt__group")];
    expect(groups).toHaveLength(2);
    const srcs = (group: Element) => [...group.querySelectorAll("img")].map((img) => img.getAttribute("src"));
    expect(srcs(groups[0])).toHaveLength(8);
    expect(srcs(groups[1])).toEqual(srcs(groups[0]));
  });

  it("uses small cropped portrait thumbnails with empty alt text", () => {
    const { container } = render(<PhotoBelt images={four} />);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("alt")).toBe("");
    expect(img.getAttribute("src")).toMatch(/c_fill.*ar_4:5.*w_\d+.*portfolio\/a$/);
  });

  it("loads the first group right away and the repeat lazily", () => {
    const { container } = render(<PhotoBelt images={four} />);
    const [first, second] = [...container.querySelectorAll(".ed-belt__group")];
    expect(first.querySelector("img")).toHaveAttribute("loading", "eager");
    expect(second.querySelector("img")).toHaveAttribute("loading", "lazy");
  });

  it("never stops moving on hover (the belt keeps flowing, only the colour comes back)", () => {
    expect(readFileSync("app/globals.css", "utf8")).not.toMatch(/animation-play-state/);
  });

  it("keeps the photos at their own height, otherwise flex stretch cancels the staggered offset", () => {
    expect(readFileSync("app/globals.css", "utf8")).toMatch(/\.ed-belt__group \{[^}]*align-items: flex-start/);
  });

  it("renders nothing without photos", () => {
    const { container } = render(<PhotoBelt images={[]} />);
    expect(container.querySelector(".ed-belt")).toBeNull();
  });
});
