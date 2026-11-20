import { Boxes, ChartNoAxesColumnIncreasing, Diamond, Gem, Layers3, Mountain, Triangle } from "lucide-react";

const marks = {
  NQ: { icon: Mountain, color: "#8390ff" },
  MNQ: { icon: Triangle, color: "#a68bfa" },
  ES: { icon: Layers3, color: "#48c9b0" },
  MES: { icon: ChartNoAxesColumnIncreasing, color: "#65b2fc" },
  GC: { icon: Boxes, color: "#e8af43" },
  MGC: { icon: Gem, color: "#e9ca7a" },
  XAUUSD: { icon: Diamond, color: "#ef985c" },
};

export function InstrumentMark({ symbol }: { symbol: string }) {
  const mark = marks[symbol.toUpperCase() as keyof typeof marks];
  const Icon = mark?.icon;
  return <span className="asset-mark" aria-hidden="true" style={{color: mark?.color ?? "#a8b6db"}}>
    {Icon ? <Icon size={17} strokeWidth={2.2} /> : symbol.slice(0, 2).toUpperCase()}
  </span>;
}
