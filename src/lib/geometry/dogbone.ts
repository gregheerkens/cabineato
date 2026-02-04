/**
 * Dogbone Fillet Processor
 *
 * Adds circular reliefs (dogbones) at internal corners of slots and dados
 * so that square panels can seat fully when cut with a round bit.
 *
 * Per AdditionalContext.md:
 * - Bit Geometry: A round bit cannot cut a sharp internal 90° corner
 * - Dogbone Fillets: The engine must automatically add circular reliefs at corners
 *   of slots so square panels seat fully
 */

import type { Vector2 } from '../types';

/**
 * Direction of the dogbone relative to the corner
 */
export type DogboneDirection = 'diagonal' | 'horizontal' | 'vertical';

/**
 * Dogbone fillet data
 */
export interface DogboneFillet {
  /** Center point of the dogbone circle */
  center: Vector2;
  /** Radius of the dogbone (bitDiameter / 2) */
  radius: number;
  /** The corner this dogbone is for */
  cornerIndex: number;
}

/**
 * Calculate the dogbone center position for a corner
 *
 * For a 90° internal corner, the dogbone is placed diagonally
 * into the corner at 45° from the corner point.
 *
 * @param corner - The corner point coordinates
 * @param bitRadius - Half the bit diameter
 * @param prevPoint - The previous point in the path
 * @param nextPoint - The next point in the path
 * @param direction - Direction strategy for the dogbone
 */
export function calculateDogboneCenter(
  corner: Vector2,
  bitRadius: number,
  prevPoint: Vector2,
  nextPoint: Vector2,
  direction: DogboneDirection = 'diagonal'
): Vector2 {
  const [cx, cy] = corner;
  const [px, py] = prevPoint;
  const [nx, ny] = nextPoint;

  // Calculate vectors from corner to adjacent points
  const v1x = px - cx;
  const v1y = py - cy;
  const v2x = nx - cx;
  const v2y = ny - cy;

  if (direction === 'diagonal') {
    // Diagonal dogbone: place at 45° bisector of the corner
    // Normalize vectors
    const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

    if (len1 === 0 || len2 === 0) {
      return corner; // Degenerate case
    }

    const n1x = v1x / len1;
    const n1y = v1y / len1;
    const n2x = v2x / len2;
    const n2y = v2y / len2;

    // Bisector direction (pointing into the material)
    const bisectorX = n1x + n2x;
    const bisectorY = n1y + n2y;
    const bisectorLen = Math.sqrt(bisectorX * bisectorX + bisectorY * bisectorY);

    if (bisectorLen === 0) {
      // Points are collinear, no corner
      return corner;
    }

    // Normalize bisector
    const bx = bisectorX / bisectorLen;
    const by = bisectorY / bisectorLen;

    // The dogbone center is offset from the corner along the bisector
    // by bitRadius * sqrt(2) to ensure the circle touches the corner
    const offset = bitRadius * Math.SQRT2;

    return [cx + bx * offset, cy + by * offset];
  } else if (direction === 'horizontal') {
    // Horizontal dogbone: place along the horizontal edge
    const dirX = v1x !== 0 ? Math.sign(v1x) : Math.sign(v2x);
    return [cx + dirX * bitRadius, cy];
  } else {
    // Vertical dogbone: place along the vertical edge
    const dirY = v1y !== 0 ? Math.sign(v1y) : Math.sign(v2y);
    return [cx, cy + dirY * bitRadius];
  }
}

/**
 * Determine if a corner is internal (concave) and needs a dogbone
 *
 * For a clockwise path, internal corners have the material on the right.
 * We use the cross product to determine the turn direction.
 */
export function isInternalCorner(
  prevPoint: Vector2,
  corner: Vector2,
  nextPoint: Vector2
): boolean {
  const [px, py] = prevPoint;
  const [cx, cy] = corner;
  const [nx, ny] = nextPoint;

  // Vectors from corner to adjacent points
  const v1x = px - cx;
  const v1y = py - cy;
  const v2x = nx - cx;
  const v2y = ny - cy;

  // Cross product (z-component)
  const cross = v1x * v2y - v1y * v2x;

  // For a clockwise path, negative cross product = left turn = internal corner
  // For counter-clockwise, positive cross product = right turn = internal corner
  // We assume counter-clockwise paths (standard in CAD), so positive cross = internal
  return cross > 0;
}

/**
 * Generate dogbone fillets for a rectangular slot/pocket
 *
 * @param x - Left edge X coordinate
 * @param y - Bottom edge Y coordinate
 * @param width - Width of the slot
 * @param height - Height of the slot
 * @param bitDiameter - Diameter of the router bit
 */
