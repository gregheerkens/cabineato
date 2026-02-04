/**
 * Geometry Engine
 *
 * Re-exports all geometry generation functions.
 */

// Main assembly builder
export {
  buildAssembly,
  validateConfig,
  recalculateAssembly,
  getAssemblySummary,
  getComponentsByLayer,
  type ValidationResult,
} from './assembly';

// Carcass generation
export {
  generateCarcass,
  generateLeftSidePanel,
  generateRightSidePanel,
  generateTopPanel,
  generateBottomPanel,
  calculateInteriorBounds,
  validateCarcassConfig,
} from './carcass';

// Back panel generation
export {
  generateBackPanel,
  generateAppliedBackPanel,
  generateInsetBackPanel,
  generateBackPanelDado,
  generateHorizontalBackPanelDado,
  requiresDados,
  validateBackPanelConfig,
} from './backPanel';

// Shelf generation
export {
  generateShelves,
  generateSidePanelShelfHoles,
  generateHoleColumn,
  countShelfPinHoles,
  validateShelfConfig,
} from './shelves';

// Drawer generation
export {
  generateDrawers,
  generateDrawer,
  generateDrawerFront,
  generateDrawerSides,
  generateDrawerBack,
  generateDrawerBottom,
  calculateDrawerDimensions,
  validateDrawerConfig,
  type DrawerBoxDimensions,
} from './drawers';

// Dogbone fillets
export {
  calculateDogboneCenter,
  isInternalCorner,
  generateRectangleDogbones,
  generateNotchDogbones,
  applyDogbonesToPath,
  type DogboneDirection,
  type DogboneFillet,
} from './dogbone';

// Layer utilities
export {
  LAYER_CONFIGS,
  getLayerConfig,
  getAllLayerNames,
  isValidLayerName,
  type LayerConfig,
} from './layers';
