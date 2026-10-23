import { describe, it, expect, beforeEach } from "vitest";
import { detectLeadSource, captureLeadSource, readLeadSource } from "@/lib/lead-source";

const site = (path: string) => new URL(`https://www.guthpictures.eu${path}`);

describe("detectLeadSource", () => {
  it("bere UTM parametry z odkazu reklamy", () => {
    expect(detectLeadSource(site("/firemni-portrety?utm_source=google&utm_medium=cpc&utm_campaign=firemni&utm_term=headshot+praha"), "")).toEqual({
      source: "google",
      medium: "cpc",
      campaign: "firemni",
      term: "headshot praha",
      content: undefined,
      landingPage: "/firemni-portrety",
    });
  });

  it("pozná automaticky označené kliky z Google Ads a Facebooku", () => {
    expect(detectLeadSource(site("/?gclid=abc"), "")).toMatchObject({ source: "google", medium: "cpc" });
    expect(detectLeadSource(site("/?fbclid=abc"), "")).toMatchObject({ source: "facebook", medium: "social" });
  });

  it("bez UTM použije cizí referrer, vlastní web bere jako přímý přístup", () => {
    expect(detectLeadSource(site("/"), "https://www.seznam.cz/hledani")).toMatchObject({ source: "seznam.cz", medium: "referral" });
    expect(detectLeadSource(site("/"), "https://guthpictures.eu/blog")).toEqual({ source: "direct", landingPage: "/" });
    expect(detectLeadSource(site("/"), "")).toEqual({ source: "direct", landingPage: "/" });
  });
});

describe("captureLeadSource", () => {
  beforeEach(() => sessionStorage.clear());

  it("uloží zdroj jen z první stránky návštěvy", () => {
    window.history.replaceState(null, "", "/firemni-portrety?utm_source=sklik");
    captureLeadSource();
    window.history.replaceState(null, "", "/sluzby?utm_source=instagram");
    captureLeadSource();
    expect(readLeadSource()).toMatchObject({ source: "sklik", landingPage: "/firemni-portrety" });
  });
});
