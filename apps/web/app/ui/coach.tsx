"use client";
import { useEffect, useState } from "react";
import {
  coachReply,
  behavioralAnalysis,
  summarize,
  type Trade,
} from "@edge/core";
import { useApp } from "../../lib/client-store";
import { Panel, Field, Pill, r } from "./kit";
export default function Coach({ trades, scope }: { trades: Trade[]; scope?: string }) {
  const { data, update } = useApp();
  const [question, setQuestion] = useState(
      "Pourquoi ai-je perdu dans certains contextes ?",
    ),
    [api, setApi] = useState(false),
    [configured, setConfigured] = useState(false),
    [provider, setProvider] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/coach")
      .then((r) => r.json())
      .then((r) => {
        setConfigured(r.configured);
        setProvider(r.provider);
      })
      .catch(() => {});
  }, []);
  async function ask() {
    if (!question.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      let answer = coachReply(question, trades, data.settings.minSample);
      if (api) {
        if (!configured || !consent)
          throw new Error(
            "Active le consentement et configure le fournisseur côté serveur.",
          );
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
            <span className="eyebrow violet-text">Revue de la sélection</span>
            <h2>Coach d’exécution</h2>
          </div>
          <Pill tone="neutral">{api ? "API DISTANTE" : "ANALYSE LOCALE"}</Pill>
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
        <div className="chat-list">
          {!data.messages.length && (
            <div className="chat-bubble assistant">
              Commence par « Quel est mon meilleur setup sur le NQ ? ». Le coach
              local analyse les groupes mesurés ; il ne voit pas le marché en
              direct.
            </div>
          )}
          {data.messages.slice(-30).map((m) => (
            <div key={m.id} className={"chat-bubble " + m.role}>
              <small>
                {m.role === "user"
                  ? "TOI"
                  : m.source === "api"
                    ? "COACH API"
                    : "COACH LOCAL"}{" "}
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
          <button
            className="btn primary full"
            disabled={busy || !question.trim()}
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
      <Panel className="coach-config">
        <h2>Activer une API de langage</h2>
        <p className="footnote">
          La clé et le modèle sont configurés dans le fichier d’environnement du
          serveur. La clé n’est jamais envoyée au navigateur.
        </p>
        <label className="check-inline">
          <input
            type="checkbox"
            checked={api}
            disabled={!configured}
            onChange={(e) => setApi(e.target.checked)}
          />
          Utiliser le fournisseur configuré
        </label>
        <p className="footnote">
          {configured
            ? "API configurée : " + provider
            : "API non configurée : le coach local reste disponible."}
        </p>
        {api && (
          <label className="check-inline">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            J’accepte d’envoyer ma question et les statistiques agrégées
            filtrées à {provider}. Les captures, notes brutes, email et clés
            sont exclus.
          </label>
        )}
        <p className="footnote">
          Aucune promesse de rentabilité. Les corrélations observées peuvent
          changer avec la taille de l’échantillon.
        </p>
      </Panel>
    </div>
  );
}
