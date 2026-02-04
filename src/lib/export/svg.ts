/**
 * SVG Export Module
 *
 * Generates layered SVG files for CNC workflows.
 * Each layer corresponds to a specific CNC operation.
 *
 * Per AdditionalContext.md:
 * - Layer "OUTSIDE_CUT": External boundaries for through-cutting
 * - Layer "DRILL_5MM": Center points for shelf pin drilling operations
 * - Layer "POCKET_DADO": Closed vectors for material subtraction
 */

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
import { LAYER_CONFIGS } from '../geometry/layers';
import { generateRectangleDogbones, generateNotchDogbones } from '../geometry/dogbone';

/**
 * Get the flat (2D) cutting dimensions for a component.
 * 
 * Components are stored with 3D dimensions [x, y, z] for assembly visualization,
 * but for CNC cutting we need the 2D face dimensions (excluding thickness).
 * 
 * The cutting dimensions depend on the panel orientation:
 * - Side panels: laid on their face, cut depth × height
 * - Top/Bottom panels: laid on their face, cut width × depth  
 * - Back panels: already flat, cut width × height
 * - Shelves: laid on their face, cut width × depth
 */
function getFlatDimensions(component: Component): { width: number; height: number } {
  const [dimX, dimY, dimZ] = component.dimensions;
  const thickness = component.materialThickness;

  // Determine which dimension is the thickness and exclude it
  // The two larger dimensions are the cutting face
  const dims = [dimX, dimY, dimZ].sort((a, b) => b - a);
  
  // For most panels, we want the two largest dimensions
  // But we need to be smart about orientation for proper layout
  
  switch (component.role) {
    case 'side_panel_left':
    case 'side_panel_right':
      // Side panels: [thickness, height, depth] → cut as depth × height
      return { width: dimZ, height: dimY };
      
    case 'top_panel':
    case 'bottom_panel':
      // Top/Bottom: [width, thickness, depth] → cut as width × depth
      return { width: dimX, height: dimZ };
      
    case 'back_panel':
      // Back: [width, height, thickness] → cut as width × height
      return { width: dimX, height: dimY };
      
    case 'shelf':
      // Shelf: [width, thickness, depth] → cut as width × depth
      return { width: dimX, height: dimZ };
      
    case 'drawer_front':
      // Drawer front: [width, height, thickness] → cut as width × height
      return { width: dimX, height: dimY };
      
    case 'drawer_side':
      // Drawer side: [thickness, height, depth] → cut as depth × height
      return { width: dimZ, height: dimY };
      
    case 'drawer_back':
      // Drawer back: [width, height, thickness] → cut as width × height
      return { width: dimX, height: dimY };
      
    case 'drawer_bottom':
      // Drawer bottom: [width, thickness, depth] → cut as width × depth
      return { width: dimX, height: dimZ };
      
    default:
      // Default: use two largest dimensions
      return { width: dims[0], height: dims[1] };
  }
}

/**
 * SVG export options
 */
export interface SVGExportOptions {
  /** Include dogbone fillets at internal corners */
  includeDogbones: boolean;
  /** Bit diameter for dogbone calculations */
  bitDiameter: number;
  /** Scale factor (default 1 = 1mm per SVG unit) */
  scale: number;
  /** Stroke width for outlines */
  strokeWidth: number;
  /** Include component labels */
  includeLabels: boolean;
  /** Margin around the content in mm */
  margin: number;
}

const DEFAULT_OPTIONS: SVGExportOptions = {
  includeDogbones: true,
  bitDiameter: 6.35,
  scale: 1,
  strokeWidth: 0.5,
  includeLabels: true,
  margin: 10,
};

/**
 * Generate SVG path for a rectangle
 */
function rectanglePath(
  x: number,
  y: number,
  width: number,
  height: number
): string {
  return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
}

/**
 * Generate SVG path for a rectangle with a corner notch
 */
