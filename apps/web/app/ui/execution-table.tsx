"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";
import { calculateTrade, localDateTime, type Trade } from "@edge/core";
import { Empty, r, signedMoney } from "./kit";
import { TRADE_COLUMNS, type TradeColumn } from "./view-data";
import { TradeStatus } from "./trade-ui";
import { EXIT_REASONS } from "@edge/core";
export function TradeTable({
  trades,
  onOpen,
  columns = TRADE_COLUMNS.map((column) => column.id),
  sort,
  onSort,
  caption = "Exécutions de la sélection",
  onSelect,
  selectedId,
}: {
  trades: Trade[];
  onOpen: (trade: Trade, context?: Trade[]) => void;
  columns?: TradeColumn[];
  sort?: string;
  onSort?: (sort: string) => void;
  caption?: string;
  onSelect?: (trade: Trade) => void;
  selectedId?: string;
}) {
  const [limit, setLimit] = useState(50);
  useEffect(() => setLimit(50), [trades]);
  return (
    <div className="execution-list">
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label={caption + " · tableau défilant"}
      >
        <table className="execution-table">
          <caption className="sr-only">
            {caption}. Dates d’entrée en heure de New York.
          </caption>
          <thead>
            <tr>
              <th aria-sort={sort === "date" ? "descending" : undefined}>
                {onSort ? (
                  <button type="button" onClick={() => onSort("date")}>
                    Instrument / entrée ET
                    {sort === "date" && (
                      <ArrowDown size={12} aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  "Instrument / entrée ET"
                )}
              </th>
              <th
                className="numeric-cell"
                aria-sort={
                  sort === "r"
                    ? "descending"
                    : sort === "loss"
                      ? "ascending"
                      : undefined
                }
              >
                {onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(sort === "r" ? "loss" : "r")}
                  >
                    Résultat net
                    {sort === "r" ? (
                      <ArrowDown size={12} aria-hidden="true" />
                    ) : sort === "loss" ? (
                      <ArrowUp size={12} aria-hidden="true" />
                    ) : null}
                  </button>
                ) : (
                  "Résultat net"
                )}
              </th>
              {columns.includes("setup") && <th>Setup / contexte</th>}
              {columns.includes("direction") && <th>Direction</th>}
              {columns.includes("mental") && <th>État mental</th>}
              {columns.includes("plan") && <th>Plan</th>}
              <th>
                <span className="sr-only">Ouvrir</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, limit).map((trade) => {
              const metrics = calculateTrade(trade);
              return (
                <tr
                  key={trade.id}
                  data-trade-id={trade.id}
                  data-selected={trade.id === selectedId || undefined}
                >
                  <td>
                    <button
                      type="button"
                      className="trade-link"
                      aria-label={
                        (onSelect ? "Sélectionner " : "Ouvrir ") +
                        trade.instrument +
                        " · " +
                        localDateTime(trade.enteredAt)
                      }
                      aria-pressed={
                        onSelect ? trade.id === selectedId : undefined
                      }
                      onClick={() =>
                        onSelect ? onSelect(trade) : onOpen(trade, trades)
                      }
                    >
                      <span
                        className={
                          "instrument " +
                          (trade.instrument.includes("GC") ? "gold" : "")
                        }
                      >
                        {trade.instrument.slice(0, 3)}
                      </span>
                      <span>
                        <strong>{trade.instrument}</strong>
                        <small>
                          {localDateTime(trade.enteredAt).replace("T", " ")}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td
                    className={
                      "numeric-cell " +
                      (metrics.net > 0
                        ? "positive"
                        : metrics.net < 0
                          ? "negative"
                          : "muted")
                    }
                  >
                    <strong
                      className={
                        "result-badge mono " +
                        (metrics.net > 0
                          ? "gain"
                          : metrics.net < 0
                            ? "loss"
                            : "neutral")
                      }
                    >
                      {metrics.riskKnown ? r(metrics.realizedR) : "R inconnu"}
                    </strong>
                    <small className="mono">{signedMoney(metrics.net)}</small>
                    <small>{EXIT_REASONS[trade.exitReason ?? "UNKNOWN"]}</small>
                  </td>
                  {columns.includes("setup") && (
                    <td className="setup-cell">
                      <span>{trade.setup}</span>
                      <small>
                        {trade.session} · {trade.timeframe} · {trade.quality}
                      </small>
                      {trade.tags?.includes("R hypothétique") && (
                        <small className="amber-text">R hypothétique</small>
                      )}
                    </td>
                  )}
                  {columns.includes("direction") && (
                    <td>
                      <span className="direction-label">
                        {trade.direction === "LONG" ? "↗ Achat" : "↘ Vente"}
                      </span>
                    </td>
                  )}
                  {columns.includes("mental") && (
                    <td>{trade.mentalBefore || "Non renseigné"}</td>
                  )}
                  {columns.includes("plan") && (
                    <td>
                      <TradeStatus trade={trade} score />
                    </td>
                  )}
                  <td>
                    <button
                      type="button"
                      className="icon-btn row-open"
                      aria-label={"Voir le trade " + trade.instrument}
                      onClick={() => onOpen(trade, trades)}
                    >
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!trades.length && (
          <Empty text="Aucune exécution dans cette sélection. Ajuste la recherche ou les filtres." />
        )}
      </div>
      {trades.length > 5 && (
        <div className="table-pagination">
          <span>
            {Math.min(limit, trades.length)} sur {trades.length} exécutions
          </span>
          {trades.length > limit && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setLimit((current) => current + 100)}
            >
              Afficher les suivantes{" "}
              <span className="mono">
                +{Math.min(100, trades.length - limit)}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
