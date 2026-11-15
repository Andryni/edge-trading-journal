"use client";
import { useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";

const candles = [
  [68, 38, 22, 1], [62, 52, 27, 1], [72, 32, 18, 0], [57, 60, 34, 1],
  [51, 48, 25, 1], [56, 40, 22, 0], [46, 65, 35, 1], [40, 54, 30, 1],
  [46, 42, 20, 0], [36, 70, 39, 1], [32, 48, 23, 0], [38, 52, 28, 0],
  [29, 75, 43, 1], [25, 58, 32, 1], [31, 44, 22, 0], [20, 63, 35, 1],
  [16, 57, 30, 1], [23, 45, 23, 0],
];

export default function LoginChart() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={"auth-visual" + (paused ? " is-paused" : "")}>
      <div className="auth-chart-halo" aria-hidden="true" />
      <div className="auth-chart-scene" aria-hidden="true">
        <div className="auth-chart-platform">
          <div className="auth-chart-underlay" />
          <div className="auth-chart-plane">
            <div className="auth-chart-grid" />
            <div className="auth-chart-scan" />
            <div className="auth-chart-heading"><span>EDGE / EXECUTION MAP</span><span>01 — 18</span></div>
            <svg className="auth-equity" viewBox="0 0 600 260" fill="none">
              <path className="auth-equity-area" d="M0 230 35 216 70 228 105 192 140 202 175 161 210 180 245 142 280 154 315 115 350 133 385 87 420 106 455 65 490 80 525 39 560 52 600 20V260H0Z" />
              <path className="auth-equity-line" d="M0 230 35 216 70 228 105 192 140 202 175 161 210 180 245 142 280 154 315 115 350 133 385 87 420 106 455 65 490 80 525 39 560 52 600 20" pathLength="1" />
            </svg>
            <div className="auth-candles">
              {candles.map(([top, wick, body, positive], i) => (
                <div key={i} className={"auth-candle " + (positive ? "positive" : "negative")} style={{ "--top": `${top}%`, "--wick": `${wick}px`, "--body": `${body}px`, "--delay": `${i * -0.37}s` } as CSSProperties}><i /><span /></div>
              ))}
            </div>
            <div className="auth-chart-axis"><span>PRÉPARER</span><span>EXÉCUTER</span><span>COMPRENDRE</span></div>
          </div>
        </div>
        <div className="auth-floating-note auth-note-plan"><i /><div><small>AVANT LA SÉANCE</small><strong>Un plan. Une intention.</strong></div><span>01</span></div>
        <div className="auth-floating-note auth-note-review"><span className="auth-mini-chart">▂▅▃▆▄▇</span><div><small>APRÈS LA SÉANCE</small><strong>Chaque trade t’apprend.</strong></div></div>
      </div>
      <div className="auth-visual-caption"><span>Visualisation illustrative · données fictives</span><button type="button" className="auth-animation-control" onClick={() => setPaused(!paused)} aria-label={paused ? "Reprendre l’animation" : "Mettre l’animation en pause"} aria-pressed={paused}>{paused ? <Play size={13} /> : <Pause size={13} />}</button></div>
    </div>
  );
}