function rectangleWithNotchPath(
  x: number,
  y: number,
  width: number,
  height: number,
  notch: NotchFeature
): string {
  const nw = notch.width;
  const nh = notch.height;

  switch (notch.corner) {
    case 'bottom-left':
      return `M ${x + nw} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} L ${x} ${y + nh} L ${x + nw} ${y + nh} Z`;
    case 'bottom-right':
      return `M ${x} ${y} L ${x + width - nw} ${y} L ${x + width - nw} ${y + nh} L ${x + width} ${y + nh} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    case 'top-left':
      return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x + nw} ${y + height} L ${x + nw} ${y + height - nh} L ${x} ${y + height - nh} Z`;
    case 'top-right':
      return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height - nh} L ${x + width - nw} ${y + height - nh} L ${x + width - nw} ${y + height} L ${x} ${y + height} Z`;
    default:
      return rectanglePath(x, y, width, height);
  }
}

/**
 * Generate SVG circle element for a hole
 */
function holeCircle(hole: HoleFeature, offsetX: number, offsetY: number): string {
  const cx = offsetX + hole.pos[0];
  const cy = offsetY + hole.pos[1];
  const r = hole.diameter / 2;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" />`;
}

/**
 * Generate SVG path for a slot
 */
function slotPath(slot: SlotFeature, offsetX: number, offsetY: number): string {
  if (slot.path.length < 2) return '';

  const halfWidth = slot.width / 2;
  const points = slot.path.map(([x, y]) => [offsetX + x, offsetY + y]);

  // For a simple two-point slot, create a rounded rectangle
  if (points.length === 2) {
    const [x1, y1] = points[0];
    const [x2, y2] = points[1];

    // Determine if horizontal or vertical
    const isHorizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);

    if (isHorizontal) {
      const minX = Math.min(x1, x2) - halfWidth;
      const maxX = Math.max(x1, x2) + halfWidth;
      const minY = y1 - halfWidth;
      const maxY = y1 + halfWidth;
      return `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`;
    } else {
      const minX = x1 - halfWidth;
      const maxX = x1 + halfWidth;
      const minY = Math.min(y1, y2) - halfWidth;
      const maxY = Math.max(y1, y2) + halfWidth;
      return `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`;
    }
  }

  // For multi-point paths, create a simple polyline for now
  const pathD = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');

  return pathD;
}

/**
 * Generate SVG for dogbone fillets
 */
function dogboneCircles(
  x: number,
  y: number,
  width: number,
  height: number,
  bitDiameter: number,
  isNotch: boolean = false,
  notchCorner?: NotchFeature['corner']
): string {
  const circles: string[] = [];

  if (isNotch && notchCorner) {
    const dogbones = generateNotchDogbones(x, y, width, height, notchCorner, bitDiameter);
    for (const db of dogbones) {
      circles.push(`<circle cx="${db.center[0]}" cy="${db.center[1]}" r="${db.radius}" />`);
    }
  } else {
    const dogbones = generateRectangleDogbones(x, y, width, height, bitDiameter);
    for (const db of dogbones) {
      circles.push(`<circle cx="${db.center[0]}" cy="${db.center[1]}" r="${db.radius}" />`);
    }
  }

  return circles.join('\n');
}

/**
 * Generate SVG content for a single component
 */
function generateComponentSVG(
  component: Component,
  offsetX: number,
  offsetY: number,
  options: SVGExportOptions
): { outsideCut: string; drill: string; pocket: string } {
  const { width, height } = getFlatDimensions(component);
  const result = { outsideCut: '', drill: '', pocket: '' };

  // Find notch feature if any
  const notchFeature = component.features.find(
    (f): f is NotchFeature => f.type === 'notch'
  );

  // Generate outline path
  let outlinePath: string;
  if (notchFeature) {
    outlinePath = rectangleWithNotchPath(
      offsetX,
      offsetY,
      width,
      height,
      notchFeature
    );

    // Add dogbones for notch corners if enabled
    if (options.includeDogbones) {
      // Calculate notch position based on corner and flat dimensions
      let notchX = offsetX;
      let notchY = offsetY;
      
      switch (notchFeature.corner) {
        case 'bottom-left':
          notchX = offsetX;
          notchY = offsetY;
          break;
        case 'bottom-right':
          notchX = offsetX + width - notchFeature.width;
          notchY = offsetY;
          break;
        case 'top-left':
          notchX = offsetX;
          notchY = offsetY + height - notchFeature.height;
          break;
        case 'top-right':
          notchX = offsetX + width - notchFeature.width;
          notchY = offsetY + height - notchFeature.height;
          break;
      }
      
      const dogbones = dogboneCircles(
        notchX,
        notchY,
        notchFeature.width,
        notchFeature.height,
        options.bitDiameter,
        true,
        notchFeature.corner
      );
      result.outsideCut += dogbones + '\n';
    }
  } else {
    outlinePath = rectanglePath(offsetX, offsetY, width, height);
  }

  result.outsideCut += `<path d="${outlinePath}" />`;

  // Generate features
  for (const feature of component.features) {
    if (feature.type === 'hole') {
      result.drill += holeCircle(feature, offsetX, offsetY) + '\n';
    } else if (feature.type === 'slot') {
      const path = slotPath(feature, offsetX, offsetY);
      if (path) {
        result.pocket += `<path d="${path}" />\n`;

        // Add dogbones for slot if enabled
        if (options.includeDogbones && feature.path.length === 2) {
          // Simple slot - add dogbones at ends
          // This is a simplified version - full implementation would trace the slot
        }
      }
    }
    // NotchFeature is handled above with the outline
  }

  return result;
}

