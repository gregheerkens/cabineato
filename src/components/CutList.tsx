'use client';

/**
 * Cut List Component
 *
 * Displays a formatted cut list for the assembly.
 */

import React from 'react';
import type { Assembly, Component, ComponentRole } from '@/lib/types';
import { formatAsInches } from '@/lib/types';

interface CutListProps {
  assembly: Assembly;
  showImperial?: boolean;
  className?: string;
}

/**
 * Component group configuration
 */
const GROUPS: { name: string; roles: ComponentRole[] }[] = [
  {
    name: 'Carcass',
    roles: ['side_panel_left', 'side_panel_right', 'top_panel', 'bottom_panel'],
  },
  { name: 'Back', roles: ['back_panel'] },
  { name: 'Shelves', roles: ['shelf'] },
  {
    name: 'Drawers',
    roles: ['drawer_front', 'drawer_side', 'drawer_back', 'drawer_bottom'],
  },
];

/**
 * Format a single dimension with optional imperial
 */
function formatDim(mm: number, showImperial: boolean): string {
  if (showImperial) {
    return `${mm} (${formatAsInches(mm)})`;
  }
  return `${mm}`;
}

/**
 * Count components by label (for quantity display)
 */
function countByLabel(
  components: Component[]
): Map<string, { component: Component; count: number }> {
  const map = new Map<string, { component: Component; count: number }>();

  for (const comp of components) {
    const key = `${comp.label}-${comp.dimensions.join('-')}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { component: comp, count: 1 });
    }
  }

  return map;
}

export function CutList({ assembly, showImperial = false, className = '' }: CutListProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cut List</h2>

      {GROUPS.map((group) => {
        const groupComponents = assembly.components.filter((c) =>
          group.roles.includes(c.role)
        );

        if (groupComponents.length === 0) return null;

        const counted = countByLabel(groupComponents);

        return (
          <div key={group.name} className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{group.name}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1 font-medium text-gray-600">Qty</th>
                  <th className="text-left py-1 font-medium text-gray-600">Part</th>
                  <th className="text-right py-1 font-medium text-gray-600">W</th>
                  <th className="text-right py-1 font-medium text-gray-600">H</th>
                  <th className="text-right py-1 font-medium text-gray-600">T</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(counted.values()).map(({ component, count }, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1 text-gray-900">{count}</td>
                    <td className="py-1 text-gray-900">{component.label}</td>
                    <td className="py-1 text-right text-gray-600">
                      {formatDim(component.dimensions[0], showImperial)}
                    </td>
                    <td className="py-1 text-right text-gray-600">
                      {formatDim(component.dimensions[1], showImperial)}
                    </td>
                    <td className="py-1 text-right text-gray-600">
                      {component.materialThickness}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Total components: {assembly.components.length}
        </p>
      </div>
    </div>
  );
}

export default CutList;
