import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { RevealPhone } from "../RevealPhone";

it("keeps the number out of the server HTML", () => {
  const html = renderToStaticMarkup(<RevealPhone label="Zobrazit telefon" />);
  expect(html).not.toMatch(/728|113|966/);
});

it("reveals a callable number on click", () => {
  render(<RevealPhone label="Zobrazit telefon" />);
  fireEvent.click(screen.getByRole("button", { name: "Zobrazit telefon" }));
  const link = screen.getByRole("link", { name: "728 113 966" });
  expect(link.getAttribute("href")).toBe("tel:+420728113966");
});
