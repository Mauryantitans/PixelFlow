import React, { createContext, useCallback, useContext, useState } from 'react';

export interface ActivePicker {
  stepId: string;
  paramName: string;
  type: string; // 'point' | 'points' | 'rect' | 'color'
}

interface PickerContextValue {
  activePicker: ActivePicker | null;
  arm: (p: ActivePicker) => void;
  clear: () => void;
  isArmed: (stepId: string, paramName: string) => boolean;
}

const Ctx = createContext<PickerContextValue | null>(null);

/**
 * Tracks which operation parameter is currently being "picked" on the image.
 * ParamControl arms a picker; PreviewCanvas captures the click/drag and writes
 * the value back, then clears.
 */
export const PickerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);
  const arm = useCallback((p: ActivePicker) => setActivePicker(p), []);
  const clear = useCallback(() => setActivePicker(null), []);
  const isArmed = useCallback(
    (stepId: string, paramName: string) =>
      !!activePicker && activePicker.stepId === stepId && activePicker.paramName === paramName,
    [activePicker]
  );
  return <Ctx.Provider value={{ activePicker, arm, clear, isArmed }}>{children}</Ctx.Provider>;
};

export function usePicker(): PickerContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePicker must be used within PickerProvider');
  return ctx;
}
