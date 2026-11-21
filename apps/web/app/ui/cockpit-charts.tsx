"use client";
import { useId, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { summarize, type Trade } from "@edge/core";
import { distribution, resultBars } from "./cockpit-data";
import { dateLabel, weekRange, type JournalScope } from "./view-data";
import { Empty, Field, Panel, num, r } from "./kit";
import { RollingValue } from "./cockpit-presentation";

export function PeriodDelta({
  value,
  format = "r",
  inverse = false,
  period,
}: {
  value: number | null;
  format?: "r" | "usd" | "points";
  inverse?: boolean;
  period: string;
}) {
  const direction =
    value === null || Math.abs(value) < 0.000001 ? 0 : Math.sign(value);
  const Icon =
    direction > 0 ? ArrowUpRight : direction < 0 ? ArrowDownRight : Minus;
  const tone = !direction
    ? "neutral"
    : (inverse ? direction < 0 : direction > 0)
      ? "gain"
      : "loss";
  const sign = direction > 0 ? "+" : direction < 0 ? "−" : "";
  const label =
    value === null
      ? "—"
      : sign +
        num(Math.abs(value), format === "usd" ? 0 : 2) +
        (format === "r" ? " R" : format === "usd" ? " $" : " pts");
  return (
    <div className="metric-comparison">
      <span className={"delta-badge " + tone} title={period}>
        <Icon size={14} aria-hidden="true" />
        {label}
      </span>
      <span className="comparison-context">
        {value === null ? "Pas de période précédente" : "vs période précédente"}
      </span>
      <span className="sr-only">{period}</span>
    </div>
  );
}

const shortDate = (date: string) => date.slice(8) + "/" + date.slice(5, 7);
export function ResultsByPeriod({
  trades,
  onInspect,
}: {
  trades: Trade[];
  onInspect?: (scope: JournalScope) => void;
}) {
  const [period, setPeriod] = useState<"day" | "week">(() =>
    resultBars(trades, "day").length > 30 ? "week" : "day",
  );
  const reduced = useReducedMotion();
  const points = resultBars(trades, period);
  function inspect(day: string, result: "all" | "gain" | "loss" = "all") {
    const range = period === "week" ? weekRange(day) : { from: day, to: day };
    onInspect?.({
      ...range,
      result,
      label:
        (result === "loss"
          ? "Pertes · "
          : result === "gain"
            ? "Gains · "
            : "") +
        (period === "week" ? "Semaine du " : "Séance du ") +
        dateLabel(day),
    });
  }
  return (
    <Panel className="results-panel">
      <div className="panel-heading">
        <div>
          <h2>Gains & pertes</h2>
        </div>
        <Field label="Regrouper les résultats">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "day" | "week")}
          >
            <option value="day">Par jour</option>
            <option value="week">Par semaine</option>
          </select>
        </Field>
      </div>
      <div className="chart-legend" aria-label="Légende">
        <span>
          <i className="legend-dot gain" />+ Gains
        </span>
        <span>
          <i className="legend-dot loss" />− Pertes
        </span>
        <small>Résultats clôturés · R</small>
      </div>
      {points.length ? (
        <>
          <div
            className="chart grouped-chart"
            role="img"
            aria-label={
              "Gains positifs et pertes négatives côte à côte, par " +
              (period === "day" ? "jour" : "semaine")
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={points}
                barGap={3}
                margin={{ top: 16, right: 8, bottom: 0, left: -8 }}
              >
                <CartesianGrid vertical={false} stroke="#ffffff0a" />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  minTickGap={24}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => r(v)}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={66}
                />
                <Tooltip
                  cursor={{ fill: "#ffffff04" }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="chart-tooltip">
                        <strong>
                          {period === "week" ? "Semaine du " : ""}
                          {String(label).split("-").reverse().join("/")}
                        </strong>
                        {payload.map((entry) => (
                          <p
                            key={String(entry.dataKey)}
                            className={
                              entry.dataKey === "gains"
                                ? "positive"
                                : "negative"
                            }
                          >
                            {entry.dataKey === "gains" ? "+ Gains" : "− Pertes"}
                            <b className="mono">{r(Number(entry.value))}</b>
                          </p>
                        ))}
                      </div>
                    ) : null
                  }
                />
                <Bar
                  onClick={(_, index) => {
                    if (onInspect && points[index])
                      inspect(points[index].date, "gain");
                  }}
                  cursor={onInspect ? "pointer" : "default"}
                  name="Gains"
                  dataKey="gains"
                  fill="var(--green)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive={!reduced}
                  animationDuration={700}
                />
                <Bar
                  onClick={(_, index) => {
                    if (onInspect && points[index])
                      inspect(points[index].date, "loss");
                  }}
                  cursor={onInspect ? "pointer" : "default"}
                  name="Pertes"
                  dataKey="losses"
                  fill="var(--red)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={22}
                  isAnimationActive={!reduced}
                  animationDuration={700}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <details className="chart-data">
            <summary>Consulter les valeurs</summary>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  Résultats par période en R
                </caption>
                <thead>
                  <tr>
                    <th>Date ET</th>
                    <th>+ Gains</th>
                    <th>− Pertes</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((point) => (
                    <tr key={point.date}>
                      <td>
                        {onInspect ? (
                          <button
                            type="button"
                            className="table-text-link"
                            onClick={() => inspect(point.date)}
                          >
                            {dateLabel(point.date)}
                          </button>
                        ) : (
                          dateLabel(point.date)
                        )}
                      </td>
                      <td className="positive mono">
                        {onInspect ? (
                          <button
                            type="button"
                            className="table-text-link"
                            aria-label={
                              "Voir les gains du " + dateLabel(point.date)
                            }
                            onClick={() => inspect(point.date, "gain")}
                          >
                            {r(point.gains)}
                          </button>
                        ) : (
                          r(point.gains)
                        )}
                      </td>
                      <td className="negative mono">
                        {onInspect ? (
                          <button
                            type="button"
                            className="table-text-link"
                            aria-label={
                              "Voir les pertes du " + dateLabel(point.date)
                            }
                            onClick={() => inspect(point.date, "loss")}
                          >
                            {r(point.losses)}
                          </button>
                        ) : (
                          r(point.losses)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <Empty text="Tes gains et pertes apparaîtront après ta première exécution." />
      )}
    </Panel>
  );
}

const SEGMENTS = [
  "#52E0B0",
  "#3BC79A",
  "#2FA984",
  "#268B6D",
  "#1E6E57",
  "#175543",
];
export function Distribution({
  trades,
  onInspect,
}: {
  trades: Trade[];
  onInspect?: (scope: JournalScope) => void;
}) {
  const [dimension, setDimension] = useState<"setup" | "instrument">("setup");
  const id = useId().replace(/:/g, "");
  const groups = distribution(trades, dimension);
  const stats = summarize(trades);
  const setupCount = new Set(trades.map((trade) => trade.setup)).size;
  const inspect = (label: string) =>
    onInspect?.({
      label: (dimension === "setup" ? "Setup · " : "Instrument · ") + label,
      ...(dimension === "setup" ? { setup: label } : { instrument: label }),
    });
  const radius = 100,
    circumference = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = groups.map((group, index) => {
    const start = offset;
    offset += group.percent;
    const angle =
      ((start + group.percent / 2) / 100) * Math.PI * 2 - Math.PI / 2;
    return {
      ...group,
      index,
      start,
      x: 150 + radius * Math.cos(angle),
      y: 150 + radius * Math.sin(angle),
    };
  });
  return (
    <Panel className="distribution-panel glass-card">
      <div className="panel-heading">
        <div>
          <h2>Répartition</h2>
        </div>
        <Field label="Répartition par">
          <select
            value={dimension}
            onChange={(e) =>
              setDimension(e.target.value as "setup" | "instrument")
            }
          >
            <option value="setup">Setup</option>
            <option value="instrument">Instrument</option>
          </select>
        </Field>
      </div>
      {groups.length ? (
        <>
          <div className="distribution-ring">
            <svg viewBox="0 0 300 300" aria-hidden="true">
              <defs>
                {arcs.map((arc) => (
                  <linearGradient
                    key={arc.label}
                    id={`${id}-${arc.index}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop stopColor={SEGMENTS[arc.index % SEGMENTS.length]} />
                    <stop
                      offset="1"
                      stopColor={SEGMENTS[(arc.index + 1) % SEGMENTS.length]}
                    />
                  </linearGradient>
                ))}
              </defs>
              <circle
                cx="150"
                cy="150"
                r={radius}
                fill="none"
                stroke="#ffffff08"
                strokeWidth="26"
              />
              {arcs.map((arc) => (
                <circle
                  key={arc.label}
                  className={
                    "donut-segment" + (onInspect ? " interactive-segment" : "")
                  }
                  onClick={() => inspect(arc.label)}
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="none"
                  stroke={`url(#${id}-${arc.index})`}
                  strokeWidth="26"
                  strokeDasharray={`${Math.max(0, (arc.percent / 100) * circumference - 5)} ${circumference}`}
                  strokeDashoffset={(-arc.start / 100) * circumference}
                  transform="rotate(-90 150 150)"
                >
                  <title>
                    {arc.label} : {num(arc.percent, 1)} %, {arc.count} trades
                  </title>
                </circle>
              ))}
              {arcs
                .filter((arc) => arc.percent >= 7)
                .map((arc) => (
                  <g key={arc.label}>
                    <circle
                      cx={arc.x}
                      cy={arc.y}
                      r="24"
                      fill="#242033"
                      stroke="#ffffff30"
                    />
                    <text
                      x={arc.x}
                      y={arc.y}
                      dy=".35em"
                      textAnchor="middle"
                      fill="var(--text)"
                      fontSize="20"
                      fontFamily="var(--font-numeric)"
                    >
                      {num(arc.percent, 0)}%
                    </text>
                  </g>
                ))}
            </svg>
            <div className="distribution-center">
              <span>Résultat net</span>
              <strong
                className={"mono " + (stats.r >= 0 ? "positive" : "negative")}
              >
                <RollingValue value={stats.r} />
              </strong>
              <small>
                {setupCount} {setupCount === 1 ? "setup" : "setups"}
              </small>
            </div>
          </div>
          <ul className="distribution-legend">
            {groups.map((group, index) => (
              <li
                key={group.label}
                title={group.count + (group.count === 1 ? " trade" : " trades")}
              >
                <button
                  type="button"
                  className="distribution-choice"
                  disabled={!onInspect}
                  aria-label={"Voir les trades : " + group.label}
                  onClick={() => inspect(group.label)}
                >
                  <i
                    className="legend-dot"
                    style={{ background: SEGMENTS[index % SEGMENTS.length] }}
                  />
                  <span>{group.label}</span>
                  <strong className="mono">{num(group.percent, 1)} %</strong>
                </button>
              </li>
            ))}
          </ul>
          <p className="footnote">
            {trades.length} exécutions · part du nombre de trades
          </p>
        </>
      ) : (
        <Empty text="Ajoute des exécutions pour découvrir ta répartition." />
      )}
    </Panel>
  );
}
