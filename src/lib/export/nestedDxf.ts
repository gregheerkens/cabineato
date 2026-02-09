/**
 * Nested DXF Export
 *
 * Generates one DXF per sheet, with parts positioned at their
 * nested coordinates. Preserves CNC layers.
 */

import makerjs from 'makerjs';
import type { NestingResult } from '../nesting';
import type { Component } from '../types';
import { generateComponentModel, type DXFExportOptions } from './dxf';

const DEFAULT_NESTED_DXF_OPTIONS: DXFExportOptions = {
  includeDogbones: true,
  bitDiameter: 6.35,
  units: 'mm',
  margin: 10,
};

type ComponentMap = Map<string, Component>;

export interface NestedDXFFile {
  filename: string;
  content: string;
}

/**
 * Generate one DXF file per sheet.
 */
export function generateNestedDXFs(
  result: NestingResult,
  components: Component[],
  options: Partial<DXFExportOptions> = {}
): NestedDXFFile[] {
  const opts = { ...DEFAULT_NESTED_DXF_OPTIONS, ...options };

  const componentMap: ComponentMap = new Map();
  for (const c of components) {
    componentMap.set(c.id, c);
  }

  const files: NestedDXFFile[] = [];

  for (const sheet of result.sheets) {
    const model: makerjs.IModel = {
      models: {},
      units: opts.units === 'mm' ? makerjs.unitType.Millimeter : makerjs.unitType.Inch,
    };

    const outsideCutLayer: makerjs.IModel = { models: {} };
    const drillLayer: makerjs.IModel = { models: {} };
    const pocketLayer: makerjs.IModel = { models: {} };

    for (const placement of sheet.placements) {
      const component = componentMap.get(placement.part.instanceId);
      if (!component) continue;

      const { outline, holes, pockets } = generateComponentModel(component, opts);

      makerjs.model.move(outline, [placement.x, placement.y]);
      makerjs.model.move(holes, [placement.x, placement.y]);
      makerjs.model.move(pockets, [placement.x, placement.y]);

      outsideCutLayer.models![component.id] = outline;

      if (Object.keys(holes.models || {}).length > 0) {
        drillLayer.models![`${component.id}_holes`] = holes;
      }

      if (Object.keys(pockets.models || {}).length > 0) {
        pocketLayer.models![`${component.id}_pockets`] = pockets;
      }
    }

    outsideCutLayer.layer = 'OUTSIDE_CUT';
    drillLayer.layer = 'DRILL_5MM';
    pocketLayer.layer = 'POCKET_DADO';

    model.models!['OUTSIDE_CUT'] = outsideCutLayer;
    model.models!['DRILL_5MM'] = drillLayer;
    model.models!['POCKET_DADO'] = pocketLayer;

    const dxfContent = makerjs.exporter.toDXF(model);

    const thicknessStr = sheet.materialThickness.toString().replace('.', '_');
    files.push({
      filename: `sheet_${sheet.index + 1}_${thicknessStr}mm.dxf`,
      content: dxfContent,
    });
  }

  return files;
}
