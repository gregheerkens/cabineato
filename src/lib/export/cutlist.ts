/**
 * Cut List Generator
 *
 * Generates a markdown-formatted cut list with all components and their dimensions.
 * This provides a human-readable reference for manual cutting or verification.
 *
 * Per AdditionalContext.md:
 * - Cut List: A markdown table listing every component, its final dimensions, and its label
 */

import type { Assembly, Component, ComponentRole } from '../types';
import { formatAsInches, mmToInches } from '../types/constants';

/**
 * Cut list export options
 */
export interface CutListOptions {
  /** Include imperial measurements alongside metric */
  showImperial: boolean;
  /** Group components by role/type */
  groupByRole: boolean;
  /** Include feature notes (holes, slots, etc.) */
  includeFeatures: boolean;
  /** Sort order for components */
  sortBy: 'label' | 'size' | 'role';
}

const DEFAULT_OPTIONS: CutListOptions = {
  showImperial: true,
  groupByRole: true,
  includeFeatures: true,
  sortBy: 'role',
};

/**
 * Component category for grouping
 */
interface ComponentGroup {
  name: string;
  roles: ComponentRole[];
}

const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    name: 'Carcass Panels',
    roles: ['side_panel_left', 'side_panel_right', 'top_panel', 'bottom_panel'],
  },
  {
    name: 'Back Panel',
    roles: ['back_panel'],
  },
  {
    name: 'Shelves',
    roles: ['shelf', 'runner_strip'],
  },
  {
    name: 'Drawer Components',
    roles: ['drawer_front', 'drawer_side', 'drawer_back', 'drawer_bottom'],
  },
  {
    name: 'Toe Kick',
    roles: ['toe_kick_panel'],
  },
];

/**
 * Format dimensions for display
 */
function formatDimensions(
  dimensions: [number, number, number],
  showImperial: boolean
): string {
  const [w, h, d] = dimensions;
  let result = `${w} × ${h} × ${d} mm`;

  if (showImperial) {
    const wIn = formatAsInches(w);
    const hIn = formatAsInches(h);
    const dIn = formatAsInches(d);
    result += ` (${wIn} × ${hIn} × ${dIn})`;
  }

  return result;
}

/**
 * Format dimensions as Width × Height only (for 2D cut list)
 */
function format2DDimensions(
  dimensions: [number, number, number],
  showImperial: boolean
): { width: string; height: string } {
  const [w, h] = dimensions;

  let width = `${w}`;
  let height = `${h}`;

  if (showImperial) {
    width += ` (${formatAsInches(w)})`;
    height += ` (${formatAsInches(h)})`;
  }

  return { width, height };
}

/**
 * Get feature summary for a component
 */
function getFeatureSummary(component: Component): string {
  const features: string[] = [];

  const holeCount = component.features.filter((f) => f.type === 'hole').length;
  const slotCount = component.features.filter((f) => f.type === 'slot').length;
  const notchCount = component.features.filter((f) => f.type === 'notch').length;

  if (holeCount > 0) features.push(`${holeCount} holes`);
  if (slotCount > 0) features.push(`${slotCount} slots`);
  if (notchCount > 0) features.push(`${notchCount} notches`);

  return features.length > 0 ? features.join(', ') : '-';
}

/**
 * Calculate total material required
 */
function calculateMaterialSummary(
  components: Component[]
): { byThickness: Map<number, number>; totalArea: number } {
  const byThickness = new Map<number, number>();
  let totalArea = 0;

  for (const comp of components) {
    const [w, h] = comp.dimensions;
    const area = (w * h) / 1000000; // Convert to m²
    totalArea += area;

    const thickness = comp.materialThickness;
    const existing = byThickness.get(thickness) || 0;
    byThickness.set(thickness, existing + area);
  }

  return { byThickness, totalArea };
}

/**
 * Sort components based on options
 */
function sortComponents(
  components: Component[],
  sortBy: CutListOptions['sortBy']
): Component[] {
  const sorted = [...components];

  switch (sortBy) {
    case 'label':
      sorted.sort((a, b) => a.label.localeCompare(b.label));
      break;
    case 'size':
      sorted.sort((a, b) => {
        const areaA = a.dimensions[0] * a.dimensions[1];
        const areaB = b.dimensions[0] * b.dimensions[1];
        return areaB - areaA; // Largest first
      });
      break;
    case 'role':
      // Sort by role order in COMPONENT_GROUPS
      const roleOrder = COMPONENT_GROUPS.flatMap((g) => g.roles);
      sorted.sort((a, b) => {
        const indexA = roleOrder.indexOf(a.role);
        const indexB = roleOrder.indexOf(b.role);
        return indexA - indexB;
      });
      break;
  }

  return sorted;
}

/**
 * Generate markdown cut list
 */
