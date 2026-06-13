import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ApiService } from '../services/api';
import {
  OperationSchema,
  OperationSpecDTO,
  ParamSpecDTO,
  OperationConfig,
  OperationParam,
  DEFAULT_OPERATION_CONFIGS,
  OPENCV_OPERATION_CONFIGS,
  SCIKIT_OPERATION_CONFIGS,
} from '../types';

// library display name -> { subcategory -> [operation labels] }
type Palette = Record<string, Record<string, string[]>>;

interface OperationSchemaContextValue {
  loading: boolean;
  error: string | null;
  usingFallback: boolean;
  /** Resolve an operation by id OR display label (case-insensitive). */
  getOp: (idOrLabel: string) => OperationSpecDTO | undefined;
  /** Default params (name -> default value) for an operation. */
  getDefaults: (idOrLabel: string) => Record<string, any>;
  /** Grouped operations for the sidebar palette. */
  palette: Palette;
  /** Flat list of all operation labels (for search). */
  allLabels: string[];
}

// Backend category "Basic" surfaces in the UI as "Basic Operations" (matches icons).
const LIBRARY_DISPLAY: Record<string, string> = { Basic: 'Basic Operations' };

// Subcategory grouping for Basic ops in the static fallback (the API provides
// its own grouping when reachable).
const BASIC_GROUPS: Record<string, string[]> = {
  Adjustments: ['Brightness', 'Contrast', 'Saturation', 'Exposure'],
  Filters: ['Grayscale', 'Sepia', 'Invert', 'Solarize', 'Posterize'],
  'Blur & Sharpen': ['Sharpen', 'Gaussian Blur'],
  Effects: ['Vignette', 'Grain'],
};

// ---- static-config → schema-DTO fallback (used only if the API is unreachable) ----
function adaptParam(p: OperationParam): ParamSpecDTO {
  if (p.type === 'select') {
    return {
      name: p.name,
      label: p.name,
      type: 'enum',
      default: p.default,
      options: (p.options ?? []).map((o) => ({ value: o, label: o })),
      help: p.description,
    };
  }
  if (p.type === 'checkbox') {
    return { name: p.name, label: p.name, type: 'bool', default: p.default, help: p.description };
  }
  // slider -> int when all values are integers, else float
  const nums = [p.default, p.min, p.max].filter((v) => typeof v === 'number') as number[];
  const isInt = nums.length > 0 && nums.every((v) => Number.isInteger(v));
  return {
    name: p.name,
    label: p.name,
    type: isInt ? 'int' : 'float',
    default: p.default,
    min: p.min,
    max: p.max,
    help: p.description,
  };
}

function adaptConfig(
  label: string,
  category: string,
  subcategory: string,
  cfg: OperationConfig
): OperationSpecDTO {
  return {
    id: label,
    label,
    category,
    subcategory,
    description: cfg.description,
    interactive: false,
    params: cfg.params.map(adaptParam),
  };
}

function buildFallback(): { specs: OperationSpecDTO[]; palette: Palette } {
  const specs: OperationSpecDTO[] = [];
  const palette: Palette = {};

  const basic: Record<string, string[]> = {};
  Object.entries(BASIC_GROUPS).forEach(([sub, labels]) => {
    basic[sub] = [];
    labels.forEach((label) => {
      const cfg = DEFAULT_OPERATION_CONFIGS[label];
      if (cfg) {
        specs.push(adaptConfig(label, 'Basic', sub, cfg));
        basic[sub].push(label);
      }
    });
  });
  palette['Basic Operations'] = basic;

  const addNested = (lib: string, configs: Record<string, Record<string, OperationConfig>>) => {
    const group: Record<string, string[]> = {};
    Object.entries(configs).forEach(([cat, ops]) => {
      group[cat] = [];
      Object.entries(ops).forEach(([label, cfg]) => {
        specs.push(adaptConfig(label, lib, cat, cfg));
        group[cat].push(label);
      });
    });
    palette[lib] = group;
  };
  addNested('OpenCV', OPENCV_OPERATION_CONFIGS);
  addNested('Scikit-Image', SCIKIT_OPERATION_CONFIGS);

  return { specs, palette };
}

function buildFromSchema(schema: OperationSchema): { specs: OperationSpecDTO[]; palette: Palette } {
  const specs: OperationSpecDTO[] = [];
  const palette: Palette = {};
  schema.categories.forEach((cat) => {
    const lib = LIBRARY_DISPLAY[cat.name] ?? cat.name;
    const group: Record<string, string[]> = {};
    cat.subcategories.forEach((sub) => {
      const subName = sub.name ?? 'Operations';
      if (!group[subName]) group[subName] = [];
      sub.operations.forEach((op) => {
        specs.push(op);
        group[subName].push(op.label);
      });
    });
    palette[lib] = group;
  });
  return { specs, palette };
}

const Ctx = createContext<OperationSchemaContextValue | null>(null);

export const OperationSchemaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schema, setSchema] = useState<OperationSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ApiService.getOperationsSchema()
      .then((s) => {
        if (active) {
          setSchema(s);
          setError(null);
        }
      })
      .catch((e: any) => {
        if (active) setError(e?.message ?? 'Failed to load operations');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<OperationSchemaContextValue>(() => {
    const usingFallback = !schema || !schema.categories?.length;
    const { specs, palette } = usingFallback ? buildFallback() : buildFromSchema(schema as OperationSchema);

    const index = new Map<string, OperationSpecDTO>();
    specs.forEach((s) => {
      index.set(s.id.toLowerCase(), s);
      index.set(s.label.toLowerCase(), s);
    });

    const getOp = (k: string) => index.get((k ?? '').toLowerCase());
    const getDefaults = (k: string) => {
      const out: Record<string, any> = {};
      getOp(k)?.params.forEach((p) => {
        if (p.default !== null && p.default !== undefined) out[p.name] = p.default;
      });
      return out;
    };

    return {
      loading,
      error,
      usingFallback,
      getOp,
      getDefaults,
      palette,
      allLabels: specs.map((s) => s.label),
    };
  }, [schema, loading, error]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useOperationSchema(): OperationSchemaContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useOperationSchema must be used within OperationSchemaProvider');
  }
  return ctx;
}
