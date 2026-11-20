/** Modèle portable et décisions métier. Aucune API web ni dépendance native. */
import { z } from "zod";
import { Temporal } from "@js-temporal/polyfill";
import {
  INSTRUMENTS,
  calculateTrade,
  createDemoTrades,
  groupByDay,
  summarize,
  nyDate,
  SETUPS,
  type Trade,
} from "./index";
const positive = z.number().finite().positive();
const str = z.string().max(20000);
export const accountSchema = z.object({
  market: z.enum(["FUTURE","CFD"]).optional(),
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  provider: z.string().max(100),
  initialCapital: positive,
  profitTarget: positive,
  maxDrawdown: positive,
  dailyLossLimit: positive,
  consistencyLimit: z.number().min(0.01).max(1),
  minTradingDays: z.number().int().min(0).max(365),
  maxContracts: positive,
  drawdownMode: z.enum(["STATIC", "TRAILING_CLOSED", "TRAILING_EOD"]),
  highWaterMark: positive,
  drawdownCap: z.number().finite().nullable().default(null),
});
export type Account = z.infer<typeof accountSchema>;
export function accountLabel(account: Account) {
  return account.name + (account.market ? " · " + (account.market === "CFD" ? "CFD" : "Futures") : "");
}
export function accountSymbols(journal: Journal, id: string) {
  const market = journal.accounts.find(a => a.id === id)?.market;
  return Object.keys(journal.settings.instruments).filter(symbol =>
    !market || (journal.settings.instruments[symbol].category ?? INSTRUMENTS[symbol]?.category) === market);
}
export const ruleSchema = z.object({
  accountId: z.string(),
  enabled: z.boolean(),
  maxTrades: z.number().int().min(1).max(1000),
  maxConsecutiveLosses: z.number().int().min(1).max(100),
  dailyLossLimit: positive,
  cutoffNy: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  cooldownMinutes: z.number().int().min(0).max(1440),
});
export const setupSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  entryRules: str,
  invalidation: str,
  examples: z.array(z.string().max(3000000)).max(10).default([]),
  confluences: z.array(z.string().max(100)).max(50).optional(),
  history: z.array(z.object({changedAt:z.string().datetime(),name:z.string().max(100),entryRules:str,invalidation:str})).max(30).optional(),
});
export const planSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checks: z.array(z.boolean()).length(6),
  levels: str,
  optionLevels: str,
  volumeZones: str,
  events: str,
  mental: str,
  allowedSetups: z.array(z.string()).max(100),
  maxTrades: z.number().int().min(1).max(1000),
  validatedAt: z.string().nullable(),
});
export const reviewSchema = z.object({
  date: z.string(),
  planScore: z.number().int().min(0).max(10),
  bestTradeId: z.string(),
  worstMistake: str,
  tomorrowAction: str,
});
export const goalSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(200),
  unit: z.enum(["R", "USD", "DISCIPLINE"]),
  target: positive,
  startsAt: z.string(),
  endsAt: z.string(),
  archivedAt: z.string().datetime().optional(),
});
export const screenshotSchema = z.object({
  id: z.string(),
  phase: z.enum(["Avant", "Après"]),
  data: z
    .string()
    .max(3000000)
    .refine(s => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s) || /^\/api\/attachments\?path=[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpeg|webp)$/i.test(s), "Capture invalide."),
  annotations: z.string().max(50000),
  caption: z.string().max(500).optional(),
  timeframe: z.string().max(30).optional(),
  storagePath: z.string().max(1000).optional(),
});
export const exitReasonSchema = z.enum(["TP", "SL", "BE", "MANUAL", "MIXED", "OTHER", "UNKNOWN"]);
export const exitSchema = z.object({ id: z.string(), at: z.string().datetime(), price: positive, quantity: positive, fees: z.number().finite().nonnegative(), reason: exitReasonSchema });
export const managementSchema = z.object({ id: z.string(), at: z.string().datetime(), kind: z.enum(["STOP", "TARGET", "NOTE"]), price: positive.optional(), note: z.string().max(2000) });
export const draftSchema = z.object({
  id: z.string(), sourceTradeId: z.string().optional(), status: z.enum(["DRAFT", "OPEN"]), accountId: z.string(), updatedAt: z.string().datetime(),
  values: z.record(z.string(), z.string().max(20000)), screenshots: z.array(screenshotSchema).max(10), confluences: z.array(z.string().max(100)).max(50),
  exits: z.array(exitSchema).max(100), management: z.array(managementSchema).max(200),
});
export type TradeDraft = z.infer<typeof draftSchema>;
export function isPlanRated(t: Trade): boolean {
  return t.planScore !== null && Number.isFinite(t.planScore) && (t.qualificationVersion === 1 || !t.tags?.includes("Contexte non renseigné"));
}
export function averagePlan(trades: Trade[]): number | null {
  const rated = trades.filter(isPlanRated);
  return rated.length ? rated.reduce((sum, t) => sum + t.planScore!, 0) / rated.length : null;
}
export const tradeSchema = z
  .object({
    id: z.string().min(1),
    accountId: z.string(),
    enteredAt: z
      .string()
      .datetime()
      .transform((s) => new Date(s).toISOString()),
    exitedAt: z
      .string()
      .datetime()
      .transform((s) => new Date(s).toISOString()),
    instrument: z.string().min(1).max(30),
    direction: z.enum(["LONG", "SHORT"]),
    entry: positive,
    stop: z.number().finite().nonnegative(),
    target: z.number().finite().nonnegative(),
    exit: positive,
    quantity: positive,
    fees: z.number().finite().nonnegative(),
    tickSize: positive.optional(),
    tickValue: positive.optional(),
    category: z.enum(["FUTURE", "CFD", "FOREX", "CRYPTO", "EQUITY", "OTHER"]).optional(),
    quantityStep: positive.optional(),
    minQuantity: positive.optional(),
    setup: z.string().min(1).max(100),
    session: z.string().min(1).max(100),
    timeframe: z.string().max(30),
    quality: z.enum(["A", "B", "C", "UNRATED"]),
    mentalBefore: z.string().max(50),
    mentalAfter: z.string().max(50),
    energy: z.number().min(1).max(5).nullable(),
    stress: z.number().min(1).max(5).nullable(),
    sleep: z.number().min(0).max(24).nullable(),
    planScore: z.number().int().min(0).max(10).nullable(),
    qualificationVersion: z.literal(1).optional(),
    exitReason: exitReasonSchema.optional(),
    exitNote: z.string().max(2000).optional(),
    reviewStatus: z.enum(["PENDING", "REVIEWED"]).optional(),
    riskKnown: z.boolean().optional(),
    targetKnown: z.boolean().optional(),
    priceMode: z.enum(["FILL", "AVERAGE"]).optional(),
    exits: z.array(exitSchema).max(100).optional(),
    entryFees: z.number().finite().nonnegative().optional(),
    management: z.array(managementSchema).max(200).optional(),
    notes: str,
    confluences: z.array(z.string().max(100)).max(50),
    tags: z.array(z.string().max(100)).max(50).optional(),
    didWell: str.optional(),
    didWrong: str.optional(),
    lesson: str.optional(),
    mfeR: z.number().finite().nonnegative().optional(),
    maeR: z.number().finite().nonpositive().optional(),
    postStopContinuationR: z.number().finite().optional(),
    bestEntryPrice: positive.optional(),
    screenshots: z.array(screenshotSchema).max(10).optional(),
    sourceKey: z.string().max(500).optional(),
    importBatchId: z.string().optional(),
  })
  .superRefine((t, ctx) => {
    const spec = {...INSTRUMENTS[t.instrument],...Object.fromEntries(Object.entries(t).filter(([,value]) => value !== undefined))} as Trade;
    const step = spec.quantityStep ?? (spec.category === "FUTURE" ? 1 : undefined);
    if(step && Math.abs(t.quantity/step - Math.round(t.quantity/step)) > 1e-7)ctx.addIssue({code:"custom",message:`La quantité doit respecter le pas de ${step}.`});
    if(spec.minQuantity && t.quantity < spec.minQuantity)ctx.addIssue({code:"custom",message:`Quantité minimale : ${spec.minQuantity}.`});
    if(t.priceMode === "FILL" && spec.tickSize){
      const prices = [t.entry,t.exit,...(t.riskKnown !== false ? [t.stop] : []),...(t.targetKnown !== false ? [t.target] : [])];
      if(prices.some(price => Math.abs(price/spec.tickSize! - Math.round(price/spec.tickSize!)) > 1e-6))ctx.addIssue({code:"custom",message:"Un prix ne respecte pas le tick. Pour des exécutions agrégées, choisis « Prix moyens pondérés »."});
    }
    try {
      calculateTrade(t);
    } catch (e) {
      ctx.addIssue({ code: "custom", message: String(e) });
    }
    if (t.exitedAt < t.enteredAt)
      ctx.addIssue({ code: "custom", message: "La sortie précède l’entrée." });
    if (t.exits?.length) {
      const qty = t.exits.reduce((s, x) => s + x.quantity, 0);
      const average = t.exits.reduce((s, x) => s + x.quantity * x.price, 0) / qty;
      const fees = (t.entryFees ?? 0) + t.exits.reduce((s, x) => s + x.fees, 0);
      if (Math.abs(qty - t.quantity) > 1e-8 || Math.abs(average - t.exit) > 1e-7 || Math.abs(fees - t.fees) > 1e-7)
        ctx.addIssue({ code: "custom", message: "Les sorties doivent solder la quantité et correspondre au prix moyen et aux frais totaux." });
      if (t.exits.some(x => x.at < t.enteredAt || x.at > t.exitedAt)) ctx.addIssue({ code: "custom", message: "Heure de sortie partielle hors de la durée du trade." });
      if(step && t.exits.some(x => Math.abs(x.quantity/step - Math.round(x.quantity/step)) > 1e-7))ctx.addIssue({code:"custom",message:"Une sortie partielle ne respecte pas le pas de quantité."});
    }
    if (
      ["NQ", "MNQ", "ES", "MES", "GC", "MGC"].includes(t.instrument) &&
      !Number.isInteger(t.quantity)
    )
      ctx.addIssue({
        code: "custom",
        message: "Les contrats futures doivent être entiers.",
      });
  });
