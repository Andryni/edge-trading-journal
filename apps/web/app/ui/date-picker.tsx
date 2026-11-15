"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

/** La valeur reste une date ISO sans conversion de fuseau ; seul l'affichage change. */
export const displayDate = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? iso.slice(8) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4)
    : "";
function parseDate(input: string) {
  const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(iso + "T12:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === iso
    ? iso
    : null;
}
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const monthTitle = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
export function DatePicker({
  label,
  value,
  onChange,
  clearable = true,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  clearable?: boolean;
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null),
    popup = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(displayDate(value)),
    [error, setError] = useState(""),
    [month, setMonth] = useState((value || today()).slice(0, 7)),
    [focusDate, setFocusDate] = useState(value || today()),
    [position, setPosition] = useState({ top: 0, left: 0, width: 316 });
  useEffect(() => {
    setDraft(displayDate(value));
    setError("");
  }, [value]);
  function close() {
    setOpen(false);
  }
  function locate() {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(328, window.innerWidth - 24),
      height = 405;
    setPosition({
      width,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top:
        rect.bottom + height < window.innerHeight
          ? rect.bottom + 8
          : Math.max(12, rect.top - height - 8),
    });
  }
  useEffect(() => {
    if (!open) return;
    locate();
    const click = (e: PointerEvent) => {
      if (
        !box.current?.contains(e.target as Node) &&
        !popup.current?.contains(e.target as Node)
      )
        close();
    };
    const key = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", click);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", locate);
    window.addEventListener("scroll", locate, true);
    return () => {
      document.removeEventListener("pointerdown", click);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", locate);
      window.removeEventListener("scroll", locate, true);
    };
  }, [open]);
  useEffect(() => {
    if (open)
      popup.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)
        ?.focus();
  }, [open, month, focusDate]);
  function select(iso: string) {
    onChange(iso);
    setDraft(displayDate(iso));
    setError("");
    close();
    trigger.current?.focus();
  }
  function submitDraft() {
    if (!draft.trim()) {
      if (clearable) {
        onChange("");
        setError("");
      } else {
        setDraft(displayDate(value));
      }
      return;
    }
    const iso = parseDate(draft);
    if (iso) {
      onChange(iso);
      setError("");
      setMonth(iso.slice(0, 7));
    } else setError("Date invalide. Utilise JJ/MM/AAAA.");
  }
  function shiftMonth(delta: number) {
    const d = new Date(month + "-01T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + delta);
    setMonth(d.toISOString().slice(0, 7));
    setFocusDate(d.toISOString().slice(0, 10));
  }
  function keyDay(event: KeyboardEvent<HTMLButtonElement>, iso: string) {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in offsets) {
      event.preventDefault();
      const d = new Date(iso + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() + offsets[event.key]);
      const next = d.toISOString().slice(0, 10);
      setMonth(next.slice(0, 7));
      setFocusDate(next);
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      shiftMonth(event.key === "PageUp" ? -1 : 1);
    }
  }
  const first = new Date(month + "-01T12:00:00Z"),
    offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  return (
    <div className="edge-date field" ref={box}>
      <label htmlFor={id}>{label}</label>
      <div className="edge-date-control">
        <input
          ref={input}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="JJ/MM/AAAA"
          maxLength={10}
          value={draft}
          aria-invalid={!!error}
          aria-describedby={error ? id + "-error" : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            setError("");
          }}
          onBlur={submitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitDraft();
              input.current?.blur();
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setMonth((value || today()).slice(0, 7));
              setFocusDate(value || today());
              setOpen(true);
            }
          }}
        />
        {value && clearable && (
          <button
            className="edge-date-clear"
            type="button"
            aria-label={`Effacer ${label}`}
            onClick={() => {
              onChange("");
              setDraft("");
              setError("");
            }}
          >
            <X size={14} />
          </button>
        )}
        <button
          ref={trigger}
          className="edge-date-toggle"
          type="button"
          aria-label={`Ouvrir le calendrier : ${label}`}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={id + "-calendar"}
          onClick={() => {
            setMonth((value || today()).slice(0, 7));
            setFocusDate(value || today());
            setOpen(!open);
          }}
        >
          <CalendarDays size={17} />
        </button>
      </div>
      {error && (
        <span id={id + "-error"} className="edge-date-error" role="alert">
          {error}
        </span>
      )}
      {open &&
        createPortal(
          <div
            ref={popup}
            id={id + "-calendar"}
            className="edge-date-popover"
            role="dialog"
            aria-label={`Choisir une date : ${label}`}
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            <div className="edge-date-head">
              <button
                type="button"
                aria-label="Mois précédent"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <strong aria-live="polite">{monthTitle.format(first)}</strong>
              <button
                type="button"
                aria-label="Mois suivant"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="edge-date-week" aria-hidden="true">
              {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((day, i) => (
                <span key={i}>{day}</span>
              ))}
            </div>
            <div
              className="edge-date-days"
              role="grid"
              aria-label={monthTitle.format(first)}
            >
              {Array.from(
                { length: Math.ceil((offset + days) / 7) },
                (_, week) => (
                  <div role="row" className="edge-date-row" key={week}>
                    {Array.from({ length: 7 }, (_, column) => {
                      const day = week * 7 + column - offset + 1;
                      if (day < 1 || day > days)
                        return (
                          <span
                            key={column}
                            role="gridcell"
                            aria-hidden="true"
                          />
                        );
                      const iso = month + "-" + String(day).padStart(2, "0");
                      return (
                        <button
                          key={column}
                          type="button"
                          role="gridcell"
                          data-date={iso}
                          tabIndex={iso === focusDate ? 0 : -1}
                          aria-label={displayDate(iso)}
                          aria-selected={iso === value}
                          aria-current={iso === today() ? "date" : undefined}
                          onKeyDown={(e) => keyDay(e, iso)}
                          onClick={() => select(iso)}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                ),
              )}
            </div>
            <div className="edge-date-footer">
              <button type="button" onClick={() => select(today())}>
                Aujourd’hui
              </button>
              <button
                type="button"
                onClick={() => {
                  close();
                  trigger.current?.focus();
                }}
              >
                Fermer
              </button>
            </div>
            <p>JJ/MM/AAAA · flèches pour naviguer</p>
          </div>,
          document.body,
        )}
    </div>
  );
}
