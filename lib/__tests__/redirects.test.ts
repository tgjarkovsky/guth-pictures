// @vitest-environment node
import { expect, it } from "vitest";
import nextConfig from "../../next.config";

it("přesměruje skryté stránky na homepage", async () => {
  const rules = await nextConfig.redirects!();
  const hit = (source: string) => rules.find((r) => r.source.includes(source));
  expect(hit("brandove-foceni")).toMatchObject({ destination: "/:locale", permanent: true });
  expect(hit("o-mne")).toMatchObject({ destination: "/:locale", permanent: true });
});
