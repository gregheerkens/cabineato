/**
 * Carcass Geometry Generator
 *
 * Generates the main carcass components:
 * - Left and right side panels (full height)
 * - Top and bottom panels (with width deduction for butt joints)
 * - Toe kick notches on side panels (if enabled)
 *
 * Per AdditionalContext.md:
 * - Standard Joinery: Butt Joints where Top/Bottom are captured between Sides
 * - Deduction Rule: Top/Bottom width = GlobalWidth - (2 * MaterialThickness)
 * - Toe Kick: 100mm x 75mm notch at bottom front of side panels
 */

import type {
  AssemblyConfig,
  Component,
  Feature,
  NotchFeature,
  HoleFeature,
  CountersinkFeature,
  Vector3,
  AssemblyPredrillConfig,
  SlidePredrillConfig,
} from '../types';
import { ASSEMBLY_PREDRILL_DEFAULTS, SLIDE_HARDWARE_DEFAULTS, DRAWER_DEFAULTS } from '../types/constants';

/**
 * Generate a unique ID for a component
 */
function generateId(role: string, index?: number): string {
  const base = role.toLowerCase().replace(/\s+/g, '_');
  return index !== undefined ? `${base}_${index}` : base;
}

/**
 * Generate assembly pre-drill holes for a horizontal edge
 * These are holes drilled through the side panel into the top/bottom panel
 * 
 * @param edgeLength - Length of the edge (typically panel depth)
 * @param edgeDistance - Distance from panel edge (Y position in flat coordinates)
 * @param config - Pre-drill configuration
 * @returns Array of hole features positioned along the edge
 */
export function generateAssemblyPredrillsForEdge(
  edgeLength: number,
  edgeDistance: number,
  config: AssemblyPredrillConfig
): Feature[] {
  if (!config.enabled) {
    return [];
  }

  const holes: Feature[] = [];
  const pilotDiameter = config.pilotDiameter ?? ASSEMBLY_PREDRILL_DEFAULTS.PILOT_DIAMETER;
  const countersinkDiameter = config.countersinkDiameter ?? ASSEMBLY_PREDRILL_DEFAULTS.COUNTERSINK_DIAMETER;
  const screwSpacing = config.screwSpacing ?? ASSEMBLY_PREDRILL_DEFAULTS.SCREW_SPACING;
  const edgeOffset = config.edgeDistance ?? ASSEMBLY_PREDRILL_DEFAULTS.EDGE_DISTANCE;

  // Calculate positions along the edge
  // Start and end with edgeOffset from ends, then space evenly
  const startPos = edgeOffset;
  const endPos = edgeLength - edgeOffset;
  const availableLength = endPos - startPos;

  // Calculate number of holes needed
  const numIntervals = Math.max(1, Math.floor(availableLength / screwSpacing));
  const actualSpacing = availableLength / numIntervals;

  for (let i = 0; i <= numIntervals; i++) {
    const xPos = startPos + i * actualSpacing;

    // Add pilot hole
    const pilotHole: HoleFeature = {
      type: 'hole',
      pos: [xPos, edgeDistance],
      diameter: pilotDiameter,
      depth: 0, // 0 = through hole
      purpose: 'assembly',
    };
    holes.push(pilotHole);

    // Add countersink if enabled
    if (config.countersink) {
      const countersink: CountersinkFeature = {
        type: 'countersink',
        pos: [xPos, edgeDistance],
        pilotDiameter: pilotDiameter,
        countersinkDiameter: countersinkDiameter,
        pilotDepth: 0, // Through hole
        countersinkDepth: countersinkDiameter / 2, // Standard 82° countersink depth
        purpose: 'assembly',
      };
      holes.push(countersink);
    }
  }

  return holes;
}

/**
 * Generate assembly pre-drills for a side panel
 * Creates holes along top and bottom edges for joining to top/bottom panels
 */
