/**
 * Cabineato Type Definitions
 * Based on DOCTIO Stage 2: Objects
 *
 * These types define the canonical entities used throughout the system.
 * All measurements are in millimeters (mm).
 */

// ============================================================================
// Vector Types
// ============================================================================

/** 2D position [x, y] in mm */
export type Vector2 = [number, number];

/** 3D position/dimensions [x, y, z] or [w, h, d] in mm */
export type Vector3 = [number, number, number];

// ============================================================================
// Feature Types (Subtractive Operations)
// ============================================================================

/** A circular hole drilled into a component */
export interface HoleFeature {
  type: 'hole';
  /** Diameter of the hole in mm */
  diameter: number;
  /** Depth of the hole in mm (0 = through hole) */
  depth: number;
  /** Position [x, y] relative to component origin */
  pos: Vector2;
  /** Purpose of the hole for layer assignment */
  purpose?: 'shelf_pin' | 'assembly' | 'hardware' | 'drawer_pull' | 'shelf_runner';
}

/** A countersunk hole for assembly screws */
export interface CountersinkFeature {
  type: 'countersink';
  /** Pilot hole diameter in mm */
  pilotDiameter: number;
  /** Countersink diameter in mm */
  countersinkDiameter: number;
  /** Pilot hole depth in mm (0 = through) */
  pilotDepth: number;
  /** Countersink depth in mm */
  countersinkDepth: number;
  /** Position [x, y] relative to component origin */
  pos: Vector2;
  /** Purpose of the hole */
  purpose: 'assembly' | 'hardware';
}

/** A slot/dado cut into a component */
export interface SlotFeature {
  type: 'slot';
  /** Width of the slot in mm (should match material thickness going into it) */
  width: number;
  /** Depth of the slot in mm */
  depth: number;
  /** Path defining the slot centerline */
  path: Vector2[];
  /** Purpose of the slot */
  purpose?: 'back_panel' | 'fixed_shelf' | 'drawer_bottom';
}

