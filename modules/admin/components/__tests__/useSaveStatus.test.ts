import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSaveStatus } from "../useSaveStatus";

describe("useSaveStatus", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("úspěch ukáže ok a po resetMs se vrátí do idle", async () => {
    const { result } = renderHook(() => useSaveStatus());
    await act(() => result.current.run(async () => true, 2000));
    expect(result.current.status).toBe("ok");
    act(() => { vi.advanceTimersByTime(1999); });
    expect(result.current.status).toBe("ok");
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.status).toBe("idle");
  });

  it("bez resetMs zůstane ok", async () => {
    const { result } = renderHook(() => useSaveStatus());
    await act(() => result.current.run(async () => true));
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(result.current.status).toBe("ok");
  });

  it("neúspěch i výjimka skončí v error, který nezmizí", async () => {
    const { result } = renderHook(() => useSaveStatus());
    await act(() => result.current.run(async () => false, 2000));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.status).toBe("error");

    await act(() => result.current.run(async () => { throw new Error("boom"); }, 2000));
    expect(result.current.status).toBe("error");
  });

  it("během běhu hlásí saving", async () => {
    const { result } = renderHook(() => useSaveStatus());
    let finish: (ok: boolean) => void = () => {};
    let pending!: Promise<void>;
    act(() => { pending = result.current.run(() => new Promise((r) => { finish = r; })); });
    expect(result.current.status).toBe("saving");
    await act(async () => { finish(true); await pending; });
    expect(result.current.status).toBe("ok");
  });
});
