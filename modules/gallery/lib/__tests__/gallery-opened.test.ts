import { describe, it, expect } from "vitest";
import { galleryOpenedLabel } from "../gallery-opened";

describe("galleryOpenedLabel", () => {
  it("says the client has not opened the gallery yet", () => {
    expect(galleryOpenedLabel({})).toBe("Klient galerii zatím neotevřel");
  });

  it("shows only the first open when dates match", () => {
    expect(
      galleryOpenedLabel({
        firstOpenedAt: "2026-10-05T10:00:00",
        lastOpenedAt: "2026-10-05T18:00:00",
      }),
    ).toBe("Otevřeno poprvé 5. 10. 2026");
  });

  it("adds the last open when dates differ", () => {
    expect(
      galleryOpenedLabel({
        firstOpenedAt: "2026-10-05T10:00:00",
        lastOpenedAt: "2026-10-18T10:00:00",
      }),
    ).toBe("Otevřeno poprvé 5. 10. 2026, naposledy 18. 10. 2026");
  });
});
