/**
 * Nesting Orchestrator
 *
 * Groups assembly components by material thickness,
 * packs them into sheets using the FFDH packer.
 * Pure function: (Assembly, NestingConfig) => NestingResult.
 */

import type { Assembly } from '../types';
import type { NestingConfig, NestingPart, NestingResult, MaterialSummary } from './types';
import { getFlatDimensions } from './flatDimensions';
import { packSheet } from './packer';

/**
 * Nest all components from an assembly onto sheets.
 */
export function nestParts(
  assembly: Assembly,
  config: NestingConfig
): NestingResult {
  const warnings: string[] = [];

  // Extract 2D parts from assembly — only OUTSIDE_CUT layer (actual panels)
  const panels = assembly.components.filter((c) => c.layer === 'OUTSIDE_CUT');

  const parts: NestingPart[] = panels.map((component) => {
    const { width, height } = getFlatDimensions(component);
    return {
      width,
      height,
      rotated: false,
      instanceId: component.id,
      label: component.label,
      role: component.role,
      materialThickness: component.materialThickness,
    };
  });

  // Group by material thickness
  const groups = new Map<number, NestingPart[]>();
  for (const part of parts) {
    const key = part.materialThickness;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(part);
  }

  const [bedWidth, bedHeight] = config.bedSize;
  const usableWidth = bedWidth - 2 * config.edgeMargin;
  const usableHeight = bedHeight - 2 * config.edgeMargin;

  const allSheets: NestingResult['sheets'] = [];
  const allUnfitted: NestingPart[] = [];

  for (const [, groupParts] of groups) {
    // Pre-filter oversized parts
    const fittable: NestingPart[] = [];
    for (const part of groupParts) {
      const fitsNormal = part.width <= usableWidth && part.height <= usableHeight;
      const fitsRotated =
        config.allowRotation &&
        part.height <= usableWidth &&
        part.width <= usableHeight;

      if (!fitsNormal && !fitsRotated) {
        allUnfitted.push(part);
        warnings.push(
          `Part "${part.label}" (${part.width.toFixed(0)} x ${part.height.toFixed(0)}mm) exceeds usable sheet area (${usableWidth.toFixed(0)} x ${usableHeight.toFixed(0)}mm)`
        );
      } else {
        fittable.push(part);
      }
    }

    // Pack fittable parts into sheets
    let remaining = fittable;
    while (remaining.length > 0) {
      const { sheet, overflow } = packSheet(remaining, config, allSheets.length);

      // Safety: if no parts were placed, all remaining are unfittable
      if (sheet.placements.length === 0) {
        allUnfitted.push(...overflow);
        break;
      }

      allSheets.push(sheet);
      remaining = overflow;
    }
  }

  // Build material summaries
  const materialSummaries: MaterialSummary[] = [];
  const summaryMap = new Map<number, { count: number; totalUtil: number }>();
  for (const sheet of allSheets) {
    const existing = summaryMap.get(sheet.materialThickness);
    if (existing) {
      existing.count++;
      existing.totalUtil += sheet.utilization;
    } else {
      summaryMap.set(sheet.materialThickness, {
        count: 1,
        totalUtil: sheet.utilization,
      });
    }
  }
  for (const [thickness, data] of summaryMap) {
    materialSummaries.push({
      materialThickness: thickness,
      sheetCount: data.count,
      averageUtilization: data.totalUtil / data.count,
    });
  }

  // Overall utilization
  const totalPartArea = allSheets.reduce(
    (sum, s) =>
      sum +
      s.placements.reduce((pSum, p) => pSum + p.part.width * p.part.height, 0),
    0
  );
  const totalUsableArea = allSheets.length * usableWidth * usableHeight;
  const overallUtilization = totalUsableArea > 0 ? totalPartArea / totalUsableArea : 0;

  return {
    sheets: allSheets,
    unfittedParts: allUnfitted,
    sheetCount: allSheets.length,
    overallUtilization,
    materialSummaries,
    warnings,
  };
}
