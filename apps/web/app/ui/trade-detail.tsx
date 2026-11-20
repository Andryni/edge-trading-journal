"use client";
import { InstrumentMark } from "./instrument-mark";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { calculateTrade, localDateTime, type Trade } from "@edge/core";
import {
  Empty,
  Pill,
  SectionHeading,
  Stat,
  Tabs,
  money,
  num,
  r,
  signedMoney,
} from "./kit";
import { Gallery, ImageCanvas } from "./screenshots";
import { TradeStatus } from "./trade-ui";
import { EXIT_REASONS, isPlanRated } from "@edge/core";

export default function TradeDetail({
  trade,
  accountName,
  contextLabel,
  position,
  count,
  onPrevious,
  onNext,
  onClose,
  onEdit,
  onDelete,
  onSession,
  onReview,
}: {
  trade: Trade;
  accountName: string;
  contextLabel: string;
  position: number;
  count: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSession: () => void;
  onReview: () => void;
}) {
  const page = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    page.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector('[role="dialog"]'))
        close.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      requestAnimationFrame(() => previous?.focus({ preventScroll: true }));
    };
  }, []);
  const metrics = calculateTrade(trade);
  const [tab, setTab] = useState<"execution" | "notes" | "captures">(
    "execution",
  );
  const [remove, setRemove] = useState(false);
  useEffect(() => setRemove(false), [trade.id]);
  const captures = trade.screenshots ?? [];
  const duration = Math.max(
    0,
    Date.parse(trade.exitedAt) - Date.parse(trade.enteredAt),
  );
  const minutes = Math.floor(duration / 60000);
  const durationText =
    minutes < 1
      ? "< 1 min"
      : minutes < 60
        ? minutes + " min"
        : Math.floor(minutes / 60) +
          " h " +
          (minutes % 60 ? (minutes % 60) + " min" : "");
  return (
    <section
      ref={page}
      className="trade-review-page"
      tabIndex={-1}
      aria-label={trade.instrument + " · fiche d’exécution"}
    >
      <div className="review-page-heading">
        <div>
          <span className="eyebrow">JOURNAL / REVUE D’EXÉCUTION</span>
          <h1>{trade.instrument} · fiche d’exécution</h1>
        </div>
        <span className="pill neutral">
          {localDateTime(trade.exitedAt).slice(0, 10)} · New York
        </span>
      </div>
      <div className="trade-navigation">
        <button type="button" className="back-link" onClick={onClose}>
          <ArrowLeft size={14} aria-hidden="true" />
          Revenir à la sélection
        </button>
        <span className="trade-navigation-context" title={contextLabel}>
          {contextLabel}
        </span>
        <div className="trade-navigation-arrows">
          <span className="mono">
            {Math.max(1, position + 1)} / {Math.max(1, count)}
          </span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Exécution précédente"
            disabled={!onPrevious}
            onClick={onPrevious}
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Exécution suivante"
            disabled={!onNext}
            onClick={onNext}
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="trade-identity">
        <div>
          <div className="trade-identity-line">
            <InstrumentMark symbol={trade.instrument} />
            <div>
              <h3>{trade.setup}</h3>
              <p>
                {trade.session} · {trade.timeframe} · Qualité {trade.quality}
              </p>
            </div>
          </div>
          <div className="trade-identity-meta">
            <Pill tone="neutral">
              {trade.direction === "LONG" ? "↗ Achat" : "↘ Vente"}
            </Pill>
            <span>{accountName}</span>
            <TradeStatus trade={trade} />
          </div>
        </div>
        <div
          className={
            "trade-outcome " +
            (metrics.net > 0
              ? "positive"
              : metrics.net < 0
                ? "negative"
                : "muted")
          }
        >
          <span>Résultat net</span>
          <strong className="mono">{metrics.riskKnown ? r(metrics.realizedR) : "R inconnu"}</strong>
          <small className="mono">{signedMoney(metrics.net)}</small>
        </div>
      </div>
      <dl className="stat-strip trade-stat-strip">
        <Stat label="Risque initial" value={metrics.riskKnown ? money(metrics.risk) : "Non renseigné"} />
        <Stat label="Objectif prévu" value={metrics.riskKnown && metrics.targetKnown ? num(metrics.plannedR) + " R" : "Non renseigné"} />
        <Stat
          label="Position"
          value={num(trade.quantity, Number.isInteger(trade.quantity) ? 0 : 2)}
          sub={trade.category === "CFD" ? "lot(s)" : trade.category === "FUTURE" ? "contrat(s)" : "contrat(s) / lot(s)"}
        />
        <Stat label="Durée" value={durationText} />
        <Stat label="Frais" value={money(trade.fees)} />
      </dl>
      <Tabs
        id="trade-detail-mode"
        label="Détail de l’exécution"
        value={tab}
        onChange={setTab}
        options={[
          { value: "execution", label: "Exécution" },
          { value: "notes", label: "Notes et contexte" },
          { value: "captures", label: "Captures", count: captures.length },
        ]}
      />
      <div
        className="trade-detail-content"
        id="trade-detail-mode-panel"
        role="tabpanel"
        aria-labelledby={"trade-detail-mode-" + tab}
      >
        {tab === "execution" && (
          <div className="trade-execution-layout">
            <section className="trade-levels-section">
              <TradeScreenshots key={trade.id} trade={trade} onEdit={onEdit} />
              <SectionHeading
                title="Niveaux de l’exécution"
                description="Prix renseignés dans le journal"
              />
              <PriceLevels trade={trade} />
              <div className="execution-events">
                <div>
                  <span className="event-dot" />
                  <div>
                    <strong>Entrée</strong>
                    <time dateTime={trade.enteredAt}>
                      {localDateTime(trade.enteredAt).replace("T", " ")} ET
                    </time>
                  </div>
                  <b className="mono">{num(trade.entry)}</b>
                </div>
                <div>
                  <span className="event-dot exit-event" />
                  <div>
                    <strong>Sortie</strong>
                    <time dateTime={trade.exitedAt}>
                      {localDateTime(trade.exitedAt).replace("T", " ")} ET
                    </time>
                  </div>
                  <b className="mono">{num(trade.exit)}</b>
                </div>
              </div>
            </section>
            <aside className="trade-reading">
              <SectionHeading title="Lecture de l’exécution" />
              <dl className="reading-list">
                <Stat label="Motif de clôture" value={EXIT_REASONS[trade.exitReason ?? "UNKNOWN"]}/>
                <Stat label="Revue" value={trade.reviewStatus === "REVIEWED" ? "Terminée" : "À revoir"}/>
                <Stat
                  label="Respect du plan déclaré"
                  value={
                    !isPlanRated(trade)
                      ? "Non renseigné"
                      : trade.planScore + " / 10"
                  }
                />
                <Stat
                  label="Résultat brut"
                  value={signedMoney(metrics.gross)}
                />
                <Stat
                  label="MFE renseignée"
                  value={trade.mfeR === undefined ? "—" : r(trade.mfeR)}
                />
                <Stat
                  label="MAE renseignée"
                  value={trade.maeR === undefined ? "—" : r(trade.maeR)}
                />
              </dl>
              {trade.exitNote && <p className="pre-line">{trade.exitNote}</p>}
              {!!trade.exits?.length && <div className="execution-events"><h4>Sorties partielles</h4>{trade.exits.map(x => <div key={x.id}><strong>{EXIT_REASONS[x.reason]}</strong><span>{x.quantity} × {num(x.price)}</span><time>{localDateTime(x.at)} ET</time></div>)}</div>}
              {!!trade.management?.length && <div className="execution-events"><h4>Gestion du trade</h4>{[...trade.management].sort((a,b)=>a.at.localeCompare(b.at)).map(x => <div key={x.id}><strong>{x.kind === "STOP" ? "Stop déplacé" : x.kind === "TARGET" ? "Objectif ajusté" : "Observation"}</strong><span>{x.price ? num(x.price) : ""} {x.note}</span><time>{localDateTime(x.at)} ET</time></div>)}</div>}
              {trade.tags?.includes("R hypothétique") && (
                <p className="trade-data-note amber-text">
                  Le risque initial de cette exécution est hypothétique.
                </p>
              )}
              <div className="execution-note">
                <FileText size={15} aria-hidden="true" />
                <div>
                  <h4>Note d’exécution</h4>
                  <p className="pre-line">
                    {trade.notes || "Aucune note sur cette exécution."}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
        {tab === "notes" && (
          <div className="trade-notes-layout">
            <section>
              <SectionHeading title="Avant et après le trade" />
              <dl className="mental-context">
                <Stat
                  label="Avant"
                  value={trade.mentalBefore || "Non renseigné"}
                />
                <Stat
                  label="Après"
                  value={trade.mentalAfter || "Non renseigné"}
                />
                <Stat label="Énergie" value={trade.energy === null ? "Non renseigné" : trade.energy + " / 5"} />
                <Stat label="Stress" value={trade.stress === null ? "Non renseigné" : trade.stress + " / 5"} />
                <Stat label="Sommeil" value={trade.sleep === null ? "Non renseigné" : num(trade.sleep, 1) + " h"} />
              </dl>
              <div className="trade-tag-section">
                <h3>Confluences et tags</h3>
                <div className="tag-row">
                  {[...trade.confluences, ...(trade.tags ?? [])].map(
                    (tag, index) => (
                      <Pill tone="neutral" key={tag + index}>
                        {tag}
                      </Pill>
                    ),
                  )}
                  {!trade.confluences.length && !trade.tags?.length && (
                    <p className="muted">Aucun tag renseigné.</p>
                  )}
                </div>
              </div>
            </section>
            <section className="review-notes">
              <SectionHeading title="Revue personnelle" />
              {[
                ["Ce que j’ai bien fait", trade.didWell],
                ["Ce que j’ai mal fait", trade.didWrong],
                ["Leçon pour la suite", trade.lesson],
              ]
                .filter(([, text]) => text)
                .map(([label, text]) => (
                  <article key={label}>
                    <h3>{label}</h3>
                    <p className="pre-line">{text}</p>
                  </article>
                ))}
              {!trade.didWell && !trade.didWrong && !trade.lesson && (
                <div className="context-empty">
                  <FileText size={24} aria-hidden="true" />
                  <h3>Une revue à compléter</h3>
                  <p>
                    Note la décision à conserver et celle à corriger pour la
                    prochaine séance.
                  </p>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={onEdit}
                  >
                    Compléter les notes
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
        {tab === "captures" && (
          <section className="trade-captures">
            <SectionHeading
              title="Captures de l’exécution"
              description="Images et annotations enregistrées"
              actions={
                <button
                  type="button"
                  className="btn secondary"
                  onClick={onEdit}
                >
                  <Pencil size={14} aria-hidden="true" />
                  Gérer les captures
                </button>
              }
            />
            {captures.length ? (
              <Gallery shots={captures} />
            ) : (
              <div className="context-empty">
                <ImageIcon size={28} aria-hidden="true" />
                <h3>Aucune capture enregistrée</h3>
                <p>
                  Ajoute tes graphiques avant et après le trade pour documenter
                  la décision.
                </p>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={onEdit}
                >
                  Ajouter une capture
                </button>
              </div>
            )}
          </section>
        )}
      </div>
      {remove && (
        <div className="trade-remove-confirm" role="alert">
          <p>
            Une sauvegarde complète sera téléchargée avant le retrait de cette
            exécution.
          </p>
          <div>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setRemove(false)}
            >
              Annuler
            </button>
            <button type="button" className="btn primary" onClick={onDelete}>
              Sauvegarder puis retirer
            </button>
          </div>
        </div>
      )}
      <div className="trade-detail-footer">
        <button
          type="button"
          className="text-btn danger-text"
          onClick={() => setRemove(true)}
        >
          <Trash2 size={14} aria-hidden="true" />
          Retirer l’exécution
        </button>
        <div>
          <button type="button" className="btn secondary" onClick={onSession}>
            Voir la séance <ArrowUpRight size={14} aria-hidden="true" />
          </button>
          <button type="button" className="btn secondary" onClick={onReview}>
            <CalendarDays size={14} aria-hidden="true" />
            Plan et revue
          </button>
          <button type="button" className="btn primary" onClick={onEdit}>
            <Pencil size={14} aria-hidden="true" />
            Modifier le trade
          </button>
        </div>
      </div>
    </section>
  );
}
function PriceLevels({ trade }: { trade: Trade }) {
  const values = [
    { label: "Stop initial", value: trade.stop, kind: "stop" },
    { label: "Entrée", value: trade.entry, kind: "entry" },
    { label: "Sortie", value: trade.exit, kind: "exit" },
    { label: "Objectif", value: trade.target, kind: "target" },
  ];
  const min = Math.min(...values.map((item) => item.value));
  const max = Math.max(...values.map((item) => item.value));
  const range = max - min || 1;
  return (
    <div className="price-levels">
      {values.map((item) => (
        <div className={"price-level " + item.kind} key={item.kind}>
          <span>{item.label}</span>
          <div className="level-rail" aria-hidden="true">
            <i style={{ left: 8 + ((item.value - min) / range) * 84 + "%" }} />
          </div>
          <strong className="mono">{num(item.value)}</strong>
        </div>
      ))}
      <div className="level-scale" aria-hidden="true">
        <span className="mono">{num(min)}</span>
        <span>Échelle de prix</span>
        <span className="mono">{num(max)}</span>
      </div>
    </div>
  );
}

function TradeScreenshots({
  trade,
  onEdit,
}: {
  trade: Trade;
  onEdit: () => void;
}) {
  const shots = trade.screenshots ?? [];
  const [selected, setSelected] = useState(shots[0]?.id);
  const shot = shots.find((shot) => shot.id === selected) ?? shots[0];
  return (
    <section className="trade-review-visual">
      <SectionHeading
        title="Lecture visuelle"
        description="Captures et annotations de l’exécution"
        actions={
          <span className="pill neutral">
            {shots.length} capture{shots.length !== 1 ? "s" : ""}
          </span>
        }
      />
      {shot ? (
        <>
          <div className="review-main-capture">
            <ImageCanvas key={shot.id} shot={shot} />
            <Gallery shots={[shot]} />
          </div>
          <div
            className="review-capture-selector"
            role="group"
            aria-label="Choisir une capture"
          >
            {shots.map((shot, index) => (
              <button
                type="button"
                key={shot.id}
                aria-pressed={selected === shot.id}
                onClick={() => setSelected(shot.id)}
              >
                {shot.phase} · {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="review-capture-empty">
          <ImageIcon size={35} aria-hidden="true" />
          <h3>Le contexte visuel de ton exécution</h3>
          <p>Aucune capture enregistrée pour ce trade.</p>
          <button type="button" className="btn secondary" onClick={onEdit}>
            <ImageIcon size={15} />
            Ajouter une capture
          </button>
        </div>
      )}
    </section>
  );
}
