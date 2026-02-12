/**
 * Cabineato Constants
 *
 * All magic numbers are defined here per CODE_ETHOS.
 * These values come from industry standards and the AdditionalContext document.
 */

import type {
  AssemblyConfig,
  CNCLayer,
  MaterialConfig,
  SecondaryMaterialConfig,
  MachiningConfig,
  BackPanelConfig,
  ShelfConfig,
  AdjustableShelfConfig,
  FixedShelfConfig,
  ShelfRunnerConfig,
  DrawerConfig,
  DrawerPullConfig,
  ToeKickConfig,
  CarcassJointConfig,
  AssemblyPredrillConfig,
  SlidePredrillConfig,
} from './assembly';

// ============================================================================
// System 32 Constants (European Cabinet Standard)
// ============================================================================

/**
 * System 32 defines the standard spacing for shelf pin holes.
 * This system allows for adjustable shelving with consistent hardware.
 */
export const SYSTEM_32 = {
  /** Hole diameter for shelf pins in mm */
  HOLE_DIAMETER: 5,
  /** Vertical spacing between holes in mm */
  HOLE_SPACING: 32,
  /** Horizontal setback from front edge in mm */
  FRONT_SETBACK: 37,
  /** Horizontal setback from rear edge in mm */
  REAR_SETBACK: 37,
  /** Minimum distance from top/bottom to first hole in mm */
  VERTICAL_MARGIN: 50,
} as const;

// ============================================================================
// CNC Layer Names
// ============================================================================

/**
 * Layer names for CNC export.
 * These follow the naming convention expected by Vectric and similar CAM software.
 */
export const CNC_LAYERS: Record<CNCLayer, string> = {
  OUTSIDE_CUT: 'OUTSIDE_CUT',
  DRILL_5MM: 'DRILL_5MM',
  DRILL_3MM: 'DRILL_3MM',
  DRILL_8MM: 'DRILL_8MM',
  DRILL_35MM: 'DRILL_35MM',
  COUNTERSINK: 'COUNTERSINK',
  POCKET_DADO: 'POCKET_DADO',
} as const;

// ============================================================================
// Common Material Thicknesses
// ============================================================================

/** Common material thicknesses in mm with imperial equivalents */
export const MATERIAL_THICKNESSES = {
  /** 3/4" plywood/MDF */
  STANDARD_18MM: 18,
  /** Actual 3/4" plywood */
  PLYWOOD_19MM: 19.05,
  /** 1/2" material */
  HALF_INCH: 12.7,
  /** 1/4" material (common for backs/drawer bottoms) */
  QUARTER_INCH: 6.35,
  /** 3mm hardboard */
  HARDBOARD_3MM: 3,
  /** 6mm MDF (backs) */
  MDF_6MM: 6,
} as const;

// ============================================================================
// Router Bit Diameters
// ============================================================================

/** Common router bit diameters in mm */
export const BIT_DIAMETERS = {
  /** 1/4" bit */
  QUARTER_INCH: 6.35,
  /** 3/8" bit */
  THREE_EIGHTH: 9.525,
  /** 1/2" bit */
  HALF_INCH: 12.7,
  /** 6mm bit */
  MM_6: 6,
  /** 8mm bit */
  MM_8: 8,
} as const;

// ============================================================================
// Drawer Constants
// ============================================================================

export const DRAWER_DEFAULTS = {
  /** Standard ball-bearing slide clearance per side in mm */
  SLIDE_CLEARANCE: 12.7,
  /** Full overlay amount in mm */
  FULL_OVERLAY: 19,
  /** Half overlay amount in mm */
  HALF_OVERLAY: 9.5,
  /** Minimum drawer height in mm */
  MIN_HEIGHT: 50,
} as const;

// ============================================================================
// Drawer Pull Constants
// ============================================================================

export const DRAWER_PULL_DEFAULTS = {
  /** Common drawer pull hole spacings (center to center) in mm */
  SPACING_64MM: 64,    // 2.5"
  SPACING_96MM: 96,    // 3.75"
  SPACING_128MM: 128,  // 5"
  SPACING_160MM: 160,  // 6.3"
  /** Standard pull hole diameter in mm */
  HOLE_DIAMETER: 5,
  /** Distance from top of drawer front to pull center in mm */
  VERTICAL_OFFSET: 32,
} as const;

