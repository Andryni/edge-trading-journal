"use client";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { groupByDay, summarize, nyDate, type Trade } from "@edge/core";
import { dateLabel } from "./view-data";
import { r, signedMoney } from "./kit";

export default function JournalCalendar({
  trades,
  month,
  day,
  onMonth,
  onDay,
}: {
  trades: Trade[];
  month: string;
  day?: string;
  onMonth: (month: string) => void;
  onDay: (day: string) => void;
}) {
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1, 12));
  const offset = (first.getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(year, number, 0, 12)).getUTCDate();
  const days = useMemo(() => groupByDay(trades), [trades]);
  const monthStats = useMemo(
    () =>
      summarize(
        trades.filter((trade) => nyDate(trade.exitedAt).startsWith(month)),
      ),
    [trades, month],
  );
  const label = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);
  function move(amount: number) {
    onMonth(
      new Date(Date.UTC(year, number - 1 + amount, 1, 12))
        .toISOString()
        .slice(0, 7),
    );
  }
  return (
    <section
      className="journal-calendar"
      aria-label="Calendrier des séances du journal"
    >
      <div className="journal-calendar-heading">
        <div>
          <span className="eyebrow">RÉSULTATS PAR SÉANCE</span>
          <h2>{label}</h2>
        </div>
        <div className="month-controls">
          <button
            type="button"
            className="icon-btn"
            aria-label="Mois précédent du journal"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={17} />
          </button>
          <label className="sr-only" htmlFor="journal-month">
            Mois du journal
          </label>
          <input
            id="journal-month"
            type="month"
            value={month}
            onChange={(event) => {
              if (/^\d{4}-\d{2}$/.test(event.target.value))
                onMonth(event.target.value);
            }}
          />
          <button
            type="button"
            className="icon-btn"
            aria-label="Mois suivant du journal"
            onClick={() => move(1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div className="review-calendar-grid">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((label) => (
          <span className="review-weekday" key={label}>
            {label}
          </span>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span key={"empty-" + index} aria-hidden="true" />
        ))}
        {Array.from({ length }, (_, index) => {
          const date = month + "-" + String(index + 1).padStart(2, "0");
          const result = days[date];
          return (
            <button
              key={date}
              type="button"
              className={
                "review-calendar-day " +
                (result
                  ? result.net > 0
                    ? "win"
                    : result.net < 0
                      ? "loss"
                      : "flat"
                  : "inactive")
              }
              aria-pressed={day === date}
              aria-label={
                dateLabel(date) +
                (result
                  ? " · " + r(result.r) + " · " + result.count + " exécutions"
                  : " · aucune exécution")
              }
              onClick={() => onDay(date)}
            >
              <span className="day-number">{index + 1}</span>
              {result ? (
                <>
                  <strong className="mono">{r(result.r)}</strong>
                  <small>{result.count} trades</small>
                </>
              ) : (
                <span className="calendar-no-trade" aria-hidden="true">
                  —
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="journal-month-summary">
        <span>{monthStats.count} exécutions ce mois-ci</span>
        <strong
          className={
            "mono " +
            (monthStats.r > 0 ? "positive" : monthStats.r < 0 ? "negative" : "")
          }
        >
          {r(monthStats.r)} <small>{signedMoney(monthStats.net)}</small>
        </strong>
      </div>
      <div className="calendar-legend">
        <span>
          <i className="gain-dot" />
          Gain net
        </span>
        <span>
          <i className="loss-dot" />
          Perte nette
        </span>
        <span>Clôtures · New York</span>
      </div>
    </section>
  );
}
