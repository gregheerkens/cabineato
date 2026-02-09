/**
 * Assembly Builder
 *
 * Main orchestrator that generates a complete assembly from configuration.
 * This is a pure function: (AssemblyConfig) => Assembly
 *
 * Per CODE_ETHOS:
 * - Functional Geometry: Geometry generation must be a pure function
 * - Top-Down Hierarchy: Carcass -> Internal Components -> Features
 * - CNC First: All geometry must account for the bitDiameter
 */

import type {
  AssemblyConfig,
  Assembly,
  Component,
  GlobalBounds,
} from '../types';

import {
  generateCarcass,
  calculateInteriorBounds,
  validateCarcassConfig,
  generateLeftSidePanel,
  generateRightSidePanel,
  generateToeKickPanel,
} from './carcass';

import {
  generateBackPanel,
  generateBackPanelDado,
  generateHorizontalBackPanelDado,
  requiresDados,
  validateBackPanelConfig,
} from './backPanel';

import {
  generateShelves,
  generateSidePanelShelfHoles,
  generateSidePanelRunnerHoles,
  generateSidePanelFixedShelfDados,
  validateShelfConfig,
} from './shelves';

import {
  generateDrawers,
  validateDrawerConfig,
} from './drawers';

/** Current version of the assembly builder */
const BUILDER_VERSION = '0.1.0';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate an assembly configuration
 *
 * Returns all validation errors and warnings.
 */
