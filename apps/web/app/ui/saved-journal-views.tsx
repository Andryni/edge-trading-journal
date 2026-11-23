"use client";
import { useEffect, useRef, useState } from "react";
import type { Journal } from "@edge/core";
import { Field } from "./kit";

export default function SavedJournalViews({ views, filters, update, onLoad, autoLoadDefault }: {
  autoLoadDefault: boolean;
  views: Journal["savedViews"];
  filters: Record<string, string>;
  update: (fn: (journal: Journal) => void) => void;
  onLoad: (filters: Record<string, string>) => void;
}) {
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const initial = autoLoadDefault && views.find(v => v.filters.isDefault === "true");
    if (initial) { setSelected(initial.id); setName(initial.name); onLoad(initial.filters); }
  }, [views, onLoad, autoLoadDefault]);
  const current = views.find(v => v.id === selected);
  return <div className="saved-journal-views">
    <Field label="Vue enregistrée">
      <select value={current?.id ?? ""} onChange={e => {
        const view = views.find(v => v.id === e.target.value);
        setSelected(view?.id ?? ""); setName(view?.name ?? "");
        if (view) { onLoad(view.filters); setMessage("Vue chargée : " + view.name); }
      }}>
        <option value="">Nouvelle vue…</option>
        {views.map(v => <option key={v.id} value={v.id}>{v.name}{v.filters.isDefault === "true" ? " · par défaut" : ""}</option>)}
      </select>
    </Field>
    <Field label="Nom de la vue"><input maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Ma revue" /></Field>
    <div className="saved-view-actions">
      <button type="button" className="btn secondary" disabled={!name.trim() || views.length >= 50} onClick={() => {
        const id = crypto.randomUUID();
        update(j => { j.savedViews.push({ id, name: name.trim(), filters }); });
        setSelected(id); setMessage("Vue enregistrée.");
      }}>Enregistrer une nouvelle vue</button>
      <button type="button" className="btn secondary" disabled={!current || !name.trim()} onClick={() => {
        update(j => { const v = j.savedViews.find(v => v.id === selected); if (v) v.name = name.trim(); });
        setMessage("Vue renommée.");
      }}>Renommer</button>
      <button type="button" className="btn secondary" disabled={!current} aria-pressed={current?.filters.isDefault === "true"} onClick={() => {
        const makeDefault = current?.filters.isDefault !== "true";
        update(j => { for (const v of j.savedViews) v.filters.isDefault = String(makeDefault && v.id === selected); });
        setMessage(makeDefault ? "Vue par défaut à la prochaine ouverture du journal." : "Vue par défaut retirée.");
      }}>Par défaut</button>
      <button type="button" className="text-btn" disabled={!current} onClick={() => {
        update(j => { j.savedViews = j.savedViews.filter(v => v.id !== selected); });
        setSelected(""); setName(""); setMessage("Vue supprimée. Les trades sont conservés.");
      }}>Supprimer la vue</button>
    </div>
    <span role="status">{message}{views.length >= 50 ? " Limite de 50 vues atteinte." : ""}</span>
  </div>;
}
