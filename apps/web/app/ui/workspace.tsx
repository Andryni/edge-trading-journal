"use client";
import "./performance.css";
import Login from "./login";
import SavedJournalViews from "./saved-journal-views";
import { InstrumentMark } from "./instrument-mark";
import { MetricGraphic } from "./metric-graphic";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MotionConfig, useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  ScanLine,
  ShieldCheck,
  Settings,
  Plus,
  Download,
  Menu,
  LogOut,
  RefreshCw,
  MessageSquare,
  ArrowUpRight,
  ArrowRight,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  BookmarkPlus,
} from "lucide-react";
import {
  accountLabel,
  INSTRUMENTS,
  calculateTrade,
  summarize,
  averagePlan,
  isPlanRated,
  groupByDay,
  nyDate,
  localDateTime,
  zonedToUtc,
  accountStatus,
  guardStatus,
  behavioralAnalysis,
  executionAnalysis,
  EXIT_REASONS,
  breakdown,
  reviewSummary,
  newJournal,
  type Trade,
  type Journal,
  type TradeDraft,
} from "@edge/core";
import { useApp } from "../../lib/client-store";
import { exportBackup } from "../../lib/files";
import {
  Panel,
  Field,
  Pill,
  Metric,
  Empty,
  money,
  signedMoney,
  num,
  r,
  Tabs,
  RangeBar,
  BalanceBar,
} from "./kit";
import TradeEditor from "./trade-editor";
import {
  PrimaryNavigation,
  SectionNavigation,
  screenLabel,
  navigationGroup,
} from "./navigation";
import TradeDetail from "./trade-detail";
import {
  Accounts,
  Guard,
  Goals,
  Playbook,
  SessionRoutine,
  Reports,
} from "./management";
import { ImportTrades, SettingsPanel, Calculator } from "./import-settings";
import Coach from "./coach";
import JournalWorkspace from "./journal-workspace";
import { TradeTable } from "./execution-table";
export { TradeTable } from "./execution-table";
import { DatePicker } from "./date-picker";
import { RollingValue, tradeCount } from "./cockpit-presentation";
import { Distribution, PeriodDelta, ResultsByPeriod } from "./cockpit-charts";
import { previousPeriod } from "./cockpit-data";
import { SessionPicker } from "./cockpit-controls";
import {
  calendarRange,
  dateLabel,
  journalTrades,
  scopeTrades,
  DEFAULT_JOURNAL_OPTIONS,
  type JournalOptions,
  type JournalFocus,
  type JournalScope,
} from "./view-data";
const VIEW_DESCRIPTIONS: Record<string, string> = {
  Cockpit: "Risque, exécution et performance.",
  Journal: "Toutes les exécutions, dans leur contexte.",
  Analytiques: "Résultats par setup, instrument et période.",
  Calendrier: "Le résultat de chaque séance, en R.",
  "Leak Finder": "Les contextes qui coûtent le plus à ton exécution.",
  Comptes: "Capital, limites et marge de risque disponible.",
  "Plan & revue": "Préparer la séance et revoir les décisions.",
  Playbook: "Tes setups et leurs règles d’exécution.",
  Objectifs: "Progression du capital et respect du plan.",
  Coach: "Une lecture de tes exécutions clôturées.",
  Calculateur: "Dimensionner la position avant l’entrée.",
  Rapports: "Synthèses et exports de la sélection.",
  Import: "Ajouter un historique à ton journal.",
  Paramètres: "Sauvegardes, préférences et instruments.",
};
const FILTER_VIEWS = new Set([
  "Cockpit",
  "Journal",
  "Analytiques",
  "Calendrier",
  "Leak Finder",
  "Coach",
  "Rapports",
]);
const todayDate = () => nyDate(new Date().toISOString());
export default function Workspace() {
  const app = useApp();
  const { data, user, update, status, error, dirty } = app;
  const [view, setView] = useState("Cockpit"),
    [journalOptions, setJournalOptions] = useState<JournalOptions>(
      DEFAULT_JOURNAL_OPTIONS,
    ),
    [journalFocus, setJournalFocus] = useState<
      | (JournalFocus & {
          savedSearch: string;
          savedSort: string;
          savedOptions: JournalOptions;
        })
      | null
    >(null),
    [detailIds, setDetailIds] = useState<string[]>([]),
    [narrow, setNarrow] = useState(false),
    [mobile, setMobile] = useState(false),
    [filtersOpen, setFiltersOpen] = useState(false),
    [editing, setEditing] = useState<Trade | "new" | null>(null),
    [editingDraft, setEditingDraft] = useState<TradeDraft | undefined>(),
    [editorPrefill, setEditorPrefill] = useState<Record<string,string> | undefined>(),
    [selected, setSelected] = useState<Trade | null>(null),
    [guardAccount, setGuardAccount] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("date"),
    [account, setAccount] = useState("all"),
    [symbol, setSymbol] = useState("all"),
    [setup, setSetup] = useState("all"),
    [session, setSession] = useState("all"),
    [timeframe, setTimeframe] = useState("all"),
    [riskVerified, setRiskVerified] = useState(false),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [date, setDate] = useState(todayDate),
    [notice, setNotice] = useState(""),
    [now, setNow] = useState(Date.now());
  const detailScroll = useRef(0);
  const [guided, setGuided] = useState(false);
  const pendingScroll = useRef<number | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const resize = () => {
      setNarrow(media.matches);
      if (!media.matches) setMobile(false);
    };
    resize();
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobile(false);
        document.querySelector<HTMLButtonElement>(".mobile-menu")?.focus();
      }
      if (event.key === "Tab") {
        const nodes = [
          ...document.querySelectorAll<HTMLElement>(
            ".sidebar a, .sidebar button:not([disabled])",
          ),
        ].filter((node) => node.offsetParent !== null);
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document
      .querySelector<HTMLButtonElement>(".sidebar nav button[aria-current]")
      ?.focus();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [mobile]);
  useEffect(() => {
    if (account !== "all" && !data.accounts.some(item => item.id === account)) setAccount("all");
  }, [account, data.accounts]);
  useEffect(() => {
    if (pendingScroll.current === null) return;
    const top = pendingScroll.current;
    pendingScroll.current = null;
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ top, behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [view, journalFocus, Boolean(selected)]);
  useEffect(() => {
    void useApp.getState().boot();
  }, []);
  useEffect(() => {
    if (!app.user) return;
    const timer = setInterval(() => void useApp.getState().sync(), 4000);
    const online = () => void useApp.getState().sync();
    window.addEventListener("online", online);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", online);
    };
  }, [app.user?.id]);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (data.mode === "demo" && data.trades.length)
      setDate(
        [...data.trades]
          .sort((a, b) => b.exitedAt.localeCompare(a.exitedAt))[0]
          .exitedAt.slice(0, 10),
      );
    else setDate(todayDate());
  }, [data.mode]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const filtered = useMemo(
    () =>
      data.trades.filter(
        (t) =>
          (account === "all" || t.accountId === account) &&
          (symbol === "all" || t.instrument === symbol) &&
          (setup === "all" || t.setup === setup) &&
          (session === "all" || t.session === session) &&
          (timeframe === "all" || t.timeframe === timeframe) &&
          (!from || nyDate(t.exitedAt) >= from) &&
          (!to || nyDate(t.exitedAt) <= to) &&
          (!riskVerified || !t.tags?.includes("R hypothétique")),
      ),
    [
      data.trades,
      account,
      symbol,
      setup,
      session,
      timeframe,
      from,
      to,
      riskVerified,
    ],
  );
  const journalBase = useMemo(
    () => scopeTrades(filtered, journalFocus),
    [filtered, journalFocus],
  );
  const journalVisible = useMemo(
    () =>
      journalTrades(
        journalBase.filter(t => !journalOptions.day || nyDate(t.exitedAt) === journalOptions.day),
        search,
        sort,
        journalOptions.result,
        journalOptions.plan,
        journalOptions.exitReason,
        journalOptions.review,
        journalOptions.streak,
      ),
    [journalBase, search, sort, journalOptions],
  );
  const tradeIndex = useMemo(
    () => new Map(data.trades.map((trade) => [trade.id, trade])),
    [data.trades],
  );
  const detailSequence = useMemo(
    () =>
      detailIds
        .map((id) => tradeIndex.get(id))
        .filter((trade): trade is Trade => Boolean(trade)),
    [detailIds, tradeIndex],
  );
  const detailPosition = detailSequence.findIndex(
    (trade) => trade.id === selected?.id,
  );
  const stats = useMemo(() => summarize(filtered), [filtered]);
  const [preferredEquityUnit, setEquityUnit] = useState<"r" | "net">("r");
  const equityUnit = stats.riskCount ? preferredEquityUnit : "net";
  const pendingReviews = useMemo(() => filtered.filter(t => nyDate(t.exitedAt) === date && t.reviewStatus !== "REVIEWED")
    .sort((a,b) => a.exitedAt.localeCompare(b.exitedAt)), [filtered,date]);
  const instrumentResults = useMemo(() => breakdown(filtered, trade => trade.instrument), [filtered]);
  const comparison = useMemo(
    () =>
      previousPeriod(
        data.trades.filter(
          (t) =>
            (account === "all" || t.accountId === account) &&
            (symbol === "all" || t.instrument === symbol) &&
            (setup === "all" || t.setup === setup) &&
            (session === "all" || t.session === session) &&
            (timeframe === "all" || t.timeframe === timeframe) &&
            (!riskVerified || !t.tags?.includes("R hypothétique")),
        ),
        filtered,
        from,
        to,
      ),
    [
      data.trades,
      filtered,
      account,
      symbol,
      setup,
      session,
      timeframe,
      riskVerified,
      from,
      to,
    ],
  );
  const delta = (
    key: "r" | "expectancy" | "winRate" | "drawdown",
    format: "r" | "usd" | "points" = "r",
  ) => (
    <PeriodDelta
      value={
        stats.count && comparison?.stats
          ? (stats[key] - comparison.stats[key]) * (key === "winRate" ? 100 : 1)
          : null
      }
      format={format}
      inverse={key === "drawdown"}
      period={
        comparison
          ? "Période précédente : " +
            comparison.start +
            " au " +
            comparison.end +
            ", mêmes filtres"
          : "Aucune période comparable"
      }
    />
  );
  const days = useMemo(() => groupByDay(filtered), [filtered]);
  const leaks = useMemo(
    () => behavioralAnalysis(filtered, data.settings.minSample),
    [filtered, data.settings.minSample],
  );
  const summary = useMemo(
    () => reviewSummary(filtered, data.settings.minSample),
    [filtered, data.settings.minSample],
  );
  const a = data.accounts.find((a) => a.id === account) ?? data.accounts[0];
  const asOf =
    date === todayDate()
      ? new Date(now).toISOString()
      : zonedToUtc(date + "T23:59:59");
  const prop = a
    ? accountStatus(a, data.trades, asOf, data.settings.riskBudget)
    : null;
  const today = summarize(filtered.filter((t) => nyDate(t.exitedAt) === date));
  const scored = filtered.filter(
    isPlanRated,
  );
  const discipline = scored.length
    ? Math.round(
        (averagePlan(scored) ?? 0) * 10,
      )
    : 0;
  const plan = data.plans.find((p) => p.date === date);
  const planDone = plan?.checks.filter(Boolean).length ?? 0;
  const guard = a ? guardStatus(data, a.id, new Date(now).toISOString()) : null;
  function restoreJournal() {
    if (!journalFocus) return;
    setSearch(journalFocus.savedSearch);
    setSort(journalFocus.savedSort);
    setJournalOptions(journalFocus.savedOptions);
    setJournalFocus(null);
  }
  function go(label: string) {
    setSelected(null);
    restoreJournal();
    pendingScroll.current = 0;
    setView(label);
    setMobile(false);
    if (label === view) window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openJournal(scope: JournalScope) {
    setJournalFocus({
      ...scope,
      origin: journalFocus?.origin ?? view,
      scroll: journalFocus?.scroll ?? window.scrollY,
      savedSearch: journalFocus?.savedSearch ?? search,
      savedSort: journalFocus?.savedSort ?? sort,
      savedOptions: journalFocus?.savedOptions ?? journalOptions,
    });
    setSearch("");
    setSort("date");
    setJournalOptions((current) => ({
      ...current,
      mode: "trades",
      result: "all",
      plan: "all",
    }));
    pendingScroll.current = 0;
    setSelected(null);
    setView("Journal");
    setMobile(false);
  }
  function returnFromJournal() {
    if (!journalFocus) return;
    pendingScroll.current = journalFocus.scroll;
    setView(journalFocus.origin);
    restoreJournal();
  }
  function closeTrade() {
    pendingScroll.current = detailScroll.current;
    setSelected(null);
  }
  function openTrade(trade: Trade, context?: Trade[]) {
    setGuided(false);
    detailScroll.current = window.scrollY;
    pendingScroll.current = 0;
    setDetailIds(
      (context ?? (view === "Journal" ? journalVisible : filtered)).map(
        (item) => item.id,
      ),
    );
    setSelected(trade);
  }
  function inspectDay(day: string) {
    openJournal({ label: "Séance du " + dateLabel(day), from: day, to: day });
  }
  function applyPeriod(days: number | null) {
    const range = days ? calendarRange(date, days) : { from: "", to: "" };
    setFrom(range.from);
    setTo(range.to);
  }
  function saveTrade(t: Trade, draftId?: string) {
    update((j) => {
      j.drafts = j.drafts.filter(d => d.id !== draftId && d.sourceTradeId !== t.id);
      j.trades = j.trades.some((p) => p.id === t.id)
        ? j.trades.map((p) => (p.id === t.id ? t : p))
        : [...j.trades, t];
      if (!j.setups.some((s) => s.name === t.setup))
        j.setups.push({
          id: crypto.randomUUID(),
          name: t.setup,
          entryRules: "À documenter",
          invalidation: "À documenter",
          examples: [],
        });
    });
    setEditing(null);
    setEditingDraft(undefined);
    setSelected((current) => (current?.id === t.id ? t : current));
    setNotice(app.guest ? "Exécution ajoutée à la démonstration." : "Exécution enregistrée · synchronisation en attente.");
  }
  async function removeTrade(t: Trade) {
    try {
      await exportBackup(data);
      update((j) => (j.trades = j.trades.filter((p) => p.id !== t.id)));
      if (selected?.id === t.id) closeTrade();
      setNotice(
        "Trade retiré du journal. Une sauvegarde complète a été téléchargée.",
      );
    } catch (e) {
      setNotice(String(e));
    }
  }
  if (!app.loaded)
    return (
      <div className="loading-screen">
        <img src="/brand/edge-mark.svg?v=candles1" alt="EDGE" width={56} height={56} />
        <p>Ouverture de ton journal…</p>
      </div>
    );
  if (!user) return <Login />;
  return (
    <MotionConfig reducedMotion="user">
      <div
        className={"app-shell" + (view === "Cockpit" ? " cockpit-view" : "")}
        data-view={view}
      >
        <a className="skip-link" href="#main-content">
          Aller au contenu
        </a>
        <aside
          id="workspace-sidebar"
          inert={narrow && !mobile}
          aria-hidden={narrow && !mobile ? true : undefined}
          className={"sidebar " + (mobile ? "open" : "")}
        >
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              go("Cockpit");
            }}
          >
            <img src="/brand/edge-logo.svg?v=candles1" alt="EDGE — accueil du cockpit" width={176} height={44} />
          </a>
          <div className="brand-sub">Risque · Exécution · Revue</div>
          <div className="workspace">
            <span className="avatar">TR</span>
            <div>
              <strong>Espace personnel</strong>
              <small>
                {data.mode === "demo"
                  ? "Démonstration isolée"
                  : app.cloud ? "Journal synchronisé" : "Journal sur cet appareil"}
              </small>
            </div>
            <span className="workspace-dot" />
          </div>
          <PrimaryNavigation view={view} onNavigate={go} />
          <div className="sidebar-bottom">
            <button
              type="button"
              className={"nav-item " + (view === "Paramètres" ? "active" : "")}
              onClick={() => go("Paramètres")}
              title="Paramètres" aria-label="Paramètres"
            >
              <Settings size={17} aria-hidden="true" /><span>Paramètres</span>
            </button>
            <div className="local-card">
              <Radio size={16} />
              <div>
                <strong>
                  {app.guest ? "Démonstration" : dirty ? "Modifications en attente" : app.cloud ? "Journal synchronisé" : "Journal sur cet appareil"}
                </strong>
                <small>
                  {user.email.startsWith("demo-")
                    ? "Compte de démonstration"
                    : user.email}
                </small>
              </div>
            </div>
            <button
              className="nav-item"
              title="Déconnexion" aria-label="Déconnexion"
              onClick={() =>
                void app.logout().catch((e) => setNotice(e.message))
              }
            >
              <LogOut size={17} />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>
        {mobile && (
          <button
            type="button"
            className="navigation-backdrop"
            aria-label="Fermer la navigation"
            onClick={() => setMobile(false)}
          />
        )}
        <div className="main-wrap">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-btn mobile-menu"
                aria-label={mobile ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={mobile}
                aria-controls="workspace-sidebar"
                onClick={() => setMobile(!mobile)}
              >
                <Menu size={20} />
              </button>
              <span>ESPACE PERSONNEL</span>
              <span className="slash">/</span>
              <strong>{navigationGroup(view)?.label ?? "Mon espace"}</strong>
            </div>
            <div className="top-right">
              <span className="system-status">
                <span className="live-dot" />
                {status}
              </span>
              <button
                className="icon-btn"
                title="Synchroniser le journal"
                aria-label="Synchroniser le journal"
                onClick={() => void app.sync()}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </header>
          <main id="main-content" tabIndex={-1}>
            <div className="workspace-screen" hidden={Boolean(selected)}>
              <SectionNavigation view={view} onNavigate={go} />
              {data.mode === "demo" && (
                <div className="demo-banner">
                  <span>
                    <span className="demo-indicator" aria-hidden="true" />
                    Démonstration{" "}
                    <span className="demo-detail">
                      {data.trades.length} exécutions · comptes fictifs
                    </span>
                  </span>
                  <button className="text-btn" onClick={() => go("Paramètres")}>
                    Gérer mon espace
                  </button>
                </div>
              )}
              <div className="page-heading">
                <div className="page-title-group">
                  <h1>{screenLabel(view)}</h1>
                  <p className="page-description">{VIEW_DESCRIPTIONS[view]}</p>
                </div>
                <div className="heading-actions">
                  <button
                    className="btn secondary"
                    onClick={() => void exportBackup(data).catch(e => setNotice(String(e)))}
                  >
                    <Download size={16} />
                    Sauvegarde
                  </button>
                  {["Cockpit", "Journal", "Calendrier"].includes(view) && (
                    <button
                      className="btn primary"
                      onClick={() => { setEditingDraft(undefined); setEditorPrefill(undefined); setEditing("new"); }}
                      disabled={!data.accounts.length}
                    >
                      <Plus size={17} />
                      Nouveau trade
                    </button>
                  )}
                </div>
              </div>
              {error && (
                <div className="notice-inline" role="alert">
                  <p>{error}</p>
                  <button
                    className="btn secondary"
                    onClick={() => void app.sync()}
                  >
                    Réessayer
                  </button>
                </div>
              )}
              {app.conflict && (
                <Panel className="conflict-panel">
                  <h2>Une autre copie a modifié le journal.</h2>
                  <p>
                    Le serveur est à la révision {app.conflict.revision}.
                    Exporte la copie de cet appareil avant de choisir. Aucun changement
                    n’a été écrasé automatiquement.
                  </p>
                  <div className="upload-row">
                    <button
                      className="btn secondary"
                      onClick={() => void exportBackup(data).catch(e => setNotice(String(e)))}
                    >
                      Exporter la copie de cet appareil
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => app.resolve(false)}
                    >
                      Récupérer le serveur
                    </button>
                    <button
                      className="btn primary"
                      onClick={async () => {
                        try {await exportBackup(app.conflict!.data);app.resolve(true);}catch(e){setNotice(String(e));}
                      }}
                    >
                      Sauvegarder le serveur puis conserver ma copie
                    </button>
                  </div>
                </Panel>
              )}
              {FILTER_VIEWS.has(view) && (
                <>
                  <div className="cockpit-filter-toolbar product-toolbar">
                    <label className="quick-account">
                      <span>Compte</span>
                      <select
                        aria-label="Compte affiché"
                        value={account}
                        onChange={(event) => setAccount(event.target.value)}
                      >
                        <option value="all">Tous les comptes</option>
                        {data.accounts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {accountLabel(item)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div
                      className="period-switch"
                      role="group"
                      aria-label="Période affichée"
                    >
                      {(
                        [
                          { days: 7, label: "7 jours" },
                          { days: 30, label: "30 jours" },
                          { days: null, label: "Tout" },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          aria-pressed={
                            option.days
                              ? from ===
                                  calendarRange(date, option.days).from &&
                                to === date
                              : !from && !to
                          }
                          onClick={() => applyPeriod(option.days)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn secondary filters-toggle"
                      aria-expanded={filtersOpen}
                      aria-controls="workspace-filters"
                      onClick={() => setFiltersOpen(!filtersOpen)}
                    >
                      <SlidersHorizontal size={16} />
                      Filtres
                      <ChevronDown
                        size={16}
                        className={filtersOpen ? "rotated" : ""}
                      />
                    </button>
                    <span className="filter-context">
                      {from || to
                        ? "Période personnalisée"
                        : "Tout l’historique"}{" "}
                      · {account === "all" ? "Tous les comptes" : a?.name} ·{" "}
                      {tradeCount(filtered.length)}
                    </span>
                    <span className="filter-help">
                      {from || to
                        ? (from ? dateLabel(from) : "Début") +
                          " → " +
                          (to ? dateLabel(to) : "Fin")
                        : "Clôtures · New York"}
                    </span>
                  </div>
                  <div
                    id="workspace-filters"
                    className="filterbar expanded-filters"
                    hidden={!filtersOpen}
                  >
                    <DatePicker
                      label="Du · clôture ET"
                      value={from}
                      onChange={setFrom}
                    />
                    <DatePicker
                      label="Au · clôture ET"
                      value={to}
                      onChange={setTo}
                    />
                    <Field label="Compte">
                      <select
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                      >
                        <option value="all">Tous</option>
                        {data.accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {accountLabel(a)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Instrument">
                      <select
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                      >
                        <option value="all">Tous</option>
                        {Object.keys(data.settings.instruments).map((i) => (
                          <option key={i}>{i}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Setup">
                      <select
                        value={setup}
                        onChange={(e) => setSetup(e.target.value)}
                      >
                        <option value="all">Tous</option>
                        {[...new Set(data.trades.map((t) => t.setup))].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </Field>
                    <Field label="Session">
                      <select
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                      >
                        <option value="all">Toutes</option>
                        {[...new Set(data.trades.map((t) => t.session))].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </Field>
                    <Field label="Timeframe">
                      <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                      >
                        <option value="all">Tous</option>
                        {[...new Set(data.trades.map((t) => t.timeframe))].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </Field>
                    {view === "Journal" && (
                      <div className="filterbar-journal">
                        <Field label="Recherche">
                          <input
                            type="search"
                            value={search}
                            placeholder="Instrument ou setup…"
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </Field>
                        <div className="field">
                          <span>Résultat</span>
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
                                aria-pressed={
                                  journalOptions.result === item.value
                                }
                                onClick={() =>
                                  setJournalOptions((current) => ({
                                    ...current,
                                    result: item.value,
                                    streak: "all",
                                  }))
                                }
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Field label="Respect du plan">
                          <select
                            value={journalOptions.plan}
                            onChange={(e) =>
                              setJournalOptions((current) => ({
                                ...current,
                                plan: e.target.value as JournalOptions["plan"],
                              }))
                            }
                          >
                            <option value="all">Tous les statuts</option>
                            <option value="respected">Plan respecté</option>
                            <option value="offplan">Hors plan</option>
                            <option value="unknown">Non renseigné</option>
                          </select>
                        </Field>
                        <Field label="Motif de clôture">
                          <select
                            value={journalOptions.exitReason ?? "all"}
                            onChange={(e) =>
                              setJournalOptions((current) => ({
                                ...current,
                                exitReason: e.target.value,
                              }))
                            }
                          >
                            <option value="all">Tous les motifs</option>
                            {Object.entries(EXIT_REASONS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Revue du trade">
                          <select
                            value={journalOptions.review ?? "all"}
                            onChange={(e) =>
                              setJournalOptions((current) => ({
                                ...current,
                                review: e.target
                                  .value as JournalOptions["review"],
                              }))
                            }
                          >
                            <option value="all">Toutes les revues</option>
                            <option value="pending">À revoir</option>
                            <option value="reviewed">Terminées</option>
                          </select>
                        </Field>
                        <Field label="Série maximale">
                          <select value={journalOptions.streak ?? "all"} onChange={e => setJournalOptions(current => ({...current, streak: e.target.value as JournalOptions["streak"], result: "all", inspectedId: undefined}))}>
                            <option value="all">Toutes les exécutions</option>
                            <option value="gain">Série gagnante · première en cas d’égalité</option>
                            <option value="loss">Série perdante · première en cas d’égalité</option>
                          </select>
                        </Field>
                        <SavedJournalViews views={data.savedViews} update={update} autoLoadDefault={!journalFocus}
                          filters={{search, sort, result: journalOptions.result, plan: journalOptions.plan, mode: journalOptions.mode, exitReason: journalOptions.exitReason ?? "all", review: journalOptions.review ?? "all", streak: journalOptions.streak ?? "all", density: journalOptions.density ?? "comfortable", columns: journalOptions.columns.join(","), day: journalOptions.day ?? "", account, symbol, setup, session, timeframe, from, to, riskVerified: String(riskVerified)}}
                          onLoad={f => {
                            setSearch(f.search ?? ""); setSort(f.sort ?? "date"); setJournalFocus(null);
                            setAccount(f.account ?? "all"); setSymbol(f.symbol ?? "all"); setSetup(f.setup ?? "all"); setSession(f.session ?? "all"); setTimeframe(f.timeframe ?? "all"); setFrom(f.from ?? ""); setTo(f.to ?? ""); setRiskVerified(f.riskVerified === "true");
                            setJournalOptions({...DEFAULT_JOURNAL_OPTIONS, result: (f.result as JournalOptions["result"]) ?? "all", plan: (f.plan as JournalOptions["plan"]) ?? "all", mode: (f.mode as JournalOptions["mode"]) ?? "trades", exitReason: f.exitReason ?? "all", review: (f.review as JournalOptions["review"]) ?? "all", streak: (f.streak as JournalOptions["streak"]) ?? "all", density: f.density === "compact" ? "compact" : "comfortable", columns: f.columns === undefined ? DEFAULT_JOURNAL_OPTIONS.columns : DEFAULT_JOURNAL_OPTIONS.columns.filter(c => f.columns.split(",").includes(c)), day: f.day || undefined});
                          }} />
                      </div>
                    )}
                    <button
                      className="text-btn"
                      onClick={() => {
                        const end = new Date(now);
                        const start = new Date(now);
                        start.setDate(start.getDate() - 6);
                        setFrom(nyDate(start.toISOString()));
                        setTo(nyDate(end.toISOString()));
                      }}
                    >
                      7 jours
                    </button>
                    <button
                      className="text-btn"
                      onClick={() => {
                        setFrom(date.slice(0, 7) + "-01");
                        setTo(date);
                      }}
                    >
                      Mois sélectionné
                    </button>
                    <button
                      className="text-btn"
                      onClick={() => {
                        setFrom("");
                        setTo("");
                        setAccount("all");
                        setSymbol("all");
                        setSetup("all");
                        setSession("all");
                        setTimeframe("all");
                      }}
                    >
                      Tout réinitialiser
                    </button>
                    <label className="check-inline">
                      <input
                        type="checkbox"
                        checked={riskVerified}
                        onChange={(e) => setRiskVerified(e.target.checked)}
                      />
                      Exclure les R hypothétiques
                    </label>
                    <span className="filter-summary">
                      {tradeCount(filtered.length)} · sélection
                    </span>
                  </div>
                  <div className="active-filters" aria-label="Filtres actifs">
                    {[
                      {
                        value: symbol,
                        label: "Instrument",
                        clear: () => setSymbol("all"),
                      },
                      {
                        value: setup,
                        label: "Setup",
                        clear: () => setSetup("all"),
                      },
                      {
                        value: session,
                        label: "Session",
                        clear: () => setSession("all"),
                      },
                      {
                        value: timeframe,
                        label: "Timeframe",
                        clear: () => setTimeframe("all"),
                      },
                    ]
                      .filter((item) => item.value !== "all")
                      .map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className="filter-chip"
                          aria-label={"Effacer le filtre " + item.label}
                          onClick={item.clear}
                        >
                          {item.label} : {item.value}
                          <span aria-hidden="true">×</span>
                        </button>
                      ))}
                    {riskVerified && (
                      <button
                        type="button"
                        className="filter-chip"
                        onClick={() => setRiskVerified(false)}
                      >
                        R vérifiés <span aria-hidden="true">×</span>
                      </button>
                    )}
                  </div>
                </>
              )}
              {view === "Cockpit" && (
                <div className="performance-workspace">
                  <div className="performance-content">
                    <div className="metrics-grid cockpit-kpis">
                      <Metric
                        compact
                        label="Performance nette"
                        graphic={<MetricGraphic stats={stats} kind="equity" />}
                        comparison={delta("r")}
                        value={<RollingValue value={stats.r} />}
                        sub={signedMoney(stats.net)}
                        action="Conserve une taille stable et mesure la qualité."
                        tone={stats.r >= 0 ? "positive" : "negative"}
                      />
                      <Metric
                        compact
                        label="Espérance / trade"
                        graphic={<MetricGraphic stats={stats} kind="averages" />}
                        comparison={delta("expectancy")}
                        value={<RollingValue value={stats.expectancy} />}
                        sub={`Profit factor ${stats.profitFactor === null ? "— (pas de pertes)" : num(stats.profitFactor)}`}
                        action="Privilégie les configurations documentées."
                      />
                      <Metric
                        compact
                        label="Taux de réussite"
                        graphic={<MetricGraphic stats={stats} kind="outcomes" />}
                        comparison={delta("winRate", "points")}
                        value={
                          <RollingValue
                            value={stats.winRate * 100}
                            format="percent"
                          />
                        }
                        sub={`${tradeCount(stats.count)}, neutres inclus`}
                        action="Lis ce taux avec le gain et la perte moyens."
                      />
                      <Metric
                        compact
                        label="Drawdown maximal"
                        graphic={<MetricGraphic stats={stats} kind="drawdown" />}
                        comparison={delta("drawdown", "usd")}
                        value={
                          <RollingValue value={stats.drawdown} format="usd" />
                        }
                        sub="Équité clôturée · historique filtré"
                        action="Garde une marge sous le seuil du compte."
                      />
                    </div>

                    {instrumentResults.length > 0 && <section className="market-section" aria-label="Résultats par instrument">
                      <h2>Instruments</h2>
                      <div className="asset-strip">{instrumentResults.map(group =>
                        <button key={group.label} type="button" onClick={() => openJournal({label: group.label, ids: filtered.filter(trade => trade.instrument === group.label).map(trade => trade.id)})}>
                          <InstrumentMark symbol={group.label} /><span><strong>{group.label}</strong><small>{tradeCount(group.count)}</small></span>
                          <span className={group.net < 0 ? "negative" : "positive"}>{signedMoney(group.net)}</span>
                        </button>
                      )}</div>
                    </section>}
                    <Panel className="equity-panel cockpit-equity">
                      <div className="panel-heading">
                        <div>
                          <h2>Courbe d’équité</h2>
                        </div>
                        <div className="period-switch" role="group" aria-label="Unité de la courbe d’équité">
                          {(["r", "net"] as const).map(unit => (
                            <button type="button" key={unit} className={equityUnit === unit ? "active" : ""}
                              disabled={unit === "r" && !stats.riskCount} aria-pressed={equityUnit === unit} onClick={() => setEquityUnit(unit)}>
                              {unit === "r" ? "R cumulés" : "$ cumulés"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="equity-coverage">Risque initial renseigné sur {stats.riskCount} / {tradeCount(stats.count)}.</p>
                      <div className="equity-summary">
                        <strong className="mono key-r">
                          <RollingValue value={stats[equityUnit]} format={equityUnit === "net" ? "usd" : "r"} />
                        </strong>
                        <span
                          className={stats.net >= 0 ? "positive" : "negative"}
                        >
                          {equityUnit === "r" ? signedMoney(stats.net) + " net" : stats.riskCount ? r(stats.r) : "R indisponible"}
                        </span>
                      </div>
                      <Equity trades={filtered} unit={equityUnit} animated onDay={inspectDay} />
                      <div className="chart-foot">
                        <span>Résultats clôturés · New York</span>
                        <SessionPicker days={days} onDay={inspectDay} />
                        <button
                          className="text-btn"
                          onClick={() => go("Analytiques")}
                        >
                          Analytiques <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </Panel>
                    <Panel className="recent-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Dernières exécutions</h2>
                        </div>
                        <button
                          className="text-btn"
                          onClick={() => go("Journal")}
                        >
                          Tout le journal <ArrowUpRight size={15} />
                        </button>
                      </div>
                      <TradeTable
                        columns={["setup", "plan"]}
                        trades={[...filtered]
                          .sort((a, b) => b.exitedAt.localeCompare(a.exitedAt))
                          .slice(0, 3)}
                        onOpen={openTrade}
                      />
                    </Panel>
                  </div>
                  <aside
                    className="performance-rail"
                    aria-label="Risque et préparation de la séance"
                  >
                    <Panel
                      className={
                        "session-command" +
                        (guard?.locked ? " session-locked" : "")
                      }
                    >
                      <div className="session-command-head">
                        <div>
                          <h2>Séance</h2>
                          <div className="session-account">
                            <span>Compte de risque</span>
                            <strong title={a ? accountLabel(a) : undefined}>
                              {a ? accountLabel(a) : "Aucun compte configuré"}
                            </strong>
                          </div>
                        </div>
                        <DatePicker
                          label="Séance · New York"
                          value={date}
                          onChange={(v) => setDate(v || todayDate())}
                          clearable={false}
                        />
                      </div>
                      <div className="session-command-body">
                        <div className="session-pnl">
                          <div className="session-pnl-top">
                            <span className="eyebrow">Résultat clôturé</span>
                            <span className="session-trade-count">
                              {tradeCount(today.count)}
                            </span>
                          </div>
                          <strong
                            className={
                              "mono key-r " +
                              (today.net >= 0 ? "positive" : "negative")
                            }
                          >
                            <RollingValue value={today.r} />
                          </strong>
                          <p>{signedMoney(today.net)}</p>
                        </div>
                        <div className="session-risk">
                          {prop && a ? (
                            <>
                              <div className="risk-available">
                                <span>Risque journalier restant</span>
                                <strong className="mono">
                                  <RollingValue
                                    value={prop.dailyRemaining}
                                    format="usd"
                                  />
                                </strong>
                              </div>
                              <div
                                className="risk-ladder"
                                data-low={
                                  prop.dailyRemaining / a.dailyLossLimit < 0.25
                                    ? "true"
                                    : undefined
                                }
                                role="meter"
                                aria-label="Budget journalier restant avant la limite"
                                aria-valuemin={0}
                                aria-valuemax={a.dailyLossLimit}
                                aria-valuenow={Math.max(
                                  0,
                                  Math.min(
                                    a.dailyLossLimit,
                                    prop.dailyRemaining,
                                  ),
                                )}
                                aria-valuetext={`${money(prop.dailyRemaining)} disponibles ; limite initiale ${money(a.dailyLossLimit)}`}
                              >
                                <div className="risk-ladder-track">
                                  <span
                                    className="risk-ladder-fill"
                                    style={{
                                      width: `${Math.max(0, Math.min(100, (prop.dailyRemaining / a.dailyLossLimit) * 100))}%`,
                                    }}
                                  />
                                  <span
                                    className="risk-ladder-marker"
                                    style={{
                                      left: `${Math.max(0, Math.min(100, (prop.dailyRemaining / a.dailyLossLimit) * 100))}%`,
                                    }}
                                  />
                                </div>
                                <div className="risk-ladder-scale">
                                  <span>0 $</span>
                                  <span>{money(a.dailyLossLimit)}</span>
                                </div>
                              </div>
                              <div className="session-risk-facts">
                                <div>
                                  <span>Distance au drawdown</span>
                                  <strong className="mono">
                                    {money(prop.remaining)}
                                  </strong>
                                </div>
                                <div>
                                  <span>Trades restants</span>
                                  <strong className="mono">
                                    {tradeCount(
                                      Math.max(
                                        0,
                                        (plan?.maxTrades ??
                                          data.rules.find(
                                            (r) => r.accountId === a.id,
                                          )?.maxTrades ??
                                          5) - prop.today.count,
                                      ),
                                    )}
                                  </strong>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="muted">
                              Configure un compte pour afficher son budget de
                              risque.
                            </p>
                          )}
                        </div>
                        <div className="session-readiness">
                          <div
                            className={
                              "readiness-state" +
                              (plan?.validatedAt ? " is-valid" : "")
                            }
                          >
                            <ShieldCheck size={16} aria-hidden="true" />
                            <div>
                              <span>Préparation de la séance</span>
                              <strong>
                                {plan?.validatedAt ? "Validée" : "À compléter"}
                              </strong>
                            </div>
                            <span className="prep-count">{planDone}/6</span>
                          </div>
                          <div className="prep-meter" aria-hidden="true">
                            {Array.from({ length: 6 }, (_, index) => (
                              <span
                                key={index}
                                data-on={
                                  plan?.checks[index] ? "true" : undefined
                                }
                              />
                            ))}
                          </div>
                          <button
                            className="btn secondary full session-prep-btn"
                            onClick={() => go("Plan & revue")}
                          >
                            Revoir la préparation <ArrowUpRight size={15} />
                          </button>
                          {a && (
                            <button
                              className={
                                "session-guard-link" +
                                (guard?.locked ? " is-locked" : "")
                              }
                              onClick={() => setGuardAccount(a.id)}
                            >
                              <ShieldCheck size={14} aria-hidden="true" />
                              {guard?.locked
                                ? "Lock Guard actif · ouvrir la pause"
                                : "Lock Guard · limites"}
                            </button>
                          )}
                          <details className="guard-help">
                            <summary>À propos du Lock Guard</summary>
                            <p>
                              Lock Guard suit la date réelle. Le journal ne
                              bloque pas les ordres du courtier.
                            </p>
                          </details>
                        </div>
                      </div>
                    </Panel>
                    <Panel className="next-action glass-card">
                      <div className="next-action-heading">
                        <span className="action-icon">
                          <MessageSquare size={16} aria-hidden="true" />
                        </span>
                        <h2>Prochaine action</h2>
                      </div>
                      <span className="coach-scope">
                        Briefing sur {tradeCount(stats.count)}
                      </span>
                      <p>{summary.action}</p>
                      <div className="session-actions">
                      {pendingReviews.length > 0 && <button className="btn primary full" onClick={() => {
                        openTrade(pendingReviews[0], pendingReviews); setGuided(true);
                      }}><span>Revoir {tradeCount(pendingReviews.length)}<small>{dateLabel(date)}</small></span><ArrowRight size={16} aria-hidden="true" /></button>}
                      <button
                        className={`btn full ${pendingReviews.length ? "secondary" : "primary"}`}
                        onClick={() => go("Plan & revue")}
                      >
                        Préparer la séance <ArrowUpRight size={16} />
                      </button>
                      </div>
                      <div className="session-analysis-links">
                      <button
                        className="text-btn"
                        onClick={() => go("Leak Finder")}
                      >
                        Comprendre mes fuites <ArrowRight size={15} />
                      </button>
                      <button
                        className="text-btn coach-loss-link"
                        disabled={
                          !filtered.some(
                            (trade) => calculateTrade(trade).net < 0,
                          )
                        }
                        onClick={() =>
                          openJournal({
                            label: "Exécutions perdantes",
                            result: "loss",
                          })
                        }
                      >
                        Revoir les pertes{" "}
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                      </div>
                    </Panel>
                  </aside>
                  <div className="performance-secondary">
                    <ResultsByPeriod
                      trades={filtered}
                      onInspect={openJournal}
                    />
                    <Distribution trades={filtered} onInspect={openJournal} />
                  </div>
                  <div className="bottom-grid cockpit-bottom">
                    <Panel>
                      <div className="panel-heading">
                        <div>
                          <h2>Dernières séances</h2>
                        </div>
                        <button
                          className="text-btn"
                          onClick={() => go("Calendrier")}
                        >
                          Calendrier <ArrowUpRight size={14} />
                        </button>
                      </div>
                      <div className="session-grid">
                        {Object.entries(days)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .slice(-5)
                          .map(([d, x]) => (
                            <button
                              key={d}
                              className={
                                "session-tile " + (x.r >= 0 ? "win" : "loss")
                              }
                              onClick={() => {
                                setDate(d);
                                go("Calendrier");
                              }}
                            >
                              <small>
                                {d.slice(8)}/{d.slice(5, 7)}
                              </small>
                              <strong className="mono">{r(x.r)}</strong>
                              <span>{tradeCount(x.count)}</span>
                            </button>
                          ))}
                      </div>
                      {!filtered.length && (
                        <Empty text="Ajoute un trade ou importe ton historique." />
                      )}
                    </Panel>
                    <Panel className="routine-panel cockpit-discipline">
                      <div className="panel-heading">
                        <div>
                          <h2>Respect du plan</h2>
                        </div>
                        <div
                          className="discipline-circle"
                          role="img"
                          aria-label={`Discipline déclarée : ${discipline} sur 100`}
                          style={{
                            background: `conic-gradient(var(--accent) ${discipline}%,#ffffff0f 0)`,
                          }}
                        >
                          <span aria-hidden="true">
                            <RollingValue value={discipline} format="integer" />
                            <small>/100</small>
                          </span>
                        </div>
                      </div>
                      <p className="muted">
                        Moyenne du respect du plan déclaré.{" "}
                        {plan?.checks.filter(Boolean).length ?? 0}/6 points de
                        préparation sur la séance sélectionnée.
                      </p>
                      <button
                        className="text-btn accent-text"
                        onClick={() => go("Plan & revue")}
                      >
                        Ouvrir la préparation <ArrowRight size={16} />
                      </button>
                    </Panel>
                  </div>
                </div>
              )}
              {view === "Journal" && (
                <>
                {!!data.drafts.length && <Panel className="pending-trades"><h2>Positions ouvertes et brouillons</h2><p className="muted">Ces éléments sont exclus du résultat clôturé.</p>{data.drafts.map(d => <button className="draft-item" key={d.id} onClick={() => {setEditingDraft(d); setEditing(d.sourceTradeId ? data.trades.find(t => t.id === d.sourceTradeId) ?? "new" : "new");}}><span>{d.status === "OPEN" ? "Ouvert" : "Brouillon"}</span><strong>{d.values.instrument} · {d.values.direction === "SHORT" ? "Vente" : "Achat"}</strong><small>{data.accounts.find(a => a.id === d.accountId)?.name} · {d.values.setup || "Contexte à compléter"}</small><b>Reprendre →</b></button>)}</Panel>}
                <JournalWorkspace
                  journal={data}
                  onDelete={(trade) => void removeTrade(trade)}
                  onEdit={(trade) => {setEditingDraft(undefined); setEditing(trade);}}
                  onReview={(day) => {
                    setDate(day);
                    go("Plan & revue");
                  }}
                  streakTrades={journalBase.filter(t => !journalOptions.day || nyDate(t.exitedAt) === journalOptions.day)}
                  trades={journalVisible}
                  total={journalBase.length}
                  options={journalOptions}
                  onOptions={setJournalOptions}
                  search={search}
                  onSearch={setSearch}
                  sort={sort}
                  onSort={setSort}
                  focus={journalFocus}
                  onReturn={returnFromJournal}
                  onClearFocus={restoreJournal}
                  onScope={openJournal}
                  onOpen={openTrade}
                />
                </>
              )}
              {view === "Analytiques" && (
                <Analytics
                  onInspect={openJournal}
                  trades={filtered}
                  minSample={data.settings.minSample}
                />
              )}
              {view === "Calendrier" && (
                <Calendar
                  onInspect={openJournal}
                  trades={filtered}
                  date={date}
                  onDate={setDate}
                  onOpen={openTrade}
                />
              )}
              {view === "Leak Finder" && (
                <Leaks
                  trades={filtered}
                  minSample={data.settings.minSample}
                  onInspect={openJournal}
                />
              )}
              {view === "Comptes" && <Accounts at={asOf} />}
              {view === "Plan & revue" && (
                <SessionRoutine date={date} onDate={setDate} />
              )}
              {view === "Playbook" && <Playbook />}
              {view === "Objectifs" && <Goals />}
              {view === "Coach" && <Coach trades={filtered} scope={[account === "all" ? "Tous les comptes" : a?.name, (from || "Début")+" au "+(to || "aujourd’hui"),symbol,setup,session,timeframe].filter(x=>x&&x!=="all").join(" · ")}/>}
              {view === "Calculateur" && <Calculator initialAccountId={account === "all" ? undefined : account} onPrepare={values => {setEditingDraft(undefined); setEditorPrefill(values); setEditing("new");}}/>}
              {view === "Rapports" && (
                <Reports
                  trades={filtered}
                  label={
                    (from || "Début") + " → " + (to || "fin de l’historique")
                  }
                />
              )}
              {view === "Import" && <ImportTrades />}
              {view === "Paramètres" && <SettingsPanel />}
              <footer>
                <span>
                  <Activity size={13} />
                  EDGE / Journal de trading
                </span>
                <span>Clôtures en heure de New York</span>
              </footer>
            </div>
            {selected && (
              <TradeDetail
                key={selected.id}
                onCompleteReview={guided ? notes => {
                  update(j => {
                    const trade = j.trades.find(t => t.id === selected.id);
                    if (trade) { trade.notes = notes; trade.reviewStatus = "REVIEWED"; }
                  });
                  const next = detailSequence.find(t => t.id !== selected.id && t.reviewStatus !== "REVIEWED");
                  if (next) {setSelected(next); window.scrollTo({top:0,behavior:"instant"});}
                  else {closeTrade(); setNotice("Revue de séance terminée.");}
                } : undefined}
                accountName={
                  data.accounts.find(
                    (account) => account.id === selected.accountId,
                  )?.name ?? "Compte non renseigné"
                }
                contextLabel={
                  guided ? "Revue de séance · " + dateLabel(date) : journalFocus?.label ??
                  (view === "Journal" ? "Journal · sélection active" : view)
                }
                position={detailPosition}
                count={detailSequence.length}
                onPrevious={
                  detailPosition > 0
                    ? () => setSelected(detailSequence[detailPosition - 1])
                    : undefined
                }
                onNext={
                  detailPosition >= 0 &&
                  detailPosition < detailSequence.length - 1
                    ? () => setSelected(detailSequence[detailPosition + 1])
                    : undefined
                }
                onSession={() => inspectDay(nyDate(selected.exitedAt))}
                onReview={() => {
                  setDate(nyDate(selected.exitedAt));
                  setSelected(null);
                  go("Plan & revue");
                }}
                trade={
                  data.trades.find((t) => t.id === selected.id) ?? selected
                }
                onClose={closeTrade}
                onEdit={() => {
                  setEditing(selected);
                }}
                onDelete={() => void removeTrade(selected)}
              />
            )}
          </main>
        </div>
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button
              aria-label="Fermer la notification"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}
        {editing && (
          <TradeEditor
            key={editingDraft?.id ?? (editing === "new" ? "new" : editing.id)}
            journal={data}
            trade={editing === "new" ? undefined : editing}
            draft={editingDraft}
            prefill={editing === "new" && !editingDraft ? editorPrefill : undefined}
            initialAccountId={account === "all" ? undefined : account}
            onDraft={draft => update(j => {const index = j.drafts.findIndex(d => d.id === draft.id); if (index >= 0) j.drafts[index] = draft; else j.drafts.push(draft);})}
            onDiscardDraft={id => update(j => {j.drafts = j.drafts.filter(d => d.id !== id);})}
            onClose={() => {setEditing(null); setEditingDraft(undefined);}}
            onSave={saveTrade}
          />
        )}{" "}
        {guardAccount && (
          <Guard
            accountId={guardAccount}
            onClose={() => setGuardAccount(null)}
          />
        )}
      </div>
    </MotionConfig>
  );
}
export function Equity({
  trades,
  unit = "r",
  animated = false,
  onDay,
}: {
  trades: Trade[];
  unit?: "r" | "net";
  animated?: boolean;
  onDay?: (day: string) => void;
}) {
  const reduced = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const days = groupByDay(trades);
  let cumulative = 0;
  const points = [
    { date: "Départ", value: 0 },
    ...Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        value: (cumulative += d[unit]),
      })),
  ];
  return (
    <div
      className={"chart" + (animated ? " equity-chart-animated" : "")}
      role="img"
      aria-label={`Courbe du résultat cumulé des trades clôturés, en ${unit === "r" ? "R-multiples" : "dollars"}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          onClick={(state) => {
            const point = points[Number(state.activeTooltipIndex)];
            if (onDay && point && point.date !== "Départ") onDay(point.date);
          }}
          margin={{ left: 0, right: 18, top: 14, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.38} />
              <stop offset="65%" stopColor="var(--accent)" stopOpacity={0.09} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#ffffff0a"
            strokeDasharray="3 6"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(date: string) =>
              date === "Départ" ? date : date.slice(8) + "/" + date.slice(5, 7)
            }
            axisLine={false}
            tickLine={false}
            minTickGap={45}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
          />
          <YAxis
            width={unit === "net" ? 80 : 60}
            tickFormatter={(v: number) => v.toLocaleString("fr-FR") + (unit === "r" ? "R" : " $")}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-raised)",
              border: "1px solid #ffffff1f",
              color: "var(--text)",
            }}
            labelFormatter={(date) =>
              date === "Départ"
                ? "Départ"
                : String(date).split("-").reverse().join("/")
            }
            formatter={(v) => [unit === "r" ? r(Number(v)) : signedMoney(Number(v)), "Résultat cumulé"]}
            cursor={{ stroke: "var(--accent)", strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={3}
            activeDot={{
              r: 6,
              fill: "var(--accent)",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
            fill={"url(#" + gradientId + ")"}
            isAnimationActive={animated && !reduced}
            animationDuration={1100}
            animationEasing="ease-out"
            dot={
              animated
                ? (props: { cx?: number; cy?: number; index?: number }) =>
                    props.index === points.length - 1 ? (
                      <circle
                        className="equity-end-dot"
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill="var(--accent)"
                        stroke="var(--surface)"
                        strokeWidth={2}
                      />
                    ) : (
                      <g />
                    )
                : false
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function Analytics({
  trades,
  minSample,
  onInspect,
}: {
  trades: Trade[];
  minSample: number;
  onInspect?: (scope: JournalScope) => void;
}) {
  const stats = useMemo(() => summarize(trades), [trades]);
  const history = useMemo(() => {
    let peak = 0, peakR = 0;
    return [{ date: "Départ", equity: 0, drawdown: 0, r: 0, drawdownR: 0 }, ...stats.curve.map(point => {
      peak = Math.max(peak, point.usd);
      peakR = Math.max(peakR, point.r);
      return { date: point.date, equity: point.usd, drawdown: point.usd - peak, r: point.r, drawdownR: point.r - peakR };
    })];
  }, [stats]);
  const monthFormat = useMemo(() => new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }), []);
  const monthly = useMemo(() => {
    const rows = new Map<string, { month: string; label: string; net: number; r: number; count: number; rated: number; wins: number; ids: string[] }>();
    for (const trade of trades) {
      const month = nyDate(trade.exitedAt).slice(0, 7);
      const metrics = calculateTrade(trade);
      const row = rows.get(month) ?? {
        month,
        label: monthFormat.format(new Date(month + "-01T12:00:00Z")),
        net: 0,
        r: 0,
        count: 0,
        rated: 0,
        wins: 0,
        ids: [],
      };
      row.net += metrics.net;
      row.r += metrics.realizedR;
      row.count += 1;
      row.ids.push(trade.id);
      if (metrics.riskKnown) row.rated += 1;
      if (metrics.net > 0) row.wins += 1;
      rows.set(month, row);
    }
    return [...rows.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [trades, monthFormat]);
  const weekdayRows = useMemo(() => {
    const rows = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].map(label => ({
      label, net: 0, r: 0, count: 0, rated: 0, wins: 0, ids: [] as string[],
    }));
    for (const trade of trades) {
      const date = new Date(nyDate(trade.exitedAt) + "T12:00:00Z");
      const row = rows[(date.getUTCDay() + 6) % 7];
      const metrics = calculateTrade(trade);
      row.net += metrics.net;
      row.r += metrics.realizedR;
      row.count += 1;
      row.ids.push(trade.id);
      if (metrics.riskKnown) row.rated += 1;
      if (metrics.net > 0) row.wins += 1;
    }
    return rows.slice(0, 5).concat(rows.slice(5).filter(row => row.count > 0));
  }, [trades]);
  const bestWeekday = weekdayRows.reduce((best, row) => row.net > best.net ? row : best, weekdayRows[0]);
  const bestWeekdayR = weekdayRows.reduce((best, row) => row.r > best.r ? row : best, weekdayRows[0]);
  const resultDistribution = useMemo(() => {
    const rows = [
      { label: "≤ −2R", count: 0, ids: [] as string[] },
      { label: "−2 à −1R", count: 0, ids: [] as string[] },
      { label: "−1 à 0R", count: 0, ids: [] as string[] },
      { label: "0 à 1R", count: 0, ids: [] as string[] },
      { label: "1 à 2R", count: 0, ids: [] as string[] },
      { label: "≥ 2R", count: 0, ids: [] as string[] },
    ];
    for (const trade of trades) {
      const metrics = calculateTrade(trade);
      if (!metrics.riskKnown) continue;
      const value = metrics.realizedR;
      const index = value <= -2 ? 0 : value <= -1 ? 1 : value < 0 ? 2 : value < 1 ? 3 : value < 2 ? 4 : 5;
      rows[index].count += 1;
      rows[index].ids.push(trade.id);
    }
    return rows;
  }, [trades]);
  const sessionRows = useMemo(() =>
    breakdown(trades, (trade) => trade.session?.trim() || "Non renseigné", 0)
      .map((group) => ({ ...group, winRatePct: group.winRate * 100 }))
      .sort((a, b) => b.winRatePct - a.winRatePct),
  [trades]);
  const planPoints = useMemo(() => trades.flatMap((trade) => {
    if (!isPlanRated(trade)) return [];
    const metrics = calculateTrade(trade);
    if (!metrics.riskKnown) return [];
    return [{
      id: trade.id,
      score: trade.planScore!,
      r: metrics.realizedR,
      net: metrics.net,
      instrument: trade.instrument,
      setup: trade.setup,
    }];
  }), [trades]);
  const [dimension, setDimension] = useState("session");
  const [view, setView] = useState<"overview" | "wins" | "compare">(
    "overview",
  );
  const [resultUnit, setResultUnit] = useState<"net" | "r">("net");
  const hourFormat = useMemo(() => new Intl.DateTimeFormat("fr-FR", {
    timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23",
  }), []);
  const keys: Record<string, (t: Trade) => string> = {
    instrument: (t) => t.instrument.trim() || "Non renseigné",
    setup: (t) => t.setup.trim() || "Non renseigné",
    timeframe: (t) => t.timeframe.trim() || "Non renseigné",
    heure: (t) => hourFormat.format(new Date(t.enteredAt)).slice(0, 2) + " h",
    session: (t) => t.session?.trim() || "Non renseigné",
    marché: (t) => (t.category ?? INSTRUMENTS[t.instrument]?.category) === "FUTURE" ? "Futures" : t.category ?? INSTRUMENTS[t.instrument]?.category ?? "Non renseigné",
    jour: (t) => nyDate(t.exitedAt),
    semaine: (t) => {
      const d = new Date(nyDate(t.exitedAt) + "T12:00Z");
      const day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() - day + 1);
      return d.toISOString().slice(0, 10);
    },
    mois: (t) => nyDate(t.exitedAt).slice(0, 7),
    confluence: (t) => [...t.confluences].sort().join(" + ") || "Aucune",
    "motif de sortie": (t) => EXIT_REASONS[t.exitReason ?? "UNKNOWN"],
    "respect du plan": (t) => !isPlanRated(t) ? "Non renseigné" : t.planScore! >= 8 ? "Respecté" : "Hors plan",
    "état de revue": (t) => t.reviewStatus === "REVIEWED" ? "Revue terminée" : "À revoir",
  };
  const labels: Record<string, string> = { instrument: "Instrument", setup: "Setup", timeframe: "Unité de temps", heure: "Heure d’entrée", session: "Session" };
  const groups = breakdown(trades, keys[dimension], minSample).sort((a, b) =>
    dimension === "heure" ? a.label.localeCompare(b.label) : b[resultUnit] - a[resultUnit]);
  const scale = Math.max(1, ...groups.map(group => Math.abs(group[resultUnit])));
  const setups = breakdown(trades, (t) => t.setup, minSample);
  const execution = executionAnalysis(trades);
  const resultStats = useMemo(() => {
    const metrics = trades.map(calculateTrade);
    const rated = metrics.filter((metric) => metric.riskKnown);
    const wins = metrics.filter((metric) => metric.net > 0);
    const losses = metrics.filter((metric) => metric.net < 0);
    let peakR = 0, drawdownR = 0;
    for (const point of stats.curve) {
      peakR = Math.max(peakR, point.r);
      drawdownR = Math.max(drawdownR, peakR - point.r);
    }
    return {
      rated: rated.length,
      drawdownR,
      averageWinNet: wins.length ? wins.reduce((sum, metric) => sum + metric.net, 0) / wins.length : 0,
      averageLossNet: losses.length ? losses.reduce((sum, metric) => sum + metric.net, 0) / losses.length : 0,
      bestR: rated.length ? Math.max(...rated.map((metric) => metric.realizedR)) : 0,
      worstR: rated.length ? Math.min(...rated.map((metric) => metric.realizedR)) : 0,
    };
  }, [trades, stats]);
  const quality = useMemo(() => {
    const checks: { label: string; note: string; test: (trade: Trade) => boolean }[] = [
      { label: "Risque inconnu", note: "Stop ou risque non renseigné", test: (trade) => !calculateTrade(trade).riskKnown },
      { label: "Stop absent", note: "Aucun stop enregistré", test: (trade) => !(trade.stop > 0) },
      { label: "Setup manquant", note: "Contexte non renseigné", test: (trade) => !trade.setup.trim() },
      { label: "État mental manquant", note: "Ressenti non renseigné", test: (trade) => !trade.mentalBefore.trim() },
      { label: "Motif de sortie inconnu", note: "TP, SL, BE… non renseigné", test: (trade) => (trade.exitReason ?? "UNKNOWN") === "UNKNOWN" },
      { label: "Revue en attente", note: "Trade non revu", test: (trade) => trade.reviewStatus !== "REVIEWED" },
    ];
    return checks.map((check) => {
      const ids = trades.filter(check.test).map((trade) => trade.id);
      return { ...check, count: ids.length, ids };
    });
  }, [trades]);
  const qualityGaps = useMemo(() => new Set(quality.flatMap((item) => item.ids)).size, [quality]);
  function inspectContext(label: string) {
    onInspect?.({
      label: "Analyse · " + label,
      ids: trades
        .filter((trade) => keys[dimension](trade) === label)
        .map((trade) => trade.id),
    });
  }
  return (
    <>
      <div className="analysis-views">
        <div className="analysis-views-main">
        <Tabs
          id="analysis-view"
          label="Vue de l’analyse"
          value={view}
          options={[
            { value: "overview", label: "Vue d’ensemble" },
            { value: "wins", label: "Gains vs pertes" },
            { value: "compare", label: "Comparer" },
          ]}
          onChange={setView}
        />
        {view === "overview" && <div className="analysis-unit">
          <span>Unité</span>
          <div role="group" aria-label="Unité des résultats">
            <button type="button" aria-pressed={resultUnit === "net"} onClick={() => setResultUnit("net")}>$</button>
            <button type="button" aria-pressed={resultUnit === "r"} onClick={() => setResultUnit("r")}>R</button>
          </div>
        </div>}
        </div>
        <p className="footnote">
          {view === "overview"
            ? "Graphiques et repères de la sélection."
            : view === "wins"
              ? "Ce qui distingue les trades gagnants des perdants."
              : "Deux sous-ensembles de la sélection, côte à côte."}
        </p>
      </div>
      {view === "overview" && (
        <>
      <div className="metrics-grid">
        <Metric
          label="Drawdown max. de clôture"
          graphic={<MetricGraphic stats={stats} kind="drawdown" />}
          value={resultUnit === "net" ? money(stats.drawdown) : r(resultStats.drawdownR)}
          action="Garde une marge sous le seuil du compte."
        />
        <Metric
          label="Gain moyen / perte moyenne"
          graphic={<MetricGraphic stats={stats} kind="averages" />}
          value={resultUnit === "net" ? signedMoney(resultStats.averageWinNet) : r(stats.averageWinR)}
          sub={(resultUnit === "net" ? signedMoney(resultStats.averageLossNet) : r(stats.averageLossR)) + " sur les perdants"}
          action="Respecte ton risque initial sur chaque trade."
        />
        <Metric
          label="Plus gros gain / perte"
          graphic={<MetricGraphic stats={stats} kind="extremes" />}
          value={resultUnit === "net" ? money(stats.best) : r(resultStats.bestR)}
          sub={resultUnit === "net" ? money(stats.worst) : r(resultStats.worstR)}
          action="Vérifie si ta taille est cohérente entre trades."
        />
        <Metric
          label="Séries max. gains / pertes"
          graphic={<MetricGraphic stats={stats} kind="streaks" />}
          value={stats.maxWinStreak + " / " + stats.maxLossStreak}
          action="Prépare une pause avant la prochaine dérive."
        />
      </div>
      <div className="analysis-history">
        {(["equity", "drawdown"] as const).map(key => {
          const equity = key === "equity";
          const inR = resultUnit === "r";
          const title = equity
            ? (inR ? "R cumulés" : "Courbe d’équité")
            : (inR ? "Drawdown en R" : "Drawdown");
          const subtitle = equity
            ? (inR ? "R cumulés depuis le début de la sélection · risque renseigné" : "Résultat net cumulé depuis le début de la sélection ($)")
            : (inR ? "Recul depuis le plus haut R cumulé de la sélection" : "Recul depuis le plus haut résultat clôturé de la sélection ($)");
          const dataKey = equity ? (inR ? "r" : "equity") : (inR ? "drawdownR" : "drawdown");
          const color = equity ? "var(--green)" : "var(--red)";
          return <Panel key={key}>
            <h2>{title}</h2>
            <p className="footnote">{subtitle}</p>
            {stats.count ? <div className="chart" role="img" aria-label={title + (inR ? " en R, par clôture" : " en dollars, par clôture")}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 12, bottom: 4, left: 0, right: 15 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                  <XAxis dataKey="date" minTickGap={40} tickFormatter={date => date === "Départ" ? date : date.slice(8) + "/" + date.slice(5, 7)} tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={equity ? ["auto", "auto"] : ["auto", 0]} width={54} tickFormatter={(value) => {
                    const n = Number(value);
                    return inR ? num(n, 1) + "R" : (Math.abs(n) >= 1000 ? Math.round(n / 1000) + "k" : Math.round(n)) + " $";
                  }} tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  {!equity && <ReferenceLine y={0} stroke="var(--border-strong)" />}
                  <Tooltip formatter={value => [inR ? r(Number(value)) : money(Number(value)), title]} contentStyle={{background: "var(--surface)", borderColor: "var(--border-strong)"}} />
                  <Area type="linear" dataKey={dataKey} stroke={color} strokeWidth={2} fill={color} fillOpacity={0.15} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
                        </div> : <p className="empty">Aucun trade clôturé sur cette sélection.</p>}</Panel>;
        })}
      </div>
      <Panel className="analysis-chart-card monthly-performance">
        <div className="panel-heading">
          <div>
            <h2>Performance mensuelle</h2>
            <p className="footnote">{resultUnit === "net" ? "Résultat net de chaque mois après frais · filtres actifs · clôtures New York." : "R cumulés par mois · risque renseigné sur " + tradeCount(stats.riskCount) + " / " + tradeCount(stats.count) + " trades."}</p>
          </div>
          {monthly.length > 0 && <div className="plot-readout"><small>{resultUnit === "net" ? "Net sur la période" : "R cumulés"}</small><strong>{resultUnit === "net" ? signedMoney(monthly.reduce((sum, row) => sum + row.net, 0)) : r(monthly.reduce((sum, row) => sum + row.r, 0))}</strong></div>}
        </div>
        {monthly.length ? (
          <div className="chart chart-drill" role="img" aria-label={resultUnit === "net" ? "Résultat net par mois" : "R cumulés par mois"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis tickFormatter={(value) => resultUnit === "net" ? (Math.abs(Number(value)) >= 1000 ? Math.round(Number(value) / 1000) + "k$" : Math.round(Number(value)) + "$") : num(Number(value), 1) + "R"} tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
                <Tooltip
                  cursor={{ fill: "#ffffff04" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as (typeof monthly)[number];
                    return <div className="chart-tooltip">
                      <strong>{row.label}</strong>
                      <p>Résultat net <b className="mono">{signedMoney(row.net)}</b></p>
                      {row.rated > 0 && <p>R cumulés <b className="mono">{r(row.r)}</b>{row.rated < row.count ? " · " + row.rated + "/" + row.count + " risqués" : ""}</p>}
                      <p>{tradeCount(row.count)} · {num(row.wins / row.count * 100, 1)} % de réussite</p>
                    </div>;
                  }}
                />
                <ReferenceLine y={0} stroke="var(--muted)" strokeOpacity={0.65} />
                <Bar dataKey={resultUnit === "net" ? "net" : "r"} radius={[3, 3, 0, 0]} maxBarSize={58} isAnimationActive={false} onClick={(entry: unknown) => {
                  const row = (entry as { payload?: (typeof monthly)[number] })?.payload;
                  if (row?.ids.length) onInspect?.({ label: "Analyse · " + row.label, ids: row.ids });
                }}>
                  {monthly.map((row) => <Cell key={row.month} fill={row[resultUnit] >= 0 ? "var(--green)" : "var(--red)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="empty">Aucun mois clôturé sur cette sélection.</p>}
        {monthly.length > 0 && <details className="monthly-performance-values">
          <summary>Voir les résultats mensuels</summary>
          <div className="table-scroll">
            <table>
              <caption className="sr-only">Performance mensuelle de la sélection</caption>
              <thead><tr><th scope="col">Mois</th><th scope="col">Résultat net</th><th scope="col">R cumulés</th><th scope="col">Trades</th><th scope="col">Réussite</th></tr></thead>
              <tbody>{monthly.map(row => <tr key={row.month}>
                <th scope="row">{row.label}</th><td className={row.net >= 0 ? "positive mono" : "negative mono"}>{signedMoney(row.net)}</td><td>{row.rated ? r(row.r) : "—"}</td><td>{row.count}</td><td>{num(row.wins / row.count * 100, 1)} %</td>
              </tr>)}</tbody>
            </table>
          </div>
        </details>}
      </Panel>

      <div className="analysis-charts-grid">

        <Panel className="analysis-chart-card">
          <div className="panel-heading">
            <div>
              <h2>Distribution des résultats</h2>
              <p className="footnote">Nombre de trades par tranche de R · risque initial renseigné.</p>
            </div>
            {stats.riskCount > 0 && <div className="plot-readout"><small>Risque connu</small><strong>{tradeCount(stats.riskCount)}</strong></div>}
          </div>
          {stats.riskCount ? (
            <div className="chart chart-drill" role="img" aria-label="Distribution des résultats par tranche de R">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resultDistribution} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                  <XAxis dataKey="label" interval={0} tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} width={24} />
                  <Tooltip
                    formatter={(value) => [tradeCount(Number(value)), "Effectif"]}
                    labelFormatter={(label) => String(label)}
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 8 }}
                    cursor={{ fill: "#ffffff04" }}
                  />
                  <Bar dataKey="count" label={{ position: "top", fill: "var(--text)", fontSize: 11 }} radius={[3, 3, 0, 0]} maxBarSize={54} isAnimationActive={false} onClick={(entry: unknown) => {
                    const row = (entry as { payload?: (typeof resultDistribution)[number] })?.payload;
                    if (row?.ids.length) onInspect?.({ label: "Analyse · " + row.label, ids: row.ids });
                  }}>
                    {resultDistribution.map((row, index) => <Cell key={row.label} fill={index >= 3 ? "var(--green)" : "var(--red)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="empty">Renseigne le risque initial pour afficher la distribution en R.</p>}
        </Panel>
        <Panel className="analysis-chart-card">
          <div className="panel-heading">
            <div>
              <h2>Réussite par session</h2>
              <p className="footnote">Taux de trades gagnants · seuil de lecture à 50 %.</p>
            </div>
          </div>
          {sessionRows.length ? (
            <div className="chart" role="img" aria-label="Taux de réussite par session">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionRows} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 5" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="label" width={96} tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <ReferenceLine x={50} stroke="var(--border-strong)" strokeDasharray="3 4" />
                  <Tooltip
                    cursor={{ fill: "#ffffff04" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as { label: string; count: number; winRatePct: number; net: number };
                      return <div className="chart-tooltip">
                        <strong>{row.label}</strong>
                        <p>Réussite <b className="mono">{num(row.winRatePct, 1)} %</b></p>
                        <p>{tradeCount(row.count)} · {signedMoney(row.net)}</p>
                      </div>;
                    }}
                  />
                  <Bar dataKey="winRatePct" background={{ fill: "var(--border)", radius: 3 }} label={{ position: "right", formatter: (value) => `${num(Number(value), 1)} %`, fill: "var(--text)", fontSize: 11 }} radius={[0, 3, 3, 0]} maxBarSize={12} isAnimationActive={false}>
                    {sessionRows.map((row) => <Cell key={row.label} fill={row.winRatePct >= 50 ? "var(--green)" : "var(--red)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="empty">Aucune session renseignée sur cette sélection.</p>}
        </Panel>
        <Panel className="analysis-chart-card">
          <div className="panel-heading">
            <div>
              <h2>Plan et résultat</h2>
              <p className="footnote">Chaque point est un trade noté · seuil de plan à 8/10.</p>
            </div>
          </div>
          {planPoints.length ? (
            <div className="chart" role="img" aria-label="Nuage des scores de respect du plan et des résultats en R">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 24, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" />
                  <XAxis type="number" dataKey="score" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="r" width={54} tickFormatter={(value) => r(Number(value))} tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <ReferenceLine x={8} stroke="var(--accent)" strokeDasharray="3 4" label={{ value: "Plan 8/10", position: "top", fill: "var(--accent)", fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="var(--border-strong)" />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0].payload as { instrument: string; setup: string; score: number; r: number; net: number };
                      return <div className="chart-tooltip">
                        <strong>{point.instrument} · {point.setup}</strong>
                        <p>Score <b className="mono">{point.score}/10</b></p>
                        <p className={point.r >= 0 ? "positive" : "negative"}>{r(point.r)} · {signedMoney(point.net)}</p>
                      </div>;
                    }}
                  />
                  <Scatter data={planPoints} fill="var(--accent)" fillOpacity={0.48} stroke="var(--surface)" strokeWidth={1} isAnimationActive={false}>
                    {planPoints.map((point) => <Cell key={point.id} fill={point.r >= 0 ? "var(--green)" : "var(--red)"} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="empty">Note les trades pour afficher la relation entre plan et résultat.</p>}
        </Panel>
        <Panel className="analysis-chart-card">
          <div className="panel-heading">
            <div>
              <h2>Performance par jour de la semaine</h2>
              <p className="footnote">{resultUnit === "net" ? "Résultat net par jour de clôture · New York · filtres actifs." : "R cumulés par jour · risque renseigné sur " + tradeCount(stats.riskCount) + " / " + tradeCount(stats.count) + " trades."}</p>
            </div>
            {stats.count > 0 && <div className="plot-readout"><small>{resultUnit === "net" ? "Meilleur jour" : "Meilleur jour en R"}</small><strong>{resultUnit === "net" ? bestWeekday.label + " · " + signedMoney(bestWeekday.net) : bestWeekdayR.label + " · " + r(bestWeekdayR.r)}</strong></div>}
          </div>
          {stats.count ? (
            <div className="chart chart-drill" role="img" aria-label={resultUnit === "net" ? "Résultat net par jour de la semaine" : "R cumulés par jour de la semaine"}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayRows} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                  <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => resultUnit === "net" ? (Math.abs(Number(value)) >= 1000 ? Math.round(Number(value) / 1000) + "k$" : Math.round(Number(value)) + "$") : num(Number(value), 1) + "R"} tick={{ fill: "var(--muted)", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
                  <Tooltip
                    cursor={{ fill: "#ffffff04" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as (typeof weekdayRows)[number];
                      return <div className="chart-tooltip">
                        <strong>{row.label}</strong>
                        <p>Résultat net <b className="mono">{signedMoney(row.net)}</b></p>
                        <p>R cumulés <b className="mono">{r(row.r)}</b></p>
                        <p>{tradeCount(row.count)} · {row.count ? num(row.wins / row.count * 100, 1) : 0} % de réussite</p>
                      </div>;
                    }}
                  />
                  <ReferenceLine y={0} stroke="var(--muted)" strokeOpacity={0.65} />
                  <Bar dataKey={resultUnit === "net" ? "net" : "r"} radius={[3, 3, 0, 0]} maxBarSize={54} isAnimationActive={false} onClick={(entry: unknown) => {
                    const row = (entry as { payload?: (typeof weekdayRows)[number] })?.payload;
                    if (row?.ids.length) onInspect?.({ label: "Analyse · " + row.label, ids: row.ids });
                  }}>
                    {weekdayRows.map((row) => <Cell key={row.label} fill={row[resultUnit] >= 0 ? "var(--green)" : "var(--red)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="empty">Aucun trade clôturé sur cette sélection.</p>}
        </Panel>
      </div>
      <div className="bottom-grid">
        <Panel>
          <h2>Performance par contexte</h2>
          <div className="dimension-picks" aria-label="Axes de performance">
            {["session", "instrument", "setup", "timeframe", "heure"].map(key =>
              <button type="button" key={key} aria-pressed={dimension === key} onClick={() => setDimension(key)}>{labels[key]}</button>
            )}
          </div>
          <div className="analysis-controls">
            <Field label="Comparer par"><select value={dimension} onChange={event => setDimension(event.target.value)}>
              {Object.keys(keys).map(key => <option key={key} value={key}>{labels[key] ?? key}</option>)}
            </select></Field>
            
          </div>
          <p className="footnote">{dimension === "heure" ? "Heure d’entrée à New York · " : ""}{resultUnit === "r" ? `Risque initial renseigné sur ${stats.riskCount} / ${tradeCount(stats.count)}.` : "Gains et pertes après frais."}</p>
          {groups.length ? <div className="performance-bars">{groups.map(group => {
            const value = group[resultUnit];
            const measurable = resultUnit === "net" || group.riskCount > 0;
            return <button type="button" key={group.label} className="performance-row" onClick={() => inspectContext(group.label)}>
              <span>{group.label}<small>{group.count} {group.count === 1 ? "trade" : "trades"}</small></span>
              <span className="performance-track" aria-hidden="true"><i className={value < 0 ? "loss" : "gain"} style={{width: Math.abs(value) / scale * 50 + "%"}} /></span>
              <strong>{measurable ? resultUnit === "r" ? r(value) : signedMoney(value) : "—"}</strong>
            </button>;
          })}</div> : <p>Aucun trade clôturé sur cette sélection.</p>}
        </Panel>
        <Panel>
          <h2>Radar du respect du plan par setup</h2>
          <div className="chart radar">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                outerRadius="65%"
                data={setups.map((s) => ({
                  name:
                    s.label.length > 16 ? s.label.slice(0, 16) + "…" : s.label,
                  score:
                    (averagePlan(trades.filter((t) => t.setup === s.label)) ?? 0) * 10,
                }))}
              >
                <PolarGrid stroke="#ffffff14" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted)", fontSize: 10 }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Tooltip formatter={value => [num(Number(value) / 10, 1) + " / 10", "Respect du plan"]} contentStyle={{background: "var(--surface)", borderColor: "var(--border-strong)", borderRadius: 10}} />
                <Radar
                  dataKey="score"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.42}
                  dot={{ r: 3, fill: "var(--accent)" }}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <Panel>
        <h2>Espérance et fiabilité de lecture</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Contexte</th>
                <th>Effectif</th>
                <th>Net ($)</th><th>R cumulés</th>
                <th>Espérance</th><th>Réussite</th>
                <th>Lecture</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.label}>
                  <td>
                    <button
                      type="button"
                      className="table-text-link"
                      onClick={() => inspectContext(g.label)}
                    >
                      {g.label}
                      <ArrowUpRight size={12} aria-hidden="true" />
                    </button>
                  </td>
                  <td>{g.count}</td>
                  <td>{signedMoney(g.net)}</td><td>{g.riskCount ? r(g.r) : "—"}</td>
                  <td>{g.riskCount ? r(g.expectancy) : "—"}</td>
                  <td>{num(g.winRate * 100, 1)} %</td>
                  <td>
                    {g.reliable
                      ? "Seuil minimal atteint"
                      : "Échantillon limité"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote">
          Le seuil de {minSample} observations facilite la lecture ; ce n’est
          pas une preuve statistique de rentabilité ni un intervalle de
          confiance.
        </p>
      </Panel>
      <Panel className="section-gap">
        <h2>Entrées, stops et sorties</h2>
        {[
          [
            "Distance entrée → meilleur prix mesuré",
            execution.entryDistance === null
              ? "Non mesurable sans meilleur prix"
              : num(execution.entryDistance) +
                "R de distance moyenne · " +
                execution.entryCount +
                " trades",
          ],
          [
            "R brut laissé entre MFE et sortie",
            execution.leftR === null
              ? "Renseigne la MFE pour analyser les sorties"
              : num(execution.leftR) +
                "R moyen · " +
                execution.mfeCount +
                " observations",
          ],
          [
            "Stops suivis d’une continuation positive",
            execution.stopRebound === null
              ? "Renseigne le parcours après stop"
              : num(execution.stopRebound * 100, 1) +
                " % sur " +
                execution.stopCount +
                " observations",
          ],
          [
            "Amplitude adverse des gagnants · percentile 90",
            execution.mae90 === null
              ? "30 gagnants avec MAE requis"
              : num(execution.mae90) +
                "R · à tester hors échantillon, pas un stop optimal démontré",
          ],
        ].map(([label, value]) => (
          <div className="setup-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
        <p className="footnote">
          Action : mesure le parcours avant de modifier le stop. Le meilleur
          prix atteint après l’entrée peut être une fluctuation normale ; il ne
          prouve pas à lui seul une entrée trop précoce.
        </p>
      </Panel>
      <Panel className="section-gap data-quality analysis-chart-card">
        <div className="panel-heading">
          <div>
            <h2>Qualité des données</h2>
            <p className="footnote">Champs manquants dans la sélection active · un clic ouvre les trades concernés.</p>
          </div>
          <div className="plot-readout"><small>Trades incomplets</small><strong>{tradeCount(qualityGaps)}</strong></div>
        </div>
        <div className="quality-grid">
          {quality.map((item) => (
            <button type="button" key={item.label} className="quality-item" disabled={!item.count} onClick={() => onInspect?.({ label: "Qualité · " + item.label, ids: item.ids })}>
              <span>{item.label}<small>{item.count ? item.note : "Complet"}</small></span>
              <strong>{item.count}</strong>
            </button>
          ))}
        </div>
      </Panel>
      <MetricLedger trades={trades} />
        </>
      )}
      {view === "wins" && <WinLossView trades={trades} />}
      {view === "compare" && <CompareView trades={trades} />}
    </>
  );
}
function Leaks({
  trades,
  minSample,
  onInspect,
}: {
  trades: Trade[];
  minSample: number;
  onInspect?: (scope: JournalScope) => void;
}) {
  const groups = behavioralAnalysis(trades, minSample);
  const negative = groups.filter((g) => g.net < 0);
  const emotions = [...new Set(trades.map((t) => t.mentalBefore))];
  const contextKeys: Record<string, (trade: Trade) => string> = {
    "État mental": (trade) => trade.mentalBefore,
    Instrument: (trade) => trade.instrument,
    Setup: (trade) => trade.setup,
    Session: (trade) => trade.session,
    "Heure ET": (trade) =>
      localDateTime(trade.enteredAt).slice(11, 13) + "h ET",
    Taille: (trade) => trade.quantity + (trade.category === "CFD" ? " lot(s)" : trade.category === "FUTURE" ? " contrat(s)" : " unité(s)"),
    Jour: (trade) =>
      new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        timeZone: "America/New_York",
      }).format(new Date(trade.enteredAt)),
  };
  return (
    <>
      <div className="briefing">
        <ScanLine size={24} className="accent-text" />
        <p>
          Classement par pertes cumulées, avec au moins {minSample} observations
          par groupe. Les catégories se chevauchent : leurs pertes ne doivent
          pas être additionnées.
        </p>
      </div>
      {negative.map((g, i) => (
        <Panel className="leak-card" key={g.category + g.label}>
          <span className="leak-index">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <span className="eyebrow">{g.category}</span>
            <h2>{g.label}</h2>
            <p className="muted">
              {g.count} trades · {num(g.winRate * 100, 1)} % de réussite ·{" "}
              {r(g.expectancy)} / trade
            </p>
            <p className="action">
              Prochaine séance : exige une confirmation explicite dans ce
              contexte et conserve une taille stable.
            </p>
            {contextKeys[g.category] && (
              <button
                type="button"
                className="text-btn"
                onClick={() =>
                  onInspect?.({
                    label: g.category + " · " + g.label,
                    ids: trades
                      .filter(
                        (trade) => contextKeys[g.category](trade) === g.label,
                      )
                      .map((trade) => trade.id),
                  })
                }
              >
                Voir les exécutions{" "}
                <ArrowUpRight size={13} aria-hidden="true" />
              </button>
            )}
          </div>
          <strong className="negative mono">
            {r(g.r)}
            <small>{money(g.net)}</small>
          </strong>
        </Panel>
      ))}
      {!negative.length && (
        <Panel>
          <Empty text="Aucun groupe négatif n’atteint l’effectif minimal. Élargis la période sans réduire artificiellement le seuil." />
        </Panel>
      )}
      <Panel className="section-gap">
        <h2>Matrice état mental × résultat précédent</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>État mental actuel</th>
                <th>Après un gain</th>
                <th>Après une perte</th>
                <th>Premier trade / neutre</th>
              </tr>
            </thead>
            <tbody>
              {emotions.map((emotion) => (
                <tr key={emotion}>
                  <td>{emotion}</td>
                  {["gain", "perte", "premier"].map((result) => {
                    const sorted = [...trades].sort((a, b) =>
                      a.enteredAt.localeCompare(b.enteredAt),
                    );
                    const subset = sorted.filter((t, i) => {
                      if (t.mentalBefore !== emotion) return false;
                      const previous = sorted
                        .slice(0, i)
                        .filter(
                          (p) =>
                            p.accountId === t.accountId &&
                            p.exitedAt <= t.enteredAt,
                        )
                        .at(-1);
                      const net = previous ? calculateTrade(previous).net : 0;
                      return result === "gain"
                        ? net > 0
                        : result === "perte"
                          ? net < 0
                          : net === 0;
                    });
                    const s = summarize(subset);
                    return (
                      <td
                        key={result}
                        className={s.expectancy >= 0 ? "positive" : "negative"}
                      >
                        {subset.length ? (
                          <button
                            type="button"
                            className="table-text-link"
                            onClick={() =>
                              onInspect?.({
                                label:
                                  emotion + " · contexte précédent : " + result,
                                ids: subset.map((trade) => trade.id),
                              })
                            }
                          >
                            {r(s.expectancy)}
                          </button>
                        ) : (
                          "—"
                        )}
                        <small>
                          {subset.length} trades ·{" "}
                          {subset.length < minSample
                            ? "effectif limité"
                            : "seuil atteint"}
                        </small>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote">
          Action : compare ta taille après une perte et ton respect du plan
          après un gros gain. L’émotion est déclarative, la matrice reste
          descriptive.
        </p>
      </Panel>
    </>
  );
}
function WinLossView({ trades }: { trades: Trade[] }) {
  const data = useMemo(() => {
    const rows = trades.map((trade) => ({
      trade,
      metrics: calculateTrade(trade),
    }));
    const wins = rows.filter((row) => row.metrics.net > 0);
    const losses = rows.filter((row) => row.metrics.net < 0);
    const flats = rows.filter((row) => row.metrics.net === 0);
    const hours = (list: typeof rows) =>
      list.length
        ? list.reduce(
            (sum, row) =>
              sum +
              (Date.parse(row.trade.exitedAt) -
                Date.parse(row.trade.enteredAt)) /
                3_600_000,
            0,
          ) / list.length
        : 0;
    const plan = (list: typeof rows) => {
      const rated = list.filter((row) => isPlanRated(row.trade));
      return rated.length
        ? rated.reduce((sum, row) => sum + row.trade.planScore!, 0) /
            rated.length
        : null;
    };
    const side = (list: typeof rows) => ({
      count: list.length,
      net: list.reduce((sum, row) => sum + row.metrics.net, 0),
      r: list.reduce((sum, row) => sum + row.metrics.realizedR, 0),
      averageR: list.length
        ? list.reduce((sum, row) => sum + row.metrics.realizedR, 0) /
          list.length
        : 0,
      best: list.length ? Math.max(...list.map((row) => row.metrics.net)) : 0,
      worst: list.length ? Math.min(...list.map((row) => row.metrics.net)) : 0,
      hours: hours(list),
      plan: plan(list),
    });
    const setups = breakdown(
      trades,
      (trade) => trade.setup.trim() || "Non renseigné",
      0,
    )
      .map((group) => {
        const list = trades.filter(
          (trade) => (trade.setup.trim() || "Non renseigné") === group.label,
        );
        return {
          label: group.label,
          count: list.length,
          gain: list
            .filter((trade) => calculateTrade(trade).net > 0)
            .reduce((sum, trade) => sum + calculateTrade(trade).net, 0),
          loss: list
            .filter((trade) => calculateTrade(trade).net < 0)
            .reduce((sum, trade) => sum + calculateTrade(trade).net, 0),
        };
      })
      .sort((a, b) => Math.abs(b.gain + b.loss) - Math.abs(a.gain + a.loss))
      .slice(0, 6);
    return {
      wins: side(wins),
      losses: side(losses),
      flats: flats.length,
      setups,
    };
  }, [trades]);
  const cards = [
    { key: "wins", title: "Trades gagnants", tone: "gain", value: data.wins },
    {
      key: "losses",
      title: "Trades perdants",
      tone: "loss",
      value: data.losses,
    },
  ] as const;
  return (
    <>
      <Panel className="winloss-share">
        <div className="panel-heading">
          <div>
            <h2>Répartition de la sélection</h2>
            <p className="footnote">
              Proportion de trades gagnants et perdants · neutres exclus.
            </p>
          </div>
          <span className="mono">
            {tradeCount(data.wins.count + data.losses.count)}
          </span>
        </div>
        <BalanceBar
          positive={data.wins.count}
          negative={data.losses.count}
          label={
            data.wins.count +
            " gagnants, " +
            data.losses.count +
            " perdants"
          }
        />
        <div className="range-bar-labels">
          <span className="positive">
            {tradeCount(data.wins.count)} gagnants
          </span>
          <span className="negative">
            {tradeCount(data.losses.count)} perdants
          </span>
        </div>
      </Panel>
      <div className="winloss-grid">
        {cards.map((card) => (
          <Panel className={"winloss-card " + card.tone} key={card.key}>
            <div className="panel-heading">
              <div>
                <span className="eyebrow">{card.title}</span>
                <h2
                  className={
                    card.tone === "gain" ? "positive" : "negative"
                  }
                >
                  {signedMoney(card.value.net)}
                </h2>
              </div>
              <span className="winloss-count mono">
                {tradeCount(card.value.count)}
              </span>
            </div>
            <dl className="winloss-facts">
              <div>
                <dt>R cumulés</dt>
                <dd className="mono">{card.value.r ? r(card.value.r) : "—"}</dd>
              </div>
              <div>
                <dt>R moyen</dt>
                <dd className="mono">
                  {card.value.count ? r(card.value.averageR) : "—"}
                </dd>
              </div>
              <div>
                <dt>Meilleur</dt>
                <dd className="mono positive">
                  {signedMoney(card.value.best)}
                </dd>
              </div>
              <div>
                <dt>Pire</dt>
                <dd className="mono negative">{signedMoney(card.value.worst)}</dd>
              </div>
              <div>
                <dt>Durée moyenne</dt>
                <dd className="mono">
                  {card.value.count ? num(card.value.hours, 1) + " h" : "—"}
                </dd>
              </div>
              <div>
                <dt>Score de plan</dt>
                <dd className="mono">
                  {card.value.plan === null
                    ? "—"
                    : num(card.value.plan, 1) + " / 10"}
                </dd>
              </div>
            </dl>
          </Panel>
        ))}
      </div>
      <Panel>
        <div className="panel-heading">
          <div>
            <h2>Écart par setup</h2>
            <p className="footnote">
              Somme des gains et des pertes, par setup · six setups les plus
              contributifs.
            </p>
          </div>
        </div>
        {data.setups.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Setup</th>
                  <th>Effectif</th>
                  <th>Gains</th>
                  <th>Pertes</th>
                  <th>Écart net</th>
                </tr>
              </thead>
              <tbody>
                {data.setups.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{tradeCount(row.count)}</td>
                    <td className="positive">{signedMoney(row.gain)}</td>
                    <td className="negative">{signedMoney(row.loss)}</td>
                    <td
                      className={
                        row.gain + row.loss >= 0 ? "positive" : "negative"
                      }
                    >
                      {signedMoney(row.gain + row.loss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Aucun setup renseigné sur cette sélection.</p>
        )}
        {data.flats > 0 && (
          <p className="footnote">
            {tradeCount(data.flats)} trade(s) neutre(s) exclu(s) de la
            comparaison.
          </p>
        )}
      </Panel>
    </>
  );
}
function CompareView({ trades }: { trades: Trade[] }) {
  const [axis, setAxis] = useState("setup");
  const [leftValue, setLeftValue] = useState("");
  const [rightValue, setRightValue] = useState("");
  const keys: Record<string, { label: string; read: (trade: Trade) => string }> =
    {
      setup: {
        label: "Setup",
        read: (trade) => trade.setup.trim() || "Non renseigné",
      },
      session: {
        label: "Session",
        read: (trade) => trade.session?.trim() || "Non renseigné",
      },
      instrument: { label: "Instrument", read: (trade) => trade.instrument },
      timeframe: {
        label: "Unité de temps",
        read: (trade) => trade.timeframe?.trim() || "Non renseigné",
      },
      direction: {
        label: "Direction",
        read: (trade) => (trade.direction === "LONG" ? "Achat" : "Vente"),
      },
    };
  const active = keys[axis];
  const values = useMemo(
    () => [...new Set(trades.map(active.read))].sort(),
    [trades, axis],
  );
  const left = values.includes(leftValue) ? leftValue : (values[0] ?? "");
  const right =
    values.includes(rightValue) && rightValue !== left
      ? rightValue
      : (values.find((value) => value !== left) ?? "");
  const leftTrades = useMemo(
    () => trades.filter((trade) => active.read(trade) === left),
    [trades, axis, left],
  );
  const rightTrades = useMemo(
    () => trades.filter((trade) => active.read(trade) === right),
    [trades, axis, right],
  );
  const a = summarize(leftTrades);
  const b = summarize(rightTrades);
  const series = useMemo(() => {
    const build = (list: Trade[]) => {
      const days = groupByDay(list);
      let running = 0;
      return Object.entries(days)
        .sort(([x], [y]) => x.localeCompare(y))
        .map(([date, value]) => ({ date, value: (running += value.net) }));
    };
    const leftSeries = build(leftTrades);
    const rightSeries = build(rightTrades);
    const dates = [
      ...new Set([
        ...leftSeries.map((point) => point.date),
        ...rightSeries.map((point) => point.date),
      ]),
    ].sort();
    let leftLast = 0;
    let rightLast = 0;
    return dates.map((date) => {
      const leftPoint = leftSeries.find((point) => point.date === date);
      const rightPoint = rightSeries.find((point) => point.date === date);
      if (leftPoint) leftLast = leftPoint.value;
      if (rightPoint) rightLast = rightPoint.value;
      return { date, left: leftLast, right: rightLast };
    });
  }, [leftTrades, rightTrades]);
  const rows: {
    label: string;
    left: string;
    right: string;
    better?: "left" | "right";
  }[] = [
    { label: "Exécutions", left: tradeCount(a.count), right: tradeCount(b.count) },
    {
      label: "Résultat net",
      left: signedMoney(a.net),
      right: signedMoney(b.net),
      better: a.net === b.net ? undefined : a.net > b.net ? "left" : "right",
    },
    {
      label: "R cumulés",
      left: a.riskCount ? r(a.r) : "—",
      right: b.riskCount ? r(b.r) : "—",
      better: a.r === b.r ? undefined : a.r > b.r ? "left" : "right",
    },
    {
      label: "Espérance / trade",
      left: a.riskCount ? r(a.expectancy) : "—",
      right: b.riskCount ? r(b.expectancy) : "—",
      better:
        a.expectancy === b.expectancy
          ? undefined
          : a.expectancy > b.expectancy
            ? "left"
            : "right",
    },
    {
      label: "Taux de réussite",
      left: a.count ? num(a.winRate * 100, 1) + " %" : "—",
      right: b.count ? num(b.winRate * 100, 1) + " %" : "—",
      better:
        a.winRate === b.winRate
          ? undefined
          : a.winRate > b.winRate
            ? "left"
            : "right",
    },
    {
      label: "Profit factor",
      left: a.profitFactor === null ? "—" : num(a.profitFactor),
      right: b.profitFactor === null ? "—" : num(b.profitFactor),
      better:
        a.profitFactor === b.profitFactor ||
        a.profitFactor === null ||
        b.profitFactor === null
          ? undefined
          : a.profitFactor > b.profitFactor
            ? "left"
            : "right",
    },
    {
      label: "Drawdown max.",
      left: money(a.drawdown),
      right: money(b.drawdown),
      better:
        a.drawdown === b.drawdown
          ? undefined
          : a.drawdown < b.drawdown
            ? "left"
            : "right",
    },
    {
      label: "Risque renseigné",
      left: tradeCount(a.riskCount) + " / " + tradeCount(a.count),
      right: tradeCount(b.riskCount) + " / " + tradeCount(b.count),
    },
  ];
  return (
    <>
      <Panel>
        <div className="compare-controls">
          <Field label="Comparer par">
            <select
              value={axis}
              onChange={(event) => {
                setAxis(event.target.value);
                setLeftValue("");
                setRightValue("");
              }}
            >
              {Object.entries(keys).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sous-ensemble A">
            <select value={left} onChange={(event) => setLeftValue(event.target.value)}>
              {values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sous-ensemble B">
            <select
              value={right}
              onChange={(event) => setRightValue(event.target.value)}
            >
              {values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {!values.length || !right ? (
          <p className="empty">
            Cette sélection ne contient pas deux valeurs comparables sur cet
            axe.
          </p>
        ) : (
          <>
            <div className="table-scroll compare-table">
              <table>
                <thead>
                  <tr>
                    <th>Métrique</th>
                    <th>{left}</th>
                    <th>{right}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className={row.better === "left" ? "compare-win" : ""}>
                        {row.left}
                      </td>
                      <td className={row.better === "right" ? "compare-win" : ""}>
                        {row.right}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {series.length > 1 && (
              <div
                className="chart compare-chart"
                role="img"
                aria-label={"Résultat cumulé comparé de " + left + " et " + right}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 12, right: 14, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                    <XAxis
                      dataKey="date"
                      minTickGap={40}
                      tickFormatter={(value) =>
                        String(value).slice(8) + "/" + String(value).slice(5, 7)
                      }
                      tick={{ fill: "var(--muted)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      width={54}
                      tickFormatter={(value) => {
                        const n = Number(value);
                        return (
                          (Math.abs(n) >= 1000 ? Math.round(n / 1000) + "k" : Math.round(n)) +
                          " $"
                        );
                      }}
                      tick={{ fill: "var(--muted)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        money(Number(value)),
                        name === "left" ? left : right,
                      ]}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border-strong)",
                        borderRadius: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="left"
                      stroke="var(--green)"
                      fill="var(--green)"
                      fillOpacity={0.14}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="right"
                      stroke="var(--accent)"
                      fill="var(--accent)"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="range-bar-labels">
              <span className="compare-legend left">{left}</span>
              <span className="compare-legend right">{right}</span>
            </div>
          </>
        )}
      </Panel>
    </>
  );
}
function MetricLedger({ trades }: { trades: Trade[] }) {
  const rows = useMemo(() => {
    const stats = summarize(trades);
    const rated = trades.filter(isPlanRated);
    const days = Object.values(groupByDay(trades));
    const hours = trades.length
      ? trades.reduce(
          (sum, trade) =>
            sum +
            (Date.parse(trade.exitedAt) - Date.parse(trade.enteredAt)) /
              3_600_000,
          0,
        ) / trades.length
      : 0;
    const fees = trades.reduce((sum, trade) => sum + (trade.fees ?? 0), 0);
    const volume = trades.reduce((sum, trade) => sum + trade.quantity, 0);
    const list: [string, string, string?][] = [
      ["Résultat net", signedMoney(stats.net), stats.net >= 0 ? "positive" : "negative"],
      ["R cumulés", stats.riskCount ? r(stats.r) : "—"],
      ["Exécutions", tradeCount(stats.count)],
      ["Gagnants", tradeCount(trades.filter((trade) => calculateTrade(trade).net > 0).length), "positive"],
      ["Perdants", tradeCount(trades.filter((trade) => calculateTrade(trade).net < 0).length), "negative"],
      ["Neutres", tradeCount(trades.filter((trade) => calculateTrade(trade).net === 0).length)],
      ["Taux de réussite", stats.count ? num(stats.winRate * 100, 1) + " %" : "—"],
      ["Profit factor", stats.profitFactor === null ? "—" : num(stats.profitFactor)],
      ["Espérance / trade", stats.riskCount ? r(stats.expectancy) : "—"],
      ["Gain moyen", stats.averageWinR ? r(stats.averageWinR) : "—", "positive"],
      ["Perte moyenne", stats.averageLossR ? r(stats.averageLossR) : "—", "negative"],
      ["Meilleur trade", signedMoney(stats.best), "positive"],
      ["Pire trade", signedMoney(stats.worst), "negative"],
      ["Drawdown max.", money(stats.drawdown)],
      ["Série max. gagnante", tradeCount(stats.maxWinStreak)],
      ["Série max. perdante", tradeCount(stats.maxLossStreak)],
      ["Risque renseigné", tradeCount(stats.riskCount) + " / " + tradeCount(stats.count)],
      ["Score de plan moyen", rated.length ? num(rated.reduce((sum, trade) => sum + trade.planScore!, 0) / rated.length, 1) + " / 10" : "—"],
      ["Durée moyenne", trades.length ? num(hours, 1) + " h" : "—"],
      ["Frais totaux", money(fees)],
      ["Volume total", num(volume, 0)],
      ["Setups distincts", tradeCount(new Set(trades.map((trade) => trade.setup.trim()).filter(Boolean)).size)],
      ["Instruments distincts", tradeCount(new Set(trades.map((trade) => trade.instrument)).size)],
      ["Jours tradés", tradeCount(days.length)],
      ["Jours gagnants", tradeCount(days.filter((day) => day.net > 0).length), "positive"],
      ["Jours perdants", tradeCount(days.filter((day) => day.net < 0).length), "negative"],
    ];
    return list;
  }, [trades]);
  return (
    <Panel className="metric-ledger-panel">
      <div className="panel-heading">
        <div>
          <h2>Relevé des métriques</h2>
          <p className="footnote">
            Toutes les valeurs de la sélection, sans survol ni infobulle.
          </p>
        </div>
      </div>
      <dl className="metric-ledger">
        {rows.map(([label, value, tone]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={"mono " + (tone ?? "")}>{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
function Calendar({
  trades,
  date,
  onDate,
  onOpen,
  onInspect,
}: {
  trades: Trade[];
  date: string;
  onDate: (date: string) => void;
  onOpen: (t: Trade) => void;
  onInspect?: (scope: JournalScope) => void;
}) {
  const month = date.slice(0, 7),
    days = groupByDay(trades);
  const first = new Date(month + "-01T12:00Z"),
    offset = (first.getUTCDay() + 6) % 7,
    last = new Date(
      first.getUTCFullYear(),
      first.getUTCMonth() + 1,
      0,
    ).getDate();
  const monthly = trades.filter((t) => nyDate(t.exitedAt).startsWith(month));
  const monthDays = Object.entries(days).filter(([key]) =>
    key.startsWith(month),
  );
  const bestDay = monthDays.length
    ? Math.max(...monthDays.map(([, value]) => value.net))
    : 0;
  const worstDay = monthDays.length
    ? Math.min(...monthDays.map(([, value]) => value.net))
    : 0;
  const winsByDay: Record<string, number> = {};
  for (const trade of monthly) {
    if (calculateTrade(trade).net > 0) {
      const key = nyDate(trade.exitedAt);
      winsByDay[key] = (winsByDay[key] ?? 0) + 1;
    }
  }
  function changeMonth(delta: number) {
    const d = new Date(month + "-15T12:00Z");
    d.setUTCMonth(d.getUTCMonth() + delta);
    onDate(d.toISOString().slice(0, 7) + "-01");
  }
  return (
    <Panel>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">P&L CLÔTURÉ · FUSEAU NEW YORK</span>
          <h2>
            {first.toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}{" "}
            · {r(summarize(monthly).r)}
          </h2>
        </div>
        <div className="upload-row">
          <button
            className="btn secondary"
            onClick={() => changeMonth(-1)}
            aria-label="Mois précédent"
          >
            ←
          </button>
          <button
            className="btn secondary"
            onClick={() => changeMonth(1)}
            aria-label="Mois suivant"
          >
            →
          </button>
        </div>
      </div>
      <div
        className="calendar-grid"
        role="region"
        aria-label="Calendrier des résultats · défilement horizontal sur petit écran"
        tabIndex={0}
      >
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <span className="weekday" key={d}>
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={"empty" + i} />
        ))}
        {Array.from({ length: last }, (_, i) => {
          const d = month + "-" + String(i + 1).padStart(2, "0"),
            value = days[d];
          return (
            <button
              key={d}
              onClick={() => onDate(d)}
              aria-pressed={d === date}
              aria-label={
                dateLabel(d) +
                (value
                  ? " · " + r(value.r) + " · " + value.count + " trades"
                  : " · aucune exécution")
              }
              className={
                "calendar-day " +
                (value ? (value.r >= 0 ? "win" : "loss") : "no-trade") +
                (d === date ? " chosen" : "")
              }
            >
              <span>{i + 1}</span>
              <strong>{value ? r(value.r) : "—"}</strong>
              <small>
                {value
                  ? value.count +
                    " trades · " +
                    Math.round(((winsByDay[d] ?? 0) / value.count) * 100) +
                    " %"
                  : "Sans trade"}
              </small>
            </button>
          );
        })}
      </div>
      <RangeBar
        min={worstDay}
        max={bestDay}
        lowLabel={signedMoney(worstDay)}
        highLabel={signedMoney(bestDay)}
        label={
          "Amplitude du mois : de " +
          signedMoney(worstDay) +
          " à " +
          signedMoney(bestDay)
        }
      />
      <div className="week-summaries">
        {Array.from({ length: Math.ceil((last + offset) / 7) }, (_, week) => {
          const start = week * 7 - offset + 1,
            end = Math.min(last, start + 6);
          const items = monthly.filter((t) => {
            const d = Number(nyDate(t.exitedAt).slice(8));
            return d >= Math.max(1, start) && d <= end;
          });
          return (
            <div key={week}>
              <small>Semaine {week + 1}</small>
              <strong className="mono">{r(summarize(items).r)}</strong>
            </div>
          );
        })}
      </div>
      <div className="panel-heading day-heading">
        <h2>Séance du {dateLabel(date)}</h2>
        {onInspect && (
          <button
            type="button"
            className="calendar-journal-link"
            onClick={() =>
              onInspect({
                label: "Séance du " + dateLabel(date),
                from: date,
                to: date,
              })
            }
          >
            Ouvrir dans le journal <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        )}
        <Pill>{r(days[date]?.r ?? 0)}</Pill>
      </div>
      <TradeTable
        trades={trades.filter((t) => nyDate(t.exitedAt) === date)}
        onOpen={onOpen}
      />
    </Panel>
  );
}
