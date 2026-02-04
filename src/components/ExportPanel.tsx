'use client';

/**
 * Export Panel Component
 *
 * Provides export buttons for SVG, DXF, and cut list.
 */

import React from 'react';
import type { Assembly } from '@/lib/types';
import { downloadSVG, downloadDXF, downloadCutList } from '@/lib/export';

interface ExportPanelProps {
  assembly: Assembly;
  className?: string;
}

export function ExportPanel({ assembly, className = '' }: ExportPanelProps) {
  const handleExportSVG = () => {
    downloadSVG(assembly, 'cabinet.svg', {
      includeDogbones: true,
      bitDiameter: assembly.config.machining.bitDiameter,
      includeLabels: true,
    });
  };

  const handleExportDXF = () => {
    downloadDXF(assembly, 'cabinet.dxf', {
      includeDogbones: true,
      bitDiameter: assembly.config.machining.bitDiameter,
    });
  };

  const handleExportCutList = () => {
    downloadCutList(assembly, 'cutlist.md', {
      showImperial: true,
      groupByRole: true,
      includeFeatures: true,
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Export</h2>

      <div className="space-y-2">
        <button
          onClick={handleExportSVG}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Download SVG
        </button>

        <button
          onClick={handleExportDXF}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium"
        >
          Download DXF
        </button>

        <button
          onClick={handleExportCutList}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          Download Cut List
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          SVG and DXF exports include layered geometry for direct import into Vectric
          VCarve and other CAM software.
        </p>
      </div>
    </div>
  );
}

export default ExportPanel;
