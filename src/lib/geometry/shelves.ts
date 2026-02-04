/**
 * Shelf Pin Hole Generator
 *
 * Generates shelf pin holes following the System 32 standard:
 * - 5mm diameter holes
 * - 32mm vertical spacing
 * - 37mm horizontal setback from front and rear edges
 *
 * Per AdditionalContext.md:
 * - Shelf Pins use 5mm holes spaced 32mm apart (System 32)
 * - Setback: Holes are typically inset 37mm from front and rear internal edges
 * - Clearance: Shelves should be 1mm narrower than interior width
 *
 * Also supports:
 * - Fixed shelves with dados (slots routed in side panels)
 * - Shelf runner mounting holes
 */

import type {
  AssemblyConfig,
  Component,
  HoleFeature,
  SlotFeature,
  Feature,
  Vector2,
  ShelfConfig,
  AdjustableShelfConfig,
  FixedShelfConfig,
  ShelfRunnerConfig,
} from '../types';
import {
  SYSTEM_32,
  TOLERANCES,
  DADO_DEFAULTS,
  SHELF_RUNNER_DEFAULTS,
} from '../types/constants';
import { calculateInteriorBounds } from './carcass';

/**
 * Generate shelf pin hole positions for a single column
 *
 * @param startY - Y position of the first hole
 * @param endY - Y position of the last possible hole
 * @param xPos - X position of the column
 * @returns Array of hole positions
 */
export function generateHoleColumn(
  startY: number,
  endY: number,
  xPos: number
): Vector2[] {
  const holes: Vector2[] = [];
  const spacing = SYSTEM_32.HOLE_SPACING;

  // Generate holes from startY to endY at regular intervals
  let y = startY;
  while (y <= endY) {
    holes.push([xPos, y]);
    y += spacing;
  }

  return holes;
}

/**
 * Helper to get adjustable shelf config from the new nested structure
 */
function getAdjustableConfig(shelves: ShelfConfig): AdjustableShelfConfig | null {
  // Handle new nested structure
  if ('adjustable' in shelves) {
    return shelves.adjustable ?? null;
  }
  // Legacy structure - treat the whole config as adjustable
  return shelves as unknown as AdjustableShelfConfig;
}

/**
 * Helper to get fixed shelf config
 */
function getFixedConfig(shelves: ShelfConfig): FixedShelfConfig | null {
  if ('fixed' in shelves) {
    return shelves.fixed ?? null;
  }
  return null;
}

/**
 * Helper to get shelf runner config
 */
function getRunnerConfig(shelves: ShelfConfig): ShelfRunnerConfig | null {
  if ('runners' in shelves) {
    return shelves.runners ?? null;
  }
  return null;
}

/**
 * Generate all shelf pin holes for a side panel (adjustable shelves)
 *
 * Creates two columns of holes:
 * - Front column: setback from front edge
 * - Rear column: setback from rear edge
 */
export function generateSidePanelShelfHoles(
  config: AssemblyConfig,
  side: 'left' | 'right'
): HoleFeature[] {
  const { globalBounds, material, features } = config;
  const { d, h } = globalBounds;
  const thickness = material.thickness;

  const adjustable = getAdjustableConfig(features.shelves);
  if (!adjustable?.enabled) {
    return [];
  }

  const holes: HoleFeature[] = [];

  // Calculate vertical range for holes
  // Start above the bottom panel (and toe kick if present)
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const bottomPanelTop = toeKickHeight + thickness;
  const topPanelBottom = h - thickness;

  // Add margin from top and bottom
  const verticalMargin = SYSTEM_32.VERTICAL_MARGIN;
  const startY = bottomPanelTop + verticalMargin;
  const endY = topPanelBottom - verticalMargin;

  // Check if there's enough room for any holes
  if (endY <= startY) {
    return holes;
  }

  // Calculate horizontal positions
  // Front setback: from the front edge of the panel (which is at Z=0)
  const frontSetback = adjustable.frontSetback ?? SYSTEM_32.FRONT_SETBACK;
  const rearSetback = adjustable.rearSetback ?? SYSTEM_32.REAR_SETBACK;

  // Holes are drilled on the inside face of the panel
  // For a side panel lying flat, X is depth, Y is height
  const frontColumnX = frontSetback;
  const rearColumnX = d - rearSetback;

  // Generate front column holes
  const frontHoles = generateHoleColumn(startY, endY, frontColumnX);
  for (const [x, y] of frontHoles) {
    holes.push({
      type: 'hole',
      diameter: SYSTEM_32.HOLE_DIAMETER,
      depth: 10, // Standard shelf pin hole depth
      pos: [x, y],
      purpose: 'shelf_pin',
    });
  }

  // Generate rear column holes
  const rearHoles = generateHoleColumn(startY, endY, rearColumnX);
  for (const [x, y] of rearHoles) {
    holes.push({
      type: 'hole',
      diameter: SYSTEM_32.HOLE_DIAMETER,
      depth: 10,
      pos: [x, y],
      purpose: 'shelf_pin',
    });
  }

  return holes;
}