/**
 * Layout components for nesting (simple grid layout)
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
  const maxRowWidth = 2400; // Max sheet width

  for (const component of components) {
    const { width, height } = getFlatDimensions(component);

    // Check if we need to start a new row
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
 * Generate complete SVG document
 */
export function generateSVG(
  assembly: Assembly,
  options: Partial<SVGExportOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Filter to only OUTSIDE_CUT components (actual panels)
  const panels = assembly.components.filter((c) => c.layer === 'OUTSIDE_CUT');

  // Layout components
  const { items, totalWidth, totalHeight } = layoutComponents(panels, opts.margin);

  // Collect SVG content by layer
  const layers: Record<CNCLayer, string[]> = {
    OUTSIDE_CUT: [],
    DRILL_5MM: [],
    POCKET_DADO: [],
  };

  const labels: string[] = [];

  for (const { component, x, y } of items) {
    const svg = generateComponentSVG(component, x, y, opts);

    if (svg.outsideCut) layers.OUTSIDE_CUT.push(svg.outsideCut);
    if (svg.drill) layers.DRILL_5MM.push(svg.drill);
    if (svg.pocket) layers.POCKET_DADO.push(svg.pocket);

    // Add label if enabled
    if (opts.includeLabels) {
      const flatDims = getFlatDimensions(component);
      labels.push(
        `<text x="${x + flatDims.width / 2}" y="${y + flatDims.height / 2}" ` +
          `text-anchor="middle" dominant-baseline="middle" ` +
          `font-size="12" fill="#666">${component.label}</text>`
      );
    }
  }

  // Build SVG document
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${totalWidth * opts.scale}mm" 
     height="${totalHeight * opts.scale}mm" 
     viewBox="0 0 ${totalWidth} ${totalHeight}">
  
  <!-- Cabineato Export - Generated ${new Date().toISOString()} -->
  
  <!-- Layer: OUTSIDE_CUT - ${LAYER_CONFIGS.OUTSIDE_CUT.description} -->
  <g id="OUTSIDE_CUT" fill="none" stroke="${LAYER_CONFIGS.OUTSIDE_CUT.color}" stroke-width="${opts.strokeWidth}">
    ${layers.OUTSIDE_CUT.join('\n    ')}
  </g>
  
  <!-- Layer: DRILL_5MM - ${LAYER_CONFIGS.DRILL_5MM.description} -->
  <g id="DRILL_5MM" fill="none" stroke="${LAYER_CONFIGS.DRILL_5MM.color}" stroke-width="${opts.strokeWidth}">
    ${layers.DRILL_5MM.join('\n    ')}
  </g>
  
  <!-- Layer: POCKET_DADO - ${LAYER_CONFIGS.POCKET_DADO.description} -->
  <g id="POCKET_DADO" fill="none" stroke="${LAYER_CONFIGS.POCKET_DADO.color}" stroke-width="${opts.strokeWidth}">
    ${layers.POCKET_DADO.join('\n    ')}
  </g>
  
  <!-- Labels (not for CNC) -->
  <g id="LABELS" class="labels">
    ${labels.join('\n    ')}
  </g>
  
</svg>`;

  return svgContent;
}

/**
 * Generate SVG and trigger download
 */
export function downloadSVG(
  assembly: Assembly,
  filename: string = 'cabinet.svg',
  options: Partial<SVGExportOptions> = {}
): void {
  const svg = generateSVG(assembly, options);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
