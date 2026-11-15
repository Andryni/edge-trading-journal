"use client";
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
} from "lucide-react";
import {
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
function Login() {
  const { login, enterDemo, cloud, error: serverError } = useApp();
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function demo() {
    setBusy(true);
    try {
      enterDemo();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-shell">
      <div className="login-brand">
        <img src="/brand/edge-logo.svg" alt="EDGE" width={212} height={53} />
      </div>
      <p className="eyebrow">TRADING INTELLIGENCE · EDGE</p>
      <div className="login-grid">
        <div className="login-intro">
          <h1>
            Ton journal
            <br />
            <span>de trading.</span>
          </h1>
          <p>
            Observe tes vraies fuites. Protège ton capital. Construis une
            exécution que tu peux répéter.
          </p>
          <div className="login-points">
            <span>01 / Ton risque, avant ton résultat.</span>
            <span>02 / Ton historique et tes captures, réunis.</span>
            <span>03 / Une action concrète pour demain.</span>
          </div>
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => void demo()}
          >
            Explorer les 180 trades de démonstration <ArrowUpRight size={17} />
          </button>
          <small className="footnote">
            La démo utilise des données fictives en mémoire. Ton journal personnel reste séparé.
          </small>
        </div>
        <Panel>
          <Pill>
            {register ? "NOUVEL ESPACE" : "BON RETOUR AU COCKPIT"}
          </Pill>
          <h2>{register ? "Créer mon journal" : "Connexion"}</h2>
          <p className="footnote">
            {cloud ? "Ton compte Supabase permet de retrouver le journal sur tes appareils. Confirme ton email après l’inscription." : "Ce compte utilise la base locale de cet ordinateur."}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              try {
                await login(
                  String(f.get("email")),
                  String(f.get("password")),
                  register,
                );
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Connexion impossible.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Adresse email">
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Mot de passe · 10 caractères minimum">
              <input
                name="password"
                type="password"
                minLength={10}
                maxLength={200}
                autoComplete={register ? "new-password" : "current-password"}
                required
              />
            </Field>
            {(error || serverError) && (
              <p role="alert" className="error-message">
                {error || serverError}
              </p>
            )}
            <button className="btn primary full" disabled={busy}>
              {busy
                ? "Ouverture…"
                : register
                  ? "Créer mon espace"
                  : "Ouvrir mon cockpit"}
            </button>
          </form>
          <button
            className="text-btn"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? "J’ai déjà un compte local"
              : "Créer un nouveau compte local"}
          </button>
        </Panel>
      </div>
    </div>
  );
}
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
        journalBase,
        search,
        sort,
        journalOptions.result,
        journalOptions.plan,
        journalOptions.exitReason,
        journalOptions.review,
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
    setNotice("Exécution enregistrée localement.");
  }
  if (!app.loaded)
    return (
      <div className="loading-screen">
        <img src="/brand/edge-mark.svg" alt="EDGE" width={56} height={56} />
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
            <img src="/brand/edge-logo.svg" alt="EDGE — accueil du cockpit" width={176} height={44} />
          </a>
          <div className="brand-sub">Risque · Exécution · Revue</div>
          <div className="workspace">
            <span className="avatar">TR</span>
            <div>
              <strong>Espace personnel</strong>
              <small>
                {data.mode === "demo"
                  ? "Démonstration isolée"
                  : app.cloud ? "Journal cloud" : "Journal local"}
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
            >
              <Settings size={17} aria-hidden="true" />
              Paramètres
            </button>
            <div className="local-card">
              <Radio size={16} />
              <div>
                <strong>
                  {dirty ? "Modifications en attente" : "Journal local"}
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
              onClick={() =>
                void app.logout().catch((e) => setNotice(e.message))
              }
            >
              <LogOut size={17} />
              Déconnexion
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
                    Exporte la copie locale avant de choisir. Aucun changement
                    n’a été écrasé automatiquement.
                  </p>
                  <div className="upload-row">
                    <button
                      className="btn secondary"
                      onClick={() => void exportBackup(data).catch(e => setNotice(String(e)))}
                    >
                      Exporter la copie locale
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
                            {item.name}
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
                            {a.name}
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
                        comparison={delta("r")}
                        value={<RollingValue value={stats.r} />}
                        sub={signedMoney(stats.net)}
                        action="Conserve une taille stable et mesure la qualité."
                        tone={stats.r >= 0 ? "positive" : "negative"}
                      />
                      <Metric
                        compact
                        label="Espérance / trade"
                        comparison={delta("expectancy")}
                        value={<RollingValue value={stats.expectancy} />}
                        sub={`Profit factor ${stats.profitFactor === null ? "— (pas de pertes)" : num(stats.profitFactor)}`}
                        action="Privilégie les configurations documentées."
                      />
                      <Metric
                        compact
                        label="Taux de réussite"
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
                        comparison={delta("drawdown", "usd")}
                        value={
                          <RollingValue value={stats.drawdown} format="usd" />
                        }
                        sub="Équité clôturée · historique filtré"
                        action="Garde une marge sous le seuil du compte."
                      />
                    </div>

                    <Panel className="equity-panel cockpit-equity">
                      <div className="panel-heading">
                        <div>
                          <h2>Courbe d’équité</h2>
                        </div>
                        <Pill>R cumulés</Pill>
                      </div>
                      <div className="equity-summary">
                        <strong className="mono key-r">
                          <RollingValue value={stats.r} />
                        </strong>
                        <span
                          className={stats.net >= 0 ? "positive" : "negative"}
                        >
                          {signedMoney(stats.net)} net
                        </span>
                      </div>
                      <Equity trades={filtered} animated onDay={inspectDay} />
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
                          .slice(0, 5)}
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
                          <p className="session-account">
                            {a
                              ? "Risque : " + a.name
                              : "Aucun compte configuré"}
                          </p>
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
                          <span className="eyebrow">Résultat clôturé</span>
                          <strong
                            className={
                              "mono key-r " +
                              (today.net >= 0 ? "positive" : "negative")
                            }
                          >
                            <RollingValue value={today.r} />
                          </strong>
                          <p>
                            {signedMoney(today.net)} · {tradeCount(today.count)}
                          </p>
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
                                className="life-bar session-risk-bar"
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
                                {Array.from({ length: 24 }, (_, i) => (
                                  <span
                                    key={i}
                                    className={
                                      i <
                                      Math.max(
                                        0,
                                        Math.min(
                                          24,
                                          (prop.dailyRemaining /
                                            a.dailyLossLimit) *
                                            24,
                                        ),
                                      )
                                        ? "lit"
                                        : ""
                                    }
                                  />
                                ))}
                              </div>
                              <div className="risk-scale">
                                <span>
                                  Limite initiale : {money(a.dailyLossLimit)}
                                </span>
                                <span>Gains clôturés inclus</span>
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
                          <div className="readiness-state">
                            <ShieldCheck size={18} aria-hidden="true" />
                            <div>
                              <span>Préparation de la séance</span>
                              <strong>
                                {plan?.validatedAt
                                  ? "✓ Validée"
                                  : "○ À compléter"}{" "}
                                · {plan?.checks.filter(Boolean).length ?? 0}/6
                              </strong>
                            </div>
                          </div>
                          <button
                            className="btn secondary full"
                            onClick={() => go("Plan & revue")}
                          >
                            Revoir la préparation <ArrowUpRight size={15} />
                          </button>
                          {a && (
                            <button
                              className={
                                "btn full " +
                                (guard?.locked ? "lock-button" : "secondary")
                              }
                              onClick={() => setGuardAccount(a.id)}
                            >
                              <ShieldCheck size={16} aria-hidden="true" />
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
                      <button
                        className="btn primary full"
                        onClick={() => go("Plan & revue")}
                      >
                        Préparer la séance <ArrowUpRight size={16} />
                      </button>
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
                  onEdit={(trade) => {setEditingDraft(undefined); setEditing(trade);}}
                  onReview={(day) => {
                    setDate(day);
                    go("Plan & revue");
                  }}
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
                accountName={
                  data.accounts.find(
                    (account) => account.id === selected.accountId,
                  )?.name ?? "Compte non renseigné"
                }
                contextLabel={
                  journalFocus?.label ??
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
                onDelete={async () => {
                  try {await exportBackup(data);
                  update(
                    (j) =>
                      (j.trades = j.trades.filter((t) => t.id !== selected.id)),
                  );
                  closeTrade();
                  setNotice(
                    "Trade retiré du journal. Une sauvegarde complète a été téléchargée.",
                  );
                  }catch(e){setNotice(String(e));}
                }}
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
  animated = false,
  onDay,
}: {
  trades: Trade[];
  animated?: boolean;
  onDay?: (day: string) => void;
}) {
  const reduced = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const days = groupByDay(trades);
  let cumulative = 0;
  const points = [
    { date: "Départ", r: 0 },
    ...Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        r: (cumulative += d.r),
      })),
  ];
  return (
    <div
      className={"chart" + (animated ? " equity-chart-animated" : "")}
      role="img"
      aria-label="Courbe du résultat cumulé des trades clôturés, en R-multiples"
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
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.14} />
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
            tickFormatter={(v) => v + "R"}
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
            formatter={(v) => [r(Number(v)), "Résultat cumulé"]}
            cursor={{ stroke: "var(--accent)", strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="r"
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
  const stats = summarize(trades);
  const [dimension, setDimension] = useState("setup");
  const keys: Record<string, (t: Trade) => string> = {
    setup: (t) => t.setup,
    instrument: (t) => t.instrument,
    session: (t) => t.session,
    timeframe: (t) => t.timeframe,
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
  const groups = breakdown(trades, keys[dimension], minSample);
  const setups = breakdown(trades, (t) => t.setup, minSample);
  const execution = executionAnalysis(trades);
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
      <div className="metrics-grid">
        <Metric
          label="Drawdown max. de clôture"
          value={money(stats.drawdown)}
          action="Garde une marge sous le seuil du compte."
        />
        <Metric
          label="Gain moyen / perte moyenne"
          value={r(stats.averageWinR)}
          sub={r(stats.averageLossR) + " sur les perdants"}
          action="Respecte ton risque initial sur chaque trade."
        />
        <Metric
          label="Plus gros gain / perte"
          value={money(stats.best)}
          sub={money(stats.worst)}
          action="Vérifie si ta taille est cohérente entre trades."
        />
        <Metric
          label="Séries max. gains / pertes"
          value={stats.maxWinStreak + " / " + stats.maxLossStreak}
          action="Prépare une pause avant la prochaine dérive."
        />
      </div>
      <div className="bottom-grid">
        <Panel>
          <div className="panel-heading">
            <h2>Résultat en R par contexte</h2>
            <Field label="Regrouper par">
              <select
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
              >
                {Object.keys(keys).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groups.map((g) => ({ name: g.label, r: g.r }))}
                onClick={(state) => {
                  const group = groups[Number(state.activeTooltipIndex)];
                  if (group) inspectContext(group.label);
                }}
                margin={{ left: -20, right: 10 }}
              >
                <CartesianGrid vertical={false} stroke="#ffffff0a" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-raised)",
                    border: "1px solid #ffffff1f",
                  }}
                />
                <Bar dataKey="r" isAnimationActive={false}>
                  {groups.map((g) => (
                    <Cell
                      key={g.label}
                      fill={g.r >= 0 ? "#34D399" : "#FB7185"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel>
          <h2>Radar du respect du plan par setup</h2>
          <div className="chart radar">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={setups.map((s) => ({
                  name:
                    s.label.length > 20 ? s.label.slice(0, 20) + "…" : s.label,
                  score:
                    (averagePlan(trades.filter((t) => t.setup === s.label)) ?? 0) * 10,
                }))}
              >
                <PolarGrid stroke="#ffffff1a" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar
                  dataKey="score"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.18}
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
                <th>Espérance</th>
                <th>Win rate</th>
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
                  <td>{r(g.expectancy)}</td>
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
    Taille: (trade) => trade.quantity + " contrat(s)/lot(s)",
    Jour: (trade) =>
      new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        timeZone: "America/New_York",
      }).format(new Date(trade.enteredAt)),
  };
  return (
    <>
      <div className="briefing">
        <ScanLine size={24} className="violet-text" />
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
              <small>{value ? value.count + " trades" : "Sans trade"}</small>
            </button>
          );
        })}
      </div>
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