/**
 * Generate dados (slots) for fixed shelves on a side panel
 *
 * @param config - Assembly configuration
 * @param side - Which side panel
 * @returns Array of slot features for the dados
 */
export function generateSidePanelFixedShelfDados(
  config: AssemblyConfig,
  side: 'left' | 'right'
): SlotFeature[] {
  const { globalBounds, material, features, secondaryMaterial } = config;
  const { d, h } = globalBounds;
  const thickness = material.thickness;

  const fixedConfig = getFixedConfig(features.shelves);
  if (!fixedConfig?.enabled || fixedConfig.positions.length === 0) {
    return [];
  }

  const slots: SlotFeature[] = [];

  // Determine the shelf material thickness
  // Use secondary material if configured, otherwise primary
  let shelfThickness = thickness;
  if (fixedConfig.useSecondaryMaterial && secondaryMaterial?.fixedShelfThickness) {
    shelfThickness = secondaryMaterial.fixedShelfThickness;
  }

  const dadoDepth = fixedConfig.dadoDepth ?? DADO_DEFAULTS.MIN_DEPTH;
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;

  // Front offset for dado (similar to shelf setback)
  const frontOffset = 10; // 10mm from front
  const rearOffset = 10; // 10mm from rear

  for (const position of fixedConfig.positions) {
    // Position is specified as height from interior bottom
    const dadoY = toeKickHeight + thickness + position;

    // Dado runs from front to back of panel
    const slot: SlotFeature = {
      type: 'slot',
      width: shelfThickness, // Width matches the shelf material thickness
      depth: dadoDepth,
      path: [
        [frontOffset, dadoY],
        [d - rearOffset, dadoY],
      ],
      purpose: 'dado',
    };
    slots.push(slot);
  }

  return slots;
}

/**
 * Generate shelf runner mounting holes on a side panel
 *
 * @param config - Assembly configuration
 * @param side - Which side panel
 * @returns Array of hole features for runner mounting
 */
export function generateSidePanelRunnerHoles(
  config: AssemblyConfig,
  side: 'left' | 'right'
): HoleFeature[] {
  const { globalBounds, material, features } = config;
  const { d, h } = globalBounds;
  const thickness = material.thickness;

  const runnerConfig = getRunnerConfig(features.shelves);
  if (!runnerConfig?.enabled || runnerConfig.positions.length === 0) {
    return [];
  }

  const holes: HoleFeature[] = [];

  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const frontSetback = runnerConfig.frontSetback ?? SHELF_RUNNER_DEFAULTS.FRONT_SETBACK;
  const rearSetback = runnerConfig.rearSetback ?? SHELF_RUNNER_DEFAULTS.REAR_SETBACK;
  const holeDiameter = runnerConfig.holeDiameter ?? SHELF_RUNNER_DEFAULTS.HOLE_DIAMETER;
  const holesPerRunner = runnerConfig.holesPerRunner ?? SHELF_RUNNER_DEFAULTS.HOLES_PER_RUNNER;

  // Calculate hole spacing along the runner length
  const runnerLength = d - frontSetback - rearSetback;
  const holeSpacing = runnerLength / (holesPerRunner - 1);

  for (const position of runnerConfig.positions) {
    // Position is specified as height from interior bottom
    const runnerY = toeKickHeight + thickness + position;

    // Generate holes along the runner
    for (let i = 0; i < holesPerRunner; i++) {
      const holeX = frontSetback + i * holeSpacing;

      holes.push({
        type: 'hole',
        pos: [holeX, runnerY],
        diameter: holeDiameter,
        depth: 0, // 0 = through hole
        purpose: 'shelf_runner',
      });
    }
  }

  return holes;
}

/**
 * Generate all shelf-related features for a side panel
 * Includes adjustable shelf pin holes, fixed shelf dados, and runner holes
 */
export function generateAllSidePanelShelfFeatures(
  config: AssemblyConfig,
  side: 'left' | 'right'
): Feature[] {
  const features: Feature[] = [];

  // Add adjustable shelf pin holes
  features.push(...generateSidePanelShelfHoles(config, side));

  // Add fixed shelf dados
  features.push(...generateSidePanelFixedShelfDados(config, side));

  // Add shelf runner mounting holes
  features.push(...generateSidePanelRunnerHoles(config, side));

  return features;
}

