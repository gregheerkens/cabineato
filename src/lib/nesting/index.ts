/**
 * Nesting Module
 *
 * Sheet nesting for CNC-ready cabinet parts.
 */

export { getFlatDimensions } from './flatDimensions';
export { packSheet } from './packer';
export { nestParts } from './nesting';
export type {
  NestingConfig,
  NestingPart,
  PlacedPart,
  Sheet,
  Shelf,
  NestingResult,
  MaterialSummary,
} from './types';
