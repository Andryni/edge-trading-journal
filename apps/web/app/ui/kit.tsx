"use client";
import { useEffect, useId, useRef, Children, isValidElement, cloneElement, type ReactElement, type ReactNode } from "react";
import { X } from "lucide-react";
const frenchInteger = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const money = (n: number) =>
  frenchInteger.format(n).replace(/[\u00a0\u202f]/g, " ") + " $";
export const num = (n: number, d = 2) =>
  n.toLocaleString("fr-FR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
export const r = (n: number) =>
  (n > 0 ? "+" : n < 0 ? "−" : "") + num(Math.abs(n)) + "R";
export const signedMoney = (n: number) =>
  (n > 0 ? "+" : n < 0 ? "−" : "") + money(Math.abs(n));
export function Sparkline({
  values,
  tone = "accent",
  height = 26,
  area = false,
}: {
  values: number[];
  tone?: string;
  height?: number;
  area?: boolean;
}) {
  const gradientId = useId().replace(/:/g, "");
  if (values.length < 2)
    return <span className="sparkline-empty" aria-hidden="true" />;
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const y = (value: number) => 26 - ((value - min) / span) * 24;
  const coords = values.map(
    (value, index) =>
      (index / (values.length - 1)) * 100 + "," + y(value).toFixed(2),
  );
  return (
    <svg
      className={"sparkline " + tone}
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      style={{ height }}
      aria-hidden="true"
    >
      {area && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.34" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      <line className="sparkline-zero" x1="0" x2="100" y1={y(0)} y2={y(0)} />
      {area && (
        <polygon
          points={"0,28 " + coords.join(" ") + " 100,28"}
          fill={"url(#" + gradientId + ")"}
        />
      )}
      <polyline points={coords.join(" ")} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
export function Ring({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <svg
      className="edge-ring"
      viewBox="0 0 40 40"
      role="img"
      aria-label={label ?? Math.round(pct) + " %"}
    >
      <circle className="edge-ring-track" cx="20" cy="20" r="15" />
      <circle
        className="edge-ring-value"
        cx="20"
        cy="20"
        r="15"
        pathLength={100}
        strokeDasharray={pct + " 100"}
      />
    </svg>
  );
}
export function Gauge({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <svg
      className="gauge"
      viewBox="0 0 60 34"
      role="img"
      aria-label={label ?? Math.round(pct) + " %"}
    >
      <path className="gauge-track" d="M6 30a24 24 0 0 1 48 0" pathLength={100} />
      <path
        className="gauge-value"
        d="M6 30a24 24 0 0 1 48 0"
        pathLength={100}
        strokeDasharray={pct + " 100"}
      />
    </svg>
  );
}
export function BalanceBar({
  positive,
  negative,
  label,
}: {
  positive: number;
  negative: number;
  label: string;
}) {
  const total = positive + negative || 1;
  return (
    <div className="balance-bar" role="img" aria-label={label}>
      <i className="gain" style={{ width: (positive / total) * 100 + "%" }} />
      <i className="loss" style={{ width: (negative / total) * 100 + "%" }} />
    </div>
  );
}
export function RangeBar({
  min,
  max,
  lowLabel,
  highLabel,
  label,
}: {
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
  label: string;
}) {
  const span = max - min || 1;
  const zero = Math.max(0, Math.min(100, ((0 - min) / span) * 100));
  return (
    <div className="range-bar" role="img" aria-label={label}>
      <div className="range-bar-track" aria-hidden="true">
        <i className="range-bar-zero" style={{ left: zero + "%" }} />
      </div>
      <div className="range-bar-labels">
        <span className="negative">{lowLabel}</span>
        <span className="positive">{highLabel}</span>
      </div>
    </div>
  );
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={"panel " + className}>{children}</section>;
}
export function Pill({
  children,
  tone = "violet",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={"pill " + tone}>{children}</span>;
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const labelId = useId();
  return (
    <label className="field">
      <span id={labelId}>{label}</span>
      {Children.map(children, child => isValidElement(child) && ["input", "select", "textarea"].includes(String(child.type))
        ? cloneElement(child as ReactElement<{"aria-labelledby"?: string}>, {"aria-labelledby": labelId}) : child)}
    </label>
  );
}
export function Modal({
  title,
  onClose,
  children,
  wide = false,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const old = document.activeElement as HTMLElement | null;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current
      ?.querySelector<HTMLElement>("input,button,select,textarea")
      ?.focus();
    function key(e: KeyboardEvent) {
      const dialogs = document.querySelectorAll<HTMLElement>(
        '[role="dialog"][aria-modal="true"]',
      );
      if (dialogs.item(dialogs.length - 1) !== ref.current) return;
      if (e.key === "Escape") close.current();
      if (e.key !== "Tab") return;
      const nodes = [
        ...ref.current!.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]',
        ),
      ].filter((n) => n.offsetParent !== null);
      const first = nodes[0],
        last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = original;
      old?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop">
      <div
        ref={ref}
        className={"modal " + (wide ? "wide-modal " : "") + className}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="panel-heading">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Fermer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
export function Metric({
  label,
  value,
  sub,
  action,
  tone = "",
  comparison,
  compact = false,
  graphic,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  action: string;
  tone?: string;
  comparison?: ReactNode;
  compact?: boolean;
  graphic?: ReactNode;
}) {
  return (
    <Panel className={"metric" + (compact ? " metric-compact" : "")}>
      <span className="eyebrow">{label}</span>
      <div className="metric-reading"><strong className={"metric-value mono block-value " + tone}>
        {value}
      </strong>{graphic}</div>
      <p className="metric-sub">{sub}</p>
      {comparison}
      {!compact && <div className="metric-note">{action}</div>}
    </Panel>
  );
}
export function Empty({
  text = "Aucune donnée pour cette sélection.",
}: {
  text?: string;
}) {
  return <p className="empty">{text}</p>;
}

export function SectionHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="section-actions">{actions}</div>}
    </div>
  );
}
export function Stat({
  label,
  value,
  sub,
  meta,
  tone = "",
  graphic,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  meta?: ReactNode;
  tone?: string;
  graphic?: ReactNode;
}) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd className={"mono " + tone}>{value}</dd>
      {meta && <div className="stat-meta">{meta}</div>}
      {graphic && <div className="stat-visual">{graphic}</div>}
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
export function Tabs<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id?: string;
  label: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
}) {
  const generated = useId();
  const prefix = id ?? generated;
  return (
    <div
      className="view-tabs"
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        const current = options.findIndex((option) => option.value === value);
        const next =
          event.key === "ArrowRight"
            ? (current + 1) % options.length
            : event.key === "ArrowLeft"
              ? (current - 1 + options.length) % options.length
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : -1;
        if (next < 0) return;
        event.preventDefault();
        onChange(options[next].value);
        event.currentTarget
          .querySelectorAll<HTMLButtonElement>('[role="tab"]')
          [next]?.focus();
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          id={prefix + "-" + option.value}
          aria-controls={prefix + "-panel"}
          aria-selected={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="tab-count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