export function generateCutList(
  assembly: Assembly,
  options: Partial<CutListOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { config, components, interiorBounds } = assembly;

  const lines: string[] = [];

  // Header
  lines.push('# Cabinet Cut List');
  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  // Cabinet summary
  lines.push('## Cabinet Dimensions');
  lines.push('');
  lines.push(`| Property | Value |`);
  lines.push(`|----------|-------|`);
  lines.push(
    `| Overall Size | ${formatDimensions(
      [config.globalBounds.w, config.globalBounds.h, config.globalBounds.d],
      opts.showImperial
    )} |`
  );
  lines.push(
    `| Interior Size | ${formatDimensions(
      [interiorBounds.w, interiorBounds.h, interiorBounds.d],
      opts.showImperial
    )} |`
  );
  lines.push(`| Material Thickness | ${config.material.thickness}mm |`);
  lines.push(`| Back Panel | ${config.backPanel.type} (${config.backPanel.thickness}mm) |`);
  lines.push('');

  // Material summary
  const { byThickness, totalArea } = calculateMaterialSummary(components);
  lines.push('## Material Required');
  lines.push('');
  lines.push(`| Thickness | Area (m²) | Area (sq ft) |`);
  lines.push(`|-----------|-----------|--------------|`);

  for (const [thickness, area] of byThickness.entries()) {
    const sqFt = area * 10.764; // Convert m² to sq ft
    lines.push(`| ${thickness}mm | ${area.toFixed(3)} | ${sqFt.toFixed(2)} |`);
  }

  lines.push(`| **Total** | **${totalArea.toFixed(3)}** | **${(totalArea * 10.764).toFixed(2)}** |`);
  lines.push('');

  // Component list
  lines.push('## Components');
  lines.push('');

  if (opts.groupByRole) {
    // Group by component type
    for (const group of COMPONENT_GROUPS) {
      const groupComponents = components.filter((c) => group.roles.includes(c.role));

      if (groupComponents.length === 0) continue;

      lines.push(`### ${group.name}`);
      lines.push('');

      // Table header
      if (opts.includeFeatures) {
        lines.push(`| Qty | Label | Width (mm) | Height (mm) | Thickness | Features |`);
        lines.push(`|-----|-------|------------|-------------|-----------|----------|`);
      } else {
        lines.push(`| Qty | Label | Width (mm) | Height (mm) | Thickness |`);
        lines.push(`|-----|-------|------------|-------------|-----------|`);
      }

      // Count duplicates
      const componentCounts = new Map<string, { component: Component; count: number }>();
      for (const comp of groupComponents) {
        const key = `${comp.label}-${comp.dimensions.join('-')}`;
        const existing = componentCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          componentCounts.set(key, { component: comp, count: 1 });
        }
      }

      // Output rows
      for (const { component, count } of componentCounts.values()) {
        const { width, height } = format2DDimensions(component.dimensions, opts.showImperial);

        if (opts.includeFeatures) {
          lines.push(
            `| ${count} | ${component.label} | ${width} | ${height} | ${component.materialThickness}mm | ${getFeatureSummary(component)} |`
          );
        } else {
          lines.push(
            `| ${count} | ${component.label} | ${width} | ${height} | ${component.materialThickness}mm |`
          );
        }
      }

      lines.push('');
    }
  } else {
    // Flat list
    const sorted = sortComponents(components, opts.sortBy);

    if (opts.includeFeatures) {
      lines.push(`| # | Label | Width (mm) | Height (mm) | Thickness | Features |`);
      lines.push(`|---|-------|------------|-------------|-----------|----------|`);
    } else {
      lines.push(`| # | Label | Width (mm) | Height (mm) | Thickness |`);
      lines.push(`|---|-------|------------|-------------|-----------|`);
    }

    sorted.forEach((component, index) => {
      const { width, height } = format2DDimensions(component.dimensions, opts.showImperial);

      if (opts.includeFeatures) {
        lines.push(
          `| ${index + 1} | ${component.label} | ${width} | ${height} | ${component.materialThickness}mm | ${getFeatureSummary(component)} |`
        );
      } else {
        lines.push(
          `| ${index + 1} | ${component.label} | ${width} | ${height} | ${component.materialThickness}mm |`
        );
      }
    });

    lines.push('');
  }

  // Footer with totals
  lines.push('---');
  lines.push('');
  lines.push(`**Total Components:** ${components.length}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate cut list and trigger download
 */
export function downloadCutList(
  assembly: Assembly,
  filename: string = 'cutlist.md',
  options: Partial<CutListOptions> = {}
): void {
  const markdown = generateCutList(assembly, options);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate a simplified cut list as plain text
 */
export function generateSimpleCutList(assembly: Assembly): string {
  const lines: string[] = [];

  lines.push('CUT LIST');
  lines.push('=========');
  lines.push('');

  for (const component of assembly.components) {
    const [w, h, d] = component.dimensions;
    lines.push(`${component.label}: ${w} x ${h} x ${d} mm`);
  }

  return lines.join('\n');
}
