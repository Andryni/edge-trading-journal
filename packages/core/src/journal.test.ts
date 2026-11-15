import { describe, it, expect } from "vitest";
import {
  newJournal,
  journalSchema,
  tradeSchema,
  accountStatus,
  guardStatus,
  zonedToUtc,
  localDateTime,
  mergeImport,
  tradeFingerprint,
  executionAnalysis,
  detectColumns,
  normalizeImport,
  importDate,
  behavioralAnalysis,
  createDemoTrades,
  calculateTrade,
  parseCsv,
  disciplineStreak,
  readBackup,
} from "./index";
const loss = () => ({
  ...createDemoTrades()[0],
  id: "loss",
  accountId: "principal",
  enteredAt: "2026-11-13T15:00:00.000Z",
  exitedAt: "2026-11-13T15:10:00.000Z",
  instrument: "NQ",
  direction: "LONG" as const,
  entry: 21000,
  stop: 20990,
  target: 21020,
  exit: 20990,
  quantity: 1,
  fees: 0,
});
describe("Journal et fuseaux", () => {
  it("valide un journal vide et une démo complète", () => {
    expect(journalSchema.parse(newJournal()).trades).toHaveLength(0);
    expect(journalSchema.parse(newJournal(true)).trades).toHaveLength(180);
  });
  it("refuse un trade lié à un compte absent", () => {
    const j = newJournal();
    j.trades = [{ ...loss(), accountId: "intrus" }];
    expect(() => journalSchema.parse(j)).toThrow();
  });
  it("refuse les contrats fractionnaires et les sorties antérieures", () => {
    expect(() => tradeSchema.parse({ ...loss(), quantity: 0.5 })).toThrow();
    expect(() =>
      tradeSchema.parse({ ...loss(), exitedAt: "2026-11-12T15:00:00Z" }),
    ).toThrow();
  });
  it("convertit New York été et hiver sans décaler le calendrier", () => {
    expect(zonedToUtc("2026-07-01T09:30")).toBe("2026-07-01T13:30:00.000Z");
    expect(zonedToUtc("2026-11-13T09:30")).toBe("2026-11-13T14:30:00.000Z");
    expect(localDateTime("2026-11-13T14:30:00Z")).toBe("2026-11-13T09:30");
  });
  it("rejette une heure inexistante ou ambiguë", () => {
    expect(() => zonedToUtc("2026-03-08T02:30")).toThrow();
    expect(() => zonedToUtc("2026-11-01T01:30")).toThrow();
  });
});
describe("Limites de compte et Lock Guard", () => {
  it("mesure la marge statique après perte", () => {
    const a = newJournal().accounts[0];
    const s = accountStatus(a, [loss()], "2026-11-13T16:00:00Z", 300);
    expect(s.balance).toBe(49800);
    expect(s.remaining).toBe(2300);
    expect(s.simulatedMargin).toBe(2000);
    expect(s.dailyRemaining).toBe(800);
  });
  it("ne réinitialise jamais un pic trailing après une perte", () => {
    const a = {
      ...newJournal().accounts[0],
      drawdownMode: "TRAILING_CLOSED" as const,
    };
    const gain = { ...loss(), id: "gain", exit: 21020 };
    const later = {
      ...loss(),
      enteredAt: "2026-11-13T15:30:00Z",
      exitedAt: "2026-11-13T15:40:00Z",
    };
    const s = accountStatus(a, [gain, later], "2026-11-13T16:00:00Z");
    expect(s.peak).toBe(50400);
    expect(s.floor).toBe(47900);
    expect(s.remaining).toBe(2300);
  });
  it("diffère le trailing EOD à la journée suivante", () => {
    const a = {
      ...newJournal().accounts[0],
      drawdownMode: "TRAILING_EOD" as const,
    };
    const gain = { ...loss(), exit: 21020 };
    expect(accountStatus(a, [gain], "2026-11-13T16:00:00Z").peak).toBe(50000);
    expect(accountStatus(a, [gain], "2026-11-14T16:00:00Z").peak).toBe(50400);
  });
  it("la consistance ne devient pas un ratio trompeur sur un profit négatif", () => {
    expect(
      accountStatus(newJournal().accounts[0], [loss()], "2026-11-13T16:00:00Z")
        .consistency,
    ).toBeNull();
  });
  it("verrouille après la série prévue et calcule une pause", () => {
    const j = newJournal();
    j.rules[0].maxConsecutiveLosses = 1;
    j.trades = [loss()];
    const guard = guardStatus(j, "principal", "2026-11-13T15:11:00Z");
    expect(guard.locked).toBe(true);
    expect(guard.waitSeconds).toBe(840);
  });
  it("une dérogation expire au prochain trade clôturé", () => {
    const j = newJournal();
    j.rules[0].maxConsecutiveLosses = 1;
    j.trades = [loss()];
    j.overrides = [
      {
        accountId: "principal",
        day: "2026-11-13",
        note: "Je reprends avec une taille stable.",
        createdAt: "2026-11-13T15:30:00Z",
        until: "2026-11-13T15:40:00Z",
        reason: "test",
      },
    ];
    expect(guardStatus(j, "principal", "2026-11-13T15:31:00Z").locked).toBe(
      false,
    );
    j.trades.push({
      ...loss(),
      id: "second",
      enteredAt: "2026-11-13T15:31:00Z",
      exitedAt: "2026-11-13T15:32:00Z",
    });
    expect(guardStatus(j, "principal", "2026-11-13T15:33:00Z").locked).toBe(
      true,
    );
  });
});
describe("Imports et parcours du prix", () => {
  it("reconnaît les colonnes courantes", () => {
    expect(
      detectColumns([
        "Entry time",
        "Symbol",
        "Side",
        "Entry price",
        "Exit price",
        "Qty",
        "Commission",
      ]).entry,
    ).toBe("Entry price");
  });
  it("écarte les doublons du fichier et du journal", () => {
    expect(
      mergeImport([loss()], [loss(), { ...loss(), id: "copie" }]).duplicates,
    ).toBe(2);
  });
  it("importe un export clôturé et rejette les prix manquants", () => {
    const j = newJournal();
    const cols = [
      "Date",
      "Symbol",
      "Side",
      "Entry price",
      "Exit price",
      "Qty",
      "Stop loss",
      "Take profit",
    ];
    const rows = [
      {
        Date: "13/11/2026 10:00",
        Symbol: "NQZ6",
        Side: "Buy",
        "Entry price": "21000",
        "Exit price": "21020",
        Qty: 1,
        "Stop loss": 20990,
        "Take profit": 21020,
      },
      {
        Date: "13/11/2026 10:00",
        Symbol: "NQ",
        Side: "Buy",
        "Entry price": "",
        "Exit price": "21020",
        Qty: 1,
        "Stop loss": 20990,
        "Take profit": 21020,
      },
    ];
    const result = normalizeImport(rows, detectColumns(cols), j, {
      accountId: "principal",
      zone: "America/New_York",
      dayFirst: true,
      defaultStopPoints: 0,
      defaultRR: 2,
      batchId: "batch",
    });
    expect(result.accepted).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.accepted[0].instrument).toBe("NQ");
  });
  it("ne déduit pas un stop optimal sans données de parcours", () => {
    const e = executionAnalysis([loss()]);
    expect(e.mae90).toBeNull();
    expect(e.entryDistance).toBeNull();
  });
  it("compare la MFE brute à la sortie brute, sans compter les frais deux fois", () => {
    const e = executionAnalysis([{ ...loss(), exit: 21020, fees: 5, mfeR: 3 }]);
    expect(e.leftR).toBeCloseTo(1);
  });
  it("conserve les spécifications de tick historiques", () => {
    expect(
      calculateTrade({ ...loss(), tickValue: 10, tickSize: 0.25 }).risk,
    ).toBe(400);
  });
  it("n’invente pas une alerte comportementale sous le seuil choisi", () => {
    expect(behavioralAnalysis([loss()], 10)).toEqual([]);
  });
});

