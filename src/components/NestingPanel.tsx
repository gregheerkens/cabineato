'use client';

/**
 * Nesting Panel Component
 *
 * Configuration controls for sheet nesting and results summary.
 */

import React, { useState, useCallback } from 'react';
import type { NestingConfig, NestingResult } from '@/lib/nesting';
import { BED_SIZES, NESTING_DEFAULTS, formatAsInches } from '@/lib/types';

interface NestingPanelProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  config: NestingConfig;
  onUpdateConfig: (updates: Partial<NestingConfig>) => void;
  result: NestingResult | null;
  showImperial?: boolean;
  className?: string;
}

type BedPreset = 'FOUR_BY_FOUR' | 'FOUR_BY_EIGHT' | 'custom';

function getBedPreset(bedSize: [number, number]): BedPreset {
  if (bedSize[0] === BED_SIZES.FOUR_BY_FOUR[0] && bedSize[1] === BED_SIZES.FOUR_BY_FOUR[1]) {
    return 'FOUR_BY_FOUR';
  }
  if (bedSize[0] === BED_SIZES.FOUR_BY_EIGHT[0] && bedSize[1] === BED_SIZES.FOUR_BY_EIGHT[1]) {
    return 'FOUR_BY_EIGHT';
  }
  return 'custom';
}

export function NestingPanel({
  isEnabled,
  onToggleEnabled,
  config,
  onUpdateConfig,
  result,
  showImperial = false,
  className = '',
}: NestingPanelProps) {
  const [bedPreset, setBedPreset] = useState<BedPreset>(getBedPreset(config.bedSize));

  const handlePresetChange = useCallback(
    (preset: BedPreset) => {
      setBedPreset(preset);
      if (preset === 'FOUR_BY_FOUR') {
        onUpdateConfig({ bedSize: [...BED_SIZES.FOUR_BY_FOUR] as [number, number] });
      } else if (preset === 'FOUR_BY_EIGHT') {
        onUpdateConfig({ bedSize: [...BED_SIZES.FOUR_BY_EIGHT] as [number, number] });
      }
    },
    [onUpdateConfig]
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Sheet Nesting</h2>

      {/* Enable toggle */}
      <label className="flex items-center gap-2 cursor-pointer mb-4">
        <div className="relative">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => onToggleEnabled(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-10 h-5 rounded-full transition-colors ${
              isEnabled ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              isEnabled ? 'translate-x-5' : ''
            }`}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">Enable Nesting</span>
      </label>

      {isEnabled && (
        <div className="space-y-4">
          {/* Bed size preset */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Bed Size</label>
            <select
              value={bedPreset}
              onChange={(e) => handlePresetChange(e.target.value as BedPreset)}
              className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="FOUR_BY_FOUR">4&apos; x 4&apos; (1219 x 1219mm)</option>
              <option value="FOUR_BY_EIGHT">4&apos; x 8&apos; (1219 x 2438mm)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Custom bed size inputs */}
          {bedPreset === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Width (mm)</label>
                <input
                  type="number"
                  value={config.bedSize[0]}
                  onChange={(e) =>
                    onUpdateConfig({
                      bedSize: [Number(e.target.value), config.bedSize[1]],
                    })
                  }
                  min={100}
                  max={5000}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showImperial && (
                  <span className="text-xs text-gray-400">({formatAsInches(config.bedSize[0])})</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Height (mm)</label>
                <input
                  type="number"
                  value={config.bedSize[1]}
                  onChange={(e) =>
                    onUpdateConfig({
                      bedSize: [config.bedSize[0], Number(e.target.value)],
                    })
                  }
                  min={100}
                  max={5000}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {showImperial && (
                  <span className="text-xs text-gray-400">({formatAsInches(config.bedSize[1])})</span>
                )}
              </div>
            </div>
          )}

          {/* Edge margin */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Edge Margin</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.edgeMargin}
                onChange={(e) => onUpdateConfig({ edgeMargin: Number(e.target.value) })}
                min={0}
                max={100}
                step={1}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">mm</span>
              {showImperial && (
                <span className="text-xs text-gray-400">({formatAsInches(config.edgeMargin)})</span>
              )}
            </div>
          </div>

          {/* Part spacing */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Part Spacing</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.partSpacing}
                onChange={(e) => onUpdateConfig({ partSpacing: Number(e.target.value) })}
                min={NESTING_DEFAULTS.MIN_PART_SPACING}
                max={50}
                step={0.1}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm text-gray-500">mm</span>
              {showImperial && (
                <span className="text-xs text-gray-400">({formatAsInches(config.partSpacing)})</span>
              )}
            </div>
          </div>

          {/* Allow rotation */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={config.allowRotation}
                onChange={(e) => onUpdateConfig({ allowRotation: e.target.checked })}
                className="sr-only"
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  config.allowRotation ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  config.allowRotation ? 'translate-x-5' : ''
                }`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">Allow Rotation</span>
          </label>
          <p className="text-xs text-gray-500 -mt-2">
            Disable for plywood with grain direction control.
          </p>

          {/* Results summary */}
          {result && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Results</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Sheets:</span>
                  <span className="font-medium">{result.sheetCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Overall Utilization:</span>
                  <span className="font-medium">
                    {(result.overallUtilization * 100).toFixed(1)}%
                  </span>
                </div>

                {result.materialSummaries.map((ms) => (
                  <div
                    key={ms.materialThickness}
                    className="flex justify-between text-xs text-gray-500"
                  >
                    <span>{ms.materialThickness}mm stock:</span>
                    <span>
                      {ms.sheetCount} sheet{ms.sheetCount > 1 ? 's' : ''} (
                      {(ms.averageUtilization * 100).toFixed(0)}% avg)
                    </span>
                  </div>
                ))}
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  {result.warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              )}

              {/* Unfitted parts */}
              {result.unfittedParts.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <p className="font-medium mb-1">
                    {result.unfittedParts.length} part{result.unfittedParts.length > 1 ? 's' : ''}{' '}
                    could not be placed:
                  </p>
                  {result.unfittedParts.map((p, i) => (
                    <p key={i}>
                      {p.label} ({p.width.toFixed(0)} x {p.height.toFixed(0)}mm)
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NestingPanel;