export function generateSidePanelAssemblyPredrills(
  config: AssemblyConfig,
  panelHeight: number,
  panelDepth: number,
  isLeftPanel: boolean
): Feature[] {
  const predrills = config.predrills?.assembly;
  if (!predrills?.enabled) {
    return [];
  }

  const features: Feature[] = [];
  const thickness = config.material.thickness;
  const edgeDistance = predrills.edgeDistance ?? ASSEMBLY_PREDRILL_DEFAULTS.EDGE_DISTANCE;

  // Bottom edge holes (for bottom panel connection)
  // Y position: near the bottom of the panel, but above toe kick if present
  const toeKickHeight = config.features.toeKick.enabled ? config.features.toeKick.height : 0;
  const bottomEdgeY = toeKickHeight + thickness / 2;

  const bottomHoles = generateAssemblyPredrillsForEdge(
    panelDepth,
    bottomEdgeY,
    predrills
  );
  features.push(...bottomHoles);

  // Top edge holes (for top panel connection)
  // Y position: near the top of the panel
  const topEdgeY = panelHeight - thickness / 2;

  const topHoles = generateAssemblyPredrillsForEdge(
    panelDepth,
    topEdgeY,
    predrills
  );
  features.push(...topHoles);

  return features;
}

/**
 * Generate slide mounting holes for a single drawer
 * 
 * @param drawerBottomY - Y position of the bottom of the drawer opening
 * @param panelDepth - Depth of the side panel
 * @param config - Slide pre-drill configuration
 * @returns Array of hole features for the slide mounting
 */
export function generateSlidePredrillsForDrawer(
  drawerBottomY: number,
  panelDepth: number,
  config: SlidePredrillConfig
): Feature[] {
  if (!config.enabled) {
    return [];
  }

  const holes: Feature[] = [];
  const diameter = config.holeDiameter ?? SLIDE_HARDWARE_DEFAULTS.HOLE_DIAMETER;
  const frontOffset = config.frontOffset ?? SLIDE_HARDWARE_DEFAULTS.FRONT_OFFSET;
  const holeSpacing = config.holeSpacing ?? SLIDE_HARDWARE_DEFAULTS.HOLE_SPACING;
  const holesPerSlide = config.holesPerSlide ?? SLIDE_HARDWARE_DEFAULTS.HOLES_PER_SLIDE;

  // Slides typically mount at the bottom of the drawer opening
  // mountingHeight is the vertical offset from the drawer opening bottom
  const slideY = drawerBottomY + (config.mountingHeight ?? 0);

  // Generate holes along the depth of the slide
  for (let i = 0; i < holesPerSlide; i++) {
    const xPos = frontOffset + i * holeSpacing;
    
    // Don't place holes beyond the panel depth
    if (xPos > panelDepth - 20) break;

    const hole: HoleFeature = {
      type: 'hole',
      pos: [xPos, slideY],
      diameter,
      depth: 0, // 0 = through hole
      purpose: 'slide_mount',
    };
    holes.push(hole);
  }

  return holes;
}

/**
 * Generate all slide pre-drills for a side panel
 * Creates mounting holes for all drawer slides
 */
export function generateSidePanelSlidePredrills(
  config: AssemblyConfig,
  panelHeight: number,
  panelDepth: number
): Feature[] {
  const slideConfig = config.predrills?.slides;
  if (!slideConfig?.enabled) {
    return [];
  }

  const { features, material } = config;
  if (!features.drawers.enabled || features.drawers.count <= 0) {
    return [];
  }

  const holes: Feature[] = [];
  const thickness = material.thickness;
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const drawerCount = features.drawers.count;

  // Calculate interior height (same as calculateInteriorBounds but inline)
  const interiorHeight = panelHeight - 2 * thickness - toeKickHeight;
  
  // Calculate drawer front height
  const drawerGap = 3;
  const totalGaps = drawerCount - 1;
  const heightForDrawers = interiorHeight - totalGaps * drawerGap;
  const drawerFrontHeight = heightForDrawers / drawerCount;

  // Generate holes for each drawer
  for (let i = 0; i < drawerCount; i++) {
    // Calculate the Y position of the bottom of each drawer opening
    // From the bottom of the interior space
    const drawerBottomY = toeKickHeight + thickness + i * (drawerFrontHeight + drawerGap);

    const drawerHoles = generateSlidePredrillsForDrawer(
      drawerBottomY,
      panelDepth,
      slideConfig
    );
    holes.push(...drawerHoles);
  }

  return holes;
}

