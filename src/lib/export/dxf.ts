/**
 * DXF Export Module
 *
 * Generates layered DXF files using Maker.js for CNC workflows.
 * DXF is the native format for most CAM software including Vectric.
 *
 * Per AdditionalContext.md:
 * - Must provide a layered file where each layer corresponds to a specific CNC bit or operation
 */

import makerjs from 'makerjs';
import type {
  Assembly,
  Component,
  Feature,
  HoleFeature,
  SlotFeature,
  NotchFeature,
  CNCLayer,
  Vector2,
  ComponentRole,
} from '../types';
import { generateRectangleDogbones, generateNotchDogbones, DogboneFillet } from '../geometry/dogbone';
import { getFlatDimensions } from '../nesting/flatDimensions';

/**
 * DXF export options
 */
export interface DXFExportOptions {
  /** Include dogbone fillets at internal corners */
  includeDogbones: boolean;
  /** Bit diameter for dogbone calculations */
  bitDiameter: number;
  /** Units for DXF (default: millimeters) */
  units: 'mm' | 'inch';
  /** Margin between nested parts */
  margin: number;
}

const DEFAULT_OPTIONS: DXFExportOptions = {
  includeDogbones: true,
  bitDiameter: 6.35,
  units: 'mm',
  margin: 10,
};

/**
 * Create a Maker.js rectangle model
 */
function createRectangle(
  width: number,
  height: number
): makerjs.IModel {
  return new makerjs.models.Rectangle(width, height);
}

/**
 * Create a Maker.js rectangle with a corner notch
 */
function createRectangleWithNotch(
  width: number,
  height: number,
  notch: NotchFeature
): makerjs.IModel {
  const nw = notch.width;
  const nh = notch.height;

  // Create the outer path based on notch corner
  let points: makerjs.IPoint[];

  switch (notch.corner) {
    case 'bottom-left':
      points = [
        [nw, 0],
        [width, 0],
        [width, height],
        [0, height],
        [0, nh],
        [nw, nh],
      ];
      break;
    case 'bottom-right':
      points = [
        [0, 0],
        [width - nw, 0],
        [width - nw, nh],
        [width, nh],
        [width, height],
        [0, height],
      ];
      break;
    case 'top-left':
      points = [
        [0, 0],
        [width, 0],
        [width, height],
        [nw, height],
        [nw, height - nh],
        [0, height - nh],
      ];
      break;
    case 'top-right':
      points = [
        [0, 0],
        [width, 0],
        [width, height - nh],
        [width - nw, height - nh],
        [width - nw, height],
        [0, height],
      ];
      break;
    default:
      return createRectangle(width, height);
  }

  return new makerjs.models.ConnectTheDots(true, points);
}

/**
 * Create a Maker.js circle for a hole
 */
function createHole(hole: HoleFeature): makerjs.IModel {
  const circle = new makerjs.models.Ellipse(hole.diameter / 2, hole.diameter / 2);
  return makerjs.model.move(circle, hole.pos);
}

/**
 * Create a Maker.js model for a slot
 */
function createSlot(slot: SlotFeature): makerjs.IModel | null {
  if (slot.path.length < 2) return null;

  const halfWidth = slot.width / 2;
  const [p1, p2] = slot.path;

  // For a simple two-point slot, create a rounded rectangle
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return null;

  // Create a slot using RoundRectangle
  const slotModel = new makerjs.models.RoundRectangle(length + slot.width, slot.width, halfWidth);

  // Rotate and position the slot
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  makerjs.model.rotate(slotModel, angle);

  // Position at the center of the slot path
  const centerX = (p1[0] + p2[0]) / 2;
  const centerY = (p1[1] + p2[1]) / 2;
  // Offset to account for the model origin being at corner
  makerjs.model.move(slotModel, [centerX - (length + slot.width) / 2, centerY - halfWidth]);

  return slotModel;
}

/**
 * Create dogbone circles as a Maker.js model
 */
function createDogbones(dogbones: DogboneFillet[]): makerjs.IModel {
  const model: makerjs.IModel = { models: {} };

  dogbones.forEach((db, i) => {
    const circle = new makerjs.models.Ellipse(db.radius, db.radius);
    makerjs.model.move(circle, db.center);
    model.models![`dogbone_${i}`] = circle;
  });

  return model;
}

/**
 * Generate Maker.js model for a single component
 */
