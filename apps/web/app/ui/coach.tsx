"use client";
import { useEffect, useState } from "react";
import {
  coachReply,
  behavioralAnalysis,
  summarize,
  type Trade,
} from "@edge/core";
import { useApp } from "../../lib/client-store";
import { Panel, Field, Pill } from "./kit";
export default function Coach({ trades, scope }: { trades: Trade[]; scope?: string }) {
  const { data, update } = useApp();
  const [question, setQuestion] = useState(
      "Pourquoi ai-je perdu dans certains contextes ?",
    ),
    [api, setApi] = useState(false),
    [configuration, setConfiguration] = useState<"loading" | "ready" | "missing" | "error">("loading"),
    [provider, setProvider] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/coach", { cache: "no-store", signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Configuration indisponible.");
        return r.json();
      })
      .then((r) => {
        setConfiguration(r.configured ? "ready" : "missing");
        setProvider(typeof r.provider === "string" ? r.provider : "");
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfiguration("error");
      });
    return () => controller.abort();
  }, []);
  const configured = configuration === "ready";
  const providerName = provider === "generativelanguage.googleapis.com" ? "Google Gemini" : provider;
  async function ask() {
    if (!question.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      let answer = coachReply(question, trades, data.settings.minSample);
      if (api) {
        if (!configured) throw new Error("Le Coach IA est indisponible pour le moment. Recharge la page pour vérifier sa connexion.");
        if (!consent) throw new Error("Autorise l’envoi de tes statistiques dans les options du coach ci-dessus.");
        const summary = {
          statistics: summarize(trades),
          groups: behavioralAnalysis(trades, data.settings.minSample).map(
            (g) => ({
              category: g.category,
              label: g.label,
              count: g.count,
              r: g.r,
              expectancy: g.expectancy,
              winRate: g.winRate,
            }),
          ),
        };
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            summary: JSON.stringify({
              ...summary,
              statistics: { ...summary.statistics, curve: undefined },
            }),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        answer = json.text;
      }
      update((j) => {
        const createdAt = new Date().toISOString();
        const context = `${scope ?? "Sélection active"} · ${trades.length} clôtures · seuil ${data.settings.minSample}`;
        j.messages.push(
          {
            id: crypto.randomUUID(),
            role: "user",
            content: question,
            createdAt,
            source: api ? "api" : "local",
            scope: context,
          },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: answer,
            createdAt,
            source: api ? "api" : "local",
            scope: context,
          },
        );
      });
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le coach est indisponible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="coach-layout">
      <Panel>
        <div className="panel-heading">
          <div>
            <span className="eyebrow accent-text">Revue de la sélection</span>
            <h2>Coach d’exécution</h2>
          </div>
          <Pill tone="neutral">{api ? "COACH IA" : "COACH INTÉGRÉ"}</Pill>
        </div>
        <p className="muted">
          Les filtres actifs définissent les données analysées.{" "}
          {api
            ? "Le coach IA analyse les statistiques de cette sélection avec ton consentement."
            : "Le coach intégré donne une réponse structurée et fonctionne sans Internet."}
        </p>
        <div className="coach-selection-note">
          <Pill tone="neutral">{trades.length} exécutions</Pill>
          <span>Les mêmes filtres que le journal</span>
        </div>
        <div className="coach-config" role="group" aria-label="Options du coach">
          <label className="check-inline">
            <input
              type="checkbox"
              checked={api}
              disabled={!configured || busy}
              onChange={(e) => { setApi(e.target.checked); setError(""); }}
            />
            Utiliser le Coach IA
          </label>
          <p className="footnote" role="status">
            {configuration === "loading" ? "Vérification de la connexion au Coach IA…"
              : configured ? "Coach IA connecté : " + providerName
              : configuration === "error" ? "Impossible de vérifier la connexion au Coach IA. Recharge la page pour réessayer."
              : "Le Coach IA n’est pas activé. Le coach intégré reste disponible."}
          </p>
          {api && (
            <>
              <label className="check-inline">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={busy}
                  onChange={(e) => { setConsent(e.target.checked); setError(""); }}
                />
                J’autorise l’envoi de ma question et des statistiques filtrées à {providerName}.
              </label>
              <p className="footnote">Les captures, notes brutes, email et clés sont exclus de cet envoi.</p>
            </>
          )}
        </div>
        <div className="chat-list">
          {!data.messages.length && (
            <div className="chat-bubble assistant">
              Commence par « Quel est mon meilleur setup sur le NQ ? ». Le coach
              intégré analyse les groupes mesurés ; il ne voit pas le marché en
              direct.
            </div>
          )}
          {data.messages.slice(-30).map((m) => (
            <div key={m.id} className={"chat-bubble " + m.role}>
              <small>
                {m.role === "user"
                  ? "TOI"
                  : m.source === "api"
                    ? "COACH IA"
                    : "COACH INTÉGRÉ"}{" "}
                · {new Date(m.createdAt).toLocaleDateString("fr-FR")}
              </small>
              {m.scope && <p className="footnote">{m.scope}</p>}
              <p className="pre-line">{m.content}</p>
            </div>
          ))}
        </div>
        <div className="suggested-questions">
          {[
            "Quel est mon meilleur setup sur le NQ ?",
            "Pourquoi ai-je perdu dans cette sélection ?",
            "Que changer pour ma prochaine séance ?",
          ].map((q) => (
            <button
              className="btn secondary"
              key={q}
              onClick={() => setQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
        >
          <Field label="Ta question">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={2000}
              rows={3}
              required
            />
          </Field>
          {api && !consent && (
            <p id="coach-consent-help" className="footnote" role="status">
              Coche l’autorisation dans les options du coach ci-dessus pour activer l’analyse IA.
            </p>
          )}
          <button
            className="btn primary full"
            disabled={busy || !question.trim() || (api && (!configured || !consent))}
            aria-describedby={api && !consent ? "coach-consent-help" : undefined}
          >
            {busy ? "Analyse en cours…" : "Analyser ma question"}
          </button>
        </form>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
      </Panel>
    </div>
  );
}
