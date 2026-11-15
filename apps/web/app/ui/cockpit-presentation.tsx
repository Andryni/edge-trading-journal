"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { money, num, r } from "./kit";

/** Présentation uniquement : le nombre final provient toujours du moteur métier. */
export function RollingValue({
  value,
  format = "r",
}: {
  value: number;
  format?: "r" | "usd" | "percent" | "integer";
}) {
  const reduced = useReducedMotion();
  const previous = useRef(0);
  const [display, setDisplay] = useState(value);
  const render = (n: number) =>
    format === "usd"
      ? money(n)
      : format === "percent"
        ? num(n, 1) + " %"
        : format === "integer"
          ? num(n, 0)
          : r(n);
  useEffect(() => {
    const startValue = previous.current;
    previous.current = value;
    if (
      reduced ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const started = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - started) / 750);
      setDisplay(
        startValue + (value - startValue) * (1 - Math.pow(1 - progress, 3)),
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return (
    <span className="rolling-value">
      <span aria-hidden="true">{render(display)}</span>
      <span className="sr-only">{render(value)}</span>
    </span>
  );
}
export const tradeCount = (count: number) =>
  `${num(count, 0)} ${count === 1 ? "trade" : "trades"}`;