export const journalSchema = z
  .object({
    version: z.literal(2),
    mode: z.enum(["real", "demo"]),
    trades: z.array(tradeSchema).max(20000),
    drafts: z.array(draftSchema).max(100).default([]),
    savedViews: z.array(z.object({id: z.string(), name: z.string().max(100), filters: z.record(z.string(), z.string().max(300))})).max(50).default([]),
    importProfiles: z.array(z.object({id:z.string(),name:z.string().max(100),mapping:z.record(z.string(),z.string()),zone:z.string().max(100),dayFirst:z.boolean()})).max(30).default([]),
    accounts: z.array(accountSchema).max(100),
    setups: z.array(setupSchema).max(200),
    plans: z.array(planSchema).max(4000),
    reviews: z.array(reviewSchema).max(4000),
    goals: z.array(goalSchema).max(300),
    rules: z.array(ruleSchema).max(100),
    overrides: z
      .array(
        z.object({
          accountId: z.string(),
          day: z.string(),
          note: z.string().min(10).max(5000),
          createdAt: z.string(),
          until: z.string(),
          reason: z.string(),
        }),
      )
      .max(5000),
    messages: z
      .array(
        z.object({
          id: z.string(),
          role: z.enum(["user", "assistant"]),
          content: str,
          createdAt: z.string(),
          source: z.enum(["local", "api"]),
          scope: z.string().max(500).optional(),
        }),
      )
      .max(1000),
    imports: z
      .array(
        z.object({
          id: z.string(),
          filename: z.string().max(200),
          source: z.string().max(100),
          mapping: z.record(z.string(), z.string()),
          createdAt: z.string(),
          count: z.number().int().nonnegative(),
        }),
      )
      .max(1000),
    settings: z.object({
      locale: z.enum(["fr", "en"]),
      timeZone: z.enum(["America/New_York", "UTC", "Indian/Antananarivo", "Europe/Paris"]).default("America/New_York"),
      minSample: z.number().int().min(5).max(1000),
      instruments: z.record(
        z.string(),
        z.object({ tickSize: positive, tickValue: positive, category: z.enum(["FUTURE", "CFD", "FOREX", "CRYPTO", "EQUITY", "OTHER"]).optional(), quantityStep: positive.optional(), minQuantity: positive.optional() }),
      ),
      riskBudget: positive,
    }),
  })
  .superRefine((s, ctx) => {
    const a = new Set(s.accounts.map((x) => x.id));
    for (const t of s.trades)
      if (!a.has(t.accountId))
        ctx.addIssue({
          code: "custom",
          message: `Compte introuvable pour ${t.id}`,
        });
    if (new Set(s.trades.map((t) => t.id)).size !== s.trades.length)
      ctx.addIssue({
        code: "custom",
        message: "Identifiants de trades en double.",
      });
    if (new Set(s.accounts.map((t) => t.id)).size !== s.accounts.length)
      ctx.addIssue({
        code: "custom",
        message: "Identifiants de comptes en double.",
      });
  });
