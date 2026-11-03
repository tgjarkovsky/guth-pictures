import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorialSubpage } from "../EditorialSubpage";

vi.mock("next-intl", () => ({ useLocale: () => "cs" }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => <a href={href} {...props}>{children}</a>,
  usePathname: () => "/blog",
}));

describe("EditorialSubpage", () => {
  it("renders the light editorial shell with secondary navigation", () => {
    render(<EditorialSubpage active="blog"><h1>Blog</h1></EditorialSubpage>);

    expect(screen.getByRole("main")).toHaveClass("editorial-secondary");
    expect(screen.getByRole("heading", { name: "Blog" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  });
});
