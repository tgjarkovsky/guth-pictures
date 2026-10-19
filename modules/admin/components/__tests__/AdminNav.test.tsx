import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AdminNav } from "../AdminNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/obsah" }));

it("shows Téma as locked, not as a link", () => {
  render(<AdminNav />);
  expect(screen.queryByRole("link", { name: /Téma/ })).not.toBeInTheDocument();
  expect(screen.getByText(/Téma/)).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByRole("link", { name: "Texty" })).toHaveAttribute("aria-current", "page");
});
