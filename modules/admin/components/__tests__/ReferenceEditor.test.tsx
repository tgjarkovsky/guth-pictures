import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReferenceEditor } from "../ReferenceEditor";
import { emptyReference, type Reference } from "@/modules/admin/lib/references";

const ref = (author: string, service: Reference["service"] = "creative"): Reference => ({ ...emptyReference(service), id: author, author });
// Business entry sits between creative ones; reordering one page must leave it where it is.
const refs = [ref("A"), ref("Biz", "business"), ref("B"), ref("C")];

function setup() {
  const onChange = vi.fn();
  render(<ReferenceEditor service="creative" refs={refs} onChange={onChange} photos={[]} />);
  const order = () => (onChange.mock.lastCall![0] as Reference[]).map((r) => r.author);
  return { onChange, order };
}

describe("ReferenceEditor ordering", () => {
  it("moves a collapsed reference with the arrows", () => {
    const { order } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Posunout dolů: A" }));
    expect(order()).toEqual(["Biz", "B", "A", "C"]);
    fireEvent.click(screen.getByRole("button", { name: "Posunout nahoru: C" }));
    expect(order()).toEqual(["A", "Biz", "C", "B"]);
  });

  it("disables arrows at the ends", () => {
    setup();
    expect(screen.getByRole("button", { name: "Posunout nahoru: A" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Posunout dolů: C" })).toBeDisabled();
  });

  it("drops a dragged reference onto another's place", () => {
    const { order } = setup();
    fireEvent.dragStart(screen.getByText("C").closest("summary")!);
    fireEvent.drop(screen.getByText("A").closest("details")!);
    expect(order()).toEqual(["C", "A", "Biz", "B"]);

    fireEvent.dragStart(screen.getByText("A").closest("summary")!);
    fireEvent.drop(screen.getByText("C").closest("details")!);
    expect(order()).toEqual(["Biz", "B", "C", "A"]);
  });
});
