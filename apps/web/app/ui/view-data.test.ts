import { describe, expect, it } from "vitest";
import { createDemoTrades, type Trade } from "@edge/core";
import { calendarRange, journalGroups, journalTrades, scopeTrades, tradePlan, weekRange } from "./view-data";
const base = createDemoTrades()[0];
const trade = (id: string, day: string, exit = 102, extra: Partial<Trade> = {}): Trade => ({
  ...base, id, enteredAt: day + "T15:00:00Z", exitedAt: day + "T16:00:00Z", instrument: "NQ", direction: "LONG", entry: 100, stop: 99, target: 104, quantity: 1, fees: 0, exit, setup: "Rejet", planScore: 9, notes: "", tags: [], ...extra,
});
describe("UI selections and review context", () => {
  it("uses inclusive calendar windows through DST and year boundaries", () => {
    expect(calendarRange("2026-11-02", 7)).toEqual({ from: "2026-10-27", to: "2026-11-02" });
    expect(calendarRange("2027-01-02", 7)).toEqual({ from: "2026-12-27", to: "2027-01-02" });
    expect(weekRange("2027-01-03")).toEqual({ from: "2026-12-28", to: "2027-01-03" });
  });
  it("drills into New York closing dates and intersects the requested setup", () => {
    const input = [trade("late", "2026-11-02", 102, { exitedAt: "2026-11-03T01:00:00Z" }), trade("next", "2026-11-03"), trade("other", "2026-11-02", 102, { setup: "Continuation" })];
    expect(scopeTrades(input, { label: "day", from: "2026-11-02", to: "2026-11-02", setup: "Rejet" }).map(t => t.id)).toEqual(["late"]);
  });
  it("keeps an empty analysis selection empty and preserves explicit IDs", () => {
    const input = [trade("a", "2026-11-02"), trade("b", "2026-11-03")];
    expect(scopeTrades(input, { label: "empty", ids: [] })).toEqual([]);
    expect(scopeTrades(input, { label: "picked", ids: ["b"] }).map(t => t.id)).toEqual(["b"]);
    expect(scopeTrades(input, null)).toBe(input);
  });
  it("classifies gains, losses and breakevens using net results including fees", () => {
    const input = [trade("win", "2026-11-02"), trade("gross-flat-net-loss", "2026-11-02", 100, { fees: 1 }), trade("flat", "2026-11-02", 100)];
    expect(journalTrades(input, "", "date", "loss", "all").map(t => t.id)).toEqual(["gross-flat-net-loss"]);
    expect(journalTrades(input, "", "date", "flat", "all").map(t => t.id)).toEqual(["flat"]);
    expect(journalTrades(input, "", "date", "gain", "all").map(t => t.id)).toEqual(["win"]);
  });
  it("filters recorded plan status while leaving missing context unclassified", () => {
    const unknown = trade("unknown", "2026-11-02", 102, { tags: ["Contexte non renseigné"] });
    const off = trade("off", "2026-11-02", 102, { planScore: 7 });
    expect(tradePlan(unknown).value).toBe("unknown");
    expect(journalTrades([unknown, off], "", "date", "all", "offplan").map(t => t.id)).toEqual(["off"]);
    expect(journalTrades([unknown, off], "", "date", "all", "respected")).toEqual([]);
  });
  it("searches notes and context and sorts a copy without altering source order", () => {
    const input = [trade("low", "2026-11-02", 99, { notes: "Confirmation Delta" }), trade("high", "2026-11-03", 104, { notes: "Delta confirmé" }), trade("other", "2026-11-04", 110)];
    const before = JSON.stringify(input);
    expect(journalTrades(input, "DELTA", "r", "all", "all").map(t => t.id)).toEqual(["high", "low"]);
    expect(journalTrades(input, "delta", "loss", "all", "all").map(t => t.id)).toEqual(["low", "high"]);
    expect(JSON.stringify(input)).toBe(before);
  });
  it("groups by close date and exposes the exact members of each review group", () => {
    const input = [trade("mon-win", "2026-12-28"), trade("mon-loss", "2026-12-28", 99), trade("sun", "2027-01-03"), trade("next", "2027-01-04")];
    const before = JSON.stringify(input);
    const groups = journalGroups(input, "weeks");
    expect(groups.map(g => [g.date, g.stats.count, g.stats.r])).toEqual([["2027-01-04", 1, 2], ["2026-12-28", 3, 3]]);
    expect(groups[1].trades.map(t => t.id)).toEqual(["mon-win", "mon-loss", "sun"]);
    expect(JSON.stringify(input)).toBe(before);
  });
  it("supports empty search results and empty review histories", () => {
    expect(journalTrades([], "NQ", "date", "all", "all")).toEqual([]);
    expect(journalGroups([], "days")).toEqual([]);
    expect(journalGroups([], "weeks")).toEqual([]);
  });
});
