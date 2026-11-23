"use client";
import { useEffect, useRef, useState } from "react";
import { InstrumentMark } from "./instrument-mark";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  FileText,
  Image as ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  calculateTrade,
  EXIT_REASONS,
  localDateTime,
  summarize,
  type Journal,
  type Trade,
} from "@edge/core";
import { r, signedMoney, money, Modal } from "./kit";
import { TradeStatus } from "./trade-ui";
import { dateLabel } from "./view-data";
import { CaptureImage, ImageCanvas } from "./screenshots";

export default function JournalInspector({
  trade,
  trades,
  journal,
  day,
  active,
  onOpen,
  onEdit,
  onDelete,
  onReview,
  onToggleReview,
}: {
  trade?: Trade;
  trades: Trade[];
  journal: Journal;
  day?: string;
  active: boolean;
  onOpen: (trade: Trade, context?: Trade[]) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
  onReview: (day: string) => void;
  onToggleReview?: (trade: Trade) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [captureId, setCaptureId] = useState<string | null>(null);
  const capture = trade?.screenshots?.find(shot => shot.id === captureId);
  useEffect(() => {
    const rail = railRef.current, panel = panelRef.current;
    if (!rail || !panel) return;
    let frame = 0;
    const sync = () => {
      const desktop = window.matchMedia("(min-width: 1101px)").matches;
      const top = parseFloat(getComputedStyle(rail).getPropertyValue("--journal-inspector-top")) || 294;
      const bounds = rail.getBoundingClientRect();
      const pinned = desktop && bounds.top <= top;
      rail.style.minHeight = desktop ? `${panel.offsetHeight}px` : "";
      panel.dataset.pinned = String(pinned);
      panel.style.left = pinned ? `${bounds.left}px` : "";
      panel.style.width = pinned ? `${bounds.width}px` : "";
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(rail);
    observer.observe(panel);
    const stats = document.querySelector(".journal-stats");
    if (stats) observer.observe(stats);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  const reviewed = trade?.reviewStatus === "REVIEWED";
  const price = (value: number) =>
    value.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
  const metrics = trade ? calculateTrade(trade) : null;
  const enteredAt = trade ? localDateTime(trade.enteredAt) : "";
  const planScore = trade?.planScore ?? 0;
  const session = day ? summarize(trades) : null;
  const review = journal.reviews.find((review) => review.date === day);
  return (
    <div className="journal-inspector-slot" ref={railRef} data-active={active}>
    <aside
      ref={panelRef}
      className="journal-inspector"
      data-active={active}
      aria-label="Détail de la sélection"
    >
      {day && session && (
        <section className="inspector-session">
          <span className="eyebrow">SÉANCE SÉLECTIONNÉE</span>
          <h2>{dateLabel(day)}</h2>
          <button
            type="button"
            className="text-btn inspector-calendar-return"
            onClick={() =>
              document
                .querySelector(".journal-calendar")
                ?.scrollIntoView({ block: "start", behavior: "instant" })
            }
          >
            Retour au calendrier
          </button>
          <strong
            className={
              "inspector-session-result mono " +
              (session.net > 0 ? "positive" : session.net < 0 ? "negative" : "")
            }
          >
            {r(session.r)}
          </strong>
          <p>
            {session.count} exécutions · {signedMoney(session.net)}
          </p>
          <button
            type="button"
            className="text-btn"
            onClick={() => onReview(day)}
          >
            <CalendarDays size={14} />
            Plan et revue de la séance <ArrowUpRight size={14} />
          </button>
          {review && (
            <div className="inspector-session-review">
              <span className="eyebrow">ACTION POUR DEMAIN</span>
              <p className="pre-line">
                {review.tomorrowAction || "Aucune action renseignée."}
              </p>
            </div>
          )}
        </section>
      )}
      {trade && metrics ? (
        <section className="inspector-trade" key={trade.id}>
          <div className="inspector-heading">
            <span className="eyebrow">EXÉCUTION SÉLECTIONNÉE</span>
            <span className="pill neutral">
              {trade.direction === "LONG" ? "Achat" : "Vente"}
            </span>
          </div>
          <div className="inspector-identity">
            <InstrumentMark symbol={trade.instrument} />
            <div>
              <h2>{trade.instrument}</h2>
              <span>
                {dateLabel(enteredAt.slice(0, 10))} · {enteredAt.slice(11, 16)} ET
              </span>
            </div>
          </div>
          <h3 className="inspector-setup">{trade.setup}</h3>
          <p className="inspector-account">
            {journal.accounts.find((account) => account.id === trade.accountId)
              ?.name ?? "Compte non renseigné"}
          </p>
          {onToggleReview && (
            <button
              type="button"
              className="review-toggle"
              aria-pressed={reviewed}
              onClick={() => onToggleReview(trade)}
            >
              <Check size={13} aria-hidden="true" />
              {reviewed ? "Revue terminée" : "Marquer comme revu"}
            </button>
          )}
          <div className="inspector-outcome">
            <div className="inspector-result">
              <span className="eyebrow">Résultat net</span>
              <strong
                className={
                  "mono " +
                  (metrics.net > 0
                    ? "positive"
                    : metrics.net < 0
                      ? "negative"
                      : "")
                }
              >
                {metrics.riskKnown ? r(metrics.realizedR) : "R inconnu"}
              </strong>
              <span className="mono">{signedMoney(metrics.net)}</span>
            </div>
            <div className="inspector-score">
              <TradeStatus trade={trade} score />
              {planScore > 0 && (
                <div className="inspector-score-track" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, index) => (
                    <span
                      key={index}
                      data-on={
                        index < Math.round(planScore) ? "true" : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <dl className="inspector-facts">
            <div>
              <dt>Risque initial</dt>
              <dd className="mono">{metrics.riskKnown ? money(metrics.risk) : "Non renseigné"}</dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>{trade.session}</dd>
            </div>
            <div>
              <dt>État avant</dt>
              <dd>{trade.mentalBefore || "Non renseigné"}</dd>
            </div>
          </dl>
          <section className="inspector-executions">
            <div className="inspector-executions-head">
              <span className="eyebrow">EXÉCUTIONS</span>
              <span className="mono">
                {1 + (trade.exits?.length ?? 0)}{" "}
                {trade.exits?.length ? "remplissages" : "remplissage"}
              </span>
            </div>
            <ol>
              <li>
                <span className="exec-tag entry">Entrée</span>
                <span className="exec-detail">
                  {trade.direction === "LONG" ? "Achat" : "Vente"} ·{" "}
                  {trade.quantity} × {price(trade.entry)}
                </span>
                <small className="mono">
                  {localDateTime(trade.enteredAt).slice(11, 16)}
                </small>
              </li>
              {(trade.exits ?? []).map((exit) => (
                <li key={exit.id}>
                  <span className="exec-tag exit">Sortie</span>
                  <span className="exec-detail">
                    {exit.quantity} × {price(exit.price)} ·{" "}
                    {EXIT_REASONS[exit.reason]}
                  </span>
                  <small className="mono">
                    {localDateTime(exit.at).slice(11, 16)}
                  </small>
                </li>
              ))}
            </ol>
            {!trade.exits?.length && (
              <p className="footnote">
                Sortie unique enregistrée. Les sorties partielles apparaissent
                ici, dans l’ordre du marché.
              </p>
            )}
          </section>
          <div className="inspector-note">
            <span className="inspector-note-icon">
              <FileText size={15} aria-hidden="true" />
            </span>
            <div>
              <span className="eyebrow">Note d’exécution</span>
              <p className="pre-line">
                {trade.notes || "Aucune note enregistrée pour cette exécution."}
              </p>
            </div>
          </div>
          {trade.screenshots?.length ? (
            <button type="button" className="inspector-capture-button"
              onClick={() => setCaptureId(trade.screenshots?.[0]?.id ?? null)}>
              <CaptureImage src={trade.screenshots[0].data} alt="Aperçu de la première capture" />
              <span>{trade.screenshots.length} capture{trade.screenshots.length > 1 ? "s" : ""} · Voir en grand</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          ) : (
            <div className="inspector-no-capture">
              <ImageIcon size={16} aria-hidden="true" />
              <span>Capture</span>
              <strong>Aucune</strong>
            </div>
          )}
          <div className="inspector-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => onOpen(trade, trades)}
            >
              Ouvrir la fiche <ArrowUpRight size={15} />
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => onEdit(trade)}
            >
              <Pencil size={14} />
              Modifier
            </button>
            <button
              type="button"
              className="btn secondary danger"
              onClick={() => onDelete(trade)}
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        </section>
      ) : (
        <div className="inspector-empty">
          <FileText size={27} aria-hidden="true" />
          <h2>
            {day ? "Aucune exécution ce jour" : "Aucune exécution sélectionnée"}
          </h2>
          <p>
            {day
              ? "Choisis une autre séance dans le calendrier."
              : "Les détails de tes trades s’afficheront ici."}
          </p>
        </div>
      )}
    </aside>
    {capture && <Modal title="Captures du trade" onClose={() => setCaptureId(null)}>
      <div className="inspector-capture-picker" role="group" aria-label="Choisir une capture">
        {trade?.screenshots?.map((shot, index) => <button type="button" className="btn secondary" key={shot.id}
          aria-pressed={shot.id === capture.id} onClick={() => setCaptureId(shot.id)}>
          {index + 1} · {shot.phase}
        </button>)}
      </div>
      <ImageCanvas shot={capture} />
      {capture.caption && <p className="pre-line">{capture.caption}</p>}
    </Modal>}
    </div>
  );
}