/**
 * Generate adjustable shelf components
 *
 * Shelves are 1mm narrower than interior width for clearance
 */
export function generateAdjustableShelves(config: AssemblyConfig): Component[] {
  const { globalBounds, material, features, backPanel } = config;
  const { d } = globalBounds;
  const thickness = material.thickness;

  const adjustable = getAdjustableConfig(features.shelves);
  if (!adjustable?.enabled || (adjustable.count ?? 0) <= 0) {
    return [];
  }

  const shelves: Component[] = [];
  const interior = calculateInteriorBounds(config);

  // Shelf width with clearance
  const shelfWidth = interior.w - TOLERANCES.SHELF_CLEARANCE;

  // Shelf depth accounts for front setback only (shelves don't extend to back)
  const frontSetback = adjustable.frontSetback ?? SYSTEM_32.FRONT_SETBACK;
  let shelfDepth = d - frontSetback - 10; // 10mm clearance at front

  // If there's an inset back panel, reduce shelf depth accordingly
  if (backPanel.type === 'inset') {
    const insetDistance = backPanel.insetDistance ?? 10;
    shelfDepth = d - frontSetback - insetDistance - backPanel.thickness - 5;
  }

  // Calculate vertical spacing for shelves
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const bottomPanelTop = toeKickHeight + thickness;
  const topPanelBottom = globalBounds.h - thickness;
  const availableHeight = topPanelBottom - bottomPanelTop;

  // Distribute shelves evenly
  const shelfCount = adjustable.count ?? 0;
  const spacing = availableHeight / (shelfCount + 1);

  for (let i = 0; i < shelfCount; i++) {
    const posY = bottomPanelTop + spacing * (i + 1);

    shelves.push({
      id: `adjustable_shelf_${i + 1}`,
      label: `Adjustable Shelf ${i + 1}`,
      role: 'adjustable_shelf',
      dimensions: [shelfWidth, thickness, shelfDepth],
      position: [thickness + TOLERANCES.SHELF_CLEARANCE / 2, posY, frontSetback],
      rotation: [0, 0, 0],
      features: [],
      layer: 'OUTSIDE_CUT',
      materialThickness: thickness,
    });
  }

  return shelves;
}

/**
 * Generate fixed shelf components
 *
 * Fixed shelves slide into dados in the side panels
 */
export function generateFixedShelves(config: AssemblyConfig): Component[] {
  const { globalBounds, material, features, backPanel, secondaryMaterial } = config;
  const { d } = globalBounds;
  const thickness = material.thickness;

  const fixedConfig = getFixedConfig(features.shelves);
  if (!fixedConfig?.enabled || fixedConfig.positions.length === 0) {
    return [];
  }

  const shelves: Component[] = [];
  const interior = calculateInteriorBounds(config);

  // Determine shelf material thickness
  let shelfThickness = thickness;
  if (fixedConfig.useSecondaryMaterial && secondaryMaterial?.fixedShelfThickness) {
    shelfThickness = secondaryMaterial.fixedShelfThickness;
  }

  // Fixed shelf width spans the full interior + dado depths
  const dadoDepth = fixedConfig.dadoDepth ?? DADO_DEFAULTS.MIN_DEPTH;
  const shelfWidth = interior.w + 2 * dadoDepth;

  // Shelf depth
  const frontOffset = 10; // Same as dado offset
  let shelfDepth = d - frontOffset - 10;

  // If there's an inset back panel, reduce shelf depth accordingly
  if (backPanel.type === 'inset') {
    const insetDistance = backPanel.insetDistance ?? 10;
    shelfDepth = d - frontOffset - insetDistance - backPanel.thickness - 5;
  }

  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;

  for (let i = 0; i < fixedConfig.positions.length; i++) {
    const position = fixedConfig.positions[i];
    const posY = toeKickHeight + thickness + position;

    // Shelf extends into dados on both sides
    const posX = thickness - dadoDepth;

    shelves.push({
      id: `fixed_shelf_${i + 1}`,
      label: `Fixed Shelf ${i + 1}`,
      role: 'fixed_shelf',
      dimensions: [shelfWidth, shelfThickness, shelfDepth],
      position: [posX, posY, frontOffset],
      rotation: [0, 0, 0],
      features: [],
      layer: 'OUTSIDE_CUT',
      materialThickness: shelfThickness,
    });
  }

  return shelves;
}

/**
 * Generate all shelf components (both adjustable and fixed)
 */
