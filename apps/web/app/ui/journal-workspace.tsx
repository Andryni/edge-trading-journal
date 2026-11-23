"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Columns3,
  Download,
  Trash2,
  X,
} from "lucide-react";
import {
  calculateTrade,
  nyDate,
  summarize,
  type Journal,
  type Trade,
} from "@edge/core";
import JournalCalendar from "./journal-calendar";
import JournalInspector from "./journal-inspector";
import { EXIT_REASONS } from "@edge/core";
import { useApp } from "../../lib/client-store";
import { exportBackup, exportCsv } from "../../lib/files";
import {
  BalanceBar,
  Gauge,
  Modal,
  Panel,
  Ring,
  SectionHeading,
  Sparkline,
  Stat,
  Tabs,
  num,
  r,
  signedMoney,
} from "./kit";
import { TradeTable } from "./execution-table";
import {
  TRADE_COLUMNS,
  dateLabel,
  journalGroups,
  longestStreak,
  type JournalFocus,
  type JournalOptions,
  type JournalScope,
} from "./view-data";

export default function JournalWorkspace({
  trades: contextTrades,
  streakTrades,
  journal,
  onEdit,
  onReview,
  total,
  options,
  onOptions,
  search,
  onSearch,
  sort,
  onSort,
  focus,
  onReturn,
  onClearFocus,
  onScope,
  onOpen,
  onDelete,
}: {
  trades: Trade[];
  streakTrades: Trade[];
  journal: Journal;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
  onReview: (day: string) => void;
  total: number;
  options: JournalOptions;
  onOptions: (options: JournalOptions) => void;
  search: string;
  onSearch: (query: string) => void;
  sort: string;
  onSort: (sort: string) => void;
  focus: JournalFocus | null;
  onReturn: () => void;
  onClearFocus: () => void;
  onScope: (scope: JournalScope) => void;
  onOpen: (trade: Trade, context?: Trade[]) => void;
}) {
  const update = useApp(s => s.update);
  const [toolsOpen,setToolsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Trade | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkNote, setBulkNote] = useState("");
  const [bulkDelete, setBulkDelete] = useState(false);
  const month =
    options.month ??
    contextTrades
      .map((trade) => nyDate(trade.exitedAt))
      .sort()
      .at(-1)
      ?.slice(0, 7) ??
    nyDate(new Date().toISOString()).slice(0, 7);
  const day =
    options.day && /^\d{4}-\d{2}-\d{2}$/.test(options.day)
      ? options.day
      : undefined;
  const trades = useMemo(
    () =>
      day
        ? contextTrades.filter((trade) => nyDate(trade.exitedAt) === day)
        : contextTrades,
    [contextTrades, day],
  );
  const inspected =
    trades.find((trade) => trade.id === options.inspectedId) ?? trades[0];
  function revealInspector() {
    if (window.matchMedia("(max-width: 1100px)").matches)
      requestAnimationFrame(() =>
        document
          .querySelector(".journal-inspector")
          ?.scrollIntoView({ block: "start", behavior: "instant" }),
      );
  }
  const onSelect = (trade: Trade) => {
    onOptions({ ...options, inspectedId: trade.id });
    revealInspector();
  };
  const [reviewing, setReviewing] = useState(false);
  const pending = trades.filter(t => t.reviewStatus !== "REVIEWED");
  const reviewTrade = pending.find(t => t.id === options.inspectedId) ?? pending[0];
  const winRun = longestStreak(streakTrades, "gain");
  const lossRun = longestStreak(streakTrades, "loss");
  function filterResult(result: "gain" | "loss") {
    onOptions({...options, result: options.result === result ? "all" : result, streak: "all", inspectedId: undefined});
  }
  function filterRun(streak: "gain" | "loss") {
    onOptions({...options, result: "all", streak: options.streak === streak ? "all" : streak, inspectedId: undefined});
  }
  function reviewNext() {
    if (!reviewTrade) return;
    update(j => { const target = j.trades.find(t => t.id === reviewTrade.id); if (target) target.reviewStatus = "REVIEWED"; });
    const next = pending[(pending.indexOf(reviewTrade) + 1) % pending.length];
    onOptions({...options, inspectedId: next?.id});
  }
  const stats = useMemo(() => summarize(trades), [trades]);
  const kpi = useMemo(() => {
    const ordered = [...trades].sort((a, b) =>
      a.exitedAt.localeCompare(b.exitedAt),
    );
    let running = 0;
    const cumulative = ordered.map(
      (trade) => (running += calculateTrade(trade).net),
    );
    return {
      cumulative,
      wins: ordered.filter((trade) => calculateTrade(trade).net > 0).length,
      losses: ordered.filter((trade) => calculateTrade(trade).net < 0).length,
    };
  }, [trades]);
  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => trades.some((trade) => trade.id === id)),
    );
  }, [trades]);
  const [stickyTop, setStickyTop] = useState(98);
  const [inspectorTop, setInspectorTop] = useState(294);
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>(".cockpit-filter-toolbar");
    if (!bar) return;
    const stats = document.querySelector<HTMLElement>(".journal-stats");
    const header =
      document.querySelector<HTMLElement>(".app-header") ??
      document.querySelector<HTMLElement>("header");
    const sync = () => {
      const headerHeight = header?.getBoundingClientRect().height ?? 56;
      bar.style.top = Math.round(headerHeight) + "px";
      const top = Math.round(headerHeight + bar.getBoundingClientRect().height);
      setStickyTop(top);
      setInspectorTop(top + Math.ceil(stats?.getBoundingClientRect().height ?? 0) + 10);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(bar);
    if (stats) observer.observe(stats);
    if (header) observer.observe(header);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      bar.style.top = "";
    };
  }, []);
  function markSelected(status: "REVIEWED" | "PENDING") {
    if (!selectedIds.length) return;
    const ids = new Set(selectedIds);
    update((journalData) => {
      for (const trade of journalData.trades)
        if (ids.has(trade.id)) trade.reviewStatus = status;
    });
    setBulkNote(
      ids.size +
        (ids.size === 1 ? " exécution marquée " : " exécutions marquées ") +
        (status === "REVIEWED" ? "comme revues." : "à revoir."),
    );
    setSelectedIds([]);
  }
  async function deleteSelected() {
    const ids = new Set(selectedIds);
    try {
      await exportBackup(journal);
      update((journalData) => {
        journalData.trades = journalData.trades.filter(
          (trade) => !ids.has(trade.id),
        );
      });
      setBulkNote(
        ids.size +
          (ids.size === 1 ? " exécution supprimée." : " exécutions supprimées."),
      );
      setSelectedIds([]);
    } catch (error) {
      setBulkNote(String(error));
    } finally {
      setBulkDelete(false);
    }
  }
  const groups = useMemo(
    () =>
      options.mode === "days" || options.mode === "weeks"
        ? journalGroups(trades, options.mode)
        : [],
    [trades, options.mode],
  );

  return (
    <div className="journal-workspace">
      {focus && (
        <div className="journal-focus-bar">
          <button type="button" className="back-link" onClick={onReturn}>
            <ArrowLeft size={15} aria-hidden="true" />
            Retour{" "}
            {focus.origin === "Journal"
              ? "au journal"
              : focus.origin === "Cockpit"
                ? "au cockpit"
                : "à " + focus.origin.toLocaleLowerCase("fr-FR")}
          </button>
          <span>{focus.label}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={onClearFocus}
            aria-label="Effacer le ciblage du journal"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}
      <button type="button" className="btn secondary mobile-journal-toggle" aria-expanded={toolsOpen}
        onClick={()=>setToolsOpen(!toolsOpen)}>Filtres, statistiques et export</button>
      <dl
        className={"stat-strip journal-stats" + (toolsOpen ? " mobile-expanded" : "")}
        style={{ top: stickyTop }}
      >
        <Stat
          label={
            <>
              Résultat de la sélection
              <span className="stat-count">{num(stats.count, 0)}</span>
            </>
          }
          value={stats.riskCount ? r(stats.r) : "—"}
          graphic={
            <Sparkline
              values={kpi.cumulative}
              tone={stats.net >= 0 ? "accent" : "negative"}
              height={44}
              area
            />
          }
          sub={signedMoney(stats.net) + " · risque renseigné : " + stats.riskCount + "/" + stats.count}
          tone={stats.r > 0 ? "positive" : stats.r < 0 ? "negative" : ""}
        />
        <Stat
          label="Exécutions"
          value={num(stats.count, 0)}
          graphic={
            <BalanceBar
              positive={kpi.wins}
              negative={kpi.losses}
              label={
                kpi.wins +
                " gagnantes, " +
                kpi.losses +
                " perdantes sur la sélection"
              }
            />
          }
          meta={
            <span className="kpi-actions"><button type="button" aria-pressed={options.result === "gain"} onClick={() => filterResult("gain")}>{kpi.wins} gagnantes</button><button type="button" aria-pressed={options.result === "loss"} onClick={() => filterResult("loss")}>{kpi.losses} pertes</button></span>
          }
          sub={
            stats.count === total
              ? "Toute la sélection"
              : "sur " + total + " dans le contexte"
          }
        />
        <Stat
          label="Taux de réussite"
          value={stats.count ? num(stats.winRate * 100, 1) + " %" : "—"}
          graphic={
            <Gauge
              value={stats.winRate * 100}
              label={num(stats.winRate * 100, 1) + " % de réussite"}
            />
          }
          meta={
            <span className="kpi-actions">Série max.
              <button type="button" disabled={!winRun.length} aria-pressed={options.streak === "gain"} title="Première série gagnante maximale du contexte, par clôture" onClick={() => filterRun("gain")}>{winRun.length} gains</button>
              <button type="button" disabled={!lossRun.length} aria-pressed={options.streak === "loss"} title="Première série perdante maximale du contexte, par clôture" onClick={() => filterRun("loss")}>{lossRun.length} pertes</button>
            </span>
          }
          sub="Neutres inclus"
        />
        <Stat
          label="Espérance / trade"
          value={stats.riskCount ? r(stats.expectancy) : "—"}
          graphic={
            <Ring
              value={
                stats.profitFactor === null
                  ? 0
                  : (stats.profitFactor / (1 + stats.profitFactor)) * 100
              }
              label={
                "Profit factor " +
                (stats.profitFactor === null ? "indisponible" : num(stats.profitFactor))
              }
            />
          }
          meta={
            "Gain moy. " +
            r(stats.averageWinR) +
            " · Perte moy. " +
            r(stats.averageLossR)
          }
          sub={
            "Profit factor " +
            (stats.profitFactor === null ? "—" : num(stats.profitFactor))
          }
        />
      </dl>
      <div className="journal-review-queue" role="region" aria-label="File de revue">
        <span role="status">{pending.length ? `${pending.length} exécutions à revoir dans la sélection` : "Aucune exécution à revoir dans la sélection"}</span>
        <button type="button" className="btn secondary" disabled={!pending.length && !reviewing} aria-pressed={reviewing} onClick={() => {setReviewing(!reviewing); if (!reviewing && reviewTrade) onSelect(reviewTrade);}}>{reviewing ? "Quitter la revue" : "Commencer la revue"}</button>
        {reviewing && reviewTrade && <>
          <button type="button" className="btn secondary" onClick={reviewNext}>Marquer revu et suivant</button>
          <button type="button" className="text-btn" disabled={pending.length < 2} onClick={() => onSelect(pending[(pending.indexOf(reviewTrade) + 1) % pending.length])}>Passer pour le moment</button>
        </>}
      </div>
      <div className="journal-review-layout" data-density={options.density ?? "comfortable"}
        style={{ "--journal-inspector-top": `${inspectorTop}px` } as import("react").CSSProperties}>
        <Panel className={"journal-panel" + (toolsOpen ? " mobile-expanded" : "")}>
          <div className="journal-navigation">
            <Tabs
              id="journal-mode"
              label="Présentation du journal"
              value={options.mode}
              options={[
                { value: "trades", label: "Exécutions", count: trades.length },
                { value: "days", label: "Séances" },
                { value: "weeks", label: "Semaines" },
                { value: "calendar", label: "Calendrier" },
              ]}
              onChange={(mode) => onOptions({ ...options, mode })}
            />
            <div className="journal-tools">
              <button type="button" className="btn secondary" aria-pressed={options.density === "compact"} onClick={() => onOptions({...options, density: options.density === "compact" ? "comfortable" : "compact"})}>Vue compacte</button>
              <details className="column-chooser">
                <summary>
                  <Columns3 size={14} aria-hidden="true" />
                  Colonnes
                </summary>
                <div className="column-menu">
                  <span className="column-menu-note">
                    Instrument et résultat toujours visibles
                  </span>
                  {TRADE_COLUMNS.map((column) => (
                    <label key={column.id}>
                      <input
                        type="checkbox"
                        checked={options.columns.includes(column.id)}
                        onChange={(event) =>
                          onOptions({
                            ...options,
                            columns: event.target.checked
                              ? [...options.columns, column.id]
                              : options.columns.filter(
                                  (value) => value !== column.id,
                                ),
                          })
                        }
                      />
                      {column.label}
                    </label>
                  ))}
                </div>
              </details>
              <button
                type="button"
                className="btn secondary"
                disabled={!trades.length}
                onClick={() => exportCsv(trades)}
              >
                <Download size={14} aria-hidden="true" />
                Exporter CSV
              </button>
            </div>
          </div>
          {selectedIds.length > 0 && (
            <div className="bulk-bar" role="group" aria-label="Actions sur la sélection">
              <strong>
                {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "sélectionnée" : "sélectionnées"}
              </strong>
              <button
                type="button"
                className="btn secondary"
                onClick={() => markSelected("REVIEWED")}
              >
                <Check size={13} aria-hidden="true" />
                Marquer revu
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => markSelected("PENDING")}
              >
                À revoir
              </button>
              <button
                type="button"
                className="btn secondary danger"
                onClick={() => setBulkDelete(true)}
              >
                <Trash2 size={13} aria-hidden="true" />
                Supprimer
              </button>
              <button
                type="button"
                className="text-btn bulk-spacer"
                onClick={() => setSelectedIds([])}
              >
                Tout désélectionner
              </button>
            </div>
          )}
          {bulkNote && (
            <p className="bulk-note" role="status">
              {bulkNote}
            </p>
          )}
          <div className="journal-selection-line">
            {day && (
              <span className="day-scope">
                Jour : {dateLabel(day)}
                <button
                  type="button"
                  aria-label="Retirer le filtre du jour"
                  onClick={() =>
                    onOptions({ ...options, day: undefined, inspectedId: undefined })
                  }
                >
                  <X size={11} aria-hidden="true" />
                </button>
              </span>
            )}
            {options.streak && options.streak !== "all" && <span>Série {options.streak === "gain" ? "gagnante" : "perdante"} maximale <button type="button" className="text-btn" aria-label="Retirer le filtre série" onClick={() => onOptions({...options, streak: "all"})}>×</button></span>}
            {options.result !== "all" && <span>{{gain:"Gains",loss:"Pertes",flat:"Neutres"}[options.result]}</span>}
            {options.plan !== "all" && <span>{{respected:"Plan respecté",offplan:"Hors plan",unknown:"Plan non renseigné"}[options.plan]}</span>}
            {options.exitReason && options.exitReason !== "all" && <span>{EXIT_REASONS[options.exitReason as keyof typeof EXIT_REASONS] ?? options.exitReason}</span>}
            {options.review && options.review !== "all" && <span>{options.review === "pending" ? "À revoir" : "Revue terminée"}</span>}
            <span role="status" aria-live="polite">
              {trades.length} {trades.length === 1 ? "exécution" : "exécutions"}
            </span>
            <span>Clôtures en heure de New York</span>
            {(options.streak && options.streak !== "all" || search || options.result !== "all" || options.plan !== "all" || (options.exitReason ?? "all") !== "all" || (options.review ?? "all") !== "all") && (
              <button
                type="button"
                className="text-btn"
                onClick={() => {
                  onSearch("");
                  onOptions({ ...options, result: "all", plan: "all", exitReason:"all", review:"all", streak:"all" });
                }}
              >
                Réinitialiser la recherche
              </button>
            )}
          </div>
          {options.mode === "calendar" && (
            <JournalCalendar
              trades={contextTrades}
              month={month}
              day={day}
              onMonth={(month) =>
                onOptions({
                  ...options,
                  month,
                  day: undefined,
                  inspectedId: undefined,
                })
              }
              onDay={(day) => {
                onOptions({ ...options, day, inspectedId: undefined });
                revealInspector();
              }}
            />
          )}
          <div
            id="journal-mode-panel"
            role="tabpanel"
            aria-labelledby={"journal-mode-" + options.mode}
          >
            {options.mode === "trades" ||
            options.mode === "calendar" ||
            !trades.length ? (
              <TradeTable
                trades={trades}
                columns={options.columns}
                onOpen={onOpen}
                onSelect={onSelect}
                selectedId={inspected?.id}
                sort={sort}
                onSort={onSort}
                onEdit={onEdit}
                onDelete={setPendingDelete}
                selection={selectedIds}
                onSelection={setSelectedIds}
              />
            ) : (
              <div className="journal-groups">
                {groups.slice(0, options.groupLimit).map((group, index) => (
                  <JournalGroup
                    key={group.date + options.mode}
                    group={group}
                    weekly={options.mode === "weeks"}
                    open={
                      options.expanded
                        ? options.expanded.includes(
                            options.mode + ":" + group.date,
                          )
                        : index === 0
                    }
                    onOpenChange={(open) => {
                      const key = options.mode + ":" + group.date;
                      const current =
                        options.expanded ??
                        (groups.length
                          ? [options.mode + ":" + groups[0].date]
                          : []);
                      onOptions({
                        ...options,
                        expanded: open
                          ? [...new Set([...current, key])]
                          : current.filter((value) => value !== key),
                      });
                    }}
                    columns={options.columns}
                    onSelect={onSelect}
                    selectedId={inspected?.id}
                    onScope={onScope}
                    onOpen={(trade) => onOpen(trade, trades)}
                    onEdit={onEdit}
                    onDelete={setPendingDelete}
                  />
                ))}
                {groups.length > options.groupLimit && (
                  <button
                    type="button"
                    className="btn secondary full"
                    onClick={() =>
                      onOptions({
                        ...options,
                        groupLimit: options.groupLimit + 12,
                      })
                    }
                  >
                    Afficher les{" "}
                    {options.mode === "weeks" ? "semaines" : "séances"}{" "}
                    suivantes
                  </button>
                )}
              </div>
            )}
          </div>
        </Panel>
        <JournalInspector
          active={Boolean(reviewing || options.inspectedId || options.day)}
          trade={reviewing ? reviewTrade : inspected}
          trades={trades}
          journal={journal}
          day={day}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={setPendingDelete}
          onReview={onReview}
          onToggleReview={(trade) =>
            update((journalData) => {
              const target = journalData.trades.find(
                (item) => item.id === trade.id,
              );
              if (target)
                target.reviewStatus =
                  target.reviewStatus === "REVIEWED" ? "PENDING" : "REVIEWED";
            })
          }
        />
      </div>
      {bulkDelete && (
        <Modal
          title={
            "Supprimer " + selectedIds.length + " exécution" + (selectedIds.length > 1 ? "s" : "") + " ?"
          }
          onClose={() => setBulkDelete(false)}
        >
          <p className="journal-delete-note">
            Les exécutions sélectionnées seront retirées du journal. Une
            sauvegarde complète est téléchargée avant la suppression.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setBulkDelete(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn danger-confirm"
              onClick={() => void deleteSelected()}
            >
              Supprimer définitivement
            </button>
          </div>
        </Modal>
      )}
      {pendingDelete && (
        <Modal
          title="Supprimer cette exécution ?"
          onClose={() => setPendingDelete(null)}
        >
          <div className="journal-delete-summary">
            <span className="journal-delete-icon" aria-hidden="true">
              <Trash2 size={19} />
            </span>
            <div>
              <strong>
                {pendingDelete.instrument} · {pendingDelete.setup}
              </strong>
              <p>
                {dateLabel(nyDate(pendingDelete.exitedAt))} ·{" "}
                {signedMoney(calculateTrade(pendingDelete).net)}
              </p>
            </div>
          </div>
          <p className="journal-delete-note">
            L’exécution sera retirée du journal. Une sauvegarde complète est
            téléchargée avant la suppression.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => setPendingDelete(null)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn danger-confirm"
              onClick={() => {
                onDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Supprimer définitivement
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function JournalGroup({
  group,
  weekly,
  open,
  onOpenChange,
  columns,
  onScope,
  onOpen,
  onSelect,
  selectedId,
  onEdit,
  onDelete,
}: {
  group: ReturnType<typeof journalGroups>[number];
  weekly: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: JournalOptions["columns"];
  onScope: (scope: JournalScope) => void;
  onOpen: (trade: Trade) => void;
  onSelect: (trade: Trade) => void;
  selectedId?: string;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
}) {
  const label = (weekly ? "Semaine du " : "Séance du ") + dateLabel(group.date);
  let running = 0;
  const cumulative = [...group.trades]
    .sort((a, b) => a.exitedAt.localeCompare(b.exitedAt))
    .map((trade) => (running += calculateTrade(trade).net));
  return (
    <details
      className="journal-group"
      open={open}
      onToggle={(event) => {
        if (event.currentTarget.open !== open)
          onOpenChange(event.currentTarget.open);
      }}
    >
      <summary>
        <span className="group-date">
          {label}
          <small>
            {group.stats.count} exécutions
            {weekly ? " · jusqu’au " + dateLabel(group.range.to) : ""}
          </small>
        </span>
        <span
          className={
            "group-result mono " +
            (group.stats.r > 0
              ? "positive"
              : group.stats.r < 0
                ? "negative"
                : "muted")
          }
        >
          {r(group.stats.r)}
          <small>{signedMoney(group.stats.net)}</small>
        </span>
        <span className="group-winrate">
          <strong className="mono">
            {num(group.stats.winRate * 100, 0)} %
          </strong>
          <small>réussite</small>
        </span>
        <span className="group-trend">
          <Sparkline
            values={cumulative}
            tone={group.stats.net >= 0 ? "accent" : "negative"}
            height={22}
          />
        </span>
      </summary>
      {open && (
        <div className="journal-group-content">
          <SectionHeading
            title={
              weekly ? "Exécutions de la semaine" : "Exécutions de la séance"
            }
            actions={
              <button
                type="button"
                className="text-btn"
                onClick={() =>
                  onScope({
                    ...group.range,
                    label,
                    ids: group.trades.map((trade) => trade.id),
                  })
                }
              >
                Isoler la sélection{" "}
                <ArrowUpRight size={14} aria-hidden="true" />
              </button>
            }
          />
          <TradeTable
            trades={group.trades}
            columns={columns}
            onOpen={onOpen}
            caption={label}
            onSelect={onSelect}
            selectedId={selectedId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
    </details>
  );
}
