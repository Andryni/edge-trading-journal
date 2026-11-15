"use client";
import { useEffect, useState } from "react";
import {
  disciplineStreak,
  zonedToUtc,
  newJournal,
  accountSchema,
  accountStatus,
  guardStatus,
  ruleSchema,
  reviewSummary,
  summarize,
  averagePlan,
  nyDate,
  breakdown,
  type Account,
  type Journal,
  type Trade,
} from "@edge/core";
import { useApp } from "../../lib/client-store";
import { exportBackup, exportCsv, monthlyPdf } from "../../lib/files";
import {
  Panel,
  Field,
  Modal,
  Pill,
  Stat,
  money,
  signedMoney,
  r,
  num,
  Empty,
} from "./kit";
import { Gallery, loadImage } from "./screenshots";
import { dateLabel } from "./view-data";
export function AccountEditor({
  account,
  onClose,
}: {
  account?: Account;
  onClose: () => void;
}) {
  const { data, update } = useApp();
  const [error, setError] = useState("");
  const a = account ?? newJournal().accounts[0];
  const rule =
    data.rules.find((r) => r.accountId === a.id) ?? newJournal().rules[0];
  return (
    <Modal
      title={account ? "Règles du compte" : "Ajouter un compte"}
      onClose={onClose}
    >
      <p className="footnote">
        Saisis les règles de ton contrat. Aucune règle officielle de prop firm
        n’est préremplie automatiquement.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const d = new FormData(e.currentTarget);
            const parsed = accountSchema.parse({
              id: account?.id ?? crypto.randomUUID(),
              name: d.get("name"),
              provider: d.get("provider"),
              ...Object.fromEntries(
                [
                  "initialCapital",
                  "profitTarget",
                  "maxDrawdown",
                  "dailyLossLimit",
                  "minTradingDays",
                  "maxContracts",
                  "highWaterMark",
                ].map((k) => [k, Number(d.get(k))]),
              ),
              consistencyLimit: Number(d.get("consistencyLimit")) / 100,
              drawdownMode: d.get("drawdownMode"),
              drawdownCap: d.get("drawdownCap")
                ? Number(d.get("drawdownCap"))
                : null,
            });
            const parsedRule = ruleSchema.parse({
              accountId: parsed.id,
              enabled: d.get("enabled") === "on",
              maxTrades: Number(d.get("maxTrades")),
              maxConsecutiveLosses: Number(d.get("maxConsecutiveLosses")),
              dailyLossLimit: parsed.dailyLossLimit,
              cutoffNy: d.get("cutoffNy"),
              cooldownMinutes: Number(d.get("cooldownMinutes")),
            });
            update((j) => {
              j.accounts = account
                ? j.accounts.map((a) => (a.id === parsed.id ? parsed : a))
                : [...j.accounts, parsed];
              j.rules = [
                ...j.rules.filter((r) => r.accountId !== parsed.id),
                parsedRule,
              ];
            });
            onClose();
          } catch (e) {
            setError(String(e));
          }
        }}
      >
        <div className="form-grid">
          <Field label="Nom">
            <input
              name="name"
              defaultValue={account?.name ?? ""}
              required
              maxLength={100}
            />
          </Field>
          <Field label="Prop firm / courtier">
            <input name="provider" defaultValue={account?.provider ?? ""} />
          </Field>
          {[
            ["initialCapital", "Capital initial ($)"],
            ["profitTarget", "Objectif de profit ($)"],
            ["maxDrawdown", "Drawdown maximal ($)"],
            ["dailyLossLimit", "Perte journalière ($)"],
            ["minTradingDays", "Jours de trading minimum"],
            ["maxContracts", "Contrats maximum"],
            ["highWaterMark", "Plus haut capital constaté ($)"],
          ].map(([k, label]) => (
            <Field key={k} label={label}>
              <input
                name={k}
                type="number"
                min={k === "minTradingDays" ? 0 : 0.01}
                step="any"
                defaultValue={a[k as keyof Account] as number}
                required
              />
            </Field>
          ))}
          <Field label="Consistance · meilleur jour / profit total (%)">
            <input
              name="consistencyLimit"
              type="number"
              min="1"
              max="100"
              step=".1"
              defaultValue={a.consistencyLimit * 100}
            />
          </Field>
          <Field label="Calcul du drawdown">
            <select name="drawdownMode" defaultValue={a.drawdownMode}>
              <option value="STATIC">Statique</option>
              <option value="TRAILING_CLOSED">
                Trailing sur clôtures de trades
              </option>
              <option value="TRAILING_EOD">Trailing fin de journée ET</option>
            </select>
          </Field>
          <Field label="Plafond du seuil de liquidation · facultatif ($)">
            <input
              name="drawdownCap"
              type="number"
              step="any"
              defaultValue={a.drawdownCap ?? ""}
            />
          </Field>
        </div>
        <h3>Lock Guard · garde-fou de saisie</h3>
        <label className="check-inline">
          <input name="enabled" type="checkbox" defaultChecked={rule.enabled} />
          Activer le verrouillage
        </label>
        <div className="form-grid">
          {[
            ["maxTrades", "Trades maximum par jour"],
            ["maxConsecutiveLosses", "Pertes consécutives maximum"],
            ["cooldownMinutes", "Pause avant dérogation (minutes)"],
          ].map(([k, label]) => (
            <Field key={k} label={label}>
              <input
                name={k}
                type="number"
                min={k === "cooldownMinutes" ? 0 : 1}
                defaultValue={rule[k as keyof typeof rule] as number}
                required
              />
            </Field>
          ))}
          <Field label="Heure de coupure · New York">
            <input
              name="cutoffNy"
              type="time"
              defaultValue={rule.cutoffNy}
              required
            />
          </Field>
        </div>
        <p className="footnote">
          Le garde-fou protège la saisie dans EDGE. Il ne bloque pas ta
          plateforme de trading. Un trailing intratrade exige un flux externe ;
          il n’est pas déduit des clôtures.
        </p>
        {error && <p className="error-message">{error}</p>}
        <button className="btn primary full">
          Enregistrer le compte et les limites
        </button>
      </form>
    </Modal>
  );
}
export function Accounts({ at }: { at: string }) {
  const { data } = useApp();
  const [edit, setEdit] = useState<Account | null>(null),
    [create, setCreate] = useState(false),
    [risk, setRisk] = useState(200);
  return (
    <>
      <div className="view-toolbar">
        <p className="muted">
          Règles configurées par toi · référence {nyDate(at)} ET · positions
          clôturées uniquement
        </p>
        <button className="btn primary" onClick={() => setCreate(true)}>
          Ajouter un compte
        </button>
      </div>
      <section className="account-simulator glass-card">
        <div>
          <h2>Tester la marge de risque</h2>
          <p>
            Observe l’effet d’une perte supplémentaire sur les seuils
            configurés, sans modifier le journal.
          </p>
        </div>
        <Field label="Simuler une perte supplémentaire · dollars, frais inclus">
          <input
            type="number"
            value={risk}
            min="0"
            onChange={(e) => setRisk(Math.max(0, Number(e.target.value)))}
          />
        </Field>
      </section>
      <div className="playbook-grid accounts-grid">
        {data.accounts.map((a) => {
          const s = accountStatus(a, data.trades, at, risk);
          return (
            <Panel key={a.id}>
              <div className="panel-heading">
                <h2>{a.name}</h2>
                <Pill tone={s.remaining > 0 ? "green" : "amber"}>
                  {a.provider || "Personnel"}
                </Pill>
              </div>
              <div className="account-equity mono">{money(s.balance)}</div>
              <dl className="stat-strip account-summary">
                <Stat
                  label="Risque journalier restant"
                  value={money(s.dailyRemaining)}
                />
                <Stat label="Marge de drawdown" value={money(s.remaining)} />
              </dl>
              <div className="progress-track">
                <span
                  style={{
                    width: `${Math.min(100, Math.max(0, s.progress * 100))}%`,
                  }}
                />
              </div>
              <details className="account-rules">
                <summary>Objectif, consistance et règles du compte</summary>
                {[
                  [
                    "Progression objectif",
                    signedMoney(s.net) + " / " + money(a.profitTarget),
                  ],
                  ["Distance au drawdown", money(s.remaining)],
                  ["Seuil actuel", money(s.floor)],
                  ["Budget journalier restant", money(s.dailyRemaining)],
                  [
                    "Consistance",
                    s.consistency === null
                      ? "Non calculable (profit ≤ 0)"
                      : num(s.consistency * 100, 1) +
                        " % / " +
                        num(a.consistencyLimit * 100, 0) +
                        " %",
                  ],
                  [
                    "Profit encore nécessaire pour la consistance",
                    money(s.consistencyProfitNeeded),
                  ],
                  ["Jours de trading", s.days + " / " + a.minTradingDays],
                  [
                    "Si je perds ce risque maintenant",
                    money(s.simulatedMargin) + " de marge",
                  ],
                ]
                  .filter(
                    ([label]) =>
                      ![
                        "Distance au drawdown",
                        "Budget journalier restant",
                      ].includes(label),
                  )
                  .map(([label, value]) => (
                    <div className="setup-row" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
              </details>
              {s.simulatedMargin < 0 && (
                <p className="error-message">
                  Cette perte franchirait le seuil configuré.
                </p>
              )}
              <button className="btn secondary full" onClick={() => setEdit(a)}>
                Modifier les règles
              </button>
            </Panel>
          );
        })}
      </div>
      {(edit || create) && (
        <AccountEditor
          account={edit ?? undefined}
          onClose={() => {
            setEdit(null);
            setCreate(false);
          }}
        />
      )}
    </>
  );
}
export function Guard({
  accountId,
  onClose,
}: {
  accountId: string;
  onClose: () => void;
}) {
  const { data, update } = useApp();
  const [now, setNow] = useState(Date.now()),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const guard = guardStatus(data, accountId, new Date(now).toISOString());
  return (
    <Modal title="Lock Guard · fais une pause" onClose={onClose}>
      <div className="guard-lock">
        <span>SESSION EN PAUSE</span>
        <strong>{guard.reasons.join(" · ") || "Aucune limite atteinte"}</strong>
      </div>
      <p>
        Le but est de casser l’impulsion. La dérogation reste volontaire,
        enregistrée et valable 10 minutes jusqu’au prochain trade.
      </p>
      <div className="countdown mono">
        {Math.floor(guard.waitSeconds / 60)}:
        {String(guard.waitSeconds % 60).padStart(2, "0")}
      </div>
      <button className="btn secondary full" onClick={() => setNow(Date.now())}>
        Actualiser le compte à rebours
      </button>
      <Field label="Pourquoi reprendre ? Quelle action de discipline ? (10 caractères minimum)">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
        />
      </Field>
      <button
        className="btn primary full"
        disabled={
          guard.waitSeconds > 0 || note.trim().length < 10 || !guard.locked
        }
        onClick={() => {
          try {
            const at = new Date().toISOString();
            const current = guardStatus(data, accountId, at);
            if (current.waitSeconds > 0)
              throw new Error("La pause n’est pas terminée.");
            update((j) =>
              j.overrides.push({
                accountId,
                day: nyDate(at),
                note: note.trim(),
                createdAt: at,
                until: new Date(Date.now() + 600000).toISOString(),
                reason: current.reasons.join(" · "),
              }),
            );
            onClose();
          } catch (e) {
            setError(String(e));
          }
        }}
      >
        Enregistrer une dérogation tracée
      </button>
      {error && <p className="error-message">{error}</p>}
    </Modal>
  );
}
export function SessionRoutine({
  date,
  onDate,
}: {
  date: string;
  onDate: (s: string) => void;
}) {
  const { data, update } = useApp();
  const stored = data.plans.find((p) => p.date === date);
  const plan = stored ?? {
    date,
    checks: [false, false, false, false, false, false],
    levels: "",
    optionLevels: "",
    volumeZones: "",
    events: "",
    mental: "Calme",
    allowedSetups: [],
    maxTrades: 3,
    validatedAt: null,
  };
  const review = data.reviews.find((r) => r.date === date);
  const [notice, setNotice] = useState("");
  return (
    <>
      <div className="routine-status">
        <span>
          <strong>{date ? dateLabel(date) : "Séance à choisir"}</strong> ·{" "}
          {plan.checks.filter(Boolean).length}/6 points préparés
        </span>
        <span>
          {plan.validatedAt ? "Préparation validée" : "Préparation à compléter"}{" "}
          · {review ? "Revue enregistrée" : "Revue à rédiger"}
        </span>
      </div>
      <div className="bottom-grid routine-columns">
        <Panel>
          <div className="panel-heading">
            <h2>Plan pré-session</h2>
            <Pill tone={plan.validatedAt ? "green" : "amber"}>
              {plan.validatedAt ? "VALIDÉ" : "À PRÉPARER"}
            </Pill>
          </div>
          <Field label="Séance · date New York">
            <input
              type="date"
              value={date}
              required
              onChange={(e) => {
                if (e.target.value) onDate(e.target.value);
              }}
            />
          </Field>
          <form
            key={date + ":plan"}
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              const checks = Array.from(
                { length: 6 },
                (_, i) => d.get("check" + i) === "on",
              );
              if (!checks.every(Boolean)) {
                setNotice("Coche les six points obligatoires.");
                return;
              }
              const p = {
                date,
                checks,
                levels: String(d.get("levels")),
                optionLevels: String(d.get("optionLevels")),
                volumeZones: String(d.get("volumeZones")),
                events: String(d.get("events")),
                mental: String(d.get("mental")),
                maxTrades: Number(d.get("maxTrades")),
                allowedSetups: d.getAll("setups").map(String),
                validatedAt: new Date().toISOString(),
              };
              if (!p.allowedSetups.length) {
                setNotice("Sélectionne au moins un setup autorisé.");
                return;
              }
              update(
                (j) =>
                  (j.plans = [...j.plans.filter((p) => p.date !== date), p]),
              );
              setNotice("Plan daté enregistré.");
            }}
          >
            <details className="plan-context-fields" open={!stored}>
              <summary>Niveaux et préparation du marché</summary>
              {[
                ["levels", "Biais HTF et niveaux clés"],
                ["optionLevels", "Call wall / put wall / zero gamma"],
                ["volumeZones", "POC / HVN / zones Bookmap"],
                ["events", "Calendrier économique · notes manuelles"],
              ].map(([k, label]) => (
                <Field label={label} key={k}>
                  <textarea
                    name={k}
                    defaultValue={String(plan[k as keyof typeof plan])}
                    rows={2}
                  />
                </Field>
              ))}
            </details>
            <div className="form-grid">
              <Field label="État mental">
                <input name="mental" defaultValue={plan.mental} />
              </Field>
              <Field label="Trades autorisés">
                <input
                  name="maxTrades"
                  type="number"
                  min="1"
                  max="1000"
                  required
                  defaultValue={plan.maxTrades}
                />
              </Field>
            </div>
            <h3>Setups autorisés</h3>
            <div className="confluence-list">
              {data.setups.map((s) => (
                <label key={s.id}>
                  <input
                    name="setups"
                    value={s.name}
                    type="checkbox"
                    defaultChecked={plan.allowedSetups.includes(s.name)}
                  />
                  {s.name}
                </label>
              ))}
            </div>
            {[
              "Biais HTF et niveaux cartographiés",
              "Niveaux d’option flow vérifiés",
              "Zones de volume repérées",
              "Annonces économiques vérifiées",
              "Énergie et état mental évalués",
              "Risque et setups autorisés définis",
            ].map((label, i) => (
              <label className="check-row" key={label}>
                <input
                  type="checkbox"
                  name={"check" + i}
                  defaultChecked={plan.checks[i]}
                />
                <span className="checkbox">✓</span>
                {label}
              </label>
            ))}
            <button className="btn primary full">
              Valider et enregistrer la session
            </button>
          </form>
        </Panel>
        <Panel>
          <h2>Revue post-session · 2 minutes</h2>
          <form
            key={date + ":review"}
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              update(
                (j) =>
                  (j.reviews = [
                    ...j.reviews.filter((r) => r.date !== date),
                    {
                      date,
                      planScore: Number(d.get("planScore")),
                      bestTradeId: String(d.get("bestTradeId")),
                      worstMistake: String(d.get("worstMistake")),
                      tomorrowAction: String(d.get("tomorrowAction")),
                    },
                  ]),
              );
              setNotice("Revue enregistrée.");
            }}
          >
            <Field label="Respect du plan · 0 à 10">
              <input
                name="planScore"
                type="number"
                min="0"
                max="10"
                defaultValue={review?.planScore ?? ""}
                required
              />
            </Field>
            <Field label="Meilleur trade">
              <select
                name="bestTradeId"
                defaultValue={review?.bestTradeId ?? ""}
              >
                <option value="">Aucun / pas de trade</option>
                {data.trades
                  .filter((t) => nyDate(t.enteredAt) === date)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.instrument} · {r(calculateNetR(t))}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Pire erreur">
              <textarea
                name="worstMistake"
                required
                defaultValue={review?.worstMistake}
                rows={4}
              />
            </Field>
            <Field label="Une action concrète pour demain">
              <textarea
                name="tomorrowAction"
                required
                defaultValue={review?.tomorrowAction}
                rows={4}
              />
            </Field>
            <button className="btn primary full">Enregistrer la revue</button>
          </form>
          <h3>Dernières revues</h3>
          {data.reviews
            .slice(-5)
            .reverse()
            .map((r) => (
              <div className="setup-row" key={r.date}>
                <div>
                  <strong>
                    {r.date} · {r.planScore}/10
                  </strong>
                  <p>{r.tomorrowAction}</p>
                </div>
              </div>
            ))}
          {notice && (
            <p role="status" className="success-message">
              {notice}
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
function calculateNetR(t: Trade) {
  return summarize([t]).r;
}
export function Playbook() {
  const { data, update } = useApp();
  const [edit, setEdit] = useState<Journal["setups"][number] | null>(null),
    [create, setCreate] = useState(false),
    [error, setError] = useState("");
  const [examples, setExamples] = useState<string[]>([]);
  return (
    <>
      <div className="view-toolbar">
        <p className="muted">
          Règles explicites et statistiques réelles · seuil de lecture{" "}
          {data.settings.minSample} trades
        </p>
        <button
          className="btn primary"
          onClick={() => {
            setCreate(true);
            setExamples([]);
          }}
        >
          Créer un setup
        </button>
      </div>
      <div className="playbook-grid setup-library">
        {data.setups.map((s) => {
          const stats = summarize(
            data.trades.filter((t) => t.setup === s.name),
          );
          return (
            <Panel key={s.id}>
              <Pill tone="neutral">
                {stats.count} trades ·{" "}
                {stats.count >= data.settings.minSample
                  ? "Seuil de lecture atteint"
                  : "Échantillon limité"}
              </Pill>
              <h2>{s.name}</h2>
              <h3>Entrée</h3>
              <p className="muted pre-line">{s.entryRules}</p>
              <h3>Invalidation</h3>
              <p className="muted pre-line">{s.invalidation}</p>
              {!!s.confluences?.length && <p className="footnote">Confluences : {s.confluences.join(" · ")}</p>}
              {!!s.history?.length && <details><summary>{s.history.length} version(s) précédente(s)</summary>{[...s.history].reverse().map((v,i)=><div key={i}><h4>{new Date(v.changedAt).toLocaleDateString("fr-FR")} · {v.name}</h4><p className="pre-line muted">{v.entryRules}</p><p className="pre-line muted">{v.invalidation}</p></div>)}</details>}
              <div className="setup-row">
                <span>Espérance observée</span>
                <strong
                  className={
                    stats.expectancy >= 0 ? "positive mono" : "negative mono"
                  }
                >
                  {r(stats.expectancy)}
                </strong>
              </div>
              {s.examples.length > 0 && (
                <Gallery
                  shots={s.examples.map((data, i) => ({
                    id: s.id + i,
                    phase: "Exemple",
                    data,
                    annotations: "[]",
                  }))}
                />
              )}
              <button
                className="btn secondary full"
                onClick={() => {
                  setEdit(s);
                  setExamples(s.examples);
                }}
              >
                Modifier le setup
              </button>
            </Panel>
          );
        })}
      </div>
      {(edit || create) && (
        <Modal
          title={edit ? "Modifier le setup" : "Nouveau setup"}
          onClose={() => {
            setEdit(null);
            setCreate(false);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const f = new FormData(e.currentTarget);
                const name = String(f.get("name")).trim();
                if (
                  data.setups.some((s) => s.name === name && s.id !== edit?.id)
                )
                  throw new Error("Ce nom de setup existe déjà.");
                const setup = {
                  id: edit?.id ?? crypto.randomUUID(),
                  name,
                  entryRules: String(f.get("entryRules")),
                  invalidation: String(f.get("invalidation")),
                  examples,
                  confluences: String(f.get("confluences")??"").split(",").map(s=>s.trim()).filter(Boolean),
                  history: edit ? [...(edit.history??[]),{changedAt:new Date().toISOString(),name:edit.name,entryRules:edit.entryRules,invalidation:edit.invalidation}].slice(-30) : [],
                };
                update((j) => {
                  if (edit) {
                    j.setups = j.setups.map((s) =>
                      s.id === edit.id ? setup : s,
                    );
                    j.trades = j.trades.map((t) =>
                      t.setup === edit.name ? { ...t, setup: name } : t,
                    );
                    j.plans = j.plans.map((p) => ({
                      ...p,
                      allowedSetups: p.allowedSetups.map((s) =>
                        s === edit.name ? name : s,
                      ),
                    }));
                  } else j.setups.push(setup);
                });
                setCreate(false);
                setEdit(null);
              } catch (e) {
                setError(String(e));
              }
            }}
          >
            <Field label="Nom">
              <input
                name="name"
                defaultValue={edit?.name}
                required
                maxLength={100}
              />
            </Field>
            <Field label="Règles d’entrée">
              <textarea
                name="entryRules"
                rows={4}
                defaultValue={edit?.entryRules}
                required
              />
            </Field>
            <Field label="Invalidation">
              <textarea
                name="invalidation"
                rows={3}
                defaultValue={edit?.invalidation}
                required
              />
            </Field>
            <Field label="Confluences propres au setup · séparées par des virgules"><input name="confluences" defaultValue={edit?.confluences?.join(", ")}/></Field>
            <label className="btn secondary">
              Ajouter des exemples
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  try {
                    const imgs = await Promise.all(
                      Array.from(e.target.files ?? []).map(loadImage),
                    );
                    if (examples.length + imgs.length > 10)
                      throw new Error("10 exemples maximum.");
                    setExamples([...examples, ...imgs]);
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              />
            </label>
            <Gallery
              shots={examples.map((data, i) => ({
                id: String(i),
                phase: "Exemple",
                data,
                annotations: "[]",
              }))}
            />
            {error && <p className="error-message">{error}</p>}
            <button className="btn primary full">Enregistrer le setup</button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Goals() {
  const { data, update } = useApp();
  const [create, setCreate] = useState(false);
  const streak = disciplineStreak(data);
  return (
    <>
      <div className="view-toolbar">
        <div>
          <h2>{streak} séance(s) revue(s) disciplinée(s) de suite</h2>
          <p className="muted">
            Basé sur les dernières revues notées au moins 8/10, indépendamment
            du profit. Les séances sans revue ne sont pas validées.
          </p>
        </div>
        <button className="btn primary" onClick={() => setCreate(true)}>
          Nouvel objectif
        </button>
      </div>
      <div className="playbook-grid">
        {data.goals.map((g) => {
          const trades = data.trades.filter(
            (t) => t.exitedAt >= g.startsAt && t.exitedAt <= g.endsAt,
          );
          const s = summarize(trades);
          const value =
            g.unit === "R"
              ? s.r
              : g.unit === "USD"
                ? s.net
                : (averagePlan(trades) ?? 0) * 10;
          return (
            <Panel key={g.id}>
              <h2>{g.label}{g.archivedAt ? " · Archivé" : ""}</h2>
              <strong className="detail-r mono">
                {num(value, 1)}
                <small>
                  {" "}
                  / {g.target} {g.unit === "DISCIPLINE" ? "points" : g.unit}
                </small>
              </strong>
              <div className="progress-track">
                <span
                  style={{
                    width: `${Math.max(0, Math.min(100, (value / g.target) * 100))}%`,
                  }}
                />
              </div>
              <p className="footnote">
                Du {g.startsAt.slice(0, 10)} au {g.endsAt.slice(0, 10)}.{" "}
                {g.unit === "DISCIPLINE"
                  ? "Moyenne des notes déclarées × 10."
                  : "Progression sur les clôtures renseignées."}
              </p>
              <button
                className="text-btn"
                onClick={() => {
                  update(j => { const goal = j.goals.find(x => x.id === g.id); if (goal) goal.archivedAt = goal.archivedAt ? undefined : new Date().toISOString(); });
                }}
              >
                {g.archivedAt ? "Réactiver l’objectif" : "Archiver l’objectif"}
              </button>
            </Panel>
          );
        })}
      </div>
      {!data.goals.length && (
        <Panel>
          <Empty text="Définis un objectif en R ou en discipline pour suivre tes progrès." />
        </Panel>
      )}
      {create && (
        <Modal title="Définir un objectif" onClose={() => setCreate(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const start = String(f.get("start")),
                end = String(f.get("end"));
              if (end < start) return;
              update((j) =>
                j.goals.push({
                  id: crypto.randomUUID(),
                  label: String(f.get("label")),
                  unit: f.get("unit") as "R",
                  target: Number(f.get("target")),
                  startsAt: zonedToUtc(start + "T00:00:00"),
                  endsAt: zonedToUtc(end + "T23:59:59"),
                }),
              );
              setCreate(false);
            }}
          >
            <Field label="Objectif">
              <input name="label" required maxLength={200} />
            </Field>
            <div className="form-grid">
              <Field label="Mesure">
                <select name="unit">
                  <option value="R">R-multiple</option>
                  <option value="USD">Dollars</option>
                  <option value="DISCIPLINE">Discipline / 100</option>
                </select>
              </Field>
              <Field label="Cible">
                <input
                  name="target"
                  type="number"
                  min=".01"
                  step="any"
                  required
                />
              </Field>
              <Field label="Début">
                <input name="start" type="date" required />
              </Field>
              <Field label="Fin">
                <input name="end" type="date" required />
              </Field>
            </div>
            <button className="btn primary full">Créer l’objectif</button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Reports({ trades, label }: { trades: Trade[]; label: string }) {
  const minimum = useApp(state => state.data.settings.minSample);
  const summary = reviewSummary(trades, minimum);
  return (
    <>
      <div className="view-toolbar">
        <div>
          <h2>Revue automatique · {label}</h2>
          <p className="muted">
            Les filtres de période et de compte s’appliquent à ce rapport.
          </p>
        </div>
        <button
          className="btn primary"
          onClick={() => void monthlyPdf(trades, label, minimum)}
        >
          Télécharger le PDF
        </button>
      </div>
      <div className="metrics-grid">
        <Panel>
          <span className="eyebrow">BILAN NET</span>
          <strong className="block-value mono">{r(summary.stats.r)}</strong>
        </Panel>
        <Panel>
          <span className="eyebrow">DÉCISIONS ANALYSÉES</span>
          <strong className="block-value mono">{summary.stats.count}</strong>
        </Panel>
      </div>
      <div className="bottom-grid">
        <Panel>
          <h2>Trois fuites à examiner</h2>
          {summary.leaks.map((s) => (
            <div className="setup-row" key={s.category + s.label}>
              <div>
                <strong>
                  {s.category} · {s.label}
                </strong>
                <small>
                  {s.count} trades · {r(s.expectancy)} par trade
                </small>
              </div>
              <strong className="negative">{r(s.r)}</strong>
            </div>
          ))}
          {!summary.leaks.length && (
            <Empty text="Aucun groupe perdant avec l’effectif minimal." />
          )}
        </Panel>
        <Panel>
          <h2>Trois forces observées</h2>
          {summary.strengths.map((s) => (
            <div className="setup-row" key={s.category + s.label}>
              <div>
                <strong>{s.label}</strong>
                <small>{s.count} trades</small>
              </div>
              <strong className="positive">{r(s.expectancy)} / trade</strong>
            </div>
          ))}
        </Panel>
      </div>
      <div className="briefing">
        <strong>OBJECTIF DE LA PROCHAINE SÉANCE</strong>
        <p>{summary.action}</p>
      </div>
    </>
  );
}