export function validateConfig(config: AssemblyConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate carcass
  errors.push(...validateCarcassConfig(config));

  // Validate back panel
  errors.push(...validateBackPanelConfig(config));

  // Validate shelves
  errors.push(...validateShelfConfig(config));

  // Validate drawers
  errors.push(...validateDrawerConfig(config));

  // Check for conflicting features
  const shelvesEnabled = ('adjustable' in config.features.shelves)
    ? config.features.shelves.adjustable.enabled
    : (config.features.shelves as { enabled?: boolean }).enabled;
  if (shelvesEnabled && config.features.drawers.enabled) {
    warnings.push(
      'Both shelves and drawers are enabled. ' +
        'Shelf pin holes will be generated but may interfere with drawer slides.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Build a complete assembly from configuration
 *
 * This is the main entry point for geometry generation.
 * It follows the DOCTIO hierarchy: Carcass -> Back Panel -> Internal Features
 *
 * @param config - The assembly configuration
 * @returns The complete assembly with all components
 * @throws Error if configuration is invalid
 */
export function buildAssembly(config: AssemblyConfig): Assembly {
  // Validate configuration first
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(
      `Invalid assembly configuration:\n${validation.errors.join('\n')}`
    );
  }

  const components: Component[] = [];

  // 1. Generate carcass (side panels, top, bottom)
  const carcassComponents = generateCarcassWithFeatures(config);
  components.push(...carcassComponents);

  // 2. Generate back panel (if any)
  const backPanelComponent = generateBackPanel(config);
  if (backPanelComponent) {
    components.push(backPanelComponent);
  }

  // 2b. Generate toe kick panel (if any)
  const toeKickComponent = generateToeKickPanel(config);
  if (toeKickComponent) {
    components.push(toeKickComponent);
  }

  // 3. Generate adjustable shelves
  const shelves = generateShelves(config);
  components.push(...shelves);

  // 4. Generate drawers
  const drawerComponents = generateDrawers(config);
  components.push(...drawerComponents);

  // Calculate interior bounds
  const interiorBounds = calculateInteriorBounds(config);

  return {
    config,
    components,
    interiorBounds,
    metadata: {
      generatedAt: new Date().toISOString(),
      version: BUILDER_VERSION,
    },
  };
}

/**
 * Generate carcass components with all features applied
 *
 * Features include:
 * - Toe kick notches
 * - Shelf pin holes
 * - Back panel dados (if inset back)
 */
function generateCarcassWithFeatures(config: AssemblyConfig): Component[] {
  const components: Component[] = [];

  // Generate base carcass panels
  let leftPanel = generateLeftSidePanel(config);
  let rightPanel = generateRightSidePanel(config);

  // Add shelf pin holes to side panels (adjustable shelves)
  const shelfConfig = config.features.shelves;
  const adjustableEnabled = 'adjustable' in shelfConfig
    ? shelfConfig.adjustable?.enabled
    : (shelfConfig as any).enabled; // Legacy format fallback

  if (adjustableEnabled) {
    const leftShelfHoles = generateSidePanelShelfHoles(config, 'left');
    const rightShelfHoles = generateSidePanelShelfHoles(config, 'right');

    leftPanel = {
      ...leftPanel,
      features: [...leftPanel.features, ...leftShelfHoles],
    };
    rightPanel = {
      ...rightPanel,
      features: [...rightPanel.features, ...rightShelfHoles],
    };
  }

  // Add shelf runner holes to side panels
  const runnerConfig = 'runners' in shelfConfig ? shelfConfig.runners : undefined;
  if (runnerConfig?.enabled && runnerConfig.positions.length > 0) {
    const leftRunnerHoles = generateSidePanelRunnerHoles(config, 'left');
    const rightRunnerHoles = generateSidePanelRunnerHoles(config, 'right');

    leftPanel = {
      ...leftPanel,
      features: [...leftPanel.features, ...leftRunnerHoles],
    };
    rightPanel = {
      ...rightPanel,
      features: [...rightPanel.features, ...rightRunnerHoles],
    };
  }

  // Add fixed shelf dados to side panels
  const fixedConfig = 'fixed' in shelfConfig ? shelfConfig.fixed : undefined;
  if (fixedConfig?.enabled && fixedConfig.positions.length > 0) {
    const leftDados = generateSidePanelFixedShelfDados(config, 'left');
    const rightDados = generateSidePanelFixedShelfDados(config, 'right');

    leftPanel = {
      ...leftPanel,
      features: [...leftPanel.features, ...leftDados],
    };
    rightPanel = {
      ...rightPanel,
      features: [...rightPanel.features, ...rightDados],
    };
  }

  // Add back panel dados if inset back
  if (requiresDados(config)) {
    const leftDado = generateBackPanelDado(config, 'left');
    const rightDado = generateBackPanelDado(config, 'right');

    leftPanel = {
      ...leftPanel,
      features: [...leftPanel.features, leftDado],
    };
    rightPanel = {
      ...rightPanel,
      features: [...rightPanel.features, rightDado],
    };
  }

  components.push(leftPanel);
  components.push(rightPanel);

  // Generate top and bottom panels with dados if needed
  const basicCarcass = generateCarcass(config);
  const topPanel = basicCarcass.find((c) => c.role === 'top_panel')!;
  const bottomPanel = basicCarcass.find((c) => c.role === 'bottom_panel')!;

  if (requiresDados(config)) {
    const topDado = generateHorizontalBackPanelDado(config, 'top');
    const bottomDado = generateHorizontalBackPanelDado(config, 'bottom');

    components.push({
      ...topPanel,
      features: [...topPanel.features, topDado],
    });
    components.push({
      ...bottomPanel,
      features: [...bottomPanel.features, bottomDado],
    });
  } else {
    components.push(topPanel);
    components.push(bottomPanel);
  }

  return components;
}

/**
 * Recalculate component dimensions based on updated config
 *
 * Useful for real-time updates in the UI.
 */
export function recalculateAssembly(
  assembly: Assembly,
  newConfig: Partial<AssemblyConfig>
): Assembly {
  const mergedConfig: AssemblyConfig = {
    ...assembly.config,
    ...newConfig,
    globalBounds: {
      ...assembly.config.globalBounds,
      ...(newConfig.globalBounds || {}),
    },
    material: {
      ...assembly.config.material,
      ...(newConfig.material || {}),
    },
    machining: {
      ...assembly.config.machining,
      ...(newConfig.machining || {}),
    },
    backPanel: {
      ...assembly.config.backPanel,
      ...(newConfig.backPanel || {}),
    },
    features: {
      shelves: {
        ...assembly.config.features.shelves,
        ...(newConfig.features?.shelves || {}),
      },
      drawers: {
        ...assembly.config.features.drawers,
        ...(newConfig.features?.drawers || {}),
      },
      toeKick: {
        ...assembly.config.features.toeKick,
        ...(newConfig.features?.toeKick || {}),
      },
    },
  };

  return buildAssembly(mergedConfig);
}

/**
 * Get a summary of the assembly for display
 */
export function getAssemblySummary(assembly: Assembly): {
  totalComponents: number;
  totalCuts: number;
  componentsByRole: Record<string, number>;
  interiorDimensions: GlobalBounds;
} {
  const componentsByRole: Record<string, number> = {};

  for (const component of assembly.components) {
    componentsByRole[component.role] = (componentsByRole[component.role] || 0) + 1;
  }

  return {
    totalComponents: assembly.components.length,
    totalCuts: assembly.components.filter((c) => c.layer === 'OUTSIDE_CUT').length,
    componentsByRole,
    interiorDimensions: assembly.interiorBounds,
  };
}

/**
 * Get components by layer for export
 */
export function getComponentsByLayer(
  assembly: Assembly
): Record<string, Component[]> {
  const byLayer: Record<string, Component[]> = {
    OUTSIDE_CUT: [],
    DRILL_5MM: [],
    POCKET_DADO: [],
  };

  for (const component of assembly.components) {
    byLayer[component.layer].push(component);

    // Also categorize features
    for (const feature of component.features) {
      if (feature.type === 'hole') {
        // Holes go to DRILL layer
        // (We'd create a virtual component for the hole)
      } else if (feature.type === 'slot') {
        // Slots go to POCKET_DADO layer
      }
    }
  }

  return byLayer;
}
