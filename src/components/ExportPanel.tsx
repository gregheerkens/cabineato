'use client';

/**
 * Export Panel Component
 *
 * Provides export buttons for SVG, DXF, cut list, and nested exports.
 */

import React from 'react';
import type { Assembly } from '@/lib/types';
import type { NestingResult } from '@/lib/nesting';
import { downloadSVG, downloadDXF, downloadCutList } from '@/lib/export';
import { generateNestedSVGs } from '@/lib/export/nestedSvg';
import { generateNestedDXFs } from '@/lib/export/nestedDxf';

interface ExportPanelProps {
  assembly: Assembly;
  nestingResult?: NestingResult | null;
  showImperial?: boolean;
  className?: string;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportPanel({ assembly, nestingResult, showImperial = false, className = '' }: ExportPanelProps) {
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
      showImperial,
      groupByRole: true,
      includeFeatures: true,
    });
  };

  const handleExportNestedSVG = () => {
    if (!nestingResult) return;
    const files = generateNestedSVGs(nestingResult, assembly.components, {
      includeDogbones: true,
      bitDiameter: assembly.config.machining.bitDiameter,
      includeLabels: true,
    });
    for (const file of files) {
      downloadFile(file.content, file.filename, 'image/svg+xml');
    }
  };

  const handleExportNestedDXF = () => {
    if (!nestingResult) return;
    const files = generateNestedDXFs(nestingResult, assembly.components, {
      includeDogbones: true,
      bitDiameter: assembly.config.machining.bitDiameter,
    });
    for (const file of files) {
      downloadFile(file.content, file.filename, 'application/dxf');
    }
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

      {/* Nested export buttons */}
      {nestingResult && nestingResult.sheets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Nested ({nestingResult.sheetCount} sheet{nestingResult.sheetCount > 1 ? 's' : ''})
          </p>
          <button
            onClick={handleExportNestedSVG}
            className="w-full px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors text-sm font-medium"
          >
            Download Nested SVG
          </button>
          <button
            onClick={handleExportNestedDXF}
            className="w-full px-4 py-2 bg-green-400 text-white rounded hover:bg-green-500 transition-colors text-sm font-medium"
          >
            Download Nested DXF
          </button>
        </div>
      )}

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
