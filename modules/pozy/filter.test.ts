import { describe, expect, it } from "vitest";
import { filterPoses, filterToQuery, keepAllowed, uniqueValues } from "./filter";

const poses = [
  { id: "a", tags: ["portrét", "business"], shot: "headshot", label: "A" },
  { id: "b", tags: ["boudoir"], shot: "full", label: "B" },
  { id: "c", tags: ["business"], shot: "full", label: "C" },
];

describe("filterPoses", () => {
  it("returns all without filter", () => {
    expect(filterPoses(poses, {}).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("filters by tag", () => {
    expect(filterPoses(poses, { tag: "business" }).map((p) => p.id)).toEqual(["a", "c"]);
  });

  it("combines tag and shot", () => {
    expect(filterPoses(poses, { tag: "business", shot: "full" }).map((p) => p.id)).toEqual(["c"]);
  });

  it("returns empty for unknown tag", () => {
    expect(filterPoses(poses, { tag: "nic" })).toEqual([]);
  });
});

describe("filterToQuery", () => {
  it("encodes czech tag and shot", () => {
    expect(filterToQuery({ tag: "portrét", shot: "full" })).toBe("?stitek=portr%C3%A9t&zaber=full");
  });

  it("is empty without filter", () => {
    expect(filterToQuery({})).toBe("");
  });
});

describe("uniqueValues", () => {
  it("dedupes keeping order", () => {
    expect(uniqueValues(["b", "a", "b"])).toEqual(["b", "a"]);
  });
});

describe("keepAllowed", () => {
  it("keeps only allowed string ids, deduped", () => {
    expect(keepAllowed(["a", "x", "a", 3, "c"], ["a", "b", "c"])).toEqual(["a", "c"]);
  });

  it("returns empty for non-array", () => {
    expect(keepAllowed("a", ["a"])).toEqual([]);
  });
});
