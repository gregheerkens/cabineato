/**
 * Shared flat dimension calculator
 *
 * Extracts the 2D cutting face from a 3D component based on its role.
 * Used by SVG/DXF export and sheet nesting.
 */

import type { Component } from '../types';

/**
 * Get the flat (2D) cutting dimensions for a component.
 *
 * Components are stored with 3D dimensions [x, y, z] for assembly visualization,
 * but for CNC cutting we need the 2D face dimensions (excluding thickness).
 *
 * The cutting dimensions depend on the panel orientation:
 * - Side panels: laid on their face, cut depth x height
 * - Top/Bottom panels: laid on their face, cut width x depth
 * - Back panels: already flat, cut width x height
 * - Shelves: laid on their face, cut width x depth
 */
export function getFlatDimensions(component: Component): { width: number; height: number } {
  const [dimX, dimY, dimZ] = component.dimensions;

  switch (component.role) {
    case 'side_panel_left':
    case 'side_panel_right':
      return { width: dimZ, height: dimY };

    case 'top_panel':
    case 'bottom_panel':
      return { width: dimX, height: dimZ };

    case 'back_panel':
      return { width: dimX, height: dimY };

    case 'shelf':
      return { width: dimX, height: dimZ };

    case 'drawer_front':
      return { width: dimX, height: dimY };

    case 'drawer_side':
      return { width: dimZ, height: dimY };

    case 'drawer_back':
      return { width: dimX, height: dimY };

    case 'drawer_bottom':
      return { width: dimX, height: dimZ };

    case 'toe_kick_panel':
      return { width: dimX, height: dimY };

    case 'runner_strip':
      return { width: dimZ, height: dimX };

    case 'back_stretcher':
      return { width: dimX, height: dimY };

    default: {
      const dims = [dimX, dimY, dimZ].sort((a, b) => b - a);
      return { width: dims[0], height: dims[1] };
    }
  }
}
