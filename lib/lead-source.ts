// Where a visitor came from, captured on the first page of their visit and
// attached to the contact form, so every inquiry says which ad, post or search
// brought it. Lives in sessionStorage only — no cookie, nothing leaves the
// browser until the visitor sends the form.

const STORAGE_KEY = "gp-lead-source";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type LeadSource = {
  source: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  landingPage: string;
};

/** Derives the source from the landing URL's UTM / click-id params, falling back to the referrer. */
export function detectLeadSource(url: URL, referrer: string): LeadSource {
  const p = url.searchParams;
  const [source, medium, campaign, term, content] = UTM_KEYS.map((k) => p.get(k)?.trim() || undefined);
  const landingPage = url.pathname;

  if (source) return { source, medium, campaign, term, content, landingPage };
  // Auto-tagged ad clicks arrive without UTM params
  if (p.has("gclid")) return { source: "google", medium: "cpc", landingPage };
  if (p.has("fbclid")) return { source: "facebook", medium: "social", landingPage };

  if (referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "");
      if (host !== url.hostname.replace(/^www\./, "")) return { source: host, medium: "referral", landingPage };
    } catch {
      // unparseable referrer — treat as direct
    }
  }
  return { source: "direct", landingPage };
}

/** Stores the source once per visit; later page views in the same tab keep the first one. */
export function captureLeadSource(): void {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const found = detectLeadSource(new URL(window.location.href), document.referrer);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  } catch {
    // storage blocked (private mode, disabled site data) — the form still works without it
  }
}

export function readLeadSource(): LeadSource | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LeadSource) : null;
  } catch {
    return null;
  }
}
