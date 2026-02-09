/**
 * Nested SVG Export
 *
 * Generates one SVG per sheet, with parts positioned at their
 * nested coordinates. Preserves CNC layers.
 */

import type { NestingResult } from '../nesting';
import type { Component } from '../types';
import { LAYER_CONFIGS } from '../geometry/layers';
import { generateComponentSVG, type SVGExportOptions } from './svg';

const DEFAULT_NESTED_SVG_OPTIONS: SVGExportOptions = {
  includeDogbones: true,
  bitDiameter: 6.35,
  scale: 1,
  strokeWidth: 0.5,
  includeLabels: true,
  margin: 10,
};

/**
 * Map from component ID to Component, for resolving placements
 * back to their full component data.
 */
type ComponentMap = Map<string, Component>;

export interface NestedSVGFile {
  filename: string;
  content: string;
}

/**
 * Generate one SVG file per sheet.
 */
export function generateNestedSVGs(
  result: NestingResult,
  components: Component[],
  options: Partial<SVGExportOptions> = {}
): NestedSVGFile[] {
  const opts = { ...DEFAULT_NESTED_SVG_OPTIONS, ...options };

  // Build lookup map
  const componentMap: ComponentMap = new Map();
  for (const c of components) {
    componentMap.set(c.id, c);
  }

  const files: NestedSVGFile[] = [];

  for (const sheet of result.sheets) {
    const [bedW, bedH] = sheet.dimensions;

    const layers: Record<string, string[]> = {
      OUTSIDE_CUT: [],
      DRILL_5MM: [],
      POCKET_DADO: [],
    };
    const labels: string[] = [];

    for (const placement of sheet.placements) {
      const component = componentMap.get(placement.part.instanceId);
      if (!component) continue;

      const svg = generateComponentSVG(component, placement.x, placement.y, opts);

      if (svg.outsideCut) layers['OUTSIDE_CUT'].push(svg.outsideCut);
      if (svg.drill) layers['DRILL_5MM'].push(svg.drill);
      if (svg.pocket) layers['POCKET_DADO'].push(svg.pocket);

      if (opts.includeLabels) {
        labels.push(
          `<text x="${placement.x + placement.part.width / 2}" y="${placement.y + placement.part.height / 2}" ` +
            `text-anchor="middle" dominant-baseline="middle" ` +
            `font-size="10" fill="#666">${placement.part.label}</text>`
        );
      }
    }

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${bedW * opts.scale}mm"
     height="${bedH * opts.scale}mm"
     viewBox="0 0 ${bedW} ${bedH}">

  <!-- Cabineato Nested Export - Sheet ${sheet.index + 1} (${sheet.materialThickness}mm) -->

  <g id="OUTSIDE_CUT" fill="none" stroke="${LAYER_CONFIGS.OUTSIDE_CUT.color}" stroke-width="${opts.strokeWidth}">
    ${layers['OUTSIDE_CUT'].join('\n    ')}
  </g>

  <g id="DRILL_5MM" fill="none" stroke="${LAYER_CONFIGS.DRILL_5MM.color}" stroke-width="${opts.strokeWidth}">
    ${layers['DRILL_5MM'].join('\n    ')}
  </g>

  <g id="POCKET_DADO" fill="none" stroke="${LAYER_CONFIGS.POCKET_DADO.color}" stroke-width="${opts.strokeWidth}">
    ${layers['POCKET_DADO'].join('\n    ')}
  </g>

  <g id="LABELS" class="labels">
    ${labels.join('\n    ')}
  </g>

</svg>`;

    const thicknessStr = sheet.materialThickness.toString().replace('.', '_');
    files.push({
      filename: `sheet_${sheet.index + 1}_${thicknessStr}mm.svg`,
      content: svgContent,
    });
  }

  return files;
}
