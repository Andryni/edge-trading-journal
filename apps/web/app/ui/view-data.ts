import { calculateTrade, nyDate, summarize, type Trade } from "@edge/core";

export type TradeColumn = "setup" | "direction" | "mental" | "plan";
import { isPlanRated } from "@edge/core";
export const TRADE_COLUMNS: { id: TradeColumn; label: string }[] = [
  { id: "setup", label: "Setup et contexte" },
  { id: "direction", label: "Direction" },
  { id: "mental", label: "État mental" },
  { id: "plan", label: "Respect du plan" },
];
export type ResultFilter = "all" | "gain" | "loss" | "flat";
export type PlanFilter = "all" | "respected" | "offplan" | "unknown";
export type JournalOptions = {
  mode: "trades" | "days" | "weeks" | "calendar";
  result: ResultFilter;
  plan: PlanFilter;
  columns: TradeColumn[];
  expanded?: string[];
  groupLimit: number;
  inspectedId?: string;
  month?: string;
  day?: string;
  exitReason?: string;
  review?: "all" | "pending" | "reviewed";
};
export const DEFAULT_JOURNAL_OPTIONS: JournalOptions = {
  groupLimit: 12,
  mode: "trades",
  result: "all",
  plan: "all",
  columns: ["setup", "direction", "mental", "plan"],
};
export type JournalScope = {
  label: string;
  from?: string;
  to?: string;
  setup?: string;
  instrument?: string;
  result?: ResultFilter;
  ids?: string[];
};
export type JournalFocus = JournalScope & { origin: string; scroll: number };

const DAY = 86_400_000;
export function calendarRange(end: string, days: number) {
  const time = Date.parse(end + "T12:00:00Z");
  return {
    from: new Date(time - (days - 1) * DAY).toISOString().slice(0, 10),
    to: end,
  };
}
export function weekRange(day: string) {
  const time = Date.parse(day + "T12:00:00Z");
  const weekday = new Date(time).getUTCDay() || 7;
  const start = time - (weekday - 1) * DAY;
  return {
    from: new Date(start).toISOString().slice(0, 10),
    to: new Date(start + 6 * DAY).toISOString().slice(0, 10),
  };
}
export const dateLabel = (day: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(day + "T12:00:00Z"));

/** Presentation convention only: the recorded score and core guard rules are untouched. */
export function tradePlan(trade: Trade) {
  if (!isPlanRated(trade))
    return {
      value: "unknown" as const,
      label: "Non renseigné",
      tone: "neutral",
    };
  return trade.planScore! >= 8
    ? { value: "respected" as const, label: "Plan respecté", tone: "on-plan" }
    : { value: "offplan" as const, label: "Hors plan", tone: "off-plan" };
}
export function scopeTrades(trades: Trade[], scope?: JournalScope | null) {
  if (!scope) return trades;
  const ids = scope.ids ? new Set(scope.ids) : null;
  return trades.filter((trade) => {
    const day = nyDate(trade.exitedAt);
    return (
      (!ids || ids.has(trade.id)) &&
      (!scope.from || day >= scope.from) &&
      (!scope.to || day <= scope.to) &&
      (!scope.setup || trade.setup === scope.setup) &&
      (!scope.instrument || trade.instrument === scope.instrument) &&
      matchesResult(trade, scope.result ?? "all")
    );
  });
}
function matchesResult(trade: Trade, result: ResultFilter) {
  if (result === "all") return true;
  const net = calculateTrade(trade).net;
  return result === "gain" ? net > 0 : result === "loss" ? net < 0 : net === 0;
}
export function journalTrades(
  trades: Trade[],
  search: string,
  sort: string,
  result: ResultFilter,
  plan: PlanFilter,
  exitReason = "all",
  review = "all",
) {
  const query = search.trim().toLocaleLowerCase("fr-FR");
  return trades
    .filter(
      (trade) =>
        matchesResult(trade, result) &&
        (exitReason === "all" || (trade.exitReason ?? "UNKNOWN") === exitReason) &&
        (review === "all" || (trade.reviewStatus === "REVIEWED" ? "reviewed" : "pending") === review) &&
        (plan === "all" || tradePlan(trade).value === plan) &&
        (!query ||
          `${trade.instrument} ${trade.setup} ${trade.mentalBefore} ${trade.mentalAfter} ${trade.notes} ${(trade.tags ?? []).join(" ")}`
            .toLocaleLowerCase("fr-FR")
            .includes(query)),
    )
    .sort((a, b) =>
      sort === "r"
        ? calculateTrade(b).realizedR - calculateTrade(a).realizedR
        : sort === "loss"
          ? calculateTrade(a).realizedR - calculateTrade(b).realizedR
          : b.enteredAt.localeCompare(a.enteredAt),
    );
}
export function journalGroups(trades: Trade[], mode: "days" | "weeks") {
  const groups = new Map<string, Trade[]>();
  for (const trade of trades) {
    const day = nyDate(trade.exitedAt);
    const key = mode === "weeks" ? weekRange(day).from : day;
    const group = groups.get(key);
    if (group) group.push(trade);
    else groups.set(key, [trade]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      trades: items,
      stats: summarize(items),
      range: mode === "weeks" ? weekRange(date) : { from: date, to: date },
    }));
}
