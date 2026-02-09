/**
 * Packer Tests — ABA Triangulation
 *
 * Each test defines a high anchor (A), target (B), and low anchor (A')
 * to create a behavior corridor.
 */

import { describe, it, expect } from 'vitest';
import { packSheet } from './packer';
import { nestParts } from './nesting';
import type { NestingConfig, NestingPart } from './types';
import type { Assembly, Component } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<NestingConfig> = {}): NestingConfig {
  return {
    bedSize: [1219, 1219],
    edgeMargin: 15,
    partSpacing: 7.35, // 6.35mm bit + 1mm comfort
    allowRotation: true,
    bitDiameter: 6.35,
    ...overrides,
  };
}

function makePart(
  width: number,
  height: number,
  id: string = 'part',
  thickness: number = 18
): NestingPart {
  return {
    width,
    height,
    rotated: false,
    instanceId: id,
    label: id,
    role: 'side_panel_left',
    materialThickness: thickness,
  };
}

function makeComponent(
  id: string,
  dims: [number, number, number],
  role: Component['role'] = 'side_panel_left',
  thickness: number = 18
): Component {
  return {
    id,
    label: id,
    role,
    dimensions: dims,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    features: [],
    layer: 'OUTSIDE_CUT',
    materialThickness: thickness,
  };
}

