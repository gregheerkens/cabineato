/**
 * CNC Layer Definitions
 *
 * Layer names for CNC export following Vectric conventions.
 * Each layer corresponds to a specific CNC operation.
 *
 * Per AdditionalContext.md:
 * - Layer "OUTSIDE_CUT": External boundaries for through-cutting
 * - Layer "DRILL_5MM": Center points for shelf pin drilling operations
 * - Layer "POCKET_DADO": Closed vectors for material subtraction (slots/grooves)
 */

import type { CNCLayer } from '../types';

/**
 * Layer configuration for CNC export
 */
export interface LayerConfig {
  /** Layer name as it appears in the export */
  name: string;
  /** Description of the layer's purpose */
  description: string;
  /** Suggested color for display (hex) */
  color: string;
  /** Typical tool operation */
  operation: string;
}

/**
 * Layer configurations for all CNC layers
 */
export const LAYER_CONFIGS: Record<CNCLayer, LayerConfig> = {
  OUTSIDE_CUT: {
    name: 'OUTSIDE_CUT',
    description: 'External boundaries for through-cutting',
    color: '#FF0000', // Red
    operation: 'Profile toolpath - outside/right',
  },
  DRILL_5MM: {
    name: 'DRILL_5MM',
    description: 'Center points for 5mm shelf pin drilling',
    color: '#00FF00', // Green
    operation: 'Drilling toolpath - 5mm bit',
  },
  POCKET_DADO: {
    name: 'POCKET_DADO',
    description: 'Closed vectors for dados, slots, and pockets',
    color: '#0000FF', // Blue
    operation: 'Pocket toolpath',
  },
};

/**
 * Get layer configuration by layer type
 */
export function getLayerConfig(layer: CNCLayer): LayerConfig {
  return LAYER_CONFIGS[layer];
}

/**
 * Get all layer names as an array
 */
export function getAllLayerNames(): string[] {
  return Object.values(LAYER_CONFIGS).map((config) => config.name);
}

/**
 * Check if a string is a valid layer name
 */
export function isValidLayerName(name: string): name is CNCLayer {
  return name in LAYER_CONFIGS;
}
