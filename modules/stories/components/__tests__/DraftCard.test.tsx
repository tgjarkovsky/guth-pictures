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
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "D" } });
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
});