// ============================================================================
// Assembly Pre-drill Constants
// ============================================================================

export const ASSEMBLY_PREDRILL_DEFAULTS = {
  /** Standard pilot hole diameter in mm */
  PILOT_DIAMETER: 3,
  /** Standard countersink diameter in mm */
  COUNTERSINK_DIAMETER: 8,
  /** Countersink depth in mm */
  COUNTERSINK_DEPTH: 4,
  /** Distance from panel edge for screws in mm */
  EDGE_DISTANCE: 25,
  /** Spacing between screws along panel in mm */
  SCREW_SPACING: 200,
} as const;

// ============================================================================
// Pocket Hole Constants
// ============================================================================

export const POCKET_HOLE_DEFAULTS = {
  /** Registration mark diameter in mm (3mm through-drill point) */
  MARK_DIAMETER: 3,
} as const;

// ============================================================================
// Slide Hardware Constants
// ============================================================================

export const SLIDE_HARDWARE_DEFAULTS = {
  /** Standard slide mounting hole diameter in mm */
  HOLE_DIAMETER: 4,
  /** Distance from front edge to first hole in mm */
  FRONT_OFFSET: 37,
  /** Spacing between holes along slide in mm */
  HOLE_SPACING: 32,
  /** Number of holes per slide */
  HOLES_PER_SLIDE: 3,
} as const;

// ============================================================================
// Shelf Runner Constants
// ============================================================================

export const SHELF_RUNNER_DEFAULTS = {
  /** Hole diameter for runner mounting screws in mm */
  HOLE_DIAMETER: 4,
  /** Distance from front edge to front hole in mm */
  FRONT_SETBACK: 50,
  /** Distance from rear edge to rear hole in mm */
  REAR_SETBACK: 50,
  /** Number of holes per runner */
  HOLES_PER_RUNNER: 2,
  /** Cross-section width of the runner strip in mm */
  STRIP_WIDTH: 20,
  /** Per-side clearance for full-width runner mode in mm */
  FULL_WIDTH_CLEARANCE: 2,
} as const;

// ============================================================================
// Fixed Shelf / Dado Constants
// ============================================================================

export const DADO_DEFAULTS = {
  /** Standard dado depth as fraction of material thickness */
  DEPTH_FRACTION: 0.5,
  /** Minimum dado depth in mm */
  MIN_DEPTH: 6,
  /** Maximum dado depth in mm */
  MAX_DEPTH: 12,
} as const;

// ============================================================================
// Toe Kick Defaults
// ============================================================================

export const TOE_KICK_DEFAULTS = {
  /** Standard toe kick height in mm */
  HEIGHT: 100,
  /** Standard toe kick depth in mm */
  DEPTH: 75,
} as const;

// ============================================================================
// Assembly Tolerances
// ============================================================================

export const TOLERANCES = {
  /** Shelf width clearance (narrower than interior) in mm */
  SHELF_CLEARANCE: 1,
  /** Drawer side clearance per side in mm */
  DRAWER_SIDE_CLEARANCE: 0.5,
  /** Minimum valid dimension in mm */
  MIN_DIMENSION: 50,
  /** Maximum valid dimension in mm */
  MAX_DIMENSION: 3000,
} as const;

// ============================================================================
// Back Panel Defaults
// ============================================================================

export const BACK_PANEL_DEFAULTS = {
  /** Default inset dado depth in mm */
  DADO_DEPTH: 6,
  /** Default inset distance from rear edge in mm */
  INSET_DISTANCE: 10,
} as const;

// ============================================================================
// Default Configurations
// ============================================================================

/** Default material configuration */
export const DEFAULT_MATERIAL: MaterialConfig = {
  thickness: MATERIAL_THICKNESSES.STANDARD_18MM,
  kerf: 3.2, // Standard table saw kerf
  name: '18mm MDF/Plywood',
};

/** Default secondary material configuration */
export const DEFAULT_SECONDARY_MATERIAL: SecondaryMaterialConfig = {
  backPanelThickness: MATERIAL_THICKNESSES.MDF_6MM,
  drawerBottomThickness: MATERIAL_THICKNESSES.MDF_6MM,
  fixedShelfThickness: undefined, // Uses primary by default
};

/** Default machining configuration */
export const DEFAULT_MACHINING: MachiningConfig = {
  bitDiameter: BIT_DIAMETERS.QUARTER_INCH,
  compensation: 'outside',
};