/**
 * Generate the left side panel
 */
export function generateLeftSidePanel(config: AssemblyConfig): Component {
  const { globalBounds, material, features } = config;
  const { w, h, d } = globalBounds;
  const thickness = material.thickness;

  // Side panels are full height and full depth
  const panelHeight = h;
  const panelDepth = d;

  // Build features array
  const panelFeatures: Feature[] = [];

  // Add toe kick notch if enabled
  if (features.toeKick.enabled) {
    const notch: NotchFeature = {
      type: 'notch',
      width: features.toeKick.depth,  // Depth becomes width in panel coordinates
      height: features.toeKick.height,
      pos: [0, 0], // Bottom-left corner of the panel
      corner: 'bottom-left',
    };
    panelFeatures.push(notch);
  }

  // Add assembly pre-drills if enabled
  const assemblyPredrills = generateSidePanelAssemblyPredrills(
    config,
    panelHeight,
    panelDepth,
    true // isLeftPanel
  );
  panelFeatures.push(...assemblyPredrills);

  // Add slide pre-drills if enabled
  const slidePredrills = generateSidePanelSlidePredrills(
    config,
    panelHeight,
    panelDepth
  );
  panelFeatures.push(...slidePredrills);

  return {
    id: generateId('side_panel_left'),
    label: 'Left Side Panel',
    role: 'side_panel_left',
    dimensions: [thickness, panelHeight, panelDepth],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    features: panelFeatures,
    layer: 'OUTSIDE_CUT',
    materialThickness: thickness,
  };
}

/**
 * Generate the right side panel
 */
export function generateRightSidePanel(config: AssemblyConfig): Component {
  const { globalBounds, material, features } = config;
  const { w, h, d } = globalBounds;
  const thickness = material.thickness;

  // Side panels are full height and full depth
  const panelHeight = h;
  const panelDepth = d;

  // Build features array
  const panelFeatures: Feature[] = [];

  // Add toe kick notch if enabled (mirrored for right side)
  if (features.toeKick.enabled) {
    const notch: NotchFeature = {
      type: 'notch',
      width: features.toeKick.depth,
      height: features.toeKick.height,
      pos: [thickness - features.toeKick.depth, 0], // Bottom-right of panel face
      corner: 'bottom-right',
    };
    panelFeatures.push(notch);
  }

  // Add assembly pre-drills if enabled
  const assemblyPredrills = generateSidePanelAssemblyPredrills(
    config,
    panelHeight,
    panelDepth,
    false // isLeftPanel
  );
  panelFeatures.push(...assemblyPredrills);

  // Add slide pre-drills if enabled
  const slidePredrills = generateSidePanelSlidePredrills(
    config,
    panelHeight,
    panelDepth
  );
  panelFeatures.push(...slidePredrills);

  // Position: at the right edge of the cabinet
  const posX = w - thickness;

  return {
    id: generateId('side_panel_right'),
    label: 'Right Side Panel',
    role: 'side_panel_right',
    dimensions: [thickness, panelHeight, panelDepth],
    position: [posX, 0, 0],
    rotation: [0, 0, 0],
    features: panelFeatures,
    layer: 'OUTSIDE_CUT',
    materialThickness: thickness,
  };
}

/**
 * Generate the top panel
 *
 * Width is deducted for butt joint: GlobalWidth - (2 * MaterialThickness)
 */
export function generateTopPanel(config: AssemblyConfig): Component {
  const { globalBounds, material } = config;
  const { w, h, d } = globalBounds;
  const thickness = material.thickness;

  // Top panel width is reduced to fit between side panels
  const panelWidth = w - 2 * thickness;
  const panelDepth = d;

  // Position: sits on top between the side panels
  const posX = thickness;
  const posY = h - thickness;

  return {
    id: generateId('top_panel'),
    label: 'Top Panel',
    role: 'top_panel',
    dimensions: [panelWidth, thickness, panelDepth],
    position: [posX, posY, 0],
    rotation: [0, 0, 0],
    features: [],
    layer: 'OUTSIDE_CUT',
    materialThickness: thickness,
  };
}

/**
 * Generate the bottom panel
 *
 * Width is deducted for butt joint: GlobalWidth - (2 * MaterialThickness)
 * If toe kick is enabled, the bottom panel sits above the toe kick height
 */
