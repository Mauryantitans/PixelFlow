import React, { useRef, useState } from 'react';
import { usePicker } from '../contexts/PickerContext';
import { usePipelineContext } from '../contexts/PipelineContext';

interface PreviewCanvasProps {
  src: string;
  alt?: string;
  className?: string;
}

// Map a client point to normalized [0..1] image coords, accounting for any
// object-contain letterboxing.
function toNormalized(img: HTMLImageElement, clientX: number, clientY: number) {
  const rect = img.getBoundingClientRect();
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh || rect.width === 0 || rect.height === 0) return null;
  const elAR = rect.width / rect.height;
  const imAR = nw / nh;
  let cw: number, ch: number, ox: number, oy: number;
  if (imAR > elAR) {
    cw = rect.width;
    ch = rect.width / imAR;
    ox = 0;
    oy = (rect.height - ch) / 2;
  } else {
    ch = rect.height;
    cw = rect.height * imAR;
    oy = 0;
    ox = (rect.width - cw) / 2;
  }
  const x = (clientX - rect.left - ox) / cw;
  const y = (clientY - rect.top - oy) / ch;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
}

function sampleHex(img: HTMLImageElement, nx: number, ny: number): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const px = Math.min(img.naturalWidth - 1, Math.round(nx * img.naturalWidth));
  const py = Math.min(img.naturalHeight - 1, Math.round(ny * img.naturalHeight));
  try {
    const d = ctx.getImageData(px, py, 1, 1).data;
    const h = (n: number) => n.toString(16).padStart(2, '0');
    return `#${h(d[0])}${h(d[1])}${h(d[2])}`;
  } catch {
    return null;
  }
}

/**
 * The preview image plus a transparent overlay that — when a coordinate/color
 * picker is armed — captures click (point), drag (rect) or click-sample (color)
 * and writes the normalized value back into the pipeline step.
 */
const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ src, alt, className }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const { activePicker, clear } = usePicker();
  const { updateStepParam } = usePipelineContext();
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  const type = activePicker?.type;
  const armed = !!activePicker;

  const commit = (value: any) => {
    if (!activePicker) return;
    updateStepParam(activePicker.stepId, activePicker.paramName, value);
    clear();
  };

  const onClick = (e: React.MouseEvent) => {
    if (!armed || !imgRef.current) return;
    const n = toNormalized(imgRef.current, e.clientX, e.clientY);
    if (!n) return;
    if (type === 'point' || type === 'points') {
      commit(type === 'points' ? [n] : n);
    } else if (type === 'color') {
      const hex = sampleHex(imgRef.current, n.x, n.y);
      if (hex) commit(hex);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!armed || type !== 'rect' || !imgRef.current) return;
    const n = toNormalized(imgRef.current, e.clientX, e.clientY);
    if (n) setDrag({ x0: n.x, y0: n.y, x1: n.x, y1: n.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag || !imgRef.current) return;
    const n = toNormalized(imgRef.current, e.clientX, e.clientY);
    if (n) setDrag((d) => (d ? { ...d, x1: n.x, y1: n.y } : d));
  };

  const onMouseUp = () => {
    if (!drag) return;
    const x = Math.min(drag.x0, drag.x1);
    const y = Math.min(drag.y0, drag.y1);
    const w = Math.abs(drag.x1 - drag.x0);
    const h = Math.abs(drag.y1 - drag.y0);
    setDrag(null);
    if (w > 0.01 && h > 0.01) commit({ x, y, w, h });
  };

  const band = drag
    ? {
        left: `${Math.min(drag.x0, drag.x1) * 100}%`,
        top: `${Math.min(drag.y0, drag.y1) * 100}%`,
        width: `${Math.abs(drag.x1 - drag.x0) * 100}%`,
        height: `${Math.abs(drag.y1 - drag.y0) * 100}%`,
      }
    : null;

  const hint = type === 'rect' ? 'Drag to draw a region' : type === 'color' ? 'Click to pick a color' : 'Click to place the point';

  return (
    <div className="relative inline-flex max-w-full max-h-full">
      <img ref={imgRef} src={src} alt={alt} className={className} />
      {armed && (
        <div
          data-testid="preview-picker-overlay"
          className="absolute inset-0 cursor-crosshair"
          onClick={onClick}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {band && <div className="absolute border-2 border-blue-500 bg-blue-500/20" style={band} />}
          <div className="absolute top-2 left-2 text-[11px] font-medium bg-blue-600 text-white px-2 py-1 rounded shadow">
            {hint}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewCanvas;