function makeAssembly(components: Component[]): Assembly {
  return {
    config: {} as Assembly['config'],
    components,
    interiorBounds: { w: 0, h: 0, d: 0 },
    metadata: { generatedAt: '', version: '' },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('packSheet — FFDH shelf packing', () => {
  // =========================================================================
  // Single part fit: A/B/A'
  // =========================================================================
  describe('single part fit', () => {
    it('A (high): part equal to usable area fits with ~100% utilization', () => {
      const config = makeConfig({ partSpacing: 0 });
      const usable = 1219 - 2 * 15; // 1189
      const part = makePart(usable, usable, 'full-sheet');

      const { sheet, overflow } = packSheet([part], config, 0);

      expect(sheet.placements).toHaveLength(1);
      expect(overflow).toHaveLength(0);
      expect(sheet.utilization).toBeCloseTo(1.0, 2);
    });

    it('B (target): typical part fits with room to spare', () => {
      const config = makeConfig();
      const part = makePart(400, 300, 'typical');

      const { sheet, overflow } = packSheet([part], config, 0);

      expect(sheet.placements).toHaveLength(1);
      expect(overflow).toHaveLength(0);
      expect(sheet.utilization).toBeGreaterThan(0);
      expect(sheet.utilization).toBeLessThan(1);
    });

    it("A' (low): part exceeding usable area goes to overflow", () => {
      const config = makeConfig();
      const usable = 1219 - 2 * 15; // 1189
      const part = makePart(usable + 1, usable + 1, 'oversized');

      const { sheet, overflow } = packSheet([part], config, 0);

      expect(sheet.placements).toHaveLength(0);
      expect(overflow).toHaveLength(1);
    });
  });

  // =========================================================================
  // Part spacing: A/B/A'
  // =========================================================================
  describe('part spacing', () => {
    it('A (high): spacing=0, parts placed flush', () => {
      const config = makeConfig({ partSpacing: 0 });
      const parts = [
        makePart(500, 500, 'a'),
        makePart(500, 500, 'b'),
      ];

      const { sheet } = packSheet(parts, config, 0);

      expect(sheet.placements).toHaveLength(2);
      // Second part should start exactly where first ends
      const p1 = sheet.placements.find((p) => p.part.instanceId === 'a')!;
      const p2 = sheet.placements.find((p) => p.part.instanceId === 'b')!;
      expect(p2.x).toBe(p1.x + 500);
    });

    it('B (target): default spacing enforces gap between parts', () => {
      const config = makeConfig({ partSpacing: 7.35 });
      const parts = [
        makePart(500, 500, 'a'),
        makePart(500, 500, 'b'),
      ];

      const { sheet } = packSheet(parts, config, 0);

      expect(sheet.placements).toHaveLength(2);
      const p1 = sheet.placements.find((p) => p.part.instanceId === 'a')!;
      const p2 = sheet.placements.find((p) => p.part.instanceId === 'b')!;
      expect(p2.x - (p1.x + 500)).toBeCloseTo(7.35, 1);
    });

    it("A' (low): large spacing means fewer parts per shelf row", () => {
      const config = makeConfig({ partSpacing: 200 });
      // Each part is 400mm wide. With 200mm spacing and 15mm margins:
      // usable = 1189, first at x=15, next at 15+400+200=615,
      // third at 615+400+200=1215 > 15+1189=1204 → overflows to next shelf
      const parts = [
        makePart(400, 400, 'a'),
        makePart(400, 400, 'b'),
        makePart(400, 400, 'c'),
      ];

      const { sheet } = packSheet(parts, config, 0);

      expect(sheet.placements).toHaveLength(3);
      // Should have 2 shelves: 2 parts on first, 1 on second
      expect(sheet.shelves).toHaveLength(2);
      // Parts on first shelf should be spaced 200mm apart
      const firstShelfParts = sheet.placements.filter((p) => p.y === sheet.shelves[0].y);
      expect(firstShelfParts).toHaveLength(2);
      const sortedByX = [...firstShelfParts].sort((a, b) => a.x - b.x);
      expect(sortedByX[1].x - (sortedByX[0].x + 400)).toBeCloseTo(200, 0);
    });
  });

  // =========================================================================
  // Edge margin: A/B/A'
  // =========================================================================
  describe('edge margin', () => {
    it('A (high): margin=0, parts can touch sheet edge', () => {
      const config = makeConfig({ edgeMargin: 0, partSpacing: 0 });
      const part = makePart(1219, 1219, 'full');

      const { sheet } = packSheet([part], config, 0);

      expect(sheet.placements).toHaveLength(1);
      expect(sheet.placements[0].x).toBe(0);
      expect(sheet.placements[0].y).toBe(0);
    });

    it('B (target): margin=15, no part within 15mm of edge', () => {
      const config = makeConfig({ edgeMargin: 15 });
      const part = makePart(400, 300, 'test');

      const { sheet } = packSheet([part], config, 0);

      expect(sheet.placements).toHaveLength(1);
      expect(sheet.placements[0].x).toBeGreaterThanOrEqual(15);
      expect(sheet.placements[0].y).toBeGreaterThanOrEqual(15);
    });

    it("A' (low): margin=200, tiny usable area", () => {
      const config = makeConfig({ edgeMargin: 500 });
      // usable = 1219 - 1000 = 219mm per axis
      const part = makePart(300, 300, 'wont-fit');

      const { sheet, overflow } = packSheet([part], config, 0);

      expect(sheet.placements).toHaveLength(0);
      expect(overflow).toHaveLength(1);
    });
  });

  // =========================================================================
  // Multi-sheet overflow
  // =========================================================================
  describe('multi-sheet overflow via nestParts', () => {
    it('A (high): all parts fit on 1 sheet', () => {
      const config = makeConfig();
      // Small cabinet: side panels 400x300, top/bottom 300x300
      // All fit easily on one 1219x1219 sheet
      const components = [
        makeComponent('left', [18, 400, 300]),
        makeComponent('right', [18, 400, 300]),
        makeComponent('top', [300, 18, 300], 'top_panel'),
        makeComponent('bottom', [300, 18, 300], 'bottom_panel'),
      ];
      const assembly = makeAssembly(components);

      const result = nestParts(assembly, config);

      expect(result.sheetCount).toBe(1);
      expect(result.unfittedParts).toHaveLength(0);
    });

    it('B (target): standard cabinet uses expected sheet count', () => {
      const config = makeConfig();
      // Many medium-sized parts that won't all fit on one sheet
      const components: Component[] = [];
      for (let i = 0; i < 12; i++) {
        components.push(makeComponent(`panel_${i}`, [18, 500, 400], 'side_panel_left'));
      }
      const assembly = makeAssembly(components);

      const result = nestParts(assembly, config);

      // All parts should be placed
      const totalPlaced = result.sheets.reduce((s, sh) => s + sh.placements.length, 0);
      expect(totalPlaced).toBe(12);
      expect(result.unfittedParts).toHaveLength(0);
      expect(result.sheetCount).toBeGreaterThanOrEqual(2);
    });

    it("A' (low): many parts produce multiple sheets, all accounted for", () => {
      const config = makeConfig();
      const components: Component[] = [];
      for (let i = 0; i < 30; i++) {
        components.push(makeComponent(`panel_${i}`, [18, 600, 500], 'side_panel_left'));
      }
      const assembly = makeAssembly(components);

      const result = nestParts(assembly, config);

      const totalPlaced = result.sheets.reduce((s, sh) => s + sh.placements.length, 0);
      expect(totalPlaced + result.unfittedParts.length).toBe(30);
      expect(result.sheetCount).toBeGreaterThanOrEqual(5);
    });
  });

  // =========================================================================
  // Material grouping
  // =========================================================================
  describe('material grouping', () => {
    it('B (target): different thickness parts are on separate sheets', () => {
      const config = makeConfig();
      const components = [
        makeComponent('thick_1', [18, 500, 400], 'side_panel_left', 18),
        makeComponent('thick_2', [18, 500, 400], 'side_panel_right', 18),
        makeComponent('thin_1', [6, 500, 400], 'back_panel', 6),
      ];
      const assembly = makeAssembly(components);

      const result = nestParts(assembly, config);

      // Check no sheet mixes thicknesses
      for (const sheet of result.sheets) {
        const thicknesses = new Set(sheet.placements.map((p) => p.part.materialThickness));
        expect(thicknesses.size).toBeLessThanOrEqual(1);
      }

      // Should have at least 2 sheets (one per thickness)
      expect(result.sheets.length).toBeGreaterThanOrEqual(2);
      expect(result.materialSummaries.length).toBe(2);
    });
  });

  // =========================================================================
  // Rotation
  // =========================================================================
  describe('rotation', () => {
    it('part fits only when rotated, rotation flag is set', () => {
      // Usable width = 1189, usable height = 1189
      // Part: 1100 wide x 200 tall — fits normally
      // Part: 200 wide x 1100 tall — fits normally
      // Part: 1100 wide x 1100 tall — fits (under 1189)
      // Let's use a sheet that's narrow: 300 x 1219
      const config = makeConfig({ bedSize: [300, 1219] });
      // Usable: 270 x 1189
      // Part: 250 x 800 — fits normally
      // Part: 800 x 250 — does NOT fit normally (800 > 270), but fits rotated (250 x 800)
      const part = makePart(800, 250, 'rotatable');

      const { sheet } = packSheet([part], config, 0);

      expect(sheet.placements).toHaveLength(1);
      expect(sheet.placements[0].part.rotated).toBe(true);
      expect(sheet.placements[0].part.width).toBe(250);
      expect(sheet.placements[0].part.height).toBe(800);
    });

    it('rotation disabled, part goes to overflow when it only fits rotated', () => {
      const config = makeConfig({ bedSize: [300, 1219], allowRotation: false });
      const part = makePart(800, 250, 'no-rotate');

      const { sheet, overflow } = packSheet([part], config, 0);

      expect(sheet.placements).toHaveLength(0);
      expect(overflow).toHaveLength(1);
    });
  });

  // =========================================================================
  // Utilization calculation
  // =========================================================================
  describe('utilization calculation', () => {
    it('known layout produces expected utilization', () => {
      const config = makeConfig({ partSpacing: 0, edgeMargin: 0 });
      // Sheet: 1219 x 1219 = 1,485,961 mm²
      // Two parts: 600 x 600 = 360,000 each, total 720,000
      // Expected utilization = 720000 / 1485961 ≈ 0.4843
      const parts = [
        makePart(600, 600, 'a'),
        makePart(600, 600, 'b'),
      ];

      const { sheet } = packSheet(parts, config, 0);

      expect(sheet.placements).toHaveLength(2);
      const expectedUtil = (2 * 600 * 600) / (1219 * 1219);
      expect(sheet.utilization).toBeCloseTo(expectedUtil, 3);
    });
  });
});
