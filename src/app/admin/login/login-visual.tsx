"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

type Cell = { id: number; x: number; y: number; glyph: string };

export function LoginVisual() {
  const visual = useRef<HTMLElement>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [active, setActive] = useState<Set<number>>(() => new Set());
  const cellSize = 36;

  useEffect(() => {
    const element = visual.current;
    if (!element) return;
    const build = () => {
      const { width, height } = element.getBoundingClientRect();
      const columns = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);
      const glyphs = ["+", "×", "•", "01", "FC", "↗"];
      setCells(Array.from({ length: columns * rows }, (_, id) => ({
        id,
        x: (id % columns) * cellSize,
        y: Math.floor(id / columns) * cellSize,
        glyph: glyphs[id % glyphs.length] ?? "+",
      })));
    };
    build();
    const observer = new ResizeObserver(build);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const reveal = useCallback((event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / cellSize;
    const py = (event.clientY - rect.top) / cellSize;
    const nearest = [...cells].sort((a, b) =>
      Math.hypot(px - a.x / cellSize, py - a.y / cellSize) - Math.hypot(px - b.x / cellSize, py - b.y / cellSize))
      .slice(0, 12).map((cell) => cell.id);
    setActive(new Set(nearest));
  }, [cells]);

  return (
    <section ref={visual} data-login-visual onMouseMove={reveal} onMouseLeave={() => setActive(new Set())} className="relative min-h-[50svh] overflow-hidden bg-[#050505] p-7 text-white sm:p-10 lg:min-h-svh">
      <div data-login-image className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 25% 20%, #f7d488 0, transparent 32%), linear-gradient(135deg, #525252 0%, #ae8d4b 48%, #050505 100%)" }} />
      <div className="absolute inset-[9%] rounded-[2rem] border border-white/25" aria-hidden="true"><div className="absolute left-1/2 top-0 h-full border-l border-white/25" /><div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" /></div>
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
        {cells.map((cell) => <span key={cell.id} className={`absolute grid place-items-center bg-[#050505]/90 font-mono text-[0.65rem] text-[#f7d488] transition-opacity duration-100 ${active.has(cell.id) ? "opacity-100" : "opacity-0"}`} style={{ left: cell.x, top: cell.y, width: cellSize, height: cellSize }}>{cell.glyph}</span>)}
      </div>
      <div className="relative z-10 flex min-h-[calc(50svh-3.5rem)] flex-col justify-between lg:min-h-[calc(100svh-5rem)]">
        <div data-login-reveal className="flex justify-between font-mono text-[0.65rem] uppercase tracking-[0.16em] text-white/65"><span>Alana FC Academy</span><span>Διαχείριση / 2026</span></div>
        <div>
          <h1 data-login-heading className="max-w-4xl text-[clamp(2.45rem,6.2vw,5.8rem)] font-black uppercase leading-[0.88] tracking-[-0.045em]">Παίξε.<br />Εξελίξου.<br />Ανήκεις.</h1>
          <div data-login-reveal className="mt-7 flex items-end justify-between border-t border-white/30 pt-5"><p className="max-w-sm text-sm leading-6 text-white/75">Το προστατευμένο κέντρο διαχείρισης της ακαδημίας.</p><span className="font-mono text-[0.62rem] uppercase tracking-widest text-[#f7d488]">Κίνησε τον δείκτη ↗</span></div>
        </div>
      </div>
    </section>
  );
}