export function generateShelves(config: AssemblyConfig): Component[] {
  const components: Component[] = [];

  components.push(...generateAdjustableShelves(config));
  components.push(...generateFixedShelves(config));

  return components;
}

/**
 * Count total shelf pin holes that will be generated
 */
export function countShelfPinHoles(config: AssemblyConfig): number {
  const { globalBounds, material, features } = config;
  const { h } = globalBounds;
  const thickness = material.thickness;

  const adjustable = getAdjustableConfig(features.shelves);
  if (!adjustable?.enabled) {
    return 0;
  }

  // Calculate vertical range
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const bottomPanelTop = toeKickHeight + thickness;
  const topPanelBottom = h - thickness;
  const verticalMargin = SYSTEM_32.VERTICAL_MARGIN;

  const startY = bottomPanelTop + verticalMargin;
  const endY = topPanelBottom - verticalMargin;

  if (endY <= startY) {
    return 0;
  }

  // Count holes in one column
  const holesPerColumn = Math.floor((endY - startY) / SYSTEM_32.HOLE_SPACING) + 1;

  // Two columns per side panel, two side panels
  return holesPerColumn * 2 * 2;
}

/**
 * Validate shelf configuration
 */
export function validateShelfConfig(config: AssemblyConfig): string[] {
  const errors: string[] = [];
  const { globalBounds, material, features } = config;
  const { h, d } = globalBounds;
  const thickness = material.thickness;

  const adjustable = getAdjustableConfig(features.shelves);
  const fixedConfig = getFixedConfig(features.shelves);
  const runnerConfig = getRunnerConfig(features.shelves);

  // Validate adjustable shelves
  if (adjustable?.enabled) {
    const frontSetback = adjustable.frontSetback ?? SYSTEM_32.FRONT_SETBACK;
    const rearSetback = adjustable.rearSetback ?? SYSTEM_32.REAR_SETBACK;

    // Check setbacks are reasonable
    if (frontSetback < 0) {
      errors.push(`Front setback must be non-negative, got ${frontSetback}mm.`);
    }
    if (rearSetback < 0) {
      errors.push(`Rear setback must be non-negative, got ${rearSetback}mm.`);
    }

    // Check that setbacks leave room for holes
    if (frontSetback + rearSetback >= d) {
      errors.push(
        `Combined setbacks (${frontSetback + rearSetback}mm) ` +
          `exceed cabinet depth (${d}mm).`
      );
    }

    // Check vertical space for holes
    const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
    const bottomPanelTop = toeKickHeight + thickness;
    const topPanelBottom = h - thickness;
    const verticalSpace = topPanelBottom - bottomPanelTop - 2 * SYSTEM_32.VERTICAL_MARGIN;

    if (verticalSpace < SYSTEM_32.HOLE_SPACING) {
      errors.push(
        `Not enough vertical space (${verticalSpace}mm) for shelf pin holes. ` +
          `Need at least ${SYSTEM_32.HOLE_SPACING}mm.`
      );
    }

    // Check shelf count
    if ((adjustable.count ?? 0) < 0) {
      errors.push(`Adjustable shelf count must be non-negative.`);
    }
  }

  // Validate fixed shelves
  if (fixedConfig?.enabled) {
    const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
    const interiorHeight = h - 2 * thickness - toeKickHeight;

    for (let i = 0; i < fixedConfig.positions.length; i++) {
      const pos = fixedConfig.positions[i];
      if (pos < 0) {
        errors.push(`Fixed shelf position ${i + 1} (${pos}mm) must be non-negative.`);
      }
      if (pos > interiorHeight) {
        errors.push(
          `Fixed shelf position ${i + 1} (${pos}mm) exceeds interior height (${interiorHeight}mm).`
        );
      }
    }

    // Check dado depth
    const dadoDepth = fixedConfig.dadoDepth ?? DADO_DEFAULTS.MIN_DEPTH;
    if (dadoDepth > thickness / 2) {
      errors.push(
        `Dado depth (${dadoDepth}mm) should not exceed half of material thickness (${thickness / 2}mm).`
      );
    }
  }

  // Validate shelf runners
  if (runnerConfig?.enabled) {
    const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
    const interiorHeight = h - 2 * thickness - toeKickHeight;

    for (let i = 0; i < runnerConfig.positions.length; i++) {
      const pos = runnerConfig.positions[i];
      if (pos < 0) {
        errors.push(`Shelf runner position ${i + 1} (${pos}mm) must be non-negative.`);
      }
      if (pos > interiorHeight) {
        errors.push(
          `Shelf runner position ${i + 1} (${pos}mm) exceeds interior height (${interiorHeight}mm).`
        );
      }
    }
  }

  return errors;
}
