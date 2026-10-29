import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Nav } from "@/components/Nav";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "cs",
}));

let pathname = "/";
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname,
  Link: ({
    href,
    locale: _locale,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { locale?: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe("Nav", () => {
  it("/light-tester: jen odkaz zpět domů", () => {
    pathname = "/light-tester";
    render(<Nav />);
    expect(screen.getByText("← home").closest("a")).toHaveAttribute("href", "/");
    expect(screen.queryByText("o-mne")).not.toBeInTheDocument();
    expect(screen.queryByText("blog")).not.toBeInTheDocument();
  });

  it("/pozy: renderuje odkazy homeLinks a přepínač jazyka", () => {
    pathname = "/pozy";
    render(<Nav />);
    expect(screen.getByText("o-mne").closest("a")).toHaveAttribute("href", "/#o-mne");
    expect(screen.getByText("sluzby").closest("a")).toHaveAttribute("href", "/#sluzby");
    expect(screen.getByText("kontakt").closest("a")).toHaveAttribute("href", "/#kontakt");
    expect(screen.getByText("blog").closest("a")).toHaveAttribute("href", "/blog");
    expect(screen.getByText("portfolio").closest("a")).toHaveAttribute("href", "/portfolio");
    expect(screen.getByText("light-tester").closest("a")).toHaveAttribute("href", "/light-tester");
    expect(screen.getByText("CS").closest("a")).toHaveAttribute("href", "/pozy");
    expect(screen.getByText("EN").closest("a")).toHaveAttribute("href", "/pozy");
    expect(screen.getByText("portfolio").closest("a")?.className).toContain(" text-[var(--color-text-muted)]");
  });

  it("/portfolio/x: odkaz zpět", () => {
    pathname = "/portfolio/x";
    render(<Nav />);
    expect(screen.getByText("← home").closest("a")).toHaveAttribute("href", "/");
  });

  it.each(["/", "/blog/x", "/portfolio", "/nahled/abc"])("%s: nic se nerenderuje", (p) => {
    pathname = p;
    const { container } = render(<Nav />);
    expect(container).toBeEmptyDOMElement();
  });

  it("drawer: přepínač jazyka a zavření po kliknutí", async () => {
    pathname = "/pozy";
    const user = userEvent.setup();
    render(<Nav />);
    await user.click(screen.getByLabelText("Otevřít menu"));
    const cs = await screen.findByText("Čeština");
    expect(cs.closest("a")).toHaveAttribute("href", "/pozy");
    expect(screen.getByText("English").closest("a")).toHaveAttribute("href", "/pozy");
    await user.click(cs);
    expect(screen.getByLabelText("Otevřít menu")).toHaveAttribute("aria-expanded", "false");
  });
});
