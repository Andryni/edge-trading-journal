"use client";
import { useState } from "react";
import { Pause, Play } from "lucide-react";

import LoginMarket from "./login-market";

export default function LoginChart() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={"auth-visual" + (paused ? " is-paused" : "")}
      onPointerMove={event => {
        if (paused || event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const scene = event.currentTarget;
        const box = scene.getBoundingClientRect();
        scene.style.setProperty("--tilt-x", ((0.5 - (event.clientY - box.top) / box.height) * 12) + "deg");
        scene.style.setProperty("--tilt-y", (((event.clientX - box.left) / box.width - 0.5) * 16) + "deg");
      }}
      onPointerLeave={event => {event.currentTarget.style.removeProperty("--tilt-x"); event.currentTarget.style.removeProperty("--tilt-y");}}>
      <div className="auth-chart-halo" aria-hidden="true" />
      <div className="auth-chart-scene" aria-hidden="true">
        <div className="auth-chart-platform">
          <div className="auth-chart-underlay" />
          <div className="auth-chart-plane">
            <div className="preview-overview">
              <div className="preview-bar"><img src="/brand/edge-mark.svg?v=spectrum2" width="22" height="22" alt="" /><strong>EDGE</strong><span>Vue d’ensemble</span></div>
              <div className="preview-kpis"><div><small>Performance nette</small><strong>+2,4 R</strong></div><div><small>Réussite</small><strong>61,1 %</strong></div><div><small>Instrument</small><strong>NQ</strong></div></div>
            </div>
            <div className="auth-chart-grid" />
            <div className="auth-chart-scan" />
            <div className="auth-chart-heading"><span>NASDAQ 100 · NQ</span><span>5 MIN</span></div>
            <LoginMarket paused={paused} />
            <div className="auth-chart-axis"><span>09:30</span><span>10:00</span><span>10:30</span><span>11:00</span></div>
          </div>
        </div>
        <div className="auth-floating-note auth-note-review"><span className="auth-mini-chart">▂▅▃▆▄▇</span><div><small>EXÉCUTIONS</small><strong>18 trades</strong></div></div>
      </div>
      <div className="auth-visual-caption"><span>Visualisation illustrative · données fictives</span><button type="button" className="auth-animation-control" onClick={() => setPaused(!paused)} aria-label={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"} aria-pressed={paused}>{paused ? <Play size={13} /> : <Pause size={13} />}</button></div>
    </div>
  );
}