/** Default back panel configuration */
export const DEFAULT_BACK_PANEL: BackPanelConfig = {
  type: 'applied',
  thickness: MATERIAL_THICKNESSES.MDF_6MM,
  dadoDepth: BACK_PANEL_DEFAULTS.DADO_DEPTH,
  insetDistance: BACK_PANEL_DEFAULTS.INSET_DISTANCE,
};

/** Default adjustable shelf configuration */
export const DEFAULT_ADJUSTABLE_SHELVES: AdjustableShelfConfig = {
  enabled: true,
  count: 2,
  frontSetback: SYSTEM_32.FRONT_SETBACK,
  rearSetback: SYSTEM_32.REAR_SETBACK,
};

/** Default fixed shelf configuration */
export const DEFAULT_FIXED_SHELVES: FixedShelfConfig = {
  enabled: false,
  positions: [],
  dadoDepth: DADO_DEFAULTS.MIN_DEPTH,
  useSecondaryMaterial: false,
};

/** Default shelf runner configuration */
export const DEFAULT_SHELF_RUNNERS: ShelfRunnerConfig = {
  enabled: false,
  mode: 'full_width',
  frontSetback: SHELF_RUNNER_DEFAULTS.FRONT_SETBACK,
  rearSetback: SHELF_RUNNER_DEFAULTS.REAR_SETBACK,
  holeDiameter: SHELF_RUNNER_DEFAULTS.HOLE_DIAMETER,
  holesPerRunner: SHELF_RUNNER_DEFAULTS.HOLES_PER_RUNNER,
};

/** Default combined shelf configuration */
export const DEFAULT_SHELVES: ShelfConfig = {
  adjustable: DEFAULT_ADJUSTABLE_SHELVES,
  fixed: DEFAULT_FIXED_SHELVES,
  runners: DEFAULT_SHELF_RUNNERS,
};

/** Default drawer pull configuration */
export const DEFAULT_DRAWER_PULLS: DrawerPullConfig = {
  type: 'none',
  holeDiameter: DRAWER_PULL_DEFAULTS.HOLE_DIAMETER,
  holeSpacing: DRAWER_PULL_DEFAULTS.SPACING_96MM,
  verticalOffset: DRAWER_PULL_DEFAULTS.VERTICAL_OFFSET,
  horizontalPosition: 'center',
};

/** Default drawer configuration */
export const DEFAULT_DRAWERS: DrawerConfig = {
  enabled: false,
  count: 0,
  slideWidth: DRAWER_DEFAULTS.SLIDE_CLEARANCE,
  overlayAmount: DRAWER_DEFAULTS.FULL_OVERLAY,
  pullHoles: DEFAULT_DRAWER_PULLS,
};

/** Default toe kick configuration */
export const DEFAULT_TOE_KICK: ToeKickConfig = {
  enabled: true,
  height: TOE_KICK_DEFAULTS.HEIGHT,
  depth: TOE_KICK_DEFAULTS.DEPTH,
  generatePanel: true,
};

/** Default carcass joint configuration */
export const DEFAULT_CARCASS_JOINT: CarcassJointConfig = {
  type: 'butt',
  pocketHoleMarks: false,
};

/** Default assembly pre-drill configuration */
export const DEFAULT_ASSEMBLY_PREDRILLS: AssemblyPredrillConfig = {
  enabled: false,
  countersink: true,
  pilotDiameter: ASSEMBLY_PREDRILL_DEFAULTS.PILOT_DIAMETER,
  countersinkDiameter: ASSEMBLY_PREDRILL_DEFAULTS.COUNTERSINK_DIAMETER,
  edgeDistance: ASSEMBLY_PREDRILL_DEFAULTS.EDGE_DISTANCE,
  screwSpacing: ASSEMBLY_PREDRILL_DEFAULTS.SCREW_SPACING,
};

/** Default slide pre-drill configuration */
export const DEFAULT_SLIDE_PREDRILLS: SlidePredrillConfig = {
  enabled: false,
  holeDiameter: SLIDE_HARDWARE_DEFAULTS.HOLE_DIAMETER,
  mountingHeight: 37, // Bottom of slide, will be calculated per drawer
  frontOffset: SLIDE_HARDWARE_DEFAULTS.FRONT_OFFSET,
  holeSpacing: SLIDE_HARDWARE_DEFAULTS.HOLE_SPACING,
  holesPerSlide: SLIDE_HARDWARE_DEFAULTS.HOLES_PER_SLIDE,
};

