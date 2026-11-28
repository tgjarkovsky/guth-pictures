import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { StoryDraft } from "../../lib/types";
import { DraftCard } from "../DraftCard";

vi.mock("../story/TemplateC", () => ({
  TemplateC: (p: { headline: string; scale: number }) => <div data-testid="tpl-C" data-scale={p.scale}>{p.headline}</div>,
}));
vi.mock("../story/TemplateD", () => ({
  TemplateD: (p: { words: string[]; scale: number }) => <div data-testid="tpl-D" data-scale={p.scale}>{p.words.join("|")}</div>,
}));
vi.mock("../story/TemplateP", async (orig) => ({
  ...(await orig<typeof import("../story/TemplateP")>()),
  TemplateP: (p: { headline: string; price: string; format: string }) => <div data-testid="tpl-P" data-format={p.format}>{p.headline}|{p.price}</div>,
}));
vi.mock("../story/useExport", () => ({ useExport: () => ({ exportVideo: vi.fn() }) }));

const draft: StoryDraft = {
  id: "d1", template: "C", headline: "Ahoj", sub: "sub",
  words: ["a", "", "b"], subHeadline: "sh", textSource: "manual", createdAt: "2026-01-01",
  photos: [
    { publicId: "folder/first", x: 50, y: 50 },
    { publicId: "folder/second", x: 20, y: 30 },
  ],
};

const setup = () => {
  const onChanged = vi.fn().mockResolvedValue(undefined);
  render(<DraftCard draft={draft} galleryPhotos={[]} onChanged={onChanged} />);
  return { onChanged };
};

describe("DraftCard", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch;
  });

  it("přepíná šablonu C/D (preview i export kontejner)", () => {
    setup();
    expect(screen.getAllByTestId("tpl-C")).toHaveLength(2);
    expect(screen.queryByTestId("tpl-D")).toBeNull();
    fireEvent.change(screen.getByDisplayValue("Šablona C"), { target: { value: "D" } });
    expect(screen.queryByTestId("tpl-C")).toBeNull();
    const d = screen.getAllByTestId("tpl-D");
    expect(d).toHaveLength(2);
    expect(d[0].textContent).toBe("a|b");
  });

  it("posune fotku níž", () => {
    setup();
    const names = () => screen.getAllByTitle("Vybrat jinou fotku z portfolia").map(b => b.textContent);
    expect(names()).toEqual(["first", "second"]);
    fireEvent.click(screen.getAllByTitle("Posunout níž")[0]);
    expect(names()).toEqual(["second", "first"]);
  });

  it("Uložit pošle PUT s draftem", async () => {
    const { onChanged } = setup();
    fireEvent.click(screen.getAllByTitle("Posunout níž")[0]);
    fireEvent.click(screen.getByText("Uložit"));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("/api/admin/stories/drafts");
    expect(init?.method).toBe("PUT");
    const sent = JSON.parse(init!.body as string).draft;
    expect(sent.id).toBe("d1");
    expect(sent.photos.map((p: { publicId: string }) => p.publicId)).toEqual(["folder/second", "folder/first"]);
  });

  it("po uložení ukáže Uloženo", async () => {
    setup();
    fireEvent.click(screen.getByText("Uložit"));
    expect(await screen.findByText("Uloženo ✓")).toBeTruthy();
  });

  it("chyba serveru se ukáže a onChanged se nevolá", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "KV not configured" }) }) as unknown as typeof fetch;
    const { onChanged } = setup();
    fireEvent.click(screen.getByText("Uložit"));
    expect((await screen.findByRole("alert")).textContent).toBe("Uložení selhalo: KV not configured");
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.queryByText("Uloženo ✓")).toBeNull();
  });

  it("výpadek sítě se ukáže jako chyba", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch")) as unknown as typeof fetch;
    setup();
    fireEvent.click(screen.getByText("Uložit"));
    expect((await screen.findByRole("alert")).textContent).toBe("Uložení selhalo: Failed to fetch");
  });

  it("safe zone pro Reels ukáže pásy, ve feedu 4:5 se vypne", () => {
    setup();
    const zone = screen.getByDisplayValue("vypnuto");
    fireEvent.change(zone, { target: { value: "reels" } });
    expect(screen.getByTestId("safe-zone-reels")).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue("Šablona C"), { target: { value: "P" } });
    fireEvent.change(screen.getByDisplayValue("Story / Reels 9:16"), { target: { value: "feed" } });
    expect(screen.queryByTestId("safe-zone-reels")).toBeNull();
    expect(zone).toBeDisabled();
  });

  it("šablona P: předloha vyplní texty, feed 4:5 nejde naplánovat jako story", () => {
    setup();
    fireEvent.change(screen.getByDisplayValue("Šablona C"), { target: { value: "P" } });
    expect(screen.getAllByTestId("tpl-P")).toHaveLength(2);
    const format = screen.getByDisplayValue("Story / Reels 9:16");
    const preset = screen.getByDisplayValue("Text podle předlohy…");
    fireEvent.change(preset, { target: { value: "1" } });
    expect(screen.getAllByTestId("tpl-P")[0].textContent).toBe("Ne další\nsvetr.|");
    fireEvent.change(format, { target: { value: "feed" } });
    expect(screen.getAllByTestId("tpl-P")[0].dataset.format).toBe("feed");
    expect(screen.getByText("Schválit + naplánovat").closest("button")).toBeDisabled();
  });
});