export function generateComponentModel(
  component: Component,
  options: DXFExportOptions
): {
  outline: makerjs.IModel;
  holes: makerjs.IModel;
  pockets: makerjs.IModel;
} {
  const { width, height } = getFlatDimensions(component);

  // Find notch feature if any
  const notchFeature = component.features.find(
    (f): f is NotchFeature => f.type === 'notch'
  );

  // Create outline
  let outline: makerjs.IModel;
  if (notchFeature) {
    outline = createRectangleWithNotch(width, height, notchFeature);

    // Add dogbones for notch if enabled
    if (options.includeDogbones) {
      // Calculate notch position based on corner and flat dimensions
      let notchX = 0;
      let notchY = 0;
      
      switch (notchFeature.corner) {
        case 'bottom-left':
          notchX = 0;
          notchY = 0;
          break;
        case 'bottom-right':
          notchX = width - notchFeature.width;
          notchY = 0;
          break;
        case 'top-left':
          notchX = 0;
          notchY = height - notchFeature.height;
          break;
        case 'top-right':
          notchX = width - notchFeature.width;
          notchY = height - notchFeature.height;
          break;
      }
      
      const dogbones = generateNotchDogbones(
        notchX,
        notchY,
        notchFeature.width,
        notchFeature.height,
        notchFeature.corner,
        options.bitDiameter
      );
      const dogboneModel = createDogbones(dogbones);
      outline = makerjs.model.combineUnion(outline, dogboneModel);
    }
  } else {
    outline = createRectangle(width, height);
  }

  // Create holes model
  const holes: makerjs.IModel = { models: {} };
  let holeIndex = 0;

  // Create pockets model
  const pockets: makerjs.IModel = { models: {} };
  let pocketIndex = 0;

  // Process features
  for (const feature of component.features) {
    if (feature.type === 'hole') {
      const holeModel = createHole(feature);
      holes.models![`hole_${holeIndex++}`] = holeModel;
    } else if (feature.type === 'slot') {
      const slotModel = createSlot(feature);
      if (slotModel) {
        pockets.models![`slot_${pocketIndex++}`] = slotModel;

        // Add dogbones for slot if enabled
        if (options.includeDogbones) {
          const [p1, p2] = feature.path;
          // Generate dogbones at slot ends
          const halfWidth = feature.width / 2;
          const dogbones = generateRectangleDogbones(
            Math.min(p1[0], p2[0]) - halfWidth,
            Math.min(p1[1], p2[1]) - halfWidth,
            Math.abs(p2[0] - p1[0]) + feature.width,
            Math.abs(p2[1] - p1[1]) + feature.width,
            options.bitDiameter
          );
          const dogboneModel = createDogbones(dogbones);
          pockets.models![`slot_dogbones_${pocketIndex}`] = dogboneModel;
        }
      }
    }
  }

  return { outline, holes, pockets };
}

/**
 * Layout components in a grid pattern
 */
interface LayoutItem {
  component: Component;
  x: number;
  y: number;
}

function layoutComponents(
  components: Component[],
  margin: number
): { items: LayoutItem[]; totalWidth: number; totalHeight: number } {
  const items: LayoutItem[] = [];
  let currentX = margin;
  let currentY = margin;
  let rowHeight = 0;
  let maxWidth = 0;
  const maxRowWidth = 2400;

  for (const component of components) {
    const { width, height } = getFlatDimensions(component);

    if (currentX + width + margin > maxRowWidth && currentX > margin) {
      currentX = margin;
      currentY += rowHeight + margin;
      rowHeight = 0;
    }

    items.push({
      component,
      x: currentX,
      y: currentY,
    });

    currentX += width + margin;
    rowHeight = Math.max(rowHeight, height);
    maxWidth = Math.max(maxWidth, currentX);
  }

  return {
    items,
    totalWidth: maxWidth + margin,
    totalHeight: currentY + rowHeight + margin,
  };
}

/**
 * Generate complete DXF model
 */
export function generateDXFModel(
  assembly: Assembly,
  options: Partial<DXFExportOptions> = {}
): makerjs.IModel {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Filter to only OUTSIDE_CUT components (actual panels)
  const panels = assembly.components.filter((c) => c.layer === 'OUTSIDE_CUT');

  // Layout components
  const { items } = layoutComponents(panels, opts.margin);

  // Create the root model with layers
  const model: makerjs.IModel = {
    models: {},
    units: opts.units === 'mm' ? makerjs.unitType.Millimeter : makerjs.unitType.Inch,
  };

  // Layer models
  const outsideCutLayer: makerjs.IModel = { models: {} };
  const drillLayer: makerjs.IModel = { models: {} };
  const pocketLayer: makerjs.IModel = { models: {} };

  // Generate models for each component
  for (const { component, x, y } of items) {
    const { outline, holes, pockets } = generateComponentModel(component, opts);

    // Move models to their layout position
    makerjs.model.move(outline, [x, y]);
    makerjs.model.move(holes, [x, y]);
    makerjs.model.move(pockets, [x, y]);

    // Add to layers
    outsideCutLayer.models![component.id] = outline;

    if (Object.keys(holes.models || {}).length > 0) {
      drillLayer.models![`${component.id}_holes`] = holes;
    }

    if (Object.keys(pockets.models || {}).length > 0) {
      pocketLayer.models![`${component.id}_pockets`] = pockets;
    }
  }

  // Set layer names (DXF layer property)
  outsideCutLayer.layer = 'OUTSIDE_CUT';
  drillLayer.layer = 'DRILL_5MM';
  pocketLayer.layer = 'POCKET_DADO';

  // Add layers to root model
  model.models!['OUTSIDE_CUT'] = outsideCutLayer;
  model.models!['DRILL_5MM'] = drillLayer;
  model.models!['POCKET_DADO'] = pocketLayer;

  return model;
}

/**
 * Generate DXF string
 */
export function generateDXF(
  assembly: Assembly,
  options: Partial<DXFExportOptions> = {}
): string {
  const model = generateDXFModel(assembly, options);
  return makerjs.exporter.toDXF(model);
}

/**
 * Generate DXF and trigger download
 */
export function downloadDXF(
  assembly: Assembly,
  filename: string = 'cabinet.dxf',
  options: Partial<DXFExportOptions> = {}
): void {
  const dxf = generateDXF(assembly, options);
  const blob = new Blob([dxf], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
