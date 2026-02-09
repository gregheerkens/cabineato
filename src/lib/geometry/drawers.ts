/**
 * Drawer Box Generator
 *
 * Generates drawer box components including:
 * - Drawer fronts (overlay)
 * - Drawer sides
 * - Drawer backs
 * - Drawer bottoms
 *
 * Per AdditionalContext.md:
 * - Box Construction: 12.7mm (1/2") clearance on each side for standard ball-bearing slides
 * - Overlay: Drawer fronts usually overlap the carcass frame by 19mm on all sides (Full Overlay)
 */

import type {
  AssemblyConfig,
  Component,
  SlotFeature,
  HoleFeature,
  DrawerPullConfig,
} from '../types';
import { DRAWER_DEFAULTS, MATERIAL_THICKNESSES, DRAWER_PULL_DEFAULTS } from '../types/constants';
import { calculateInteriorBounds } from './carcass';

/** Drawer box material thickness (typically 1/2" / 12.7mm) */
const DRAWER_BOX_THICKNESS = MATERIAL_THICKNESSES.HALF_INCH;

/** Default drawer bottom thickness (typically 1/4" / 6.35mm) */
const DEFAULT_DRAWER_BOTTOM_THICKNESS = MATERIAL_THICKNESSES.QUARTER_INCH;

/** Dado depth for drawer bottom */
const DRAWER_BOTTOM_DADO_DEPTH = 6;

/** Distance from bottom edge to drawer bottom dado */
const DRAWER_BOTTOM_DADO_OFFSET = 12;

/**
 * Get the drawer bottom thickness from config
 * Uses secondary material if configured, otherwise default
 */
function getDrawerBottomThickness(config: AssemblyConfig): number {
  return config.secondaryMaterial?.drawerBottomThickness ?? DEFAULT_DRAWER_BOTTOM_THICKNESS;
}

/**
 * Calculate drawer box dimensions
 */
export interface DrawerBoxDimensions {
  /** Interior width of the drawer box */
  boxInteriorWidth: number;
  /** Exterior width of the drawer box (including sides) */
  boxExteriorWidth: number;
  /** Height of the drawer box */
  boxHeight: number;
  /** Depth of the drawer box */
  boxDepth: number;
  /** Width of the drawer front */
  frontWidth: number;
  /** Height of the drawer front */
  frontHeight: number;
}

/**
 * Calculate drawer box dimensions based on cabinet and drawer configuration
 */
export function calculateDrawerDimensions(
  config: AssemblyConfig,
  drawerIndex: number,
  totalDrawers: number
): DrawerBoxDimensions {
  const { globalBounds, features, backPanel } = config;
  const interior = calculateInteriorBounds(config);

  const slideWidth = features.drawers.slideWidth;
  const overlayAmount = features.drawers.overlayAmount;

  // Box exterior width = interior width - (2 * slide clearance)
  const boxExteriorWidth = interior.w - 2 * slideWidth;

  // Box interior width = exterior - (2 * box material thickness)
  const boxInteriorWidth = boxExteriorWidth - 2 * DRAWER_BOX_THICKNESS;

  // Drawer depth - leave some clearance at the back
  let boxDepth = globalBounds.d - 50; // 50mm clearance at back

  // Adjust for back panel if inset
  if (backPanel.type === 'inset') {
    const insetDistance = backPanel.insetDistance ?? 10;
    boxDepth = globalBounds.d - insetDistance - backPanel.thickness - 20;
  }

  // Calculate available height for drawers
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const availableHeight = interior.h;

  // Divide height evenly among drawers with gaps
  const drawerGap = 3; // 3mm gap between drawers
  const totalGaps = totalDrawers - 1;
  const heightForDrawers = availableHeight - totalGaps * drawerGap;
  const drawerFrontHeight = heightForDrawers / totalDrawers;

  // Box height is slightly less than front height (leave clearance)
  const boxHeight = Math.max(drawerFrontHeight - 25, DRAWER_DEFAULTS.MIN_HEIGHT);

  // Front dimensions include overlay
  const frontWidth = interior.w + 2 * overlayAmount;
  const frontHeight = drawerFrontHeight;

  return {
    boxInteriorWidth,
    boxExteriorWidth,
    boxHeight,
    boxDepth,
    frontWidth,
    frontHeight,
  };
}

