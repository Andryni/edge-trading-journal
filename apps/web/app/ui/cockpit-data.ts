import { calculateTrade, nyDate, summarize, type Trade } from "@edge/core";

const DAY = 86_400_000;
const dayTime = (day: string) => Date.parse(day + "T12:00:00Z");
const dayString = (time: number) => new Date(time).toISOString().slice(0, 10);

/** Read-only chart projections. All monetary and R values come from core. */
export function resultBars(trades: Trade[], period: "day" | "week") {
  const groups = new Map<
    string,
    { date: string; gains: number; losses: number }
  >();
  for (const trade of trades) {
    let date = nyDate(trade.exitedAt);
    if (period === "week") {
      const time = dayTime(date);
      const weekday = new Date(time).getUTCDay() || 7;
      date = dayString(time - (weekday - 1) * DAY);
    }
    const group = groups.get(date) ?? { date, gains: 0, losses: 0 };
    const value = calculateTrade(trade).realizedR;
    if (value > 0) group.gains += value;
    if (value < 0) group.losses += value;
    groups.set(date, group);
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function distribution(
  trades: Trade[],
  dimension: "setup" | "instrument",
) {
  const counts = new Map<string, number>();
  for (const trade of trades) {
    const label = trade[dimension] || "Non renseigné";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts]
    .map(([label, count]) => ({
      label,
      count,
      percent: (count / trades.length) * 100,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** The preceding calendar window has the same inclusive length and never overlaps. */
export function previousPeriod(
  context: Trade[],
  selected: Trade[],
  from: string,
  to: string,
) {
  const dates = selected.map((trade) => nyDate(trade.exitedAt)).sort();
  const start = from || dates[0];
  const end = to || dates.at(-1);
  if (!start || !end || start > end) return null;
  const duration = dayTime(end) - dayTime(start) + DAY;
  const previousStart = dayString(dayTime(start) - duration);
  const previousEnd = dayString(dayTime(start) - DAY);
  const trades = context.filter((trade) => {
    const day = nyDate(trade.exitedAt);
    return day >= previousStart && day <= previousEnd;
  });
  return {
    start: previousStart,
    end: previousEnd,
    stats: trades.length ? summarize(trades) : null,
  };
}
