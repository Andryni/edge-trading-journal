"use client";
import { useEffect, useState } from "react";
import {captureBlob} from "../../lib/attachment-cache";
import { Modal, Field } from "./kit";
export type Shot = {
  id: string;
  phase: string;
  data: string;
  annotations: string;
  caption?: string;
  timeframe?: string;
  storagePath?: string;
};
type Mark = {
  type: "arrow" | "text";
  x: number;
  y: number;
  x2: number;
  y2: number;
  text: string;
};
export function CaptureImage({src,alt}:{src:string;alt:string}) {
  const [url,setUrl]=useState(src.startsWith("/api/attachments?")?"":src);
  const [error,setError]=useState(false);
  useEffect(()=>{setError(false);if(!src.startsWith("/api/attachments?")){setUrl(src);return;}let active=true,objectURL="";setUrl("");captureBlob(src).then(blob=>{if(active){objectURL=URL.createObjectURL(blob);setUrl(objectURL);}}).catch(()=>{if(active)setError(true);});return()=>{active=false;if(objectURL)URL.revokeObjectURL(objectURL);};},[src]);
  return url?<img src={url} alt={alt}/>:<span role="status" className="capture-placeholder">{error?"Capture indisponible · réessaie en ligne":"Chargement de la capture…"}</span>;
}
export async function loadImage(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Choisis une image PNG, JPEG ou WebP.");
  if (file.size > 10_000_000)
    throw new Error("Image trop volumineuse : 10 Mo maximum.");
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
function marksFor(s: string) {
  try {
    const values = JSON.parse(s);
    return Array.isArray(values)
      ? (values.filter(
          (m) =>
            ["arrow", "text"].includes(m.type) &&
            [m.x, m.y, m.x2, m.y2].every(Number.isFinite),
        ) as Mark[])
      : [];
  } catch {
    return [];
  }
}
export function ImageCanvas({
  shot,
  onChange,
  editable = false,
}: {
  shot: Shot;
  onChange?: (annotations: string) => void;
  editable?: boolean;
}) {
  const marks = marksFor(shot.annotations);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null),
    [tool, setTool] = useState<"arrow" | "text">("arrow"),
    [text, setText] = useState("Confirmation");
  function position(e: React.PointerEvent) {
    const box = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) / box.width) * 100,
      y: ((e.clientY - box.top) / box.height) * 100,
    };
  }
  return (
    <>
      <div className="image-canvas">
        <CaptureImage
          src={shot.data}
          alt={`Capture ${shot.phase.toLowerCase()} le trade`}
        />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onPointerDown={(e) => {
            if (editable) {
              setStart(position(e));
              e.currentTarget.setPointerCapture(e.pointerId);
            }
          }}
          onPointerUp={(e) => {
            if (!editable || !start) return;
            const end = position(e);
            const next = [
              ...marks,
              {
                type: tool,
                x: start.x,
                y: start.y,
                x2: end.x,
                y2: end.y,
                text,
              },
            ];
            onChange?.(JSON.stringify(next));
            setStart(null);
          }}
        >
          <defs>
            <marker
              id={"arrow" + shot.id}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10z" fill="#8B5CF6" />
            </marker>
          </defs>
          {marks.map((m, i) =>
            m.type === "arrow" ? (
              <line
                key={i}
                x1={m.x}
                y1={m.y}
                x2={m.x2}
                y2={m.y2}
                stroke="#8B5CF6"
                strokeWidth=".4"
                markerEnd={`url(#arrow${shot.id})`}
              />
            ) : (
              <text
                key={i}
                x={m.x}
                y={m.y}
                fill="#8B5CF6"
                stroke="#05070a"
                strokeWidth=".1"
                fontSize="3"
              >
                {m.text}
              </text>
            ),
          )}
        </svg>
      </div>
      {editable && (
        <div className="annotation-tools">
          <Field label="Outil">
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value as "arrow" | "text")}
            >
              <option value="arrow">Flèche : cliquer et glisser</option>
              <option value="text">Texte : cliquer pour placer</option>
            </select>
          </Field>
          <Field label="Texte de l’annotation">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={100}
            />
          </Field>
          <button
            className="btn secondary"
            type="button"
            onClick={() => onChange?.(JSON.stringify(marks.slice(0, -1)))}
          >
            Annuler le dernier trait
          </button>
        </div>
      )}
    </>
  );
}
export function Gallery({
  shots,
  onChange,
}: {
  shots: Shot[];
  onChange?: (shots: Shot[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const shot = shots.find((s) => s.id === selected);
  return (
    <>
      <div className="gallery-grid">
        {shots.map((s) => (
          <div key={s.id}>
            <button
              type="button"
              className="image-thumb"
              onClick={() => setSelected(s.id)}
            >
              <CaptureImage src={s.data} alt={"Ouvrir la capture " + s.phase} />
              <span>{s.phase} · zoom / annotations</span>
            </button>
            {onChange && (
              <button
                className="text-btn negative"
                type="button"
                onClick={() => onChange(shots.filter((x) => x.id !== s.id))}
              >
                Retirer cette image
              </button>
            )}
          </div>
        ))}
      </div>
      {shot && (
        <Modal
          wide
          title={`Capture ${shot.phase} · ${onChange ? "annotation" : "zoom"}`}
          onClose={() => setSelected(null)}
        >
          <ImageCanvas
            shot={shot}
            editable={!!onChange}
            onChange={(annotations) =>
              onChange?.(
                shots.map((s) =>
                  s.id === shot.id ? { ...s, annotations } : s,
                ),
              )
            }
          />
          <p className="muted">{shot.caption || "Capture sans légende"}{shot.timeframe ? " · " + shot.timeframe : ""}</p>
          {onChange && <div className="form-grid">
            <Field label="Légende"><input maxLength={500} value={shot.caption ?? ""} onChange={e => onChange(shots.map(s => s.id === shot.id ? {...s, caption: e.target.value} : s))}/></Field>
            <Field label="Unité de temps de la capture"><input maxLength={30} value={shot.timeframe ?? ""} onChange={e => onChange(shots.map(s => s.id === shot.id ? {...s, timeframe: e.target.value} : s))}/></Field>
          </div>}
          <button
            type="button"
            className="btn primary full"
            onClick={() => setSelected(null)}
          >
            Terminer
          </button>
        </Modal>
      )}
    </>
  );
}
