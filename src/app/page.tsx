'use client';

/**
 * Cabineato - Main Application Page
 *
 * A parametric web app for generating CNC-ready cabinetry.
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ParameterForm } from '@/components/ParameterForm';
import { CutList } from '@/components/CutList';
import { ExportPanel } from '@/components/ExportPanel';
import { NestingPanel } from '@/components/NestingPanel';
import { SheetView } from '@/components/SheetView';
import { useAssembly } from '@/hooks/useAssembly';
import { useNesting } from '@/hooks/useNesting';
import { formatAsInches } from '@/lib/types';

// Dynamically import Preview3D to avoid SSR issues with Three.js
const Preview3D = dynamic(() => import('@/components/Preview3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
      <p className="text-gray-500">Loading 3D preview...</p>
    </div>
  ),
});

type ViewMode = '3d' | 'nesting';

export default function Home() {
  const {
    config,
    assembly,
    setConfig,
    isValid,
    errors,
    warnings,
  } = useAssembly();

  const {
    nestingConfig,
    updateNestingConfig,
    result: nestingResult,
    isEnabled: nestingEnabled,
    setEnabled: setNestingEnabled,
  } = useNesting(assembly);

  const [selectedComponentId, setSelectedComponentId] = useState<string>();
  const [showImperial, setShowImperial] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cabineato</h1>
            <p className="text-sm text-gray-500">
              Parametric Cabinetry for CNC Workflows
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showImperial}
                onChange={(e) => setShowImperial(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-gray-600">Show Imperial</span>
            </label>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        {/* Error/Warning Messages */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">Configuration Errors</h3>
            <ul className="list-disc list-inside text-sm text-red-700">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Warnings</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Parameters */}
          <div className="lg:col-span-3 space-y-4">
            <ParameterForm
              config={config}
              onChange={setConfig}
              showImperial={showImperial}
            />
          </div>

          {/* Center Column: Preview */}
          <div className="lg:col-span-6">
            <div className="sticky top-6">
              {/* View mode toggle */}
              {assembly && nestingEnabled && nestingResult && (
                <div className="flex mb-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === '3d'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    3D Preview
                  </button>
                  <button
                    onClick={() => setViewMode('nesting')}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'nesting'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sheet Nesting
                  </button>
                </div>
              )}

              <div className="h-[500px] lg:h-[600px]">
                {viewMode === 'nesting' && nestingResult ? (
                  <SheetView result={nestingResult} showImperial={showImperial} className="h-full" />
                ) : assembly ? (
                  <Preview3D
                    assembly={assembly}
                    selectedComponentId={selectedComponentId}
                    onSelectComponent={setSelectedComponentId}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                    <p className="text-gray-500">
                      Fix configuration errors to see preview
                    </p>
                  </div>
                )}
              </div>

              {/* Assembly Summary */}
              {assembly && (
                <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Assembly Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Overall Size:</span>
                      <br />
                      <span className="font-medium text-blue-600">
                        {config.globalBounds.w} × {config.globalBounds.h} ×{' '}
                        {config.globalBounds.d} mm
                      </span>
                      {showImperial && (
                        <span className="text-xs font-medium text-red-400 block">
                          {formatAsInches(config.globalBounds.w)} × {formatAsInches(config.globalBounds.h)} ×{' '}
                          {formatAsInches(config.globalBounds.d)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Interior Size:</span>
                      <br />
                      <span className="font-medium text-blue-600">
                        {assembly.interiorBounds.w} × {assembly.interiorBounds.h} ×{' '}
                        {assembly.interiorBounds.d} mm
                      </span>
                      {showImperial && (
                        <span className="text-xs font-medium text-red-400 block">
                          {formatAsInches(assembly.interiorBounds.w)} × {formatAsInches(assembly.interiorBounds.h)} ×{' '}
                          {formatAsInches(assembly.interiorBounds.d)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Components:</span>
                      <br />
                      <span className="font-medium">
                        {assembly.components.length} parts
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Material:</span>
                      <br />
                      <span className="font-medium text-blue-600">
                        {config.material.thickness}mm
                      </span>
                      {showImperial && (
                        <span className="text-xs font-medium text-red-400 ml-1">
                          ({formatAsInches(config.material.thickness)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Cut List & Export */}
          <div className="lg:col-span-3 space-y-4">
            {assembly && (
              <>
                <ExportPanel
                  assembly={assembly}
                  nestingResult={nestingEnabled ? nestingResult : null}
                  showImperial={showImperial}
                />
                <NestingPanel
                  isEnabled={nestingEnabled}
                  onToggleEnabled={setNestingEnabled}
                  config={nestingConfig}
                  onUpdateConfig={updateNestingConfig}
                  result={nestingResult}
                  showImperial={showImperial}
                />
                <CutList assembly={assembly} showImperial={showImperial} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-500 text-center">
            Cabineato - Rough and Ready Cabinetry for CNC Makers
          </p>
        </div>
      </footer>
    </div>
  );
}
