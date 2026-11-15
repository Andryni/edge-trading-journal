import {
  type Journal,
  type Trade,
  calculateTrade,
  reviewSummary,
} from "@edge/core";
import {captureBlob} from "./attachment-cache";
export function download(
  filename: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export async function portableJournal(j:Journal):Promise<Journal> {
  async function embed(value:unknown):Promise<unknown> {
    if(typeof value === "string" && value.startsWith("/api/attachments?path=")) {
      const blob=await captureBlob(value);return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Lecture de capture impossible."));reader.readAsDataURL(blob);});
    }
    if(Array.isArray(value)){const output=[];for(const item of value)output.push(await embed(item));return output;}
    if(value&&typeof value==="object"){const output:Record<string,unknown>={};for(const [key,item] of Object.entries(value))output[key]=await embed(item);return output;}
    return value;
  }
  return await embed(j) as Journal;
}
export async function exportBackup(j: Journal) {
  const portable=await portableJournal(j);
  download(
    `EDGE-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(portable, null, 2),
  );
}
export function exportCsv(trades: Trade[]) {
  const fields = [
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
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  download(
    "EDGE-trades.csv",
    "\uFEFF" +
      fields.join(",") +
      "\r\n" +
      trades.map((t) => fields.map((k) => cell(t[k])).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
}
export async function readTradeFile(file: File) {
  if (file.size > 15_000_000)
    throw new Error("Fichier trop volumineux : 15 Mo maximum.");
  let table: unknown[][] = [];
  if (/\.xlsx$/i.test(file.name)) {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("Classeur vide.");
    sheet.eachRow((row) =>
      table.push(
        (row.values as unknown[])
          .slice(1)
          .map((v) =>
            v instanceof Date
              ? v.toISOString().slice(0, 19)
              : v && typeof v === "object" && "text" in v
                ? String(v.text)
                : v,
          ),
      ),
    );
  } else {
    const { default: Papa } = await import("papaparse");
    const parsed = Papa.parse<string[]>(await file.text(), {
      skipEmptyLines: true,
    });
    table = parsed.data;
  }
  const headerIndex = table
    .slice(0, 30)
    .findIndex((row) =>
      row.some((v) =>
        /symbol|instrument|symbole|contract|security|actif/i.test(String(v)),
      ),
    );
  const index = headerIndex >= 0 ? headerIndex : 0;
  const columns = table[index]?.map((v) => String(v ?? "").trim()) ?? [];
  if (new Set(columns).size !== columns.length)
    throw new Error("En-têtes en double : renomme les colonnes avant import.");
  if (!columns.length) throw new Error("Aucune colonne reconnue.");
  const rows = table
    .slice(index + 1)
    .filter((r) => r.some((v) => v !== null && v !== ""))
    .map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i] ?? ""])));
  if (rows.length > 20000) throw new Error("20 000 lignes maximum par import.");
  return { columns, rows };
}
export async function monthlyPdf(trades: Trade[], label: string, minimum = 30) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  try {
    const response=await fetch('/fonts/DejaVuSans.ttf');
    if(response.ok){const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));pdf.addFileToVFS('DejaVuSans.ttf',btoa(binary));pdf.addFont('DejaVuSans.ttf','EDGE','normal');pdf.setFont('EDGE','normal');}
  } catch { pdf.setFont('helvetica','normal'); }
  pdf.setCharSpace(0);
  const summary = reviewSummary(trades, minimum);
  let y = 25;
  const heading = () => {
    pdf.setFillColor(5, 7, 10);
    pdf.rect(0, 0, 210, 297, "F");
    pdf.setTextColor(70, 222, 237);
    pdf.setFontSize(24);
    pdf.text("EDGE / RAPPORT DE TRADING", 15, 20);
  };
  heading();
  pdf.setFontSize(11);
  pdf.setTextColor(220, 233, 242);
  pdf.text(label.replace(/→/g, " -> "), 15, (y += 10));
  const s = summary.stats;
  for (const line of [
    `${s.count} trades | ${s.r.toFixed(2)}R | ${s.net.toFixed(2)} USD`,
    `Réussite ${(s.winRate * 100).toFixed(1)} % | Espérance ${s.expectancy.toFixed(2)}R`,
    `Drawdown de clôture ${s.drawdown.toFixed(2)} USD`,
  ])
    pdf.text(line, 15, (y += 9));
  y += 12;
  pdf.setDrawColor(70, 222, 237);
  const values = [0, ...s.curve.map((x) => x.r)],
    min = Math.min(...values),
    range = Math.max(1, Math.max(...values) - min);
  values.forEach((v, i) => {
    if (i)
      pdf.line(
        15 + ((i - 1) / Math.max(1, values.length - 1)) * 180,
        y + 50 - ((values[i - 1] - min) / range) * 50,
        15 + (i / Math.max(1, values.length - 1)) * 180,
        y + 50 - ((v - min) / range) * 50,
      );
  });
  y += 70;
  const lines = [
    "FUITES OBSERVÉES",
    ...summary.leaks.map(
      (l) =>
        `${l.category} : ${l.label} | ${l.count} trades | ${l.expectancy.toFixed(2)}R/trade`,
    ),
    "FORCES OBSERVÉES",
    ...summary.strengths.map(
      (l) =>
        `${l.category} : ${l.label} | ${l.count} trades | ${l.expectancy.toFixed(2)}R/trade`,
    ),
    "ACTION POUR LA PROCHAINE SÉANCE",
    summary.action,
    "Les regroupements décrivent un historique. Ils ne démontrent pas une causalité et ne garantissent pas les résultats futurs.",
  ];
  for (const text of lines) {
    for (const line of pdf.splitTextToSize(
      text.replace(/→/g, " -> ").replace(/≥/g, ">="),
      180,
    )) {
      if (y > 275) {
        pdf.addPage();
        heading();
        y = 35;
      }
      pdf.text(line, 15, y);
      y += 6;
    }
    y += 5;
  }
  pdf.save("EDGE-rapport.pdf");
}
