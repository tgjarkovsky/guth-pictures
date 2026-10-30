import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PozyApp } from "./PozyApp";

const poses = [{ id: "a", label: "Póza A", shot: "full", tags: ["portrait"] }] as never;

describe("SendPicks", () => {
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("po úpravě výběru zmizí potvrzení odeslání", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    render(<PozyApp poses={poses} initial={{}} pick={{ slug: "x", ids: [] }} />);

    await userEvent.click(screen.getByRole("button", { name: "Odeslat výběr" }));
    expect(await screen.findByText(/Díky, výběr mám/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "♡ Líbí se mi" }));
    expect(screen.queryByText(/Díky, výběr mám/)).not.toBeInTheDocument();
  });
});
