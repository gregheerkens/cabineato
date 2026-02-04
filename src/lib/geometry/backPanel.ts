/**
 * Back Panel Generator
 *
 * Generates back panel components based on configuration:
 * - Applied: Nailed to the rear of the carcass
 * - Inset: Slotted into a dado/groove on the inside of the carcass
 *
 * Per AdditionalContext.md:
 * - Applied back: nailed to the rear edges
 * - Inset back: slotted into a groove/dado
 */

import type {
  AssemblyConfig,
  Component,
  SlotFeature,
  Vector2,
} from '../types';
import { BACK_PANEL_DEFAULTS, MATERIAL_THICKNESSES } from '../types/constants';

/**
 * Get the back panel thickness from config
 * Uses secondary material if specified, otherwise falls back to backPanel.thickness
 */
function getBackPanelThickness(config: AssemblyConfig): number {
  // If secondary material config specifies a thickness, use it
  if (config.secondaryMaterial?.backPanelThickness !== undefined) {
    return config.secondaryMaterial.backPanelThickness;
  }
  // Otherwise use the backPanel config thickness
  return config.backPanel.thickness;
}

/**
 * Generate an applied back panel
 *
 * Applied backs are nailed to the rear of the carcass.
 * Dimensions: Full cabinet width x (height minus toe kick)
 */
export function generateAppliedBackPanel(config: AssemblyConfig): Component {
  const { globalBounds, features } = config;
  const { w, h } = globalBounds;

  // Get actual back panel thickness from config
  const thickness = getBackPanelThickness(config);

  // Applied back covers the full width
  const panelWidth = w;

  // Height excludes toe kick if present
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const panelHeight = h - toeKickHeight;

  // Position: at the rear of the cabinet, above toe kick
  const posY = toeKickHeight;
  const posZ = globalBounds.d; // At the back

  return {
    id: 'back_panel',
    label: 'Back Panel (Applied)',
    role: 'back_panel',
    dimensions: [panelWidth, panelHeight, thickness],
    position: [0, posY, posZ - thickness],
    rotation: [0, 0, 0],
    features: [],
    layer: 'OUTSIDE_CUT',
    materialThickness: thickness,
  };
}

/**
 * Generate an inset back panel
 *
 * Inset backs are slotted into dados on the side panels.
 * Dimensions are reduced to fit within the dados.
 */
export function generateInsetBackPanel(config: AssemblyConfig): Component {
  const { globalBounds, material, backPanel, features } = config;
  const { w, h } = globalBounds;
  const carcassThickness = material.thickness;
  const dadoDepth = backPanel.dadoDepth ?? BACK_PANEL_DEFAULTS.DADO_DEPTH;

  // Get actual back panel thickness from config
  const panelThickness = getBackPanelThickness(config);

  // Inset back width accounts for the side panel dados
  // It sits inside the side panels, extending into the dados
  const panelWidth = w - 2 * carcassThickness + 2 * dadoDepth;

  // Height accounts for top/bottom panel dados and toe kick
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const panelHeight = h - 2 * carcassThickness - toeKickHeight + 2 * dadoDepth;

  // Position: inset from the rear by the inset distance
  const insetDistance = backPanel.insetDistance ?? BACK_PANEL_DEFAULTS.INSET_DISTANCE;
  const posX = carcassThickness - dadoDepth;
  const posY = toeKickHeight + carcassThickness - dadoDepth;
  const posZ = globalBounds.d - insetDistance - panelThickness;

  return {
    id: 'back_panel',
    label: 'Back Panel (Inset)',
    role: 'back_panel',
    dimensions: [panelWidth, panelHeight, panelThickness],
    position: [posX, posY, posZ],
    rotation: [0, 0, 0],
    features: [],
    layer: 'OUTSIDE_CUT',
    materialThickness: panelThickness,
  };
}

/**
 * Generate dado slots for inset back panel on side panels
 *
 * Returns slot features to be added to side panels
 */
