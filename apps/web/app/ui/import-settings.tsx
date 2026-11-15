"use client";
import { useMemo, useState } from "react";
import {
  IMPORT_FIELDS,
  detectColumns,
  detectSource,
  normalizeImport,
  journalSchema,
  readBackup,
  newJournal,
  sizePosition,
  calculateTrade,
  type ColumnMap,
  type Journal,
  type InstrumentSpec,
} from "@edge/core";
import { useApp } from "../../lib/client-store";
import {
  readTradeFile,
  exportBackup,
  exportCsv,
  download,
} from "../../lib/files";
import { Panel, Field, Modal, Pill, Empty, money, r } from "./kit";
import CloudHistory from "./cloud-history";
const FIELD_LABELS: Record<string, string> = {
  enteredAt: "Date/heure entrée",
  exitedAt: "Date/heure sortie",
  instrument: "Instrument",
  direction: "Direction achat/vente",
  entry: "Prix entrée",
  stop: "Stop loss",
  target: "Objectif",
  exit: "Prix sortie",
  quantity: "Taille / contrats",
  fees: "Frais totaux",
  setup: "Setup",
  session: "Session",
  timeframe: "Unité de temps",
  notes: "Notes",
  exitReason: "Motif de clôture · TP / SL / BE / MANUAL",
};
export function ImportTrades() {
  const { data, update } = useApp();
  const [file, setFile] = useState(""),
    [columns, setColumns] = useState<string[]>([]),
    [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [mapping, setMapping] = useState<ColumnMap | null>(null),
    [zone, setZone] = useState("America/New_York"),
    [dayFirst, setDayFirst] = useState(true),
    [account, setAccount] = useState(data.accounts[0]?.id ?? ""),
    [stop, setStop] = useState(0),
    [rr, setRR] = useState(2),
    [batch, setBatch] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(false),
    [acceptedAssumptions, setAcceptedAssumptions] = useState(false);
  const preview = useMemo(
    () =>
      mapping
        ? normalizeImport(rows, mapping, data, {
            accountId: account,
            zone,
            dayFirst,
            defaultStopPoints: stop,
            defaultRR: rr,
            batchId: batch,
          })
        : null,
    [mapping, rows, data, account, zone, dayFirst, stop, rr, batch],
  );
  const complete =
    mapping &&
    ["enteredAt", "instrument", "direction", "entry", "exit", "quantity"].every(
      (k) => mapping[k as keyof ColumnMap],
    );
  return (
    <>
      <ol className="import-steps" aria-label="Étapes de l’import">
        <li aria-current={!file ? "step" : undefined}>
          <span>1</span>
          <div>
            <strong>Choisir le fichier</strong>
            <small>CSV ou XLSX</small>
          </div>
        </li>
        <li aria-current={file && !complete ? "step" : undefined}>
          <span>2</span>
          <div>
            <strong>Vérifier les colonnes</strong>
            <small>Mapping et fuseau horaire</small>
          </div>
        </li>
        <li aria-current={complete ? "step" : undefined}>
          <span>3</span>
          <div>
            <strong>Contrôler et importer</strong>
            <small>Aperçu avant écriture</small>
          </div>
        </li>
      </ol>
      <Panel>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Positions clôturées</span>
            <h2>CSV / XLSX · aperçu avant écriture</h2>
          </div>
          <Pill tone="neutral">CSV / XLSX</Pill>
        </div>
        <p className="muted">
          Les colonnes sont détectées, puis contrôlées par toi. Utilise un
          export de trades clôturés avec prix d’entrée et sortie. Un historique
          d’ordres ou de fills partiels doit d’abord être regroupé en positions.
        </p>
        <div className="view-toolbar">
          <label className="btn primary">
            Choisir un fichier
            <input
              type="file"
              className="sr-only"
              accept=".csv,.tsv,.txt,.xlsx"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setLoading(true);
                setError("");
                setNotice("");
                try {
                  const table = await readTradeFile(f);
                  setColumns(table.columns);
                  setRows(table.rows);
                  setMapping(detectColumns(table.columns));
                  setFile(f.name);
                  setBatch(crypto.randomUUID());
                  setAcceptedAssumptions(false);
                } catch (err) {
                  setError(String(err));
                } finally {
                  setLoading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          <button
            className="btn secondary"
            onClick={() =>
              download(
                "EDGE-modele-import.csv",
                "enteredAt,exitedAt,instrument,direction,entry,stop,target,exit,quantity,fees,setup,session,timeframe,notes\n2026-11-13T14:35:00Z,2026-11-13T14:40:00Z,NQ,LONG,21400,21390,21425,21420,1,4.8,Absorption,New York open,M1,Confirmation delta\n",
                "text/csv",
              )
            }
          >
            Télécharger un modèle CSV
          </button>
        </div>
        {loading && <p role="status">Lecture du fichier…</p>}
        {mapping && (
          <>
            <div className="upload-row"><Field label="Profil d’import enregistré"><select defaultValue="" onChange={e=>{const p=data.importProfiles.find(p=>p.id===e.target.value);if(p){setMapping(Object.fromEntries(IMPORT_FIELDS.map(k=>[k,columns.includes(p.mapping[k])?p.mapping[k]:""])) as ColumnMap);setZone(p.zone);setDayFirst(p.dayFirst);}}}><option value="">Choisir un profil…</option>{data.importProfiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><button className="btn secondary" onClick={()=>{const name=window.prompt("Nom de ce profil d’import",detectSource(columns));if(name?.trim())update(j=>{j.importProfiles.push({id:crypto.randomUUID(),name:name.trim().slice(0,100),mapping,zone,dayFirst});});}}>Enregistrer le mapping</button></div>
            <div className="notice-inline">
              {file} · {rows.length} lignes · profil suggéré :{" "}
              {detectSource(columns)}
            </div>
            <div className="form-grid">
              <Field label="Compte de destination">
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  {data.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fuseau des dates sans décalage explicite">
                <select value={zone} onChange={(e) => setZone(e.target.value)}>
                  {[
                    "America/New_York",
                    "UTC",
                    "Europe/Paris",
                    "Indian/Antananarivo",
                  ].map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </Field>
              <Field label="Format des dates à slash / point">
                <select
                  value={dayFirst ? "DMY" : "MDY"}
                  onChange={(e) => setDayFirst(e.target.value === "DMY")}
                >
                  <option value="DMY">Jour / mois / année</option>
                  <option value="MDY">Mois / jour / année</option>
                </select>
              </Field>
              {IMPORT_FIELDS.map((k) => (
                <Field
                  key={k}
                  label={
                    FIELD_LABELS[k] +
                    ([
                      "enteredAt",
                      "instrument",
                      "direction",
                      "entry",
                      "exit",
                      "quantity",
                    ].includes(k)
                      ? " *"
                      : "")
                  }
                >
                  <select
                    value={mapping[k]}
                    onChange={(e) =>
                      setMapping({ ...mapping, [k]: e.target.value })
                    }
                  >
                    <option value="">Non fourni</option>
                    {columns.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
            {(!mapping.stop || !mapping.target) && (
              <div className="notice-inline">
                <div>
                  <strong>Risque historique manquant</strong>
                  <p>
                    Renseigne une hypothèse explicite pour calculer des R. Les
                    trades concernés seront tagués « R hypothétique ». Ne les
                    mélange pas aux statistiques de risque vérifiées.
                  </p>
                  <div className="form-grid">
                    <Field label="Distance stop supposée · points">
                      <input
                        type="number"
                        min=".001"
                        step="any"
                        value={stop || ""}
                        onChange={(e) => setStop(Number(e.target.value))}
                      />
                    </Field>
                    <Field label="RR objectif supposé">
                      <input
                        type="number"
                        min=".01"
                        step="any"
                        value={rr}
                        onChange={(e) => setRR(Number(e.target.value))}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}
            {preview && (
              <>
                <div className="import-counts">
                  <Pill tone="green">{preview.accepted.length} VALIDES</Pill>
                  <Pill tone="neutral">
                    {preview.duplicates} DOUBLONS ÉCARTÉS
                  </Pill>
                  <Pill tone="amber">{preview.errors.length} REJETS</Pill>
                </div>
                {preview.warnings.map((w) => (
                  <p className="footnote amber-text" key={w}>
                    {w}
                  </p>
                ))}
                {preview.warnings.length > 0 && (
                  <label className="check-inline">
                    <input
                      type="checkbox"
                      checked={acceptedAssumptions}
                      onChange={(e) => setAcceptedAssumptions(e.target.checked)}
                    />
                    J’ai vérifié ces hypothèses et j’accepte les limites de
                    l’import.
                  </label>
                )}
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Date UTC</th>
                        <th>Instrument</th>
                        <th>Direction</th>
                        <th>Entrée</th>
                        <th>Sortie</th>
                        <th>Résultat net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.accepted.slice(0, 10).map((t) => (
                        <tr key={t.id}>
                          <td>{t.enteredAt}</td>
                          <td>{t.instrument}</td>
                          <td>{t.direction}</td>
                          <td>{t.entry}</td>
                          <td>{t.exit}</td>
                          <td>{r(calculateTrade(t).realizedR)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <details>
                  <summary>Voir les rejets ({preview.errors.length})</summary>
                  {preview.errors.slice(0, 100).map((e) => (
                    <p className="error-message" key={e.row}>
                      Ligne {e.row} : {e.message}
                    </p>
                  ))}
                  {preview.errors.length > 0 && (
                    <button
                      className="btn secondary"
                      onClick={() =>
                        download(
                          "EDGE-rejets-import.json",
                          JSON.stringify(preview.errors, null, 2),
                        )
                      }
                    >
                      Exporter tous les rejets
                    </button>
                  )}
                </details>
                <button
                  className="btn primary full"
                  disabled={
                    !complete ||
                    !preview.accepted.length ||
                    (!!preview.warnings.length && !acceptedAssumptions)
                  }
                  onClick={() => {
                    try {
                      update((j) => {
                        j.trades.push(...preview.accepted);
                        for (const name of [
                          ...new Set(preview.accepted.map((t) => t.setup)),
                        ])
                          if (!j.setups.some((s) => s.name === name))
                            j.setups.push({
                              id: crypto.randomUUID(),
                              name,
                              entryRules: "À qualifier après import",
                              invalidation: "À renseigner",
                              examples: [],
                            });
                        j.imports.push({
                          id: batch,
                          filename: file,
                          source: detectSource(columns),
                          mapping,
                          createdAt: new Date().toISOString(),
                          count: preview.accepted.length,
                        });
                      });
                      setNotice(
                        `${preview.accepted.length} trades ajoutés. Les doublons et rejets n’ont pas été importés.`,
                      );
                      setRows([]);
                      setMapping(null);
                    } catch (err) {
                      setError(String(err));
                    }
                  }}
                >
                  Importer uniquement les {preview.accepted.length} lignes
                  valides
                </button>
              </>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="success-message">
            {notice}
          </p>
        )}
      </Panel>
      <Panel className="section-gap">
        <h2>Historique des imports</h2>
        {data.imports
          .slice(-10)
          .reverse()
          .map((b) => (
            <div className="setup-row" key={b.id}>
              <div>
                <strong>{b.filename}</strong>
                <small>
                  {b.source} · {b.createdAt.slice(0, 10)}
                </small>
              </div>
              <strong>{b.count} trades</strong>
            </div>
          ))}
        {!data.imports.length && <Empty text="Aucun import enregistré." />}
      </Panel>
    </>
  );
}
export function Calculator({initialAccountId, onPrepare}: {initialAccountId?: string; onPrepare?: (values: Record<string,string>) => void}) {
  const { data } = useApp();
  const [symbol, setSymbol] = useState("NQ"),
    [budget, setBudget] = useState(data.settings.riskBudget),
    [entry, setEntry] = useState(21400),
    [stop, setStop] = useState(21390),
    [percent, setPercent] = useState(0),
    [account, setAccount] = useState(initialAccountId ?? data.accounts[0]?.id ?? ""),
    [fees, setFees] = useState(0);
  const spec = data.settings.instruments[symbol];
  const a = data.accounts.find((a) => a.id === account);
  const risk =
    percent > 0 ? ((a?.initialCapital ?? 0) * percent) / 100 : budget;
  const perUnit = spec
    ? (Math.abs(entry - stop) * spec.tickValue) / spec.tickSize + fees
    : 0;
  const raw = perUnit > 0 ? risk / perUnit : 0;
  const step = spec?.quantityStep ?? (symbol === "XAUUSD" ? .01 : 1);
  const size = Math.floor(raw / step) * step;
  return (
    <Panel className="plan-panel">
      <h2>Calibrer la position avant l’entrée</h2>
      <p className="footnote">
        Risque total = distance au stop × valeur du point × taille + frais
        estimés par contrat. Le pourcentage utilise le capital initial
        configuré.
      </p>
      <div className="calculator-layout">
        <div className="form-grid">
          <Field label="Instrument">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {Object.keys(data.settings.instruments).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Compte">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            >
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Risque en dollars">
            <input
              type="number"
              min="0"
              value={budget}
              onChange={(e) => {
                setBudget(Number(e.target.value));
                setPercent(0);
              }}
            />
          </Field>
          <Field label="Ou pourcentage du capital initial">
            <input
              type="number"
              min="0"
              max="100"
              step=".01"
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
            />
          </Field>
          <Field label="Entrée">
            <input
              type="number"
              min="0"
              step="any"
              value={entry}
              onChange={(e) => setEntry(Number(e.target.value))}
            />
          </Field>
          <Field label="Stop">
            <input
              type="number"
              min="0"
              step="any"
              value={stop}
              onChange={(e) => setStop(Number(e.target.value))}
            />
          </Field>
          <Field label="Frais estimés par contrat / lot">
            <input
              type="number"
              min="0"
              step=".01"
              value={fees}
              onChange={(e) => setFees(Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="trade-preview">
          <div>
            <small>Taille maximale</small>
            <strong>
              {entry > 0 && stop > 0 && entry !== stop ? size : 0}{" "}
              {symbol === "XAUUSD" ? "lot(s)" : "contrat(s)"}
            </strong>
          </div>
          <div>
            <small>Risque avec cette taille</small>
            <strong>{money(size * perUnit)}</strong>
          </div>
          <div>
            <small>Distance au stop</small>
            <strong>
              {spec ? Math.abs(entry - stop) / spec.tickSize : 0} ticks
            </strong>
          </div>
        </div>
      </div>
      {onPrepare && <button className="btn primary" disabled={!a || size <= 0 || entry <= 0 || stop <= 0 || entry === stop || size > a.maxContracts} onClick={() => onPrepare({status:"DRAFT", accountId:account,instrument:symbol,direction:stop < entry ? "LONG" : "SHORT",entry:String(entry),stop:String(stop),quantity:String(size),fees:String(fees*size),targetKnown:"no"})}>Préparer ce trade dans le journal</button>}
      {a && size > a.maxContracts && (
        <p className="error-message">
          Cette taille dépasse la limite de {a.maxContracts} contrat(s)/lot(s)
          du compte. Utilise au maximum cette limite.
        </p>
      )}
    </Panel>
  );
}
function InstrumentQuantityFields({spec}:{spec?:InstrumentSpec}) {
  return <div className="form-grid"><Field label="Catégorie"><select name="category" defaultValue={spec?.category ?? "OTHER"}>{Object.entries({FUTURE:"Futures",CFD:"CFD",FOREX:"Forex",CRYPTO:"Crypto",EQUITY:"Actions",OTHER:"Autre"}).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field><Field label="Pas de quantité"><input name="quantityStep" type="number" min=".00000001" step="any" required defaultValue={spec?.quantityStep ?? 1}/></Field><Field label="Quantité minimale"><input name="minQuantity" type="number" min=".00000001" step="any" required defaultValue={spec?.minQuantity ?? 1}/></Field></div>;
}
export function SettingsPanel() {
  const { data, update } = useApp();
  const [restore, setRestore] = useState<Journal | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [switchMode, setSwitchMode] = useState<"real" | "demo" | null>(null);
  return (
    <>
      <div className="bottom-grid settings-layout">
        <CloudHistory/>
        <Panel><h2>Volume du journal</h2><p className="muted">{data.trades.length} trades · {data.drafts.length} brouillons / positions · {data.trades.reduce((n,t)=>n+(t.screenshots?.length??0),0)} captures de trades</p><strong>{(new TextEncoder().encode(JSON.stringify(data)).byteLength/1000000).toFixed(2)} Mo dans le document courant</strong><p className="footnote">Les captures synchronisées sont conservées séparément dans un espace privé et mises en cache sur cet appareil. La sauvegarde JSON complète inclut leurs images.</p></Panel>
        <Panel>
          <h2>Sauvegarde et restauration</h2>
          <p className="muted">
            La sauvegarde JSON contient comptes, trades, captures, annotations,
            routines et objectifs. Elle ne contient aucun mot de passe ni clé
            API.
          </p>
          <div className="upload-row">
            <button className="btn primary" onClick={() => void exportBackup(data).catch(e => setError(String(e)))}>
              Sauvegarde JSON complète
            </button>
            <button
              className="btn secondary"
              onClick={() => exportCsv(data.trades)}
            >
              Exporter tous les trades CSV
            </button>
            <label className="btn secondary">
              Restaurer un JSON
              <input
                className="sr-only"
                type="file"
                accept=".json"
                onChange={async (e) => {
                  try {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 32000000)
                      throw new Error(
                        "Sauvegarde trop volumineuse (32 Mo maximum).",
                      );
                    const parsed = readBackup(JSON.parse(await f.text()));
                    setRestore(parsed);
                    setError("");
                  } catch (err) {
                    setError(String(err));
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="footnote">
            Copie hors ligne : IndexedDB. Base locale serveur : SQLite. Les
            modifications en attente sont synchronisées lorsque le serveur
            revient. Un conflit exige un choix explicite.
          </p>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          <h3>Environnement de données</h3>
          <p className="footnote">
            Mode actuel :{" "}
            {data.mode === "demo"
              ? "démonstration synthétique"
              : "journal personnel"}
            . Le changement remplace le journal après téléchargement d’une
            sauvegarde.
          </p>
          <div className="upload-row">
            <button
              className="btn secondary"
              onClick={() => setSwitchMode("demo")}
            >
              Charger les 180 trades de démo
            </button>
            <button
              className="btn secondary"
              onClick={() => setSwitchMode("real")}
            >
              Commencer un journal vide
            </button>
          </div>
        </Panel>
        <Panel>
          <h2>Préférences et instruments</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              update((j) => {
                j.settings.minSample = Number(f.get("minSample"));
                j.settings.riskBudget = Number(f.get("riskBudget"));
                j.settings.timeZone = String(f.get("timeZone")) as Journal["settings"]["timeZone"];
              });
              setNotice("Préférences enregistrées.");
            }}
          >
            <Field label="Fuseau des nouvelles saisies"><select name="timeZone" defaultValue={data.settings.timeZone}>{["America/New_York","UTC","Indian/Antananarivo","Europe/Paris"].map(z => <option key={z}>{z}</option>)}</select></Field>
            <Field label="Effectif minimal de lecture par groupe">
              <input
                name="minSample"
                type="number"
                min="5"
                max="1000"
                defaultValue={data.settings.minSample}
                required
              />
            </Field>
            <Field label="Budget de risque par défaut ($)">
              <input
                name="riskBudget"
                type="number"
                min=".01"
                step="any"
                defaultValue={data.settings.riskBudget}
                required
              />
            </Field>
            <button className="btn primary full">
              Enregistrer les préférences
            </button>
          </form>
          <p className="footnote">
            Interface française ; codes de langue et modèle de données prêts
            pour une traduction anglaise. Pas de promesse de traduction
            automatique.
          </p>
          <h3>Spécifications des instruments</h3>
          {Object.entries(data.settings.instruments).map(([symbol, spec]) => (
            <details key={symbol}>
              <summary>
                {symbol} · tick {spec.tickSize} · {spec.tickValue} $/tick
              </summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  update(
                    (j) =>
                      (j.settings.instruments[symbol] = {
                        tickSize: Number(f.get("tickSize")),
                        tickValue: Number(f.get("tickValue")),
                        category: String(f.get("category")) as InstrumentSpec["category"],
                        quantityStep: Number(f.get("quantityStep")),
                        minQuantity: Number(f.get("minQuantity")),
                      }),
                  );
                  setNotice(
                    "Valeur modifiée pour les prochains trades. Les trades historiques conservent leur spécification.",
                  );
                }}
              >
                <div className="form-grid">
                  <Field label="Taille du tick">
                    <input
                      type="number"
                      name="tickSize"
                      step="any"
                      min=".00000001"
                      required
                      defaultValue={spec.tickSize}
                    />
                  </Field>
                  <Field label="Valeur du tick ($)">
                    <input
                      type="number"
                      name="tickValue"
                      step="any"
                      min=".00000001"
                      required
                      defaultValue={spec.tickValue}
                    />
                  </Field>
                </div>
                <InstrumentQuantityFields spec={spec}/>
                <button className="btn secondary">Enregistrer {symbol}</button>
              </form>
            </details>
          ))}
          <h3>Ajouter un instrument</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const symbol = String(f.get("symbol")).toUpperCase().trim();
              if (!symbol) return;
              if(data.settings.instruments[symbol]){setError("Ce symbole existe déjà. Modifie sa fiche ci-dessus.");return;}
              update(
                (j) =>
                  (j.settings.instruments[symbol] = {
                    tickSize: Number(f.get("tickSize")),
                    tickValue: Number(f.get("tickValue")),
                    category: String(f.get("category")) as InstrumentSpec["category"],
                    quantityStep: Number(f.get("quantityStep")),
                    minQuantity: Number(f.get("minQuantity")),
                  }),
              );
              setNotice("Instrument ajouté.");
              e.currentTarget.reset();
            }}
          >
            <div className="form-grid">
              <Field label="Symbole">
                <input name="symbol" required maxLength={30} />
              </Field>
              <Field label="Taille du tick">
                <input
                  name="tickSize"
                  type="number"
                  min=".00000001"
                  step="any"
                  required
                />
              </Field>
              <Field label="Valeur du tick ($)">
                <input
                  name="tickValue"
                  type="number"
                  min=".00000001"
                  step="any"
                  required
                />
              </Field>
            </div>
            <InstrumentQuantityFields/>
            <button className="btn secondary full">
              Ajouter cet instrument
            </button>
          </form>
          <p className="footnote">
            XAUUSD utilise 100 oz par lot par défaut. Vérifie le multiplicateur
            de ton courtier.
          </p>
        </Panel>
      </div>
      {notice && (
        <p role="status" className="success-message">
          {notice}
        </p>
      )}
      {(restore || switchMode) && (
        <Modal
          title={
            restore ? "Vérifier la restauration" : "Changer d’environnement"
          }
          onClose={() => {
            setRestore(null);
            setSwitchMode(null);
          }}
        >
          <p>
            Le journal actuel sera remplacé. Une sauvegarde de l’état actuel
            sera téléchargée avant le changement.
          </p>
          <div className="setup-row">
            <span>Nouveau contenu</span>
            <strong>
              {restore
                ? restore.trades.length
                : switchMode === "demo"
                  ? 180
                  : 0}{" "}
              trades ·{" "}
              {restore?.accounts.length ?? (switchMode === "demo" ? 2 : 1)}{" "}
              compte(s)
            </strong>
          </div>
          <button
            className="btn primary full"
            onClick={async () => {
              try {await exportBackup(data);
              const next = restore ?? newJournal(switchMode === "demo");
              update((j) => Object.assign(j, next));
              setRestore(null);
              setSwitchMode(null);
              setNotice(
                "Journal remplacé et sauvegarde précédente téléchargée.",
              );
              }catch(e){setError(String(e));}
            }}
          >
            Sauvegarder l’actuel puis confirmer le remplacement
          </button>
        </Modal>
      )}
      <Panel className="section-gap">
        <h2>Dérogations de discipline enregistrées</h2>
        {data.overrides
          .slice(-20)
          .reverse()
          .map((o, i) => (
            <div className="setup-row" key={i}>
              <div>
                <strong>
                  {o.day} · {o.reason}
                </strong>
                <p>{o.note}</p>
              </div>
            </div>
          ))}
        {!data.overrides.length && (
          <Empty text="Aucune dérogation de Lock Guard." />
        )}
      </Panel>
    </>
  );
}
