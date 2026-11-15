import { describe, it, expect } from "vitest";
import {
  calculateTrade,
  createDemoTrades,
  summarize,
  sizePosition,
  nyDate,
  groupByDay,
  setupPerformance,
  leakFinder,
} from "./index";
const base = {
  instrument: "NQ" as const,
  direction: "LONG" as const,
  entry: 21000,
  stop: 20990,
  target: 21020,
  exit: 21020,
  quantity: 2,
  fees: 10,
};
describe("Calculs du journal", () => {
  it("convertit les points NQ et déduit les frais du R réalisé", () => {
    expect(calculateTrade(base)).toEqual({
      riskKnown: true,
      targetKnown: true,
      risk: 400,
      gross: 800,
      net: 790,
      plannedR: 2,
      realizedR: 1.975,
    });
  });
  it("traite les positions vendeuses et les pertes", () => {
    expect(
      calculateTrade({
        ...base,
        direction: "SHORT",
        stop: 21010,
        target: 20980,
        exit: 21010,
      }).net,
    ).toBe(-410);
  });
  it("rejette le risque nul et un stop du mauvais côté", () => {
    expect(() => calculateTrade({ ...base, stop: 21000 })).toThrow();
    expect(() => calculateTrade({ ...base, stop: 21010 })).toThrow();
  });
  it("rejette NaN et les tailles négatives", () => {
    expect(() => calculateTrade({ ...base, fees: NaN })).toThrow();
    expect(() => calculateTrade({ ...base, quantity: -1 })).toThrow();
  });
  it("ne dépasse pas le budget de risque en contrats", () => {
    expect(sizePosition("NQ", 350, 21000, 20990)).toBe(1);
    expect(sizePosition("NQ", 100, 21000, 20990)).toBe(0);
  });
  it("gère un historique vide", () => {
    expect(summarize([])).toMatchObject({
      count: 0,
      net: 0,
      winRate: 0,
      profitFactor: null,
      drawdown: 0,
    });
  });
  it("calcule le drawdown dès une première perte", () => {
    const t = createDemoTrades()[0];
    expect(summarize([{ ...t, ...base, exit: 20990 }]).drawdown).toBe(410);
  });
  it("distingue zéro et absence de profit factor", () => {
    const t = createDemoTrades()[0];
    expect(summarize([{ ...t, ...base, exit: 20990 }]).profitFactor).toBe(0);
    expect(summarize([{ ...t, ...base }]).profitFactor).toBeNull();
  });
  it("respecte les jours de New York et le changement de saison", () => {
    expect(nyDate("2026-11-03T02:00:00Z")).toBe("2026-11-02");
    expect(nyDate("2026-08-03T03:00:00Z")).toBe("2026-08-02");
  });
  it("génère 180 trades déterministes et des métriques finies", () => {
    const demo = createDemoTrades();
    expect(demo).toHaveLength(180);
    expect(demo).toEqual(createDemoTrades());
    expect(Number.isFinite(summarize(demo).expectancy)).toBe(true);
  });
});

describe("Agrégations et cas limites", () => {
  it("intègre les trades neutres dans le dénominateur du win rate", () => {
    const t = createDemoTrades()[0];
    const s = summarize([
      { ...t, ...base },
      { ...t, ...base, exit: 20990 },
      { ...t, ...base, exit: 21000, fees: 0 },
    ]);
    expect(s.winRate).toBeCloseTo(1 / 3);
    expect(s.expectancy).toBeCloseTo((1.975 - 1.025) / 3);
    expect(s.averageWinR).toBe(1.975);
    expect(s.averageLossR).toBe(-1.025);
  });
  it("trie avant de calculer les séries et le drawdown depuis le pic", () => {
    const t = createDemoTrades()[0];
    const win = { ...t, ...base, enteredAt: "2026-11-01T15:00:00Z" };
    const loss = {
      ...t,
      ...base,
      exit: 20990,
      enteredAt: "2026-11-02T15:00:00Z",
    };
    const s = summarize([loss, win]);
    expect(s.drawdown).toBe(410);
    expect(s.curve[0].usd).toBe(790);
  });
  it("applique les multiplicateurs des micro-contrats", () => {
    expect(calculateTrade({ ...base, instrument: "MNQ", fees: 0 }).risk).toBe(
      40,
    );
    expect(calculateTrade({ ...base, instrument: "MES", fees: 0 }).risk).toBe(
      100,
    );
    expect(calculateTrade({ ...base, instrument: "MGC", fees: 0 }).risk).toBe(
      200,
    );
  });
  it("ne propose aucune taille pour un risque ou stop invalide", () => {
    expect(sizePosition("NQ", 0, 21000, 20990)).toBe(0);
    expect(sizePosition("NQ", 100, 21000, 21000)).toBe(0);
  });
});

describe("Regroupements utiles à la décision", () => {
  it("réconcilie les totaux journaliers avec les totaux globaux", () => {
    const trades = createDemoTrades();
    const days = Object.values(groupByDay(trades));
    expect(days).toHaveLength(60);
    expect(days.reduce((s, d) => s + d.net, 0)).toBeCloseTo(
      summarize(trades).net,
    );
    expect(days.reduce((s, d) => s + d.count, 0)).toBe(180);
  });
  it("réconcilie les sous-groupes de setups sans perdre un trade", () => {
    const groups = setupPerformance(createDemoTrades());
    expect(groups).toHaveLength(3);
    expect(groups.reduce((s, d) => s + d.count, 0)).toBe(180);
  });
  it("ne classe pas un groupe perdant de moins de dix observations", () => {
    const loss = { ...createDemoTrades()[0], ...base, exit: 20990 };
    expect(leakFinder(Array.from({ length: 9 }, () => loss))).toEqual([]);
    expect(leakFinder(Array.from({ length: 10 }, () => loss))).toHaveLength(4);
  });
});