describe("Sauvegarde et discipline", () => {
  it("ne compte pas une séance sans revue comme disciplinée", () => {
    const j = newJournal();
    j.trades = [loss()];
    j.reviews = [
      {
        date: "2026-11-12",
        planScore: 9,
        bestTradeId: "",
        worstMistake: "",
        tomorrowAction: "",
      },
    ];
    expect(disciplineStreak(j)).toBe(0);
  });
  it("déduplique des horodatages représentant le même instant", () => {
    expect(
      mergeImport(
        [loss()],
        [
          {
            ...loss(),
            enteredAt: "2026-11-13T15:00:00Z",
            exitedAt: "2026-11-13T15:10:00Z",
          },
        ],
      ).duplicates,
    ).toBe(1);
  });
  it("lit les séparateurs et les champs CSV quotés", () => {
    expect(parseCsv('Symbol;Notes\nNQ;"Zone; delta"').rows[0].Notes).toBe(
      "Zone; delta",
    );
  });
  it("migre les sauvegardes de la fondation", () => {
    expect(readBackup({ version: 1, trades: createDemoTrades() }).version).toBe(
      2,
    );
  });
  it("sépare les seuils de perte et de nombre de trades", () => {
    const j = newJournal();
    j.trades = [loss()];
    j.rules[0].dailyLossLimit = 200;
    j.rules[0].maxTrades = 1;
    expect(
      guardStatus(j, "principal", "2026-11-13T16:00:00Z").reasons,
    ).toHaveLength(2);
  });
});