/** Default assembly configuration */
export const DEFAULT_ASSEMBLY_CONFIG: AssemblyConfig = {
  globalBounds: {
    w: 600, // 600mm wide
    h: 720, // 720mm tall (standard base cabinet)
    d: 560, // 560mm deep
  },
  material: DEFAULT_MATERIAL,
  secondaryMaterial: DEFAULT_SECONDARY_MATERIAL,
  machining: DEFAULT_MACHINING,
  backPanel: DEFAULT_BACK_PANEL,
  features: {
    shelves: DEFAULT_SHELVES,
    drawers: DEFAULT_DRAWERS,
    toeKick: DEFAULT_TOE_KICK,
    carcassJoint: DEFAULT_CARCASS_JOINT,
  },
  predrills: {
    assembly: DEFAULT_ASSEMBLY_PREDRILLS,
    slides: DEFAULT_SLIDE_PREDRILLS,
  },
};

// ============================================================================
// Sheet Nesting Constants
// ============================================================================

/** Common CNC bed/sheet sizes in mm [width, height] */
export const BED_SIZES = {
  /** 4' x 4' CNC bed (1219mm x 1219mm) */
  FOUR_BY_FOUR: [1219, 1219] as [number, number],
  /** 4' x 8' full sheet (1219mm x 2438mm) */
  FOUR_BY_EIGHT: [1219, 2438] as [number, number],
} as const;

/** Default values for sheet nesting */
export const NESTING_DEFAULTS = {
  /** Edge margin / safe zone from sheet edges in mm */
  EDGE_MARGIN: 15,
  /** Extra spacing added to kerf for part spacing comfort in mm */
  COMFORT_MARGIN: 1,
  /** Absolute minimum part spacing in mm */
  MIN_PART_SPACING: 3,
} as const;

/** Default nesting configuration */
export const DEFAULT_NESTING_CONFIG = {
  bedSize: BED_SIZES.FOUR_BY_FOUR as [number, number],
  edgeMargin: NESTING_DEFAULTS.EDGE_MARGIN,
  partSpacing: BIT_DIAMETERS.QUARTER_INCH + NESTING_DEFAULTS.COMFORT_MARGIN,
  allowRotation: true,
  bitDiameter: BIT_DIAMETERS.QUARTER_INCH,
} as const;

// ============================================================================
// Unit Conversion Helpers
// ============================================================================

/** Millimeters per inch */
export const MM_PER_INCH = 25.4;

/** Convert mm to inches */
export function mmToInches(mm: number): number {
  return mm / MM_PER_INCH;
}

/** Convert inches to mm */
export function inchesToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

/** Format mm as fractional inches (approximate to 1/32") */
export function formatAsInches(mm: number): string {
  const inches = mmToInches(mm);
  const whole = Math.floor(inches);
  const fraction = inches - whole;

  // Round to nearest 1/32"
  const thirtySeconds = Math.round(fraction * 32);

  if (thirtySeconds === 0) {
    return `${whole}"`;
  } else if (thirtySeconds === 32) {
    return `${whole + 1}"`;
  } else if (thirtySeconds === 16) {
    return whole > 0 ? `${whole}-1/2"` : `1/2"`;
  } else if (thirtySeconds === 8) {
    return whole > 0 ? `${whole}-1/4"` : `1/4"`;
  } else if (thirtySeconds === 24) {
    return whole > 0 ? `${whole}-3/4"` : `3/4"`;
  } else if (thirtySeconds === 4) {
    return whole > 0 ? `${whole}-1/8"` : `1/8"`;
  } else if (thirtySeconds === 12) {
    return whole > 0 ? `${whole}-3/8"` : `3/8"`;
  } else if (thirtySeconds === 20) {
    return whole > 0 ? `${whole}-5/8"` : `5/8"`;
  } else if (thirtySeconds === 28) {
    return whole > 0 ? `${whole}-7/8"` : `7/8"`;
  } else {
    // Reduce fraction
    let num = thirtySeconds;
    let den = 32;
    while (num % 2 === 0) {
      num /= 2;
      den /= 2;
    }
    return whole > 0 ? `${whole}-${num}/${den}"` : `${num}/${den}"`;
  }
}
