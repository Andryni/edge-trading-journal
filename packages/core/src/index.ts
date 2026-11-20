/** Logique pure partagée par le web, les tests et Expo. Montants en USD. */
export type InstrumentSpec = {tickSize:number;tickValue:number;category?:"FUTURE"|"CFD"|"FOREX"|"CRYPTO"|"EQUITY"|"OTHER";quantityStep?:number;minQuantity?:number};
export const INSTRUMENTS: Record<string,InstrumentSpec> = {
  NQ: { tickSize: 0.25, tickValue: 5, category:"FUTURE",quantityStep:1,minQuantity:1 },
  MNQ: { tickSize: 0.25, tickValue: 0.5, category:"FUTURE",quantityStep:1,minQuantity:1 },
  ES: { tickSize: 0.25, tickValue: 12.5, category:"FUTURE",quantityStep:1,minQuantity:1 },
  MES: { tickSize: 0.25, tickValue: 1.25, category:"FUTURE",quantityStep:1,minQuantity:1 },
  GC: { tickSize: 0.1, tickValue: 10, category:"FUTURE",quantityStep:1,minQuantity:1 },
  MGC: { tickSize: 0.1, tickValue: 1, category:"FUTURE",quantityStep:1,minQuantity:1 },
  XAUUSD: { tickSize: 0.01, tickValue: 1, category:"CFD",quantityStep:.01,minQuantity:.01 },
} as const;
export type Instrument = keyof typeof INSTRUMENTS;
export const EXIT_REASONS = { TP: "Take profit", SL: "Stop loss", BE: "Break-even", MANUAL: "Clôture manuelle", MIXED: "Sorties multiples", OTHER: "Autre", UNKNOWN: "Non renseigné" } as const;
export type ExitReason = keyof typeof EXIT_REASONS;
export type TradeExit = { id: string; at: string; price: number; quantity: number; fees: number; reason: ExitReason };
export type ManagementEvent = { id: string; at: string; kind: "STOP" | "TARGET" | "NOTE"; price?: number; note: string };
export type Trade = {
  id: string;
  accountId: string;
  enteredAt: string;
  exitedAt: string;
  instrument: Instrument;
  direction: "LONG" | "SHORT";
  entry: number;
  stop: number;
  target: number;
  exit: number;
  quantity: number;
  fees: number;
  setup: string;
  session: string;
  timeframe: string;
  quality: "A" | "B" | "C" | "UNRATED";
  mentalBefore: string;
  mentalAfter: string;
  energy: number | null;
  stress: number | null;
  sleep: number | null;
  planScore: number | null;
  exitReason?: ExitReason;
  exitNote?: string;
  reviewStatus?: "PENDING" | "REVIEWED";
  qualificationVersion?: number;
  riskKnown?: boolean;
  targetKnown?: boolean;
  priceMode?: "FILL" | "AVERAGE";
  exits?: TradeExit[];
  entryFees?: number;
  management?: ManagementEvent[];
  notes: string;
  confluences: string[];
  mfeR?: number;
  maeR?: number;
  tickSize?: number;
  tickValue?: number;
  category?: InstrumentSpec["category"];
  quantityStep?: number;
  minQuantity?: number;
  didWell?: string;
  didWrong?: string;
  lesson?: string;
  tags?: string[];
  screenshots?: {
    id: string;
    phase: string;
    data: string;
    annotations: string;
    caption?: string;
    timeframe?: string;
    storagePath?: string;
  }[];
  sourceKey?: string;
  importBatchId?: string;
  postStopContinuationR?: number;
  bestEntryPrice?: number;
};
export type TradeMetrics = {
  riskKnown: boolean;
  targetKnown: boolean;
  risk: number;
  gross: number;
  net: number;
  plannedR: number;
  realizedR: number;
};
export function calculateTrade(
  t: Pick<
    Trade,
    | "instrument"
    | "direction"
    | "entry"
    | "stop"
    | "target"
    | "exit"
    | "quantity"
    | "fees"
  > & { tickSize?: number; tickValue?: number; riskKnown?: boolean; targetKnown?: boolean },
): TradeMetrics {
  if (
    ![t.entry, t.stop, t.target, t.exit, t.quantity, t.fees].every(
      Number.isFinite,
    ) ||
    t.quantity <= 0 ||
    t.fees < 0 ||
    Math.min(t.entry, t.exit) <= 0 || (t.riskKnown !== false && t.stop <= 0) || (t.targetKnown !== false && t.target <= 0)
  )
    throw new Error("Prix, taille ou frais invalides.");
  const sign = t.direction === "LONG" ? 1 : -1;
  if (t.riskKnown !== false && (t.entry - t.stop) * sign <= 0)
    throw new Error("Le stop doit être du côté du risque.");
  if (t.targetKnown !== false && (t.target - t.entry) * sign <= 0)
    throw new Error("L’objectif doit être du côté du gain.");
  if (!INSTRUMENTS[t.instrument] && !(t.tickSize && t.tickValue))
    throw new Error("Instrument inconnu : renseigne sa valeur de tick.");
  const { tickSize, tickValue } = {
    ...INSTRUMENTS[t.instrument],
    ...(t.tickSize ? { tickSize: t.tickSize } : {}),
    ...(t.tickValue ? { tickValue: t.tickValue } : {}),
  };
  if (tickSize <= 0 || tickValue <= 0)
    throw new Error("Spécifications de tick invalides.");
  const pointValue = tickValue / tickSize;
  const riskKnown = t.riskKnown !== false;
  const targetKnown = t.targetKnown !== false;
  const risk = riskKnown ? Math.abs(t.entry - t.stop) * pointValue * t.quantity : 0;
  const gross = (t.exit - t.entry) * sign * pointValue * t.quantity;
  return {
    riskKnown,
    targetKnown,
    risk,
    gross,
    net: gross - t.fees,
    plannedR: riskKnown && targetKnown ? Math.abs(t.target - t.entry) / Math.abs(t.entry - t.stop) : 0,
    realizedR: riskKnown ? (gross - t.fees) / risk : 0,
  };
}
export function summarize(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) =>
    a.exitedAt.localeCompare(b.exitedAt) || a.enteredAt.localeCompare(b.enteredAt) || a.id.localeCompare(b.id),
  );
  const m = sorted.map(calculateTrade);
  const wins = m.filter((x) => x.net > 0);
  const losses = m.filter((x) => x.net < 0);
  const rated = m.filter((x) => x.riskKnown);
  const ratedWins = wins.filter((x) => x.riskKnown), ratedLosses = losses.filter((x) => x.riskKnown);
  let equity = 0,
    peak = 0,
    drawdown = 0,
    equityR = 0;
  let currentWin = 0,
    currentLoss = 0,
    maxWinStreak = 0,
    maxLossStreak = 0;
  const curve = m.map((x, i) => {
    equity += x.net;
    equityR += x.realizedR;
    peak = Math.max(peak, equity);
    drawdown = Math.max(drawdown, peak - equity);
    currentWin = x.net > 0 ? currentWin + 1 : 0;
    currentLoss = x.net < 0 ? currentLoss + 1 : 0;
    maxWinStreak = Math.max(maxWinStreak, currentWin);
    maxLossStreak = Math.max(maxLossStreak, currentLoss);
    return { date: nyDate(sorted[i].exitedAt), r: equityR, usd: equity };
  });
  const net = m.reduce((s, x) => s + x.net, 0),
    r = m.reduce((s, x) => s + x.realizedR, 0);
  const grossWin = wins.reduce((s, x) => s + x.net, 0),
    grossLoss = -losses.reduce((s, x) => s + x.net, 0);
  return {
    count: m.length,
    riskCount: rated.length,
    net,
    r,
    winRate: m.length ? wins.length / m.length : 0,
    profitFactor: grossLoss ? grossWin / grossLoss : null,
    expectancy: rated.length ? r / rated.length : 0,
    drawdown,
    averageWinR: ratedWins.length
      ? ratedWins.reduce((s, x) => s + x.realizedR, 0) / ratedWins.length
      : 0,
    averageLossR: ratedLosses.length
      ? ratedLosses.reduce((s, x) => s + x.realizedR, 0) / ratedLosses.length
      : 0,
    best: m.length ? Math.max(...m.map((x) => x.net)) : 0,
    worst: m.length ? Math.min(...m.map((x) => x.net)) : 0,
    maxWinStreak,
    maxLossStreak,
    curve,
  };
}
export function positionQuantity(raw: number, step: number, minimum: number) {
  if (!Number.isFinite(raw) || raw <= 0 || step <= 0) return 0;
  const size = Number((Math.floor(raw / step + 1e-10) * step).toPrecision(12));
  return size < minimum ? 0 : size;
}
export function sizePosition(
  instrument: Instrument,
  risk: number,
  entry: number,
  stop: number,
) {
  if (
    ![risk, entry, stop].every(Number.isFinite) ||
    risk <= 0 ||
    entry === stop ||
    entry <= 0 ||
    stop <= 0
  )
    return 0;
  const spec = INSTRUMENTS[instrument];
  if (!spec) return 0;
  return positionQuantity(
    risk / ((Math.abs(entry - stop) * spec.tickValue) / spec.tickSize),
    spec.quantityStep ?? 1, spec.minQuantity ?? 1,
  );
}
const nyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function nyDate(utc: string) {
  return nyFormatter.format(new Date(utc));
}
export function groupByDay(trades: Trade[]) {
  const days: Record<string, { net: number; r: number; count: number }> = {};
  for (const t of trades) {
    const day = nyDate(t.exitedAt);
    const m = calculateTrade(t);
    days[day] ??= { net: 0, r: 0, count: 0 };
    days[day].net += m.net;
    days[day].r += m.realizedR;
    days[day].count++;
  }
  return days;
}
export const SETUPS = [
  "Absorption sur zone clé",
  "Continuation delta",
  "Rejet option flow",
];
export function createDemoTrades(): Trade[] {
  let seed = 74;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const dates: string[] = [];
  const cursor = new Date("2026-11-13T12:00:00Z");
  while (dates.length < 60) {
    if (cursor.getUTCDay() > 0 && cursor.getUTCDay() < 6)
      dates.unshift(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return dates.flatMap((date, day) =>
    Array.from({ length: 3 }, (_, j) => {
      const instrument = (["NQ", "ES", "GC"] as const)[(day + j) % 3];
      const entry =
        instrument === "NQ"
          ? 21400 + day * 8
          : instrument === "ES"
            ? 5900 + day * 2
            : 2700 + day;
      const distance = instrument === "NQ" ? 10 : instrument === "ES" ? 4 : 2;
      const direction = random() > 0.5 ? "LONG" : "SHORT";
      const sign = direction === "LONG" ? 1 : -1;
      const mentalBefore =
        j === 2 && day % 3 === 0 ? "FOMO" : day % 5 === 0 ? "Fatigué" : "Calme";
      const outcome =
        random() < (mentalBefore === "Calme" ? 0.64 : 0.3)
          ? 1.2 + random() * 1.7
          : -1;
      const tick = INSTRUMENTS[instrument].tickSize;
      const exit =
        Math.round((entry + sign * distance * outcome) / tick) * tick;
      const winter = date >= "2026-11-02";
      const hour0 = winter ? "14" : "13",
        hour1 = winter ? "15" : "14",
        hour2 = winter ? "17" : "16";
      return {
        id: `demo-${day}-${j}`,
        accountId: day % 4 === 0 ? "tradeify" : "phidias",
        enteredAt: `${date}T${j === 0 ? hour0 + ":35" : j === 1 ? hour1 + ":15" : hour2 + ":45"}:00.000Z`,
        exitedAt: `${date}T${j === 0 ? hour0 + ":48" : j === 1 ? hour1 + ":32" : (winter ? "18" : "17") + ":02"}:00.000Z`,
        instrument,
        direction,
        entry,
        stop: entry - sign * distance,
        target: entry + sign * distance * 2.5,
        exit,
        quantity: 1,
        fees: 4.8,
        setup: SETUPS[j],
        session: j === 2 ? "Midi" : "New York open",
        timeframe: j === 1 ? "M5" : "M1",
        quality: mentalBefore === "Calme" ? "A" : "C",
        mentalBefore,
        mentalAfter: outcome > 0 ? "Calme" : "Frustré",
        energy: mentalBefore === "Fatigué" ? 2 : 4,
        stress: mentalBefore === "FOMO" ? 5 : 2,
        sleep: mentalBefore === "Fatigué" ? 5 : 7.5,
        planScore: mentalBefore === "Calme" ? 9 : 5,
        notes:
          outcome > 0
            ? "Confirmation footprint attendue. Gestion conforme au plan."
            : "Revoir le timing et la confirmation du delta.",
        confluences: [
          "Zone Bookmap",
          j === 0
            ? "Absorption"
            : j === 1
              ? "Changement de delta"
              : "Call wall",
        ],
        mfeR: Math.max(0, outcome) + random() * 0.7,
        maeR: Math.min(-0.2, outcome),
      } as Trade;
    }),
  );
}
export function setupPerformance(trades: Trade[]) {
  return [...new Set(trades.map((t) => t.setup))].map((setup) => ({
    setup,
    ...summarize(trades.filter((t) => t.setup === setup)),
  }));
}
export function leakFinder(trades: Trade[]) {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    for (const key of [
      `État : ${t.mentalBefore}`,
      `Instrument : ${t.instrument}`,
      `Session : ${t.session}`,
      `Setup : ${t.setup}`,
    ])
      groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  return [...groups]
    .map(([label, items]) => ({ label, ...summarize(items) }))
    .filter((x) => x.count >= 10 && x.net < 0)
    .sort((a, b) => a.net - b.net);
}

export * from "./journal";
export * from "./imports";

export * from "./coach";
