"use client";
import { InstrumentMark } from "./instrument-mark";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
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
  onEdit,
  onDelete,
  selection,
  onSelection,
}: {
  trades: Trade[];
  onOpen: (trade: Trade, context?: Trade[]) => void;
  columns?: TradeColumn[];
  sort?: string;
  onSort?: (sort: string) => void;
  caption?: string;
  onSelect?: (trade: Trade) => void;
  selectedId?: string;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  selection?: string[];
  onSelection?: (ids: string[]) => void;
}) {
  const [limit, setLimit] = useState(50);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const apply = () => setLimit(media.matches ? 20 : 50);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [trades]);
  const visible = trades.slice(0, limit);
  const chosen = selection ?? [];
  const allChosen =
    visible.length > 0 && visible.every((trade) => chosen.includes(trade.id));
  function toggle(id: string) {
    onSelection?.(
      chosen.includes(id)
        ? chosen.filter((value) => value !== id)
        : [...chosen, id],
    );
  }
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
              {onSelection && (
                <th className="select-cell">
                  <input
                    type="checkbox"
                    aria-label="Sélectionner les exécutions affichées"
                    checked={allChosen}
                    onChange={() =>
                      onSelection?.(
                        allChosen
                          ? chosen.filter(
                              (id) => !visible.some((trade) => trade.id === id),
                            )
                          : [...new Set([...chosen, ...visible.map((trade) => trade.id)])],
                      )
                    }
                  />
                </th>
              )}
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
              {columns.includes("setup") && <th className="setup-cell">Setup / contexte</th>}
              {columns.includes("direction") && (
                <th className="optional-column direction-column">Direction</th>
              )}
              {columns.includes("mental") && (
                <th className="optional-column mental-column">État mental</th>
              )}
              {columns.includes("plan") && (
                <th className="optional-column">Plan</th>
              )}
              <th>
                <span className="sr-only">Ouvrir</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((trade) => {
              const metrics = calculateTrade(trade);
              return (
                <tr
                  key={trade.id}
                  data-trade-id={trade.id}
                  data-selected={trade.id === selectedId || undefined}
                  data-checked={
                    chosen.includes(trade.id) ? "true" : undefined
                  }
                >
                  {onSelection && (
                    <td className="select-cell">
                      <input
                        type="checkbox"
                        aria-label={
                          "Sélectionner " +
                          trade.instrument +
                          " du " +
                          localDateTime(trade.enteredAt)
                        }
                        checked={chosen.includes(trade.id)}
                        onChange={() => toggle(trade.id)}
                      />
                    </td>
                  )}
                  <td className="instrument-cell">
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
                      <InstrumentMark symbol={trade.instrument} />
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
                      "numeric-cell result-cell " +
                      (metrics.net > 0
                        ? "positive"
                        : metrics.net < 0
                          ? "negative"
                          : "muted")
                    }
                  >
                    <div className="result-line">
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
                      <span
                        className={
                          "trade-state " +
                          (metrics.net > 0
                            ? "gain"
                            : metrics.net < 0
                              ? "loss"
                              : "neutral")
                        }
                      >
                        {metrics.net > 0
                          ? "Gagnant"
                          : metrics.net < 0
                            ? "Perdant"
                            : "Neutre"}
                      </span>
                    </div>
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
                    <td className="optional-column direction-column">
                      <span className="direction-label">
                        {trade.direction === "LONG" ? "↗ Achat" : "↘ Vente"}
                      </span>
                    </td>
                  )}
                  {columns.includes("mental") && (
                    <td className="optional-column mental-column">
                      {trade.mentalBefore || "Non renseigné"}
                    </td>
                  )}
                  {columns.includes("plan") && (
                    <td className="optional-column">
                      <TradeStatus trade={trade} score />
                    </td>
                  )}
                  <td className="row-action">
                    <div className="row-actions">
                      {onEdit && (
                        <button
                          type="button"
                          className="icon-btn row-quick"
                          aria-label={"Modifier le trade " + trade.instrument}
                          onClick={() => onEdit(trade)}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="icon-btn row-quick danger"
                          aria-label={"Supprimer le trade " + trade.instrument}
                          onClick={() => onDelete(trade)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="icon-btn row-open"
                        aria-label={"Voir le trade " + trade.instrument}
                        onClick={() => onOpen(trade, trades)}
                      >
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </button>
                    </div>
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