/** A rectangular notch (like toe kick) cut from a component */
export interface NotchFeature {
  type: 'notch';
  /** Width of the notch in mm */
  width: number;
  /** Height of the notch in mm */
  height: number;
  /** Position of the notch corner [x, y] relative to component origin */
  pos: Vector2;
  /** Which corner the notch is on */
  corner: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

/** Union of all feature types */
export type Feature = HoleFeature | CountersinkFeature | SlotFeature | NotchFeature;

// ============================================================================
// CNC Layer Types
// ============================================================================

/** Layer names for CNC export - each corresponds to a specific operation */
export type CNCLayer =
  | 'OUTSIDE_CUT'       // External boundaries for through-cutting
  | 'DRILL_5MM'         // Center points for 5mm shelf pin drilling
  | 'DRILL_3MM'         // Center points for 3mm pilot holes
  | 'DRILL_8MM'         // Center points for 8mm hardware holes
  | 'DRILL_35MM'        // Center points for 35mm hinge cups
  | 'COUNTERSINK'       // Countersink locations
  | 'POCKET_DADO';      // Closed vectors for material subtraction

// ============================================================================
// Component Types
// ============================================================================

/** Component role within the assembly */
export type ComponentRole =
  | 'side_panel_left'
  | 'side_panel_right'
  | 'top_panel'
  | 'bottom_panel'
  | 'back_panel'
  | 'fixed_shelf'
  | 'adjustable_shelf'
  | 'shelf'            // Legacy - maps to adjustable_shelf
  | 'drawer_front'
  | 'drawer_side'
  | 'drawer_back'
  | 'drawer_bottom'
  | 'toe_kick_panel';

/**
 * Component - Atomic unit representing a single panel/part
 */
export interface Component {
  /** Unique identifier */
  id: string;
  /** Human-readable label (e.g., "Left Side Panel") */
  label: string;
  /** Role within the assembly */
  role: ComponentRole;
  /** Dimensions [Width, Height, Depth/Thickness] in mm */
  dimensions: Vector3;
  /** Position [x, y, z] in the assembly coordinate system */
  position: Vector3;
  /** Rotation [rx, ry, rz] in degrees */
  rotation: Vector3;
  /** Subtractive features (holes, slots, notches) */
  features: Feature[];
  /** Primary CNC layer for the outline */
  layer: CNCLayer;
  /** Material thickness (for reference) */
  materialThickness: number;
}

// ============================================================================
// Material & Machining Configuration
// ============================================================================

/** Material properties */
export interface MaterialConfig {
  /** Primary material thickness in mm (e.g., 18 for 18mm MDF) */
  thickness: number;
  /** Saw blade kerf in mm (material removed by cutting) */
  kerf: number;
  /** Material name for display */
  name?: string;
}

/** Secondary material properties for backs, drawer bottoms, etc. */
export interface SecondaryMaterialConfig {
  /** Back panel material thickness in mm */
  backPanelThickness: number;
  /** Drawer bottom material thickness in mm */
  drawerBottomThickness: number;
  /** Fixed shelf material thickness in mm (if different from primary) */
  fixedShelfThickness?: number;
}

/** CNC machining settings */
export interface MachiningConfig {
  /** Router bit diameter in mm */
  bitDiameter: number;
  /** Toolpath compensation mode */
  compensation: 'outside' | 'inside' | 'center';
}

// ============================================================================
// Back Panel Configuration
// ============================================================================

/** Back panel type determines how it's attached */
export type BackPanelType = 'applied' | 'inset' | 'none';

/** Back panel configuration */
export interface BackPanelConfig {
  /** How the back panel is attached */
  type: BackPanelType;
  /** Back panel material thickness in mm (often thinner than carcass) */
  thickness: number;
  /** Inset dado depth in mm (only for 'inset' type) */
  dadoDepth?: number;
  /** Inset distance from rear edge in mm (only for 'inset' type) */
  insetDistance?: number;
}

// ============================================================================
// Feature Configurations
// ============================================================================

/** Shelf type options */
export type ShelfType = 'adjustable' | 'fixed' | 'runner';

/** Adjustable shelf configuration (System 32 pin holes) */
export interface AdjustableShelfConfig {
  /** Whether to generate shelf pin holes */
  enabled: boolean;
  /** Number of adjustable shelves */
  count: number;
  /** Distance from front edge to first hole row in mm */
  frontSetback: number;
  /** Distance from rear edge to last hole row in mm */
  rearSetback: number;
}

/** Fixed shelf configuration (dados) */
export interface FixedShelfConfig {
  /** Whether to generate fixed shelves with dados */
  enabled: boolean;
  /** Positions of fixed shelves from bottom (in mm) */
  positions: number[];
  /** Dado depth in mm (typically 1/3 to 1/2 material thickness) */
  dadoDepth: number;
  /** Whether to use secondary material thickness for shelves */
  useSecondaryMaterial: boolean;
}

/** Shelf runner configuration (for simple wooden runners) */
export interface ShelfRunnerConfig {
  /** Whether to generate shelf runner mounting holes */
  enabled: boolean;
  /** Positions of runner shelves from bottom (in mm) */
  positions: number[];
  /** Distance from front edge to runner in mm */
  frontSetback: number;
  /** Distance from rear edge to runner in mm */
  rearSetback: number;
  /** Hole diameter for runner screws in mm */
  holeDiameter: number;
  /** Number of holes per runner */
  holesPerRunner: number;
}

/** Combined shelf configuration */
export interface ShelfConfig {
  /** Adjustable shelves with System 32 pin holes */
  adjustable: AdjustableShelfConfig;
  /** Fixed shelves with dados */
  fixed: FixedShelfConfig;
  /** Shelf runners (simple wooden strips) */
  runners: ShelfRunnerConfig;
}

/** Drawer pull hole configuration */
export type DrawerPullType = 'none' | 'single' | 'double';

/** Drawer pull pre-drill configuration */
export interface DrawerPullConfig {
  /** Type of drawer pull holes */
  type: DrawerPullType;
  /** Hole diameter in mm */
  holeDiameter: number;
  /** Distance between holes for double pulls (center to center) in mm */
  holeSpacing: number;
  /** Vertical position from top of drawer front in mm */
  verticalOffset: number;
  /** Horizontal position (center, or offset from center) */
  horizontalPosition: 'center' | number;
}

/** Drawer configuration */
export interface DrawerConfig {
  /** Whether to generate drawer boxes */
  enabled: boolean;
  /** Number of drawers */
  count: number;
  /** Drawer slide clearance per side in mm (e.g., 12.7 for standard slides) */
  slideWidth: number;
  /** Drawer front overlay in mm */
  overlayAmount: number;
  /** Drawer pull pre-drill configuration */
  pullHoles: DrawerPullConfig;
}

/** Assembly pre-drill configuration */
export interface AssemblyPredrillConfig {
  /** Whether to generate assembly pre-drills */
  enabled: boolean;
  /** Include countersink */
  countersink: boolean;
  /** Pilot hole diameter in mm */
  pilotDiameter: number;
  /** Countersink diameter in mm */
  countersinkDiameter: number;
  /** Distance from panel edge for screws in mm */
  edgeDistance: number;
  /** Spacing between screws along panel length in mm */
  screwSpacing: number;
}

/** Slide hardware pre-drill configuration */
export interface SlidePredrillConfig {
  /** Whether to generate slide mounting holes */
  enabled: boolean;
  /** Hole diameter in mm */
  holeDiameter: number;
  /** Slide mounting height from bottom of cabinet in mm */
  mountingHeight: number;
  /** Distance from front edge to first hole in mm */
  frontOffset: number;
  /** Hole spacing along slide length in mm */
  holeSpacing: number;
  /** Number of holes per slide */
  holesPerSlide: number;
}

/** Toe kick configuration for floor-standing units */
export interface ToeKickConfig {
  /** Whether to include toe kick notches */
  enabled: boolean;
  /** Height of the notch in mm */
  height: number;
  /** Depth of the notch in mm */
  depth: number;
}

// ============================================================================
// Assembly (Root Configuration Object)
// ============================================================================

/** Global dimensions of the cabinet */
export interface GlobalBounds {
  /** Overall width in mm */
  w: number;
  /** Overall height in mm */
  h: number;
  /** Overall depth in mm */
  d: number;
}

/**
 * Assembly - Root configuration object
 *
 * This is the primary input to the geometry engine.
 * All parameters needed to generate a complete cabinet are defined here.
 */
export interface AssemblyConfig {
  /** Overall cabinet dimensions */
  globalBounds: GlobalBounds;
  /** Primary material settings */
  material: MaterialConfig;
  /** Secondary material settings for backs, drawer bottoms, etc. */
  secondaryMaterial: SecondaryMaterialConfig;
  /** CNC machining settings */
  machining: MachiningConfig;
  /** Back panel configuration */
  backPanel: BackPanelConfig;
  /** Feature configurations */
  features: {
    shelves: ShelfConfig;
    drawers: DrawerConfig;
    toeKick: ToeKickConfig;
  };
  /** Pre-drill configurations */
  predrills: {
    assembly: AssemblyPredrillConfig;
    slides: SlidePredrillConfig;
  };
}

/**
 * Assembly - Complete generated assembly
 *
 * This is the output of the geometry engine.
 */
export interface Assembly {
  /** The input configuration */
  config: AssemblyConfig;
  /** Generated components */
  components: Component[];
  /** Calculated interior dimensions */
  interiorBounds: GlobalBounds;
  /** Generation metadata */
  metadata: {
    generatedAt: string;
    version: string;
  };
}

// ============================================================================
// Geometry Output Types (for Maker.js integration)
// ============================================================================

/** 2D outline for a component (used for CNC export) */
export interface ComponentOutline {
  /** Component ID this outline belongs to */
  componentId: string;
  /** The layer this outline should be on */
  layer: CNCLayer;
  /** Maker.js model or path data */
  paths: unknown; // Will be MakerJs.IModel in implementation
}

/** Collection of outlines grouped by layer for export */
export interface LayeredExport {
  OUTSIDE_CUT: ComponentOutline[];
  DRILL_5MM: ComponentOutline[];
  POCKET_DADO: ComponentOutline[];
}
