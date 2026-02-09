/**
 * Nesting Type Definitions
 *
 * Types for the sheet nesting (2D bin packing) subsystem.
 */

import type { ComponentRole } from '../types';

/** Configuration for sheet nesting */
export interface NestingConfig {
  /** Bed/sheet dimensions [width, height] in mm */
  bedSize: [number, number];
  /** Safe zone from sheet edges in mm */
  edgeMargin: number;
  /** Spacing between parts in mm (kerf + comfort) */
  partSpacing: number;
  /** Allow 90-degree rotation of parts */
  allowRotation: boolean;
  /** Router bit diameter in mm (used to derive minimum spacing) */
  bitDiameter: number;
}

/** 2D representation of a component for nesting */
export interface NestingPart {
  /** Width of the cutting face in mm */
  width: number;
  /** Height of the cutting face in mm */
  height: number;
  /** Whether this part was rotated 90 degrees from original */
  rotated: boolean;
  /** Link back to the source component ID */
  instanceId: string;
  /** Human-readable label */
  label: string;
  /** Component role for color coding */
  role: ComponentRole;
  /** Material thickness in mm */
  materialThickness: number;
}

/** A part that has been placed on a sheet */
export interface PlacedPart {
  /** The nesting part data */
  part: NestingPart;
  /** X position on the sheet (from left edge) in mm */
  x: number;
  /** Y position on the sheet (from bottom edge) in mm */
  y: number;
}

/** A single shelf (row) in the FFDH layout */
export interface Shelf {
  /** Y position of the shelf bottom in mm */
  y: number;
  /** Height of the shelf (tallest part) in mm */
  height: number;
  /** Current X cursor (next placement position) in mm */
  currentX: number;
}

/** A single sheet with placed parts */
export interface Sheet {
  /** Sheet index (0-based) */
  index: number;
  /** Material thickness of parts on this sheet in mm */
  materialThickness: number;
  /** Sheet dimensions [width, height] in mm */
  dimensions: [number, number];
  /** Placed parts on this sheet */
  placements: PlacedPart[];
  /** Shelf layout data */
  shelves: Shelf[];
  /** Area utilization as a fraction (0-1) */
  utilization: number;
}

/** Summary of sheets for a single material thickness */
export interface MaterialSummary {
  /** Material thickness in mm */
  materialThickness: number;
  /** Number of sheets needed */
  sheetCount: number;
  /** Average utilization across sheets */
  averageUtilization: number;
}

/** Complete nesting result */
export interface NestingResult {
  /** All sheets with placements */
  sheets: Sheet[];
  /** Parts that could not be placed (too large for any sheet) */
  unfittedParts: NestingPart[];
  /** Total number of sheets */
  sheetCount: number;
  /** Overall utilization across all sheets */
  overallUtilization: number;
  /** Per-material summaries */
  materialSummaries: MaterialSummary[];
  /** Warning messages */
  warnings: string[];
}
