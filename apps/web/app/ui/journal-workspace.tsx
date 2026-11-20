"use client";
import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Columns3,
  Download,
  Search,
  X,
} from "lucide-react";
import { summarize, nyDate, type Journal, type Trade } from "@edge/core";
import JournalCalendar from "./journal-calendar";
import JournalInspector from "./journal-inspector";
import { EXIT_REASONS } from "@edge/core";
import { useApp } from "../../lib/client-store";
import { exportCsv } from "../../lib/files";
import {
  Field,
  Panel,
  SectionHeading,
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
  type JournalFocus,
  type JournalOptions,
  type JournalScope,
} from "./view-data";

export default function JournalWorkspace({
  trades: contextTrades,
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
}: {
  trades: Trade[];
  journal: Journal;
  onEdit: (trade: Trade) => void;
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
  const month =
    options.month ??
    contextTrades
      .map((trade) => nyDate(trade.exitedAt))
      .sort()
      .at(-1)
      ?.slice(0, 7) ??
    nyDate(new Date().toISOString()).slice(0, 7);
  const day =
    options.mode === "calendar"
      ? options.day?.startsWith(month)
        ? options.day
        : (contextTrades
            .map((trade) => nyDate(trade.exitedAt))
            .filter((day) => day.startsWith(month))
            .sort()
            .at(-1) ?? month + "-01")
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
  const stats = useMemo(() => summarize(trades), [trades]);
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
      <dl className="stat-strip journal-stats">
        <Stat
          label="Résultat de la sélection"
          value={stats.riskCount ? r(stats.r) : "—"}
          sub={signedMoney(stats.net)}
          tone={stats.r > 0 ? "positive" : stats.r < 0 ? "negative" : ""}
        />
        <Stat
          label="Exécutions"
          value={num(stats.count, 0)}
          sub={
            stats.count === total
              ? "Toute la sélection"
              : "sur " + total + " dans le contexte"
          }
        />
        <Stat
          label="Taux de réussite"
          value={stats.count ? num(stats.winRate * 100, 1) + " %" : "—"}
          sub="Neutres inclus"
        />
        <Stat
          label="Espérance / trade"
          value={stats.riskCount ? r(stats.expectancy) : "—"}
          sub={
            "Profit factor " +
            (stats.profitFactor === null ? "—" : num(stats.profitFactor))
          }
        />
      </dl>
      <div className="journal-review-layout">
        <Panel className="journal-panel">
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
          <div className="journal-query">
            <label className="search journal-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                name="journal-search"
                aria-label="Rechercher une exécution"
                placeholder="Instrument, setup, note ou émotion…"
                value={search}
                onChange={(event) => onSearch(event.target.value)}
              />
            </label>
            <div
              className="result-switch"
              role="group"
              aria-label="Filtrer par résultat"
            >
              {(
                [
                  { value: "all", label: "Toutes" },
                  { value: "gain", label: "+ Gains" },
                  { value: "loss", label: "− Pertes" },
                  { value: "flat", label: "Neutres" },
                ] as const
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={options.result === item.value}
                  onClick={() => onOptions({ ...options, result: item.value })}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Field label="Respect du plan">
              <select
                value={options.plan}
                onChange={(event) =>
                  onOptions({
                    ...options,
                    plan: event.target.value as JournalOptions["plan"],
                  })
                }
              >
                <option value="all">Tous les statuts</option>
                <option value="respected">Plan respecté</option>
                <option value="offplan">Hors plan</option>
                <option value="unknown">Non renseigné</option>
              </select>
            </Field>
          </div>
          <div className="journal-filter-row">
            <Field label="Motif de clôture"><select value={options.exitReason ?? "all"} onChange={e => onOptions({...options,exitReason:e.target.value})}><option value="all">Tous les motifs</option>{Object.entries(EXIT_REASONS).map(([k,label]) => <option key={k} value={k}>{label}</option>)}</select></Field>
            <Field label="Revue du trade"><select value={options.review ?? "all"} onChange={e => onOptions({...options,review:e.target.value as JournalOptions["review"]})}><option value="all">Toutes les revues</option><option value="pending">À revoir</option><option value="reviewed">Terminées</option></select></Field>
            <Field label="Vues du tableau"><select value="" onChange={e => {const view = journal.savedViews.find(v => v.id === e.target.value); if(view){const f=view.filters;onSearch(f.search ?? "");onSort(f.sort ?? "date");onOptions({...options,result:f.result as JournalOptions["result"],plan:f.plan as JournalOptions["plan"],mode:f.mode as JournalOptions["mode"],exitReason:f.exitReason,review:f.review as JournalOptions["review"]});}}}><option value="">Charger une vue…</option>{journal.savedViews.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
            <button className="btn secondary" onClick={() => {const name = window.prompt("Nom de cette vue du tableau", "Ma revue");if(name?.trim())update(j => {j.savedViews.push({id:crypto.randomUUID(),name:name.trim().slice(0,100),filters:{search,sort,result:options.result,plan:options.plan,mode:options.mode,exitReason:options.exitReason ?? "all",review:options.review ?? "all"}});});}}>Enregistrer cette vue</button>
          </div>
          <div className="journal-selection-line">
            <span role="status" aria-live="polite">
              {trades.length} {trades.length === 1 ? "exécution" : "exécutions"}
            </span>
            <span>Clôtures en heure de New York</span>
            {(search || options.result !== "all" || options.plan !== "all" || (options.exitReason ?? "all") !== "all" || (options.review ?? "all") !== "all") && (
              <button
                type="button"
                className="text-btn"
                onClick={() => {
                  onSearch("");
                  onOptions({ ...options, result: "all", plan: "all", exitReason:"all", review:"all" });
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
          active={Boolean(options.inspectedId || options.day)}
          trade={inspected}
          trades={trades}
          journal={journal}
          day={day}
          onOpen={onOpen}
          onEdit={onEdit}
          onReview={onReview}
        />
      </div>
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
}) {
  const label = (weekly ? "Semaine du " : "Séance du ") + dateLabel(group.date);
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
          />
        </div>
      )}
    </details>
  );
}