/**
 * Generate pull holes for drawer front
 * Returns hole features positioned relative to the drawer front panel
 */
export function generateDrawerPullHoles(
  frontWidth: number,
  frontHeight: number,
  pullConfig: DrawerPullConfig
): HoleFeature[] {
  if (pullConfig.type === 'none') {
    return [];
  }

  const holes: HoleFeature[] = [];
  const diameter = pullConfig.holeDiameter ?? DRAWER_PULL_DEFAULTS.HOLE_DIAMETER;
  const verticalOffset = pullConfig.verticalOffset ?? DRAWER_PULL_DEFAULTS.VERTICAL_OFFSET;

  // Calculate Y position (from top of drawer front, offset downward)
  const holeY = frontHeight - verticalOffset;

  // Calculate X position based on horizontal position setting
  let centerX: number;
  if (pullConfig.horizontalPosition === 'center') {
    centerX = frontWidth / 2;
  } else {
    // Numeric offset from center
    centerX = frontWidth / 2 + pullConfig.horizontalPosition;
  }

  if (pullConfig.type === 'single') {
    // Single center hole
    holes.push({
      type: 'hole',
      pos: [centerX, holeY],
      diameter,
      depth: 0, // 0 = through hole
      purpose: 'drawer_pull',
    });
  } else if (pullConfig.type === 'double') {
    // Two holes at configured spacing
    const spacing = pullConfig.holeSpacing ?? DRAWER_PULL_DEFAULTS.SPACING_96MM;
    const halfSpacing = spacing / 2;

    holes.push({
      type: 'hole',
      pos: [centerX - halfSpacing, holeY],
      diameter,
      depth: 0, // 0 = through hole
      purpose: 'drawer_pull',
    });

    holes.push({
      type: 'hole',
      pos: [centerX + halfSpacing, holeY],
      diameter,
      depth: 0, // 0 = through hole
      purpose: 'drawer_pull',
    });
  }

  return holes;
}

/**
 * Generate drawer front component
 */
export function generateDrawerFront(
  config: AssemblyConfig,
  drawerIndex: number,
  totalDrawers: number
): Component {
  const { globalBounds, material, features } = config;
  const dims = calculateDrawerDimensions(config, drawerIndex, totalDrawers);

  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const drawerGap = 3;
  const overlayAmount = features.drawers.overlayAmount;

  // Calculate Y position (from bottom up)
  const posY =
    toeKickHeight +
    material.thickness +
    drawerIndex * (dims.frontHeight + drawerGap) -
    overlayAmount;

  // X position accounts for overlay
  const posX = material.thickness - overlayAmount;

  // Generate pull holes if configured
  const pullHoles = features.drawers.pullHoles
    ? generateDrawerPullHoles(dims.frontWidth, dims.frontHeight, features.drawers.pullHoles)
    : [];

  return {
    id: `drawer_front_${drawerIndex + 1}`,
    label: `Drawer Front ${drawerIndex + 1}`,
    role: 'drawer_front',
    dimensions: [dims.frontWidth, dims.frontHeight, material.thickness],
    position: [posX, posY, 0],
    rotation: [0, 0, 0],
    features: pullHoles,
    layer: 'OUTSIDE_CUT',
    materialThickness: material.thickness,
  };
}

/**
 * Generate drawer side components (left and right)
 */
