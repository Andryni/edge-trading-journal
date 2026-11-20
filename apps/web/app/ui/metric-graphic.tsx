import type { summarize } from "@edge/core";

type Stats = ReturnType<typeof summarize>;

export function MetricGraphic({ stats, kind }: {
  stats: Stats;
  kind: "equity" | "drawdown" | "outcomes" | "extremes" | "streaks" | "averages";
}) {
  if (!stats.count) return null;
  if (kind !== "equity" && kind !== "drawdown") {
    const [first, second] = kind === "outcomes"
      ? [stats.winRate, 1 - stats.winRate]
      : kind === "extremes" ? [Math.max(0, stats.best), Math.max(0, -stats.worst)]
      : kind === "averages" ? [stats.averageWinR, Math.abs(stats.averageLossR)]
      : [stats.maxWinStreak, stats.maxLossStreak];
    const total = first + second;
    if (!total) return null;
    return <span className={'metric-meter ' + kind} aria-hidden="true">
      <i style={{ width: (first / total * 100) + "%" }} />
      <b style={{ width: (second / total * 100) + "%" }} />
    </span>;
  }
  const isRisk = kind === "drawdown";
  let peak = 0;
  const values = [0, ...stats.curve.map(point => {
    peak = Math.max(peak, point.usd);
    return isRisk ? point.usd - peak : point.usd;
  })];
  let low = 0, high = 0;
  for (const value of values) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  const samples = Math.min(48, values.length);
  const points = Array.from({ length: samples }, (_, i) => {
    const value = values[Math.round(i * (values.length - 1) / (samples - 1))];
    return (2 + i * 90 / (samples - 1)) + "," + (30 - (value - low) / (high - low || 1) * 26);
  }).join(" ");
  return <svg className={'metric-spark ' + (isRisk ? "risk" : "equity")} viewBox="0 0 94 34" role="img"
    aria-label={isRisk ? "Évolution du recul depuis le dernier sommet, en dollars" : "Évolution du résultat net cumulé en dollars"}>
    <polygon points={'2,33 ' + points + ' 92,33'} fill="currentColor" opacity=".13" />
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>;
}