export type Journal = Omit<z.infer<typeof journalSchema>, "trades"> & {
  trades: Trade[];
};
export function newJournal(demo = false): Journal {
  const ids = demo ? ["phidias", "tradeify"] : ["principal"];
  return {
    version: 2,
    mode: demo ? "demo" : "real",
    trades: demo ? createDemoTrades() : [],
    drafts: [],
    savedViews: [],
    importProfiles: [],
    accounts: ids.map((id, i) => ({
      id,
      market: demo ? "FUTURE" : undefined,
      name: demo
        ? i
          ? "Tradeify · Démo"
          : "Phidias · Démo"
        : "Compte principal",
      provider: demo ? (i ? "Tradeify" : "Phidias") : "Personnel",
      initialCapital: 50000,
      profitTarget: 3000,
      maxDrawdown: 2500,
      dailyLossLimit: 1000,
      consistencyLimit: 0.3,
      minTradingDays: 5,
      maxContracts: 3,
      drawdownMode: "STATIC",
      highWaterMark: 50000,
      drawdownCap: null,
    })),
    setups: SETUPS.map((name, i) => ({
      id: `setup-${i}`,
      name,
      entryRules:
        "Zone clé + absorption ou déséquilibre footprint + changement de delta. Entrée affinée M1/M5.",
      invalidation: "Absence de confirmation ou risque supérieur au budget.",
      examples: [],
    })),
    rules: ids.map((accountId) => ({
      accountId,
      enabled: true,
      maxTrades: 5,
      maxConsecutiveLosses: 3,
      dailyLossLimit: 1000,
      cutoffNy: "16:00",
      cooldownMinutes: 15,
    })),
    plans: [],
    reviews: [],
    goals: [],
    overrides: [],
    messages: [],
    imports: [],
    settings: {
      locale: "fr",
      timeZone: "America/New_York",
      minSample: 30,
      instruments: { ...INSTRUMENTS },
      riskBudget: 200,
    },
  };
}
/** Rejette les heures inexistantes et ambiguës lors du passage été/hiver. */
export function zonedToUtc(local: string, zone = "America/New_York") {
  return new Date(
    Temporal.PlainDateTime.from(local)
      .toZonedDateTime(zone, { disambiguation: "reject" })
      .toInstant()
      .toString(),
  ).toISOString();
}
export function localDateTime(utc: string, zone = "America/New_York") {
  return Temporal.Instant.from(utc)
    .toZonedDateTimeISO(zone)
    .toPlainDateTime()
    .toString()
    .slice(0, 16);
}
/** Une édition de note/capture ne doit pas arrondir les instants importés. */
export function preserveTradeInstant(original: string | undefined, local: string, zone = "America/New_York") {
  return original && localDateTime(original, zone) === local
    ? original
    : zonedToUtc(local, zone);
}
export function accountStatus(
  account: Account,
  trades: Trade[],
  at = new Date().toISOString(),
  nextRisk = 0,
) {
  const selected = trades
    .filter((t) => t.accountId === account.id && t.exitedAt <= at)
    .sort((a, b) => a.exitedAt.localeCompare(b.exitedAt));
  const stats = summarize(selected);
  const daily = groupByDay(selected);
  const day = nyDate(at);
  const today = daily[day] ?? { net: 0, r: 0, count: 0 };
  let peak = account.initialCapital;
  let equity = peak;
  if (account.drawdownMode === "TRAILING_EOD") {
    for (const [date, d] of Object.entries(daily).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      equity += d.net;
      if (date < day) peak = Math.max(peak, equity);
    }
  } else {
    for (const t of selected) {
      equity += calculateTrade(t).net;
      peak = Math.max(peak, equity);
    }
  }
  peak = Math.max(peak, account.highWaterMark);
  const balance = account.initialCapital + stats.net;
  let floor =
    account.drawdownMode === "STATIC"
      ? account.initialCapital - account.maxDrawdown
      : peak - account.maxDrawdown;
  if (account.drawdownMode !== "STATIC" && account.drawdownCap !== null)
    floor = Math.min(floor, account.drawdownCap);
  const bestDay = Math.max(0, ...Object.values(daily).map((d) => d.net));
  const consistency = stats.net > 0 ? bestDay / stats.net : null;
  return {
    balance,
    net: stats.net,
    r: stats.r,
    floor,
    peak,
    remaining: balance - floor,
    today,
    dailyRemaining: account.dailyLossLimit + today.net,
    bestDay,
    consistency,
    days: Object.keys(daily).length,
    progress: stats.net / account.profitTarget,
    simulatedBalance: balance - nextRisk,
    simulatedMargin: balance - nextRisk - floor,
    consistencyProfitNeeded: Math.max(
      0,
      bestDay / account.consistencyLimit - stats.net,
    ),
  };
}
export function guardStatus(
  j: Journal,
  accountId: string,
  at = new Date().toISOString(),
) {
  const rule = j.rules.find((r) => r.accountId === accountId);
  const day = nyDate(at);
  const ts = j.trades
    .filter(
      (t) =>
        t.accountId === accountId &&
        nyDate(t.exitedAt) === day &&
        t.exitedAt <= at,
    )
    .sort((a, b) => a.exitedAt.localeCompare(b.exitedAt));
  const total = summarize(ts);
  const entries = j.trades.filter(t => t.accountId === accountId && nyDate(t.enteredAt) === day && t.enteredAt <= at);
  let consecutive = 0;
  for (const t of [...ts].reverse()) {
    if (calculateTrade(t).net < 0) consecutive++;
    else break;
  }
  const time = localDateTime(at).slice(11, 16);
  const reasons: string[] = [];
  if (rule?.enabled) {
    if (total.net <= -rule.dailyLossLimit)
      reasons.push("Perte journalière maximale atteinte");
    if (entries.length >= rule.maxTrades)
      reasons.push("Nombre maximal de trades atteint");
    if (consecutive >= rule.maxConsecutiveLosses)
      reasons.push("Série de pertes maximale atteinte");
    if (time >= rule.cutoffNy) reasons.push("Heure de coupure atteinte");
  }
  const cutoff = Temporal.PlainDateTime.from(day + "T" + (rule?.cutoffNy ?? "00:00"))
    .toZonedDateTime("America/New_York", { disambiguation: "compatible" }).toInstant().toString();
  const last = ts.at(-1)?.exitedAt ?? cutoff;
  const unlockAt = new Date(
    new Date(last).getTime() + (rule?.cooldownMinutes ?? 0) * 60000,
  ).toISOString();
  const override = j.overrides.find(
    (o) =>
      o.accountId === accountId &&
      o.day === day &&
      o.createdAt >= last &&
      o.until > at,
  );
  return {
    locked: reasons.length > 0 && !override,
    reasons,
    unlockAt,
    waitSeconds: reasons.length ? Math.max(
      0,
      Math.ceil((new Date(unlockAt).getTime() - new Date(at).getTime()) / 1000),
    ) : 0,
    count: entries.length,
    consecutive,
    net: total.net,
  };
}
export function breakdown(
  trades: Trade[],
  key: (t: Trade, i: number, all: Trade[]) => string,
  minSample = 1,
) {
  const groups = new Map<string, Trade[]>();
  const sorted = [...trades].sort((a, b) =>
    a.enteredAt.localeCompare(b.enteredAt),
  );
  sorted.forEach((t, i) => {
    const label = key(t, i, sorted);
    if (label) {
      const group = groups.get(label) ?? [];
      group.push(t);
      groups.set(label, group);
    }
  });
  return [...groups]
    .map(([label, ts]) => ({
      label,
      ...summarize(ts),
      reliable: ts.length >= minSample,
    }))
    .sort((a, b) => a.expectancy - b.expectancy);
}
export function behavioralAnalysis(trades: Trade[], minSample = 10) {
  const sorted = [...trades].sort((a, b) =>
    a.enteredAt.localeCompare(b.enteredAt),
  );
  const accountCloses = new Map<string, Trade[]>();
  for (const t of trades) {
    const list = accountCloses.get(t.accountId) ?? [];
    list.push(t);
    accountCloses.set(t.accountId, list);
  }
  for (const list of accountCloses.values())
    list.sort((a, b) => a.exitedAt.localeCompare(b.exitedAt));
  const contexts = new Map<
    string,
    { rank: number; previous: Trade[]; date: string }
  >();
  const ranks = new Map<string, number>();
  for (const t of sorted) {
    const date = nyDate(t.enteredAt),
      key = t.accountId + date;
    const rank = (ranks.get(key) ?? 0) + 1;
    ranks.set(key, rank);
    const list = accountCloses.get(t.accountId) ?? [];
    let lo = 0,
      hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (list[mid].exitedAt <= t.enteredAt) lo = mid + 1;
      else hi = mid;
    }
    const previous: Trade[] = [];
    for (let k = lo - 1; k >= 0 && previous.length < 2; k--)
      if (list[k].id !== t.id && list[k].enteredAt <= t.enteredAt)
        previous.unshift(list[k]);
    contexts.set(t.id, { rank, previous, date });
  }
  const weekday = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "America/New_York",
    weekday: "long",
  });
  const categories: [string, (t: Trade) => string][] = [
    ["État mental", (t) => t.mentalBefore],
    ["Instrument", (t) => t.instrument],
    ["Setup", (t) => t.setup],
    ["Session", (t) => t.session],
    ["Heure ET", (t) => localDateTime(t.enteredAt).slice(11, 13) + "h ET"],
    ["Jour", (t) => weekday.format(new Date(t.enteredAt))],
    ["Taille", (t) => `${t.quantity} contrat(s)/lot(s)`],
    ["Rang journalier", (t) => `${contexts.get(t.id)!.rank}e trade`],
    [
      "Après deux pertes",
      (t) => {
        const p = contexts.get(t.id)!.previous;
        return p.length === 2 && p.every((x) => calculateTrade(x).net < 0)
          ? "Après 2 pertes consécutives"
          : "";
      },
    ],
    [
      "Comportement",
      (t) => {
        const p = contexts.get(t.id)!.previous.at(-1);
        return p && calculateTrade(p).net < 0 && t.quantity > p.quantity
          ? "Taille augmentée après perte"
          : p &&
              calculateTrade(p).realizedR >= 2 &&
              nyDate(p.enteredAt) === nyDate(t.enteredAt)
            ? "Après un gain ≥ 2R"
            : "";
      },
    ],
  ];
  return categories
    .flatMap(([category, fn]) =>
      breakdown(sorted, fn, minSample).map((g) => ({ ...g, category })),
    )
    .filter((g) => g.count >= minSample)
    .sort((a, b) => a.net - b.net);
}
export function executionAnalysis(trades: Trade[]) {
  const mfe = trades.filter((t) => t.mfeR !== undefined && t.riskKnown !== false);
  const stopped = trades.filter(
    (t) => t.postStopContinuationR !== undefined && t.riskKnown !== false && (t.exitReason === "SL" || (!t.exitReason && calculateTrade(t).net < 0)),
  );
  const entries = trades.filter((t) => t.bestEntryPrice !== undefined && t.riskKnown !== false);
  const mae = trades.filter(
    (t) => t.maeR !== undefined && t.riskKnown !== false && calculateTrade(t).net > 0,
  );
  return {
    mfeCount: mfe.length,
    leftR: mfe.length
      ? mfe.reduce(
          (s, t) =>
            s +
            Math.max(
              0,
              t.mfeR! -
                calculateTrade(t).realizedR -
                t.fees / calculateTrade(t).risk,
            ),
          0,
        ) / mfe.length
      : null,
    stopCount: stopped.length,
    stopRebound: stopped.length
      ? stopped.filter((t) => t.postStopContinuationR! > 0).length /
        stopped.length
      : null,
    entryCount: entries.length,
    entryDistance: entries.length
      ? entries.reduce(
          (s, t) =>
            s +
            Math.abs(t.entry - t.bestEntryPrice!) / Math.abs(t.entry - t.stop),
          0,
        ) / entries.length
      : null,
    maeCount: mae.length,
    mae90:
      mae.length >= 30
        ? [...mae].map((t) => Math.abs(t.maeR!)).sort((a, b) => a - b)[
            Math.floor((mae.length - 1) * 0.9)
          ]
        : null,
  };
}
export function reviewSummary(trades: Trade[], minSample = 10) {
  const stats = summarize(trades);
  const groups = behavioralAnalysis(trades, minSample);
  const leaks = groups.filter((x) => x.net < 0).slice(0, 3);
  const strengths = [...groups]
    .filter((x) => x.net > 0)
    .sort((a, b) => b.expectancy - a.expectancy)
    .slice(0, 3);
  return {
    stats,
    leaks,
    strengths,
    action: leaks[0]
      ? `Prochaine séance : évite le contexte « ${leaks[0].label} » tant que ta confirmation n’est pas présente ; limite la taille au budget prévu.`
      : "Prochaine séance : garde une taille stable, prends uniquement un setup documenté et note le respect du plan.",
  };
}
export function tradeFingerprint(t: Trade) {
  return [
    t.accountId,
    t.instrument,
    t.direction,
    new Date(t.enteredAt).toISOString(),
    new Date(t.exitedAt).toISOString(),
    t.entry,
    t.exit,
    t.quantity,
    t.fees,
  ].join("|");
}
export function mergeImport(existing: Trade[], incoming: Trade[]) {
  const keys = new Set(existing.map(tradeFingerprint));
  const accepted: Trade[] = [];
  let duplicates = 0;
  for (const t of incoming) {
    const key = tradeFingerprint(t);
    if (keys.has(key)) duplicates++;
    else {
      keys.add(key);
      accepted.push({ ...t, sourceKey: key });
    }
  }
  return { accepted, duplicates };
}

export function disciplineStreak(j: Journal) {
  const dates = [
    ...new Set([
      ...j.trades.map((t) => nyDate(t.exitedAt)),
      ...j.reviews.map((r) => r.date),
    ]),
  ]
    .sort()
    .reverse();
  let streak = 0;
  for (const date of dates) {
    const review = j.reviews.find((r) => r.date === date);
    if (!review || review.planScore < 8) break;
    streak++;
  }
  return streak;
}
export function readBackup(input: unknown): Journal {
  if (
    input &&
    typeof input === "object" &&
    "version" in input &&
    input.version === 1 &&
    "trades" in input
  ) {
    const old = input as { trades: Trade[] };
    const next = newJournal(true);
    next.trades = old.trades;
    return journalSchema.parse(next);
  }
  return journalSchema.parse(input);
}
