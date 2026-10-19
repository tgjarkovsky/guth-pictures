import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { WorkGrid } from "../WorkGrid";
import { reviewedWork } from "../work-items";

// jsdom lacks the modal dialog API.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
});

const items = reviewedWork([
  { id: "a", quote: "První reference.", author: "Apolena", role: "Portrét", photo: "portfolio/a" },
  { id: "b", quote: "Druhá reference.", author: "Bára", photo: "portfolio/b" },
], "creative");

const setup = () => render(<WorkGrid items={items} locale="cs" sizes={["50vw", "50vw"]} placeholderLabel="Foto" />);
const dialog = () => screen.getByRole("dialog");

describe("WorkGrid lightbox", () => {
  it("opens the clicked reference with its full photo and quote", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Otevřít referenci: Bára" }));
    expect(within(dialog()).getByText("Druhá reference.")).toBeInTheDocument();
    expect(within(dialog()).getByRole("img", { name: "Bára" })).toBeInTheDocument();
    expect(within(dialog()).getByText("2 / 2")).toBeInTheDocument();
  });

  it("pages with arrow keys and wraps around", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Otevřít referenci: Bára" }));
    fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(within(dialog()).getByText("První reference.")).toBeInTheDocument();
    fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    expect(within(dialog()).getByText("Druhá reference.")).toBeInTheDocument();
  });

  it("closes from the close button", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Otevřít referenci: Apolena" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Zavřít" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("leaves photos without a review unclickable", () => {
    render(<WorkGrid items={[{ image: items[0].image }]} locale="cs" sizes={["50vw"]} placeholderLabel="Foto" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
