"use client";
import { InstrumentMark } from "./instrument-mark";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Pencil,
} from "lucide-react";
import {
  calculateTrade,
  localDateTime,
  summarize,
  type Journal,
  type Trade,
} from "@edge/core";
import { r, signedMoney, money } from "./kit";
import { TradeStatus } from "./trade-ui";
import { dateLabel } from "./view-data";
import { Gallery } from "./screenshots";

export default function JournalInspector({
  trade,
  trades,
  journal,
  day,
  active,
  onOpen,
  onEdit,
  onReview,
}: {
  trade?: Trade;
  trades: Trade[];
  journal: Journal;
  day?: string;
  active: boolean;
  onOpen: (trade: Trade, context?: Trade[]) => void;
  onEdit: (trade: Trade) => void;
  onReview: (day: string) => void;
}) {
  const metrics = trade ? calculateTrade(trade) : null;
  const session = day ? summarize(trades) : null;
  const review = journal.reviews.find((review) => review.date === day);
  return (
    <aside
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
              <span>{localDateTime(trade.enteredAt).replace("T", " ")} ET</span>
            </div>
          </div>
          <h3 className="inspector-setup">{trade.setup}</h3>
          <p className="inspector-account">
            {journal.accounts.find((account) => account.id === trade.accountId)
              ?.name ?? "Compte non renseigné"}
          </p>
          <div className="inspector-result">
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
          <TradeStatus trade={trade} score />
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
          <div className="inspector-note">
            <FileText size={15} aria-hidden="true" />
            <p className="pre-line">
              {trade.notes || "Aucune note enregistrée pour cette exécution."}
            </p>
          </div>
          {trade.screenshots?.length ? (
            <div className="inspector-capture">
              <Gallery shots={trade.screenshots.slice(0, 1)} />
            </div>
          ) : (
            <div className="inspector-no-capture">
              <ImageIcon size={18} aria-hidden="true" />
              <span>Aucune capture enregistrée</span>
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
  );
}
