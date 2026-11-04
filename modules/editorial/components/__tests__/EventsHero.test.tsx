import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { EventsHero } from "../EventsHero";
import { normalizeImages } from "@/modules/admin/lib/content";
import { defaultPageCopy } from "@/modules/admin/lib/page-copy";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }));
});

const renderHero = () => {
  const { events } = normalizeImages().editorial;
  return render(<EventsHero locale="cs" copy={defaultPageCopy("cs").events} title="Každý moment" tags={{ conference: "Konference", wedding: "Svatby" }} conference={events.hero} wedding={events.weddingHero} />);
};

it("switches the hero to the other half when its label is clicked, then drops the hint", async () => {
  const user = userEvent.setup();
  const { container } = renderHero();
  const hero = container.querySelector(".ed-events-hero")!;
  expect(hero.getAttribute("data-active")).toBe("conference");
  expect(hero.hasAttribute("data-explored")).toBe(false);

  await user.click(screen.getByRole("button", { name: /Svatby/ }));

  expect(hero.getAttribute("data-active")).toBe("wedding");
  expect(hero.hasAttribute("data-explored")).toBe(true);
  expect(screen.getByRole("button", { name: /Svatby/ }).getAttribute("aria-pressed")).toBe("true");
});
