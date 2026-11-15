"use client";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { dateLabel } from "./view-data";
import { r } from "./kit";
export function SessionPicker({
  days,
  onDay,
}: {
  days: Record<string, { r: number; count: number }>;
  onDay: (day: string) => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details
      className="session-picker"
      ref={ref}
      onKeyDown={(event) => {
        if (event.key === "Escape" && ref.current) {
          ref.current.open = false;
          ref.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>
        Voir une séance <ChevronDown size={13} aria-hidden="true" />
      </summary>
      <div className="session-picker-list">
        {Object.entries(days)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([day, value]) => (
            <button
              type="button"
              key={day}
              onClick={() => {
                if (ref.current) ref.current.open = false;
                onDay(day);
              }}
            >
              <span>
                {dateLabel(day)}
                <small>{value.count} trades</small>
              </span>
              <strong
                className={"mono " + (value.r >= 0 ? "positive" : "negative")}
              >
                {r(value.r)}
              </strong>
            </button>
          ))}
        {!Object.keys(days).length && <p>Aucune séance dans la sélection.</p>}
      </div>
    </details>
  );
}
