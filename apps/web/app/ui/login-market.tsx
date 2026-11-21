"use client";
import { useEffect, useRef } from "react";

const count = 34;
const pitch = 20;
const price = (t: number) => 77 - 22 * Math.sin(t * .18) + 13 * Math.cos(t * .71) - 8 * Math.sin(t * 1.43);

function candle(index: number, fraction = 1) {
  const open = price(index), close = price(index + fraction);
  const high = Math.min(open, close) - 3 - 4 * Math.abs(Math.sin(index * 1.8)) * fraction;
  const low = Math.max(open, close) + 3 + 5 * Math.abs(Math.cos(index * 1.3)) * fraction;
  return { open, close, high, low, color: close <= open ? "#69e1cd" : "#ff7a8a" };
}

// An illustrative price stream, isolated from journal data and authentication.
export default function LoginMarket({ paused }: { paused: boolean }) {
  const plot = useRef<SVGGElement>(null);
  const elapsed = useRef(0);
  useEffect(() => {
    const node = plot.current;
    if (!node || paused) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const bars = Array.from(node.querySelectorAll<SVGGElement>("[data-bar]"));
    const line = node.querySelector("polyline")!;
    let frame = 0, last = 0;
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      if (!last) { last = now; return; }
      if (now - last < 40) return;
      elapsed.current += Math.min(now - last, 100);
      last = now;
      const time = elapsed.current / 1150, start = Math.floor(time), phase = time - start;
      node!.setAttribute("transform", `translate(${-phase * pitch} 0)`);
      const points = bars.map((bar, i) => {
        const b = candle(start + i, i === count - 1 ? phase : 1);
        const wick = bar.children[0], body = bar.children[1];
        wick.setAttribute("y1", String(b.high)); wick.setAttribute("y2", String(b.low));
        body.setAttribute("y", String(Math.min(b.open,b.close)));
        body.setAttribute("height", String(Math.max(2, Math.abs(b.open-b.close))));
        bar.setAttribute("color", b.color);
        return `${i*pitch},${(b.close + price(start+i-.6) + price(start+i-1.2))/3 - 12}`;
      });
      line.setAttribute("points", points.join(" "));
    }
    function sync() {
      cancelAnimationFrame(frame); last = 0;
      if (!preference.matches && !document.hidden) frame = requestAnimationFrame(draw);
    }
    sync();
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener("change",sync); document.removeEventListener("visibilitychange",sync); };
  }, [paused]);
  return <svg className="login-market" viewBox="0 0 655 144" preserveAspectRatio="none" aria-hidden="true">
    <g ref={plot}>{Array.from({length:count}, (_,i) => {
      const b = candle(i);
      return <g data-bar="" key={i} transform={`translate(${i*pitch} 0)`} color={b.color}>
        <line y1={b.high} y2={b.low} stroke="currentColor" strokeWidth="1.4"/>
        <rect x="-4" width="8" y={Math.min(b.open,b.close)} height={Math.max(2,Math.abs(b.close-b.open))} rx="1" fill="currentColor"/>
      </g>;
    })}<polyline points={Array.from({length:count},(_,i)=>`${i*pitch},${(price(i+1)+price(i-.6)+price(i-1.2))/3-12}`).join(" ")} fill="none" stroke="#8fd6bd" strokeWidth="1.8" strokeLinejoin="round"/></g>
  </svg>;
}