export function generateBottomPanel(config: AssemblyConfig): Component {
  const { globalBounds, material, features } = config;
  const { w, d } = globalBounds;
  const thickness = material.thickness;

  // Bottom panel width is reduced to fit between side panels
  const panelWidth = w - 2 * thickness;
  const panelDepth = d;

  // Position: sits at the bottom between side panels
  // If toe kick is enabled, the panel is raised
  const posX = thickness;
  const posY = features.toeKick.enabled ? features.toeKick.height : 0;

  return {
    id: generateId('bottom_panel'),
    label: 'Bottom Panel',
    role: 'bottom_panel',
    dimensions: [panelWidth, thickness, panelDepth],
    position: [posX, posY, 0],
    rotation: [0, 0, 0],
    features: [],
    layer: 'OUTSIDE_CUT',
    materialThickness: thickness,
  };
}

/**
 * Calculate interior bounds of the carcass
 *
 * This is the usable interior space after accounting for:
 * - Side panel thickness on each side
 * - Top and bottom panel thickness
 * - Toe kick height (if enabled)
 */
export function calculateInteriorBounds(config: AssemblyConfig): {
  w: number;
  h: number;
  d: number;
} {
  const { globalBounds, material, features } = config;
  const thickness = material.thickness;

  const interiorWidth = globalBounds.w - 2 * thickness;

  // Interior height accounts for top, bottom panels, and toe kick
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const interiorHeight = globalBounds.h - 2 * thickness - toeKickHeight;

  // Interior depth is same as global depth (no front/back deduction for open front)
  const interiorDepth = globalBounds.d;

  return {
    w: interiorWidth,
    h: interiorHeight,
    d: interiorDepth,
  };
}

/**
 * Generate all carcass components
 *
 * This is a pure function: (config) => Component[]
 */
export function generateCarcass(config: AssemblyConfig): Component[] {
  const components: Component[] = [];

  // Generate the four main carcass panels
  components.push(generateLeftSidePanel(config));
  components.push(generateRightSidePanel(config));
  components.push(generateTopPanel(config));
  components.push(generateBottomPanel(config));

  return components;
}

/**
 * Validate carcass configuration
 *
 * Returns an array of error messages, empty if valid
 */
export function validateCarcassConfig(config: AssemblyConfig): string[] {
  const errors: string[] = [];
  const { globalBounds, material, features } = config;
  const thickness = material.thickness;

  // Check that interior width is positive
  const interiorWidth = globalBounds.w - 2 * thickness;
  if (interiorWidth <= 0) {
    errors.push(
      `Interior width would be ${interiorWidth}mm. ` +
        `Material thickness (${thickness}mm x 2 = ${thickness * 2}mm) ` +
        `exceeds cabinet width (${globalBounds.w}mm).`
    );
  }

  // Check that interior height is positive
  const toeKickHeight = features.toeKick.enabled ? features.toeKick.height : 0;
  const interiorHeight = globalBounds.h - 2 * thickness - toeKickHeight;
  if (interiorHeight <= 0) {
    errors.push(
      `Interior height would be ${interiorHeight}mm. ` +
        `Combined thickness of top (${thickness}mm), bottom (${thickness}mm), ` +
        `and toe kick (${toeKickHeight}mm) exceeds cabinet height (${globalBounds.h}mm).`
    );
  }

  // Check minimum dimensions
  if (globalBounds.w < 100) {
    errors.push(`Cabinet width (${globalBounds.w}mm) is below minimum of 100mm.`);
  }
  if (globalBounds.h < 100) {
    errors.push(`Cabinet height (${globalBounds.h}mm) is below minimum of 100mm.`);
  }
  if (globalBounds.d < 100) {
    errors.push(`Cabinet depth (${globalBounds.d}mm) is below minimum of 100mm.`);
  }

  // Check material thickness
  if (thickness <= 0) {
    errors.push(`Material thickness must be positive, got ${thickness}mm.`);
  }
  if (thickness > 50) {
    errors.push(`Material thickness (${thickness}mm) exceeds maximum of 50mm.`);
  }

  return errors;
}
