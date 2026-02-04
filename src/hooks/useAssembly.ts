'use client';

/**
 * useAssembly Hook
 *
 * Manages assembly state and provides computed values.
 */

import { useState, useCallback, useMemo } from 'react';
import type { AssemblyConfig, Assembly } from '@/lib/types';
import { DEFAULT_ASSEMBLY_CONFIG } from '@/lib/types';
import { buildAssembly, validateConfig, type ValidationResult } from '@/lib/geometry';

export interface UseAssemblyReturn {
  /** Current configuration */
  config: AssemblyConfig;
  /** Generated assembly (null if invalid config) */
  assembly: Assembly | null;
  /** Validation result */
  validation: ValidationResult;
  /** Update configuration */
  setConfig: (config: AssemblyConfig) => void;
  /** Update partial configuration */
  updateConfig: (updates: Partial<AssemblyConfig>) => void;
  /** Reset to default configuration */
  resetConfig: () => void;
  /** Is the current config valid? */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
}

/**
 * Hook for managing assembly state
 */
export function useAssembly(
  initialConfig: AssemblyConfig = DEFAULT_ASSEMBLY_CONFIG
): UseAssemblyReturn {
  const [config, setConfigState] = useState<AssemblyConfig>(initialConfig);

  // Validate and build assembly
  const { assembly, validation } = useMemo(() => {
    const validation = validateConfig(config);

    let assembly: Assembly | null = null;
    if (validation.valid) {
      try {
        assembly = buildAssembly(config);
      } catch (error) {
        console.error('Failed to build assembly:', error);
        validation.valid = false;
        validation.errors.push(
          error instanceof Error ? error.message : 'Unknown error building assembly'
        );
      }
    }

    return { assembly, validation };
  }, [config]);

  const setConfig = useCallback((newConfig: AssemblyConfig) => {
    setConfigState(newConfig);
  }, []);

  const updateConfig = useCallback((updates: Partial<AssemblyConfig>) => {
    setConfigState((prev) => ({
      ...prev,
      ...updates,
      globalBounds: {
        ...prev.globalBounds,
        ...(updates.globalBounds || {}),
      },
      material: {
        ...prev.material,
        ...(updates.material || {}),
      },
      machining: {
        ...prev.machining,
        ...(updates.machining || {}),
      },
      backPanel: {
        ...prev.backPanel,
        ...(updates.backPanel || {}),
      },
      features: {
        shelves: {
          ...prev.features.shelves,
          ...(updates.features?.shelves || {}),
        },
        drawers: {
          ...prev.features.drawers,
          ...(updates.features?.drawers || {}),
        },
        toeKick: {
          ...prev.features.toeKick,
          ...(updates.features?.toeKick || {}),
        },
      },
    }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_ASSEMBLY_CONFIG);
  }, []);

  return {
    config,
    assembly,
    validation,
    setConfig,
    updateConfig,
    resetConfig,
    isValid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}

export default useAssembly;