export function generateDrawerSides(
  config: AssemblyConfig,
  drawerIndex: number,
  totalDrawers: number
): Component[] {
  const { globalBounds, material, features } = config;
  const interior = calculateInteriorBounds(config);
  const dims = calculateDrawerDimensions(config, drawerIndex, totalDrawers);

  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const drawerGap = 3;
  const slideWidth = features.drawers.slideWidth;

  // Y position of drawer box
  const boxPosY =
    toeKickHeight +
    material.thickness +
    drawerIndex * (dims.frontHeight + drawerGap) +
    (dims.frontHeight - dims.boxHeight) / 2;

  // Get actual drawer bottom thickness from config
  const drawerBottomThickness = getDrawerBottomThickness(config);

  // Dado for drawer bottom - width matches the drawer bottom material
  const bottomDado: SlotFeature = {
    type: 'slot',
    width: drawerBottomThickness, // Dado width matches material thickness
    depth: DRAWER_BOTTOM_DADO_DEPTH,
    path: [
      [DRAWER_BOX_THICKNESS, DRAWER_BOTTOM_DADO_OFFSET],
      [dims.boxDepth - DRAWER_BOX_THICKNESS, DRAWER_BOTTOM_DADO_OFFSET],
    ],
    purpose: 'drawer_bottom',
  };

  const leftSide: Component = {
    id: `drawer_side_left_${drawerIndex + 1}`,
    label: `Drawer ${drawerIndex + 1} Left Side`,
    role: 'drawer_side',
    dimensions: [DRAWER_BOX_THICKNESS, dims.boxHeight, dims.boxDepth],
    position: [material.thickness + slideWidth, boxPosY, 0],
    rotation: [0, 0, 0],
    features: [bottomDado],
    layer: 'OUTSIDE_CUT',
    materialThickness: DRAWER_BOX_THICKNESS,
  };

  const rightSide: Component = {
    id: `drawer_side_right_${drawerIndex + 1}`,
    label: `Drawer ${drawerIndex + 1} Right Side`,
    role: 'drawer_side',
    dimensions: [DRAWER_BOX_THICKNESS, dims.boxHeight, dims.boxDepth],
    position: [
      material.thickness + slideWidth + dims.boxExteriorWidth - DRAWER_BOX_THICKNESS,
      boxPosY,
      0,
    ],
    rotation: [0, 0, 0],
    features: [bottomDado],
    layer: 'OUTSIDE_CUT',
    materialThickness: DRAWER_BOX_THICKNESS,
  };

  return [leftSide, rightSide];
}

/**
 * Generate drawer back component
 */
export function generateDrawerBack(
  config: AssemblyConfig,
  drawerIndex: number,
  totalDrawers: number
): Component {
  const { globalBounds, material, features } = config;
  const dims = calculateDrawerDimensions(config, drawerIndex, totalDrawers);

  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const drawerGap = 3;
  const slideWidth = features.drawers.slideWidth;

  // Y position of drawer box
  const boxPosY =
    toeKickHeight +
    material.thickness +
    drawerIndex * (dims.frontHeight + drawerGap) +
    (dims.frontHeight - dims.boxHeight) / 2;

  // Back is shorter than sides (sits above the bottom dado)
  const backHeight = dims.boxHeight - DRAWER_BOTTOM_DADO_OFFSET - DRAWER_BOTTOM_DADO_DEPTH;

  return {
    id: `drawer_back_${drawerIndex + 1}`,
    label: `Drawer ${drawerIndex + 1} Back`,
    role: 'drawer_back',
    dimensions: [dims.boxInteriorWidth, backHeight, DRAWER_BOX_THICKNESS],
    position: [
      material.thickness + slideWidth + DRAWER_BOX_THICKNESS,
      boxPosY + DRAWER_BOTTOM_DADO_OFFSET + DRAWER_BOTTOM_DADO_DEPTH,
      dims.boxDepth - DRAWER_BOX_THICKNESS,
    ],
    rotation: [0, 0, 0],
    features: [],
    layer: 'OUTSIDE_CUT',
    materialThickness: DRAWER_BOX_THICKNESS,
  };
}

/**
 * Generate drawer bottom component
 */