export function generateBackPanelDado(
  config: AssemblyConfig,
  side: 'left' | 'right'
): SlotFeature {
  const { globalBounds, backPanel, features } = config;
  const dadoDepth = backPanel.dadoDepth ?? BACK_PANEL_DEFAULTS.DADO_DEPTH;
  const insetDistance = backPanel.insetDistance ?? BACK_PANEL_DEFAULTS.INSET_DISTANCE;

  // Get actual back panel thickness from config
  const panelThickness = getBackPanelThickness(config);

  // Dado runs vertically along the side panel
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;

  // Dado position from the rear edge of the panel
  const dadoX = globalBounds.d - insetDistance - panelThickness / 2;

  // Dado runs from bottom (above toe kick) to top
  const startY = toeKickHeight;
  const endY = globalBounds.h;

  const path: Vector2[] = [
    [dadoX, startY],
    [dadoX, endY],
  ];

  return {
    type: 'slot',
    width: panelThickness, // Dado width matches back panel material thickness
    depth: dadoDepth,
    path,
    purpose: 'dado',
  };
}

/**
 * Generate dado slot for inset back panel on top/bottom panels
 */
export function generateHorizontalBackPanelDado(
  config: AssemblyConfig,
  panel: 'top' | 'bottom'
): SlotFeature {
  const { globalBounds, material, backPanel } = config;
  const carcassThickness = material.thickness;
  const dadoDepth = backPanel.dadoDepth ?? BACK_PANEL_DEFAULTS.DADO_DEPTH;
  const insetDistance = backPanel.insetDistance ?? BACK_PANEL_DEFAULTS.INSET_DISTANCE;

  // Get actual back panel thickness from config
  const panelThickness = getBackPanelThickness(config);

  // Horizontal dado position from the rear edge
  const dadoY = globalBounds.d - insetDistance - panelThickness / 2;

  // Dado runs across the interior width
  const startX = 0; // Relative to panel
  const endX = globalBounds.w - 2 * carcassThickness;

  const path: Vector2[] = [
    [startX, dadoY],
    [endX, dadoY],
  ];

  return {
    type: 'slot',
    width: panelThickness, // Dado width matches back panel material thickness
    depth: dadoDepth,
    path,
    purpose: 'dado',
  };
}

/**
 * Generate back panel component based on configuration
 *
 * Returns null if back panel type is 'none'
 */
export function generateBackPanel(config: AssemblyConfig): Component | null {
  const { backPanel } = config;

  switch (backPanel.type) {
    case 'applied':
      return generateAppliedBackPanel(config);
    case 'inset':
      return generateInsetBackPanel(config);
    case 'none':
      return null;
    default:
      // Type guard - should never reach here
      const _exhaustive: never = backPanel.type;
      return null;
  }
}

/**
 * Check if back panel configuration requires dados on carcass panels
 */
export function requiresDados(config: AssemblyConfig): boolean {
  return config.backPanel.type === 'inset';
}

/**
 * Validate back panel configuration
 */
export function validateBackPanelConfig(config: AssemblyConfig): string[] {
  const errors: string[] = [];
  const { backPanel, globalBounds, material } = config;

  if (backPanel.type === 'none') {
    return errors;
  }

  // Check back panel thickness
  if (backPanel.thickness <= 0) {
    errors.push(`Back panel thickness must be positive, got ${backPanel.thickness}mm.`);
  }

  if (backPanel.type === 'inset') {
    const dadoDepth = backPanel.dadoDepth ?? BACK_PANEL_DEFAULTS.DADO_DEPTH;
    const insetDistance = backPanel.insetDistance ?? BACK_PANEL_DEFAULTS.INSET_DISTANCE;

    // Check dado depth doesn't exceed material thickness
    if (dadoDepth >= material.thickness) {
      errors.push(
        `Dado depth (${dadoDepth}mm) must be less than material thickness (${material.thickness}mm).`
      );
    }

    // Check that inset distance is reasonable
    if (insetDistance < 0) {
      errors.push(`Inset distance must be non-negative, got ${insetDistance}mm.`);
    }

    if (insetDistance + backPanel.thickness > globalBounds.d) {
      errors.push(
        `Inset distance (${insetDistance}mm) + back panel thickness (${backPanel.thickness}mm) ` +
          `exceeds cabinet depth (${globalBounds.d}mm).`
      );
    }
  }

  return errors;
}