export function generateRectangleDogbones(
  x: number,
  y: number,
  width: number,
  height: number,
  bitDiameter: number
): DogboneFillet[] {
  const bitRadius = bitDiameter / 2;
  const dogbones: DogboneFillet[] = [];

  // Define the four corners (counter-clockwise from bottom-left)
  const corners: Vector2[] = [
    [x, y],                    // Bottom-left
    [x + width, y],            // Bottom-right
    [x + width, y + height],   // Top-right
    [x, y + height],           // Top-left
  ];

  // For each corner, calculate the dogbone position
  for (let i = 0; i < 4; i++) {
    const prev = corners[(i + 3) % 4];
    const curr = corners[i];
    const next = corners[(i + 1) % 4];

    // All corners of a rectangle are internal corners for a pocket
    const center = calculateDogboneCenter(curr, bitRadius, prev, next, 'diagonal');

    dogbones.push({
      center,
      radius: bitRadius,
      cornerIndex: i,
    });
  }

  return dogbones;
}

/**
 * Generate dogbone fillets for a notch (like toe kick)
 *
 * A notch has only 2 internal corners (the inner corners)
 *
 * @param x - X position of the notch
 * @param y - Y position of the notch
 * @param width - Width of the notch
 * @param height - Height of the notch
 * @param corner - Which corner of the panel the notch is in
 * @param bitDiameter - Diameter of the router bit
 */
export function generateNotchDogbones(
  x: number,
  y: number,
  width: number,
  height: number,
  corner: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right',
  bitDiameter: number
): DogboneFillet[] {
  const bitRadius = bitDiameter / 2;
  const dogbones: DogboneFillet[] = [];

  // The two internal corners depend on which corner the notch is in
  let internalCorners: { pos: Vector2; prev: Vector2; next: Vector2 }[] = [];

  switch (corner) {
    case 'bottom-left':
      // Notch removes bottom-left corner
      // Internal corners at (x+width, y) and (x, y+height)
      internalCorners = [
        {
          pos: [x + width, y],
          prev: [x + width, y - 1], // extends down (outside notch)
          next: [x, y],             // goes left along bottom
        },
        {
          pos: [x, y + height],
          prev: [x, y],             // comes from below
          next: [x - 1, y + height], // extends left (outside notch)
        },
      ];
      break;

    case 'bottom-right':
      internalCorners = [
        {
          pos: [x, y],
          prev: [x + width, y],
          next: [x, y - 1],
        },
        {
          pos: [x + width, y + height],
          prev: [x + width + 1, y + height],
          next: [x + width, y],
        },
      ];
      break;

    case 'top-left':
      internalCorners = [
        {
          pos: [x, y],
          prev: [x - 1, y],
          next: [x, y + height],
        },
        {
          pos: [x + width, y + height],
          prev: [x, y + height],
          next: [x + width, y + height + 1],
        },
      ];
      break;

    case 'top-right':
      internalCorners = [
        {
          pos: [x + width, y],
          prev: [x + width, y + height],
          next: [x + width + 1, y],
        },
        {
          pos: [x, y + height],
          prev: [x, y + height + 1],
          next: [x + width, y + height],
        },
      ];
      break;
  }

  for (let i = 0; i < internalCorners.length; i++) {
    const { pos, prev, next } = internalCorners[i];
    const center = calculateDogboneCenter(pos, bitRadius, prev, next, 'diagonal');

    dogbones.push({
      center,
      radius: bitRadius,
      cornerIndex: i,
    });
  }

  return dogbones;
}

/**
 * Apply dogbone fillets to a path
 *
 * Returns the modified path with dogbone arcs at internal corners.
 * This is used when generating the actual toolpath geometry.
 *
 * @param path - The original path points (closed polygon assumed)
 * @param bitDiameter - Diameter of the router bit
 */
export function applyDogbonesToPath(
  path: Vector2[],
  bitDiameter: number
): { path: Vector2[]; dogbones: DogboneFillet[] } {
  if (path.length < 3) {
    return { path, dogbones: [] };
  }

  const bitRadius = bitDiameter / 2;
  const dogbones: DogboneFillet[] = [];
  const modifiedPath: Vector2[] = [];

  for (let i = 0; i < path.length; i++) {
    const prev = path[(i + path.length - 1) % path.length];
    const curr = path[i];
    const next = path[(i + 1) % path.length];

    // Add current point
    modifiedPath.push(curr);

    // Check if this is an internal corner that needs a dogbone
    if (isInternalCorner(prev, curr, next)) {
      const center = calculateDogboneCenter(curr, bitRadius, prev, next, 'diagonal');

      dogbones.push({
        center,
        radius: bitRadius,
        cornerIndex: i,
      });
    }
  }

  return { path: modifiedPath, dogbones };
}
