/**
 * FFDH Shelf Packer
 *
 * First Fit Decreasing Height (FFDH) bin-packing algorithm.
 * Sorts parts by height descending, places left-to-right on shelves.
 * Pure function: (NestingPart[], NestingConfig) => Sheet + overflow.
 */

import type { NestingConfig, NestingPart, PlacedPart, Sheet, Shelf } from './types';

/**
 * Pack a list of parts onto a single sheet using FFDH.
 *
 * Returns the sheet with placed parts and any overflow parts
 * that didn't fit.
 */
export function packSheet(
  parts: NestingPart[],
  config: NestingConfig,
  sheetIndex: number
): { sheet: Sheet; overflow: NestingPart[] } {
  const [bedWidth, bedHeight] = config.bedSize;
  const usableWidth = bedWidth - 2 * config.edgeMargin;
  const usableHeight = bedHeight - 2 * config.edgeMargin;
  const spacing = config.partSpacing;

  // Sort parts by height descending (FFDH key step)
  const sorted = [...parts].sort((a, b) => b.height - a.height);

  const placements: PlacedPart[] = [];
  const shelves: Shelf[] = [];
  const overflow: NestingPart[] = [];

  for (const part of sorted) {
    const placed = tryPlacePart(
      part,
      shelves,
      placements,
      usableWidth,
      usableHeight,
      config.edgeMargin,
      spacing,
      config.allowRotation
    );

    if (!placed) {
      overflow.push(part);
    }
  }

  // Calculate utilization
  const totalPartArea = placements.reduce(
    (sum, p) => sum + p.part.width * p.part.height,
    0
  );
  const usableArea = usableWidth * usableHeight;
  const utilization = usableArea > 0 ? totalPartArea / usableArea : 0;

  const materialThickness =
    placements.length > 0 ? placements[0].part.materialThickness : 0;

  return {
    sheet: {
      index: sheetIndex,
      materialThickness,
      dimensions: [bedWidth, bedHeight],
      placements,
      shelves,
      utilization,
    },
    overflow,
  };
}

/**
 * Try to place a part on existing shelves or open a new shelf.
 * Returns true if placed, false if the part doesn't fit on this sheet.
 */
function tryPlacePart(
  part: NestingPart,
  shelves: Shelf[],
  placements: PlacedPart[],
  usableWidth: number,
  usableHeight: number,
  edgeMargin: number,
  spacing: number,
  allowRotation: boolean
): boolean {
  // Try original orientation on existing shelves
  if (fitsOnExistingShelf(part, shelves, placements, usableWidth, edgeMargin, spacing)) {
    return true;
  }

  // Try rotated on existing shelves
  if (allowRotation) {
    const rotated = rotatePart(part);
    if (fitsOnExistingShelf(rotated, shelves, placements, usableWidth, edgeMargin, spacing)) {
      return true;
    }
  }

  // Try opening a new shelf with original orientation
  if (canOpenNewShelf(part, shelves, usableWidth, usableHeight, edgeMargin, spacing)) {
    openNewShelf(part, shelves, placements, usableWidth, usableHeight, edgeMargin, spacing);
    return true;
  }

  // Try opening a new shelf with rotated orientation
  if (allowRotation) {
    const rotated = rotatePart(part);
    if (canOpenNewShelf(rotated, shelves, usableWidth, usableHeight, edgeMargin, spacing)) {
      openNewShelf(rotated, shelves, placements, usableWidth, usableHeight, edgeMargin, spacing);
      return true;
    }
  }

  return false;
}

/**
 * Try to fit a part on an existing shelf (left-to-right).
 * Returns true if placed.
 */
function fitsOnExistingShelf(
  part: NestingPart,
  shelves: Shelf[],
  placements: PlacedPart[],
  usableWidth: number,
  edgeMargin: number,
  spacing: number
): boolean {
  for (const shelf of shelves) {
    // Part must fit within shelf height
    if (part.height > shelf.height) continue;

    // Part must fit within remaining width
    const availableWidth = usableWidth - (shelf.currentX - edgeMargin);
    if (part.width > availableWidth) continue;

    // Place the part
    placements.push({
      part,
      x: shelf.currentX,
      y: shelf.y,
    });

    shelf.currentX += part.width + spacing;
    return true;
  }

  return false;
}

/**
 * Check if a new shelf can be opened for this part.
 */
function canOpenNewShelf(
  part: NestingPart,
  shelves: Shelf[],
  usableWidth: number,
  usableHeight: number,
  edgeMargin: number,
  spacing: number
): boolean {
  // Part must fit within usable width
  if (part.width > usableWidth) return false;

  // Calculate where the new shelf would start
  const newShelfY = getNextShelfY(shelves, edgeMargin, spacing);

  // Part must fit within remaining height
  if (newShelfY + part.height > edgeMargin + usableHeight) return false;

  return true;
}

/**
 * Open a new shelf and place the part on it.
 */
function openNewShelf(
  part: NestingPart,
  shelves: Shelf[],
  placements: PlacedPart[],
  usableWidth: number,
  usableHeight: number,
  edgeMargin: number,
  spacing: number
): void {
  const newShelfY = getNextShelfY(shelves, edgeMargin, spacing);

  const shelf: Shelf = {
    y: newShelfY,
    height: part.height,
    currentX: edgeMargin + part.width + spacing,
  };

  shelves.push(shelf);

  placements.push({
    part,
    x: edgeMargin,
    y: newShelfY,
  });
}

/**
 * Get the Y position for the next shelf.
 */
function getNextShelfY(
  shelves: Shelf[],
  edgeMargin: number,
  spacing: number
): number {
  if (shelves.length === 0) return edgeMargin;

  const lastShelf = shelves[shelves.length - 1];
  return lastShelf.y + lastShelf.height + spacing;
}

/**
 * Create a rotated copy of a part (swap width and height).
 */
function rotatePart(part: NestingPart): NestingPart {
  return {
    ...part,
    width: part.height,
    height: part.width,
    rotated: !part.rotated,
  };
}
