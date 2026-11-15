import {
  tradeSchema,
  tradeFingerprint,
  mergeImport,
  zonedToUtc,
  type Journal,
} from "./journal";
import { type Trade } from "./index";
export const IMPORT_FIELDS = [
  "enteredAt",
  "exitedAt",
  "instrument",
  "direction",
  "entry",
  "stop",
  "target",
  "exit",
  "quantity",
  "fees",
  "setup",
  "session",
  "timeframe",
  "notes",
  "exitReason",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
export type ColumnMap = Record<ImportField, string>;
const aliases: Record<ImportField, string[]> = {
  enteredAt: [
    "enteredat",
    "opentime",
    "entrytime",
    "dateheureentree",
    "entrydate",
    "openingtime",
    "datetime",
    "time",
    "date",
  ],
  exitedAt: ["exitedat", "closetime", "exittime", "closingtime", "exitdate"],
  instrument: [
    "instrument",
    "symbol",
    "actif",
    "symbole",
    "market",
    "ticker",
    "contract",
  ],
  direction: ["direction", "side", "type", "action", "buysell", "position"],
  entry: [
    "entry",
    "entryprice",
    "openprice",
    "prixentree",
    "entryavgprice",
    "averageentryprice",
    "buyprice",
  ],
  stop: ["stop", "stoploss", "sl", "stopprice"],
  target: ["target", "takeprofit", "tp", "targetprice"],
  exit: [
    "exit",
    "exitprice",
    "closeprice",
    "prixsortie",
    "exitavgprice",
    "averageexitprice",
    "sellprice",
  ],
  quantity: [
    "quantity",
    "qty",
    "size",
    "volume",
    "contracts",
    "lots",
    "quantite",
  ],
  fees: ["fees", "commission", "commissions", "frais", "totalfees"],
  setup: ["setup", "strategy", "strategie"],
  session: ["session"],
  timeframe: ["timeframe", "unitedetemps"],
  notes: ["notes", "comment", "commentaire"],
  exitReason: ["exitreason", "motifsortie", "closereason", "reason"],
};
export const normalizeHeader = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export function detectColumns(columns: string[]): ColumnMap {
  const map = {} as ColumnMap;
  for (const key of IMPORT_FIELDS) {
    map[key] =
      columns.find((c) => aliases[key].includes(normalizeHeader(c))) ??
      columns.find((c) =>
        aliases[key].some(
          (alias) => alias.length > 4 && normalizeHeader(c).includes(alias),
        ),
      ) ??
      "";
  }
  return map;
}
export function detectSource(columns: string[]) {
  const h = columns.map(normalizeHeader).join(" ");
  return /position|deal|commission/.test(h) && /symbol/.test(h)
    ? "MT5 / export de positions"
    : /entryefficiency|exitname|entryname/.test(h)
      ? "NinjaTrader"
      : /contract|buyprice|sellprice/.test(h)
        ? "Tradovate / Rithmic"
        : /cumulat|runup|drawdown/.test(h)
          ? "TradingView"
          : /portfolio|security/.test(h)
            ? "ATAS"
            : "CSV / XLSX personnalisé";
}
export function importNumber(value: unknown) {
  if (typeof value === "number") return value;
  const s = String(value ?? "")
    .trim()
    .replace(/[\s\u00a0$€]/g, "");
  const clean =
    s.includes(",") && s.includes(".")
      ? s.lastIndexOf(",") > s.lastIndexOf(".")
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "")
      : s.replace(",", ".");
  return Number(clean);
}
export function importDate(value: unknown, zone: string, dayFirst = true) {
  const s = String(value ?? "").trim();
  if (!s) throw new Error("Date manquante");
  if (/(Z|[+-]\d\d:\d\d)$/.test(s)) {
    const d = new Date(s);
    if (!Number.isFinite(d.getTime())) throw new Error("Date invalide");
    return d.toISOString();
  }
  let local = s.replace(" ", "T").replace(/\.(\d{3,})$/, "");
  const m = s.match(
    /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})[ T](\d{2}:\d{2}(?::\d{2})?)/,
  );
  if (m)
    local = `${m[3]}-${(dayFirst ? m[2] : m[1]).padStart(2, "0")}-${(dayFirst ? m[1] : m[2]).padStart(2, "0")}T${m[4]}`;
  local = local.replace(/^(\d{4})\.(\d{2})\.(\d{2})/, "$1-$2-$3");
  return zonedToUtc(local, zone);
}
export function normalizeImport(
  rows: Record<string, unknown>[],
  mapping: ColumnMap,
  j: Journal,
  options: {
    accountId: string;
    zone: string;
    dayFirst: boolean;
    defaultStopPoints: number;
    defaultRR: number;
    batchId: string;
  },
) {
  const accepted: Trade[] = [];
  const errors: { row: number; message: string }[] = [];
  const warnings: string[] = [];
  if (!mapping.stop)
    warnings.push(
      "Stops absents : la distance choisie est une hypothèse de risque, pas le stop historique. Les R ne sont pas des R historiques vérifiés.",
    );
  if (!mapping.target)
    warnings.push("Objectifs absents : le RR choisi est une hypothèse.");
  if (!mapping.exitedAt)
    warnings.push(
      "Heure de sortie absente : heure d’entrée utilisée pour la clôture. Les analyses de séries sont approximatives.",
    );
  rows.forEach((row, i) => {
    try {
      const get = (k: ImportField) => row[mapping[k]];
      const instrument = String(get("instrument") ?? "")
        .trim()
        .toUpperCase()
        .replace(/^[A-Z]+:/, "");
      const canonical =
        Object.keys(j.settings.instruments).find((k) => k === instrument) ??
        ["MNQ", "MES", "MGC", "NQ", "ES", "GC"].find((k) =>
          new RegExp(`^${k}(?:[FGHJKMNQUVXZ]\\d{1,4}|[!1]+)$`).test(instrument),
        ) ??
        instrument;
      const spec = j.settings.instruments[canonical];
      if (!spec)
        throw new Error(
          `Instrument ${instrument} inconnu : configure sa valeur de tick.`,
        );
      const side = String(get("direction") ?? "")
        .trim()
        .toLowerCase();
      const direction = /^(buy|long|achat|b|0)/.test(side)
        ? "LONG"
        : /^(sell|short|vente|s|1)/.test(side)
          ? "SHORT"
          : null;
      if (!direction) throw new Error("Direction non reconnue");
      const sign = direction === "LONG" ? 1 : -1;
      const entry = importNumber(get("entry"));
      const exit = importNumber(get("exit"));
      const enteredAt = importDate(
        get("enteredAt"),
        options.zone,
        options.dayFirst,
      );
      const exitedAt = mapping.exitedAt
        ? importDate(get("exitedAt"), options.zone, options.dayFirst)
        : enteredAt;
      const initialStop = mapping.stop ? importNumber(get("stop")) : entry - sign * options.defaultStopPoints;
      const t = tradeSchema.parse({
        id: `${options.batchId}-${i}`,
        accountId: options.accountId,
        enteredAt,
        exitedAt,
        instrument: canonical,
        direction,
        entry,
        stop: initialStop,
        target: mapping.target
          ? importNumber(get("target"))
          : entry + sign * Math.abs(entry - initialStop) * options.defaultRR,
        exit,
        quantity: importNumber(get("quantity")),
        fees: mapping.fees ? Math.abs(importNumber(get("fees"))) : 0,
        ...spec,
        setup: String(get("setup") || "Import à qualifier"),
        session: String(get("session") || "À qualifier"),
        timeframe: String(get("timeframe") || "À qualifier"),
        quality: "UNRATED",
        mentalBefore: "Non renseigné",
        mentalAfter: "Non renseigné",
        energy: null,
        stress: null,
        sleep: null,
        planScore: null,
        qualificationVersion: 1,
        reviewStatus: "PENDING",
        exitReason: ({tp:"TP",takeprofit:"TP",sl:"SL",stoploss:"SL",be:"BE",breakeven:"BE",manual:"MANUAL",cloturemanuelle:"MANUAL",mixed:"MIXED",other:"OTHER",unknown:"UNKNOWN"} as Record<string,string>)[normalizeHeader(String(get("exitReason") || ""))] ?? "UNKNOWN",
        notes:
          String(get("notes") || "") +
          (!mapping.stop
            ? "\nIMPORT : risque historique inconnu, stop hypothétique."
            : ""),
        tags: [
          ...(!mapping.stop ? ["R hypothétique"] : []),
          "Contexte non renseigné",
        ],
        confluences: [],
        importBatchId: options.batchId,
      });
      accepted.push({ ...t, sourceKey: tradeFingerprint(t) });
    } catch (e) {
      errors.push({
        row: i + 2,
        message: e instanceof Error ? e.message : "Ligne invalide",
      });
    }
  });
  const result = mergeImport(j.trades, accepted);
  return { ...result, errors, warnings };
}
/** Lecteur CSV portable pour Expo ; délimiteur détecté sur la première ligne. */
export function parseCsv(text: string) {
  const first = text.split(/\r?\n/)[0] ?? "";
  const delimiter =
    (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0)
      ? ";"
      : first.includes("\t")
        ? "\t"
        : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Guillemets CSV non fermés.");
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const columns =
    rows.shift()?.map((s) => s.replace(/^\uFEFF/, "").trim()) ?? [];
  return {
    columns,
    rows: rows
      .filter((r) => r.some((c) => c.trim()))
      .map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i] ?? ""]))),
  };
}
