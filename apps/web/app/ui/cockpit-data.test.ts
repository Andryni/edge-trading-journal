import { describe, expect, it } from "vitest";
import { createDemoTrades, type Trade } from "@edge/core";
import { distribution, previousPeriod, resultBars } from "./cockpit-data";

const base = createDemoTrades()[0];
const trade = (day: string, exit = 102, setup = "Rejet"): Trade => ({
  ...base,
  id: day + exit + setup,
  enteredAt: day + "T15:00:00Z",
  exitedAt: day + "T16:00:00Z",
  instrument: "NQ",
  direction: "LONG",
  entry: 100,
  stop: 99,
  target: 104,
  quantity: 1,
  fees: 0,
  exit,
  setup,
});

describe("read-only cockpit projections", () => {
  it("keeps gains and losses separate within a New York day", () => {
    const input = [
      trade("2026-11-02"),
      trade("2026-11-02", 99),
      trade("2026-11-02", 100),
    ];
    const before = JSON.stringify(input);
    expect(resultBars(input, "day")).toEqual([
      { date: "2026-11-02", gains: 2, losses: -1 },
    ]);
    expect(JSON.stringify(input)).toBe(before);
  });
  it("groups Monday to Sunday across calendar years and uses ET closing dates", () => {
    const late = { ...trade("2027-01-04"), exitedAt: "2027-01-04T02:00:00Z" };
    expect(
      resultBars([late, trade("2026-12-28", 99), trade("2027-01-04")], "week"),
    ).toEqual([
      { date: "2026-12-28", gains: 2, losses: -1 },
      { date: "2027-01-04", gains: 2, losses: 0 },
    ]);
  });
  it("distributes trade counts even when net R cancels or a setup only loses", () => {
    const trades = [
      trade("2026-11-02"),
      trade("2026-11-03", 98),
      trade("2026-11-04", 99, "Continuation"),
    ];
    expect(
      distribution(trades, "setup").map((g) => [g.label, g.count]),
    ).toEqual([
      ["Rejet", 2],
      ["Continuation", 1],
    ]);
    expect(
      distribution(trades, "setup").reduce((s, g) => s + g.percent, 0),
    ).toBeCloseTo(100);
    expect(distribution(trades, "instrument")).toEqual([
      { label: "NQ", count: 3, percent: 100 },
    ]);
  });
  it("compares adjacent inclusive calendar windows across the DST boundary", () => {
    const current = [trade("2026-11-01"), trade("2026-11-02")];
    const context = [trade("2026-10-29"), trade("2026-10-30", 99), ...current];
    const previous = previousPeriod(
      context,
      current,
      "2026-11-01",
      "2026-11-02",
    );
    expect(previous?.start).toBe("2026-10-30");
    expect(previous?.end).toBe("2026-10-31");
    expect(previous?.stats?.r).toBe(-1);
    expect(previous?.stats?.count).toBe(1);
  });
  it("never invents a prior comparison for all history or an empty selection", () => {
    const trades = [trade("2026-11-01")];
    expect(previousPeriod(trades, trades, "", "")?.stats).toBeNull();
    expect(previousPeriod([], [], "", "")).toBeNull();
    expect(previousPeriod([], [], "2026-11-02", "2026-11-01")).toBeNull();
    expect(resultBars([], "day")).toEqual([]);
    expect(distribution([], "setup")).toEqual([]);
  });
});
