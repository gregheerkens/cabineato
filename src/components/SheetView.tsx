'use client';

/**
 * SheetView Component
 *
 * 2D SVG visualization of nested parts on sheets.
 * Color-coded by component role with labels and dimensions.
 */

import React, { useState } from 'react';
import type { NestingResult, PlacedPart } from '@/lib/nesting';
import type { ComponentRole } from '@/lib/types';
import { formatAsInches } from '@/lib/types';

interface SheetViewProps {
  result: NestingResult;
  showImperial?: boolean;
  className?: string;
}

const ROLE_COLORS: Record<ComponentRole, string> = {
  side_panel_left: '#3b82f6',   // blue
  side_panel_right: '#3b82f6',  // blue
  top_panel: '#22c55e',         // green
  bottom_panel: '#22c55e',      // green
  back_panel: '#eab308',        // yellow
  shelf: '#f97316',             // orange
  fixed_shelf: '#f97316',       // orange
  adjustable_shelf: '#f97316',  // orange
  drawer_front: '#a855f7',      // purple
  drawer_side: '#a855f7',       // purple
  drawer_back: '#a855f7',       // purple
  drawer_bottom: '#a855f7',     // purple
  toe_kick_panel: '#A0522D',   // sienna
  runner_strip: '#f97316',     // orange
};

function getPartColor(role: ComponentRole): string {
  return ROLE_COLORS[role] ?? '#6b7280';
}

function PartRect({ placement, showImperial = false }: { placement: PlacedPart; showImperial?: boolean }) {
  const { part, x, y } = placement;
  const color = getPartColor(part.role);
  const labelFontSize = Math.min(part.width, part.height) * 0.12;
  const dimFontSize = labelFontSize * 0.7;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={part.width}
        height={part.height}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Label */}
      {labelFontSize > 5 && (
        <>
          <text
            x={x + part.width / 2}
            y={y + part.height / 2 - dimFontSize * 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.max(labelFontSize, 8)}
            fill={color}
            fontWeight="600"
          >
            {part.label}
          </text>
          <text
            x={x + part.width / 2}
            y={y + part.height / 2 + labelFontSize * 0.7}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.max(dimFontSize, 6)}
            fill="#6b7280"
          >
            {part.width.toFixed(0)} x {part.height.toFixed(0)}
            {showImperial ? ` (${formatAsInches(part.width)} x ${formatAsInches(part.height)})` : ''}
            {part.rotated ? ' (R)' : ''}
          </text>
        </>
      )}
    </g>
  );
}

export function SheetView({ result, showImperial = false, className = '' }: SheetViewProps) {
  const [currentSheet, setCurrentSheet] = useState(0);

  if (result.sheets.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500">No sheets to display</p>
      </div>
    );
  }

  const sheetIdx = Math.min(currentSheet, result.sheets.length - 1);
  const sheet = result.sheets[sheetIdx];
  const [bedW, bedH] = sheet.dimensions;
  const margin = 40; // SVG padding for labels

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Pagination */}
      {result.sheets.length > 1 && (
        <div className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded-t-lg border border-b-0 border-gray-200">
          <button
            onClick={() => setCurrentSheet(Math.max(0, sheetIdx - 1))}
            disabled={sheetIdx === 0}
            className="px-2 py-1 text-sm rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Sheet {sheetIdx + 1} of {result.sheets.length}
            {' '}({sheet.materialThickness}mm)
          </span>
          <button
            onClick={() => setCurrentSheet(Math.min(result.sheets.length - 1, sheetIdx + 1))}
            disabled={sheetIdx === result.sheets.length - 1}
            className="px-2 py-1 text-sm rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* SVG Sheet */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <svg
          viewBox={`${-margin} ${-margin} ${bedW + 2 * margin} ${bedH + 2 * margin}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background */}
          <rect
            x={-margin}
            y={-margin}
            width={bedW + 2 * margin}
            height={bedH + 2 * margin}
            fill="#f9fafb"
          />

          {/* Sheet outline */}
          <rect
            x={0}
            y={0}
            width={bedW}
            height={bedH}
            fill="white"
            stroke="#d1d5db"
            strokeWidth={2}
          />

          {/* Margin zone (dashed) */}
          {sheet.placements.length > 0 && (
            <rect
              x={sheet.placements[0]?.x !== undefined ? getEdgeMargin(sheet) : 15}
              y={sheet.placements[0]?.x !== undefined ? getEdgeMargin(sheet) : 15}
              width={bedW - 2 * getEdgeMargin(sheet)}
              height={bedH - 2 * getEdgeMargin(sheet)}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray="8 4"
            />
          )}

          {/* Parts */}
          {sheet.placements.map((placement, i) => (
            <PartRect key={i} placement={placement} showImperial={showImperial} />
          ))}

          {/* Dimension labels on axes */}
          <text x={bedW / 2} y={-10} textAnchor="middle" fontSize={14} fill="#9ca3af">
            {bedW}mm{showImperial ? ` (${formatAsInches(bedW)})` : ''}
          </text>
          <text
            x={-10}
            y={bedH / 2}
            textAnchor="middle"
            fontSize={14}
            fill="#9ca3af"
            transform={`rotate(-90, -10, ${bedH / 2})`}
          >
            {bedH}mm{showImperial ? ` (${formatAsInches(bedH)})` : ''}
          </text>
        </svg>
      </div>

      {/* Utilization bar */}
      <div className="mt-2 px-1">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Sheet Utilization</span>
          <span>{(sheet.utilization * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${sheet.utilization * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Infer the edge margin from shelf data.
 * The first shelf's Y position reveals the margin used.
 */
function getEdgeMargin(sheet: { shelves: { y: number }[] }): number {
  if (sheet.shelves.length > 0) {
    return sheet.shelves[0].y;
  }
  return 15; // fallback
}

export default SheetView;
