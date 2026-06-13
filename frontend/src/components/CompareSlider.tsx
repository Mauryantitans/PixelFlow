import React, { useRef, useState } from 'react';

interface CompareSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/** Before/after comparison with a draggable wipe divider. */
const CompareSlider: React.FC<CompareSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [pos, setPos] = useState(50); // divider position, %

  const update = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.min(100, Math.max(0, p)));
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block max-w-full max-h-full select-none"
      onMouseMove={(e) => dragging.current && update(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
    >
      {/* Before image defines the box */}
      <img src={beforeSrc} alt={beforeLabel} className="block max-w-full max-h-full object-contain rounded-lg" />

      {/* After image clipped to the divider */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={afterSrc} alt={afterLabel} className="absolute inset-0 w-full h-full object-contain rounded-lg" />
      </div>

      {/* Divider + handle */}
      <div className="absolute top-0 bottom-0" style={{ left: `${pos}%` }}>
        <div className="w-0.5 h-full bg-white shadow-[0_0_4px_rgba(0,0,0,0.6)]" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center cursor-ew-resize text-zinc-700 text-xs font-bold"
          onMouseDown={(e) => {
            e.preventDefault();
            dragging.current = true;
          }}
        >
          ⇆
        </div>
      </div>

      <span className="absolute top-2 left-2 text-[11px] bg-black/60 text-white px-1.5 py-0.5 rounded">{beforeLabel}</span>
      <span className="absolute top-2 right-2 text-[11px] bg-black/60 text-white px-1.5 py-0.5 rounded">{afterLabel}</span>
    </div>
  );
};

export default CompareSlider;
