import React from 'react';
import { ParamSpecDTO } from '../../types';

interface ParamControlProps {
  spec: ParamSpecDTO;
  value: any;
  onChange: (value: any) => void;
}

/**
 * Renders the right input control for a single operation parameter, driven by
 * the param's declared `type` from the backend schema. `strict` TS keeps this
 * switch exhaustive as new param types are added.
 */
const ParamControl: React.FC<ParamControlProps> = ({ spec, value, onChange }) => {
  switch (spec.type) {
    case 'int':
    case 'odd_kernel':
    case 'float':
    case 'angle': {
      const isFloat = spec.type === 'float' || spec.type === 'angle';
      const step = spec.step ?? (spec.type === 'odd_kernel' ? 2 : isFloat ? 0.01 : 1);
      const current = typeof value === 'number' ? value : Number(value ?? spec.default ?? 0);
      return (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={spec.min}
            max={spec.max}
            step={step}
            value={Number.isFinite(current) ? current : 0}
            onChange={(e) =>
              onChange(isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10))
            }
            className="param-slider flex-1"
          />
          <span className="text-sm font-mono text-gray-600 dark:text-gray-300 w-12 text-right">
            {String(value ?? spec.default ?? '')}
          </span>
        </div>
      );
    }

    case 'enum':
      return (
        <select
          value={String(value ?? spec.default ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="param-select"
        >
          {(spec.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );

    case 'bool':
      return (
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value ?? spec.default)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 accent-blue-600"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">{spec.help || spec.label}</span>
        </label>
      );

    case 'color': {
      const hex = typeof value === 'string' ? value : spec.default ?? '#000000';
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-10 rounded border border-gray-300 dark:border-zinc-600 bg-transparent cursor-pointer"
          />
          <span className="text-xs font-mono text-gray-600 dark:text-gray-300">{hex}</span>
        </div>
      );
    }

    // Interactive image-coordinate inputs: the picking UI (click / drag on the
    // preview) arrives with the Phase 4 PreviewCanvas. For now show status.
    case 'point':
    case 'points':
    case 'rect':
      return (
        <div className="text-xs italic text-gray-500 dark:text-gray-400">
          {value ? 'Set on image ✓' : 'Pick on the image (interactive picking coming soon)'}
        </div>
      );

    default:
      return null;
  }
};

export default ParamControl;
