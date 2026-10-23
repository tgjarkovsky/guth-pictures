import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/ContactForm";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    return t;
  },
}));

let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams, usePathname: () => "/firemni-portrety" }));

const track = vi.fn();
vi.mock("@vercel/analytics", () => ({ track: (...args: unknown[]) => track(...args) }));

describe("ContactForm", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID = "test123";
    searchParams = new URLSearchParams();
    sessionStorage.clear();
  });

  it("přiloží k poptávce zdroj návštěvy a po odeslání ji změří jako lead", async () => {
    sessionStorage.setItem("gp-lead-source", JSON.stringify({ source: "google", medium: "cpc", campaign: "firemni", landingPage: "/firemni-portrety" }));
    searchParams = new URLSearchParams("package=Tým&service=Firemní&topic=business");
    mockFetch.mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(track).toHaveBeenCalledOnce());
    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get("source")).toBe("google");
    expect(body.get("campaign")).toBe("firemni");
    expect(body.get("page")).toBe("/firemni-portrety");
    expect(body.get("package")).toBe("Tým");
    expect(track).toHaveBeenCalledWith("lead", {
      topic: "business",
      page: "/firemni-portrety",
      package: "Tým",
      source: "google",
      medium: "cpc",
      campaign: "firemni",
    });
  });

  it("neúspěšné odeslání se jako lead nezměří", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.type(screen.getByLabelText("message"), "x");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByText("error")).toBeInTheDocument());
    expect(track).not.toHaveBeenCalled();
  });

  it("odkaz z ceníku (?package=&service=&topic=) předvybere službu a text balíčku", () => {
    searchParams = new URLSearchParams("package=Mini&service=Portréty&topic=portraits");
    render(<ContactForm />);
    expect(screen.getByLabelText("topic")).toHaveValue("portraits");
    expect(screen.getByLabelText("message")).toHaveValue("packagePreset");
  });

  it("výběr služby předvyplní zprávu a nepřepíše ručně upravený text", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    const topic = screen.getByLabelText("topic");
    const message = screen.getByLabelText("message");

    await user.selectOptions(topic, "weddings");
    expect(message).toHaveValue("presets.weddings");

    await user.selectOptions(topic, "events");
    expect(message).toHaveValue("presets.events");

    await user.type(message, " vlastní");
    await user.selectOptions(topic, "business");
    expect(message).toHaveValue("presets.events vlastní");
  });

  it("odešle zvolenou službu do Formspree", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.selectOptions(screen.getByLabelText("topic"), "business");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());
    expect((mockFetch.mock.calls[0][1].body as FormData).get("topic")).toBe("business");
  });

  it("renderuje všechna pole a tlačítko", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText("name")).toBeInTheDocument();
    expect(screen.getByLabelText("email")).toBeInTheDocument();
    expect(screen.getByLabelText("message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "send" })).toBeInTheDocument();
  });

  it("po odeslání zavolá Formspree s daty z formuláře", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan Novák");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.type(screen.getByLabelText("message"), "Ahoj");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("formspree.io");
    expect(url).toContain("test123");
    expect(options.method).toBe("POST");
    expect(options.headers.Accept).toBe("application/json");
  });

  it("během odesílání zobrazí 'sending' a tlačítko je disabled", async () => {
    let resolve!: (v: unknown) => void;
    mockFetch.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "x");
    await user.type(screen.getByLabelText("email"), "x@x.cz");
    await user.type(screen.getByLabelText("message"), "x");
    user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "sending" })).toBeDisabled();
    });

    resolve({ ok: true });
  });

  it("po úspěchu zobrazí success zprávu a skryje formulář", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.type(screen.getByLabelText("message"), "Zpráva");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByText("success")).toBeInTheDocument());
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("po chybě zobrazí error zprávu a formulář zůstane", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.type(screen.getByLabelText("message"), "Zpráva");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByText("error")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "send" })).toBeInTheDocument();
  });

  it("po síťové chybě zobrazí error zprávu a formulář zůstane", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText("name"), "Jan");
    await user.type(screen.getByLabelText("email"), "jan@test.cz");
    await user.type(screen.getByLabelText("message"), "Zpráva");
    await user.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByText("error")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "send" })).toBeInTheDocument();
  });
});
