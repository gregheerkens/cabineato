'use client';

/**
 * useNesting Hook
 *
 * Manages nesting configuration and memoized nesting computation.
 * Only computes when enabled.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Assembly } from '@/lib/types';
import { DEFAULT_NESTING_CONFIG } from '@/lib/types';
import type { NestingConfig, NestingResult } from '@/lib/nesting';
import { nestParts } from '@/lib/nesting';

export interface UseNestingReturn {
  nestingConfig: NestingConfig;
  setNestingConfig: (config: NestingConfig) => void;
  updateNestingConfig: (updates: Partial<NestingConfig>) => void;
  result: NestingResult | null;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export function useNesting(assembly: Assembly | null): UseNestingReturn {
  const [isEnabled, setEnabled] = useState(false);
  const [nestingConfig, setNestingConfigState] = useState<NestingConfig>({
    bedSize: [...DEFAULT_NESTING_CONFIG.bedSize] as [number, number],
    edgeMargin: DEFAULT_NESTING_CONFIG.edgeMargin,
    partSpacing: DEFAULT_NESTING_CONFIG.partSpacing,
    allowRotation: DEFAULT_NESTING_CONFIG.allowRotation,
    bitDiameter: DEFAULT_NESTING_CONFIG.bitDiameter,
  });

  const setNestingConfig = useCallback((config: NestingConfig) => {
    setNestingConfigState(config);
  }, []);

  const updateNestingConfig = useCallback((updates: Partial<NestingConfig>) => {
    setNestingConfigState((prev) => ({ ...prev, ...updates }));
  }, []);

  const result = useMemo(() => {
    if (!isEnabled || !assembly) return null;
    return nestParts(assembly, nestingConfig);
  }, [isEnabled, assembly, nestingConfig]);

  return {
    nestingConfig,
    setNestingConfig,
    updateNestingConfig,
    result,
    isEnabled,
    setEnabled,
  };
}

export default useNesting;