export function generateDrawerBottom(
  config: AssemblyConfig,
  drawerIndex: number,
  totalDrawers: number
): Component {
  const { globalBounds, material, features } = config;
  const dims = calculateDrawerDimensions(config, drawerIndex, totalDrawers);

  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const drawerGap = 3;
  const slideWidth = features.drawers.slideWidth;

  // Y position of drawer box
  const boxPosY =
    toeKickHeight +
    material.thickness +
    drawerIndex * (dims.frontHeight + drawerGap) +
    (dims.frontHeight - dims.boxHeight) / 2;

  // Get actual drawer bottom thickness from config
  const drawerBottomThickness = getDrawerBottomThickness(config);

  // Bottom sits in the dados, so it extends into the side panels
  const bottomWidth = dims.boxInteriorWidth + 2 * DRAWER_BOTTOM_DADO_DEPTH;
  const bottomDepth = dims.boxDepth - 2 * DRAWER_BOX_THICKNESS + 2 * DRAWER_BOTTOM_DADO_DEPTH;

  return {
    id: `drawer_bottom_${drawerIndex + 1}`,
    label: `Drawer ${drawerIndex + 1} Bottom`,
    role: 'drawer_bottom',
    dimensions: [bottomWidth, drawerBottomThickness, bottomDepth],
    position: [
      material.thickness + slideWidth + DRAWER_BOX_THICKNESS - DRAWER_BOTTOM_DADO_DEPTH,
      boxPosY + DRAWER_BOTTOM_DADO_OFFSET,
      DRAWER_BOX_THICKNESS - DRAWER_BOTTOM_DADO_DEPTH,
    ],
    rotation: [0, 0, 0],
    features: [],
    layer: 'OUTSIDE_CUT',
    materialThickness: drawerBottomThickness,
  };
}

/**
 * Generate all components for a single drawer
 */
export function generateDrawer(
  config: AssemblyConfig,
  drawerIndex: number,
  totalDrawers: number
): Component[] {
  const components: Component[] = [];

  components.push(generateDrawerFront(config, drawerIndex, totalDrawers));
  components.push(...generateDrawerSides(config, drawerIndex, totalDrawers));
  components.push(generateDrawerBack(config, drawerIndex, totalDrawers));
  components.push(generateDrawerBottom(config, drawerIndex, totalDrawers));

  return components;
}

/**
 * Generate all drawer components
 */
export function generateDrawers(config: AssemblyConfig): Component[] {
  const { features } = config;

  if (!features.drawers.enabled || features.drawers.count <= 0) {
    return [];
  }

  const components: Component[] = [];
  const drawerCount = features.drawers.count;

  for (let i = 0; i < drawerCount; i++) {
    components.push(...generateDrawer(config, i, drawerCount));
  }

  return components;
}

/**
 * Validate drawer configuration
 */
export function validateDrawerConfig(config: AssemblyConfig): string[] {
  const errors: string[] = [];
  const { features } = config;
  const interior = calculateInteriorBounds(config);

  if (!features.drawers.enabled) {
    return errors;
  }

  // Check slide width
  if (features.drawers.slideWidth < 0) {
    errors.push(`Slide width must be non-negative, got ${features.drawers.slideWidth}mm.`);
  }

  // Check that slides leave room for drawer box
  const boxWidth = interior.w - 2 * features.drawers.slideWidth;
  if (boxWidth < 100) {
    errors.push(
      `Drawer box width (${boxWidth}mm) is too small after slide clearance. ` +
        `Need at least 100mm.`
    );
  }

  // Check drawer count
  if (features.drawers.count < 0) {
    errors.push(`Drawer count must be non-negative, got ${features.drawers.count}.`);
  }

  // Check minimum drawer height
  if (features.drawers.count > 0) {
    const dims = calculateDrawerDimensions(config, 0, features.drawers.count);
    if (dims.boxHeight < DRAWER_DEFAULTS.MIN_HEIGHT) {
      errors.push(
        `Drawer height (${dims.boxHeight}mm) is below minimum of ${DRAWER_DEFAULTS.MIN_HEIGHT}mm. ` +
          `Reduce drawer count or increase cabinet height.`
      );
    }
  }

  return errors;
}
