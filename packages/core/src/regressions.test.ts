import { describe, it, expect } from "vitest";
import { newJournal, createDemoTrades, summarize, guardStatus, accountStatus, preserveTradeInstant, normalizeImport, detectColumns, calculateTrade } from "./index";

const base = () => ({ ...createDemoTrades()[0], id: "audit", accountId: "principal", instrument: "ES", tickSize: .25, tickValue: 12.5, direction: "LONG" as const, entry: 6000, stop: 5998, target: 6004, exit: 6002, quantity: 1, fees: 0, enteredAt: "2026-11-13T15:00:00.000Z", exitedAt: "2026-11-13T15:10:00.000Z" });

describe("Régressions de fiabilité du journal", () => {
  it("mesure le drawdown et les séries dans l’ordre réel des clôtures", () => {
    const trades = [
      { ...base(), id: "A", enteredAt: "2026-11-13T14:00:00.000Z", exitedAt: "2026-11-13T17:00:00.000Z", exit: 5998 },
      { ...base(), id: "B", enteredAt: "2026-11-13T15:00:00.000Z", exitedAt: "2026-11-13T16:00:00.000Z" },
      { ...base(), id: "C", enteredAt: "2026-11-13T16:30:00.000Z", exitedAt: "2026-11-13T16:45:00.000Z", exit: 5998 },
    ];
    expect(summarize(trades)).toMatchObject({ drawdown: 200, maxLossStreak: 2 });
  });
  it("utilise le jour de clôture New York pour la courbe", () => {
    expect(summarize([{ ...base(), exitedAt: "2026-11-14T02:00:00.000Z" }]).curve[0].date).toBe("2026-11-13");
  });
  it("inclut une perte overnight dans le budget du jour sans recompter son entrée", () => {
    const j = newJournal(); j.accounts[0].dailyLossLimit = 100; j.rules[0].dailyLossLimit = 100;
    j.trades = [{ ...base(), enteredAt: "2026-11-12T23:00:00.000Z", exit: 5998 }];
    const at = "2026-11-13T16:00:00.000Z";
    expect(guardStatus(j, "principal", at)).toMatchObject({ locked: true, count: 0, net: -100 });
    expect(accountStatus(j.accounts[0], j.trades, at).today.net).toBe(-100);
  });
  it("n’étend pas continuellement la pause après coupure sans trade", () => {
    const j = newJournal();
    expect(guardStatus(j, "principal", "2026-11-13T21:01:00.000Z").waitSeconds).toBe(840);
    expect(guardStatus(j, "principal", "2026-11-13T21:20:00.000Z").waitSeconds).toBe(0);
  });
  it("préserve secondes et millisecondes lorsqu’un champ horaire n’a pas été changé", () => {
    expect(preserveTradeInstant("2026-11-13T15:00:45.123Z", "2026-11-13T10:00")).toBe("2026-11-13T15:00:45.123Z");
    expect(preserveTradeInstant("2026-11-13T15:00:45.123Z", "2026-11-13T10:01")).toBe("2026-11-13T15:01:00.000Z");
  });
  it("applique le RR supposé au stop effectivement importé", () => {
    const row = { enteredAt: base().enteredAt, exitedAt: base().exitedAt, instrument: "ES", direction: "LONG", entry: 6000, stop: 5995, exit: 6002, quantity: 1, fees: 0 };
    const result = normalizeImport([row], detectColumns(Object.keys(row)), newJournal(), { accountId: "principal", zone: "America/New_York", dayFirst: true, defaultStopPoints: 2, defaultRR: 2, batchId: "regression" });
    expect(result.accepted[0].target).toBe(6010);
    expect(calculateTrade(result.accepted[0]).plannedR).toBe(2);
  });
});
