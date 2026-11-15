"use client";
import { Check, Minus, ArrowUpRight } from "lucide-react";
import type { Trade } from "@edge/core";
import { tradePlan } from "./view-data";
export function TradeStatus({
  trade,
  score = false,
}: {
  trade: Trade;
  score?: boolean;
}) {
  const state = tradePlan(trade);
  const Icon =
    state.value === "respected"
      ? Check
      : state.value === "offplan"
        ? ArrowUpRight
        : Minus;
  return (
    <span className={"trade-status-wrap " + state.tone}>
      <span
        className={"status-badge " + state.tone}
        title="Plan respecté : score déclaré de 8/10 ou plus"
      >
        <Icon size={12} aria-hidden="true" />
        {state.label}
      </span>
      {score && state.value !== "unknown" && (
        <small className="mono">{trade.planScore}/10</small>
      )}
    </span>
  );
}
