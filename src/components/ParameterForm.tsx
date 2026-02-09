'use client';

/**
 * Parameter Form Component
 *
 * Main input form for cabinet configuration.
 * Sections: Dimensions, Material, Back Panel, Features, Machining, Pre-drills
 */

import React, { useState, useCallback } from 'react';
import type {
  AssemblyConfig,
  BackPanelType,
  DrawerPullType,
  AdjustableShelfConfig,
  FixedShelfConfig,
  ShelfRunnerConfig,
  DrawerPullConfig,
  AssemblyPredrillConfig,
  SlidePredrillConfig,
} from '@/lib/types';
import {
  DEFAULT_ASSEMBLY_CONFIG,
  MATERIAL_THICKNESSES,
  BIT_DIAMETERS,
  DRAWER_PULL_DEFAULTS,
  formatAsInches,
} from '@/lib/types';

interface ParameterFormProps {
  config: AssemblyConfig;
  onChange: (config: AssemblyConfig) => void;
  showImperial?: boolean;
}

/**
 * Number input with label and unit display
 */
function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 3000,
  step = 1,
  unit = 'mm',
  showImperial = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showImperial?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-sm text-gray-500">{unit}</span>
        {showImperial && unit === 'mm' && (
          <span className="text-xs text-gray-400">({formatAsInches(value)})</span>
        )}
      </div>
    </div>
  );
}

/**
 * Select input with label
 */
function SelectInput<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Toggle switch with label
 */
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-10 h-5 rounded-full transition-colors ${
            checked ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

/**
 * Collapsible section
 */
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-gray-50 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <span className="text-gray-500">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

/**
 * Main Parameter Form Component
 */
export function ParameterForm({
  config,
  onChange,
  showImperial = false,
}: ParameterFormProps) {
  // Helper to update nested config
  const updateConfig = useCallback(
    (updates: Partial<AssemblyConfig>) => {
      onChange({ ...config, ...updates });
    },
    [config, onChange]
  );

  const updateGlobalBounds = useCallback(
    (key: 'w' | 'h' | 'd', value: number) => {
      updateConfig({
        globalBounds: { ...config.globalBounds, [key]: value },
      });
    },
    [config.globalBounds, updateConfig]
  );

  const updateMaterial = useCallback(
    (updates: Partial<typeof config.material>) => {
      updateConfig({
        material: { ...config.material, ...updates },
      });
    },
    [config.material, updateConfig]
  );

  const updateMachining = useCallback(
    (updates: Partial<typeof config.machining>) => {
      updateConfig({
        machining: { ...config.machining, ...updates },
      });
    },
    [config.machining, updateConfig]
  );

  const updateBackPanel = useCallback(
    (updates: Partial<typeof config.backPanel>) => {
      updateConfig({
        backPanel: { ...config.backPanel, ...updates },
      });
    },
    [config.backPanel, updateConfig]
  );

  const updateDrawers = useCallback(
    (updates: Partial<typeof config.features.drawers>) => {
      updateConfig({
        features: {
          ...config.features,
          drawers: { ...config.features.drawers, ...updates },
        },
      });
    },
    [config.features, updateConfig]
  );

  const updateToeKick = useCallback(
    (updates: Partial<typeof config.features.toeKick>) => {
      updateConfig({
        features: {
          ...config.features,
          toeKick: { ...config.features.toeKick, ...updates },
        },
      });
    },
    [config.features, updateConfig]
  );

  const updateSecondaryMaterial = useCallback(
    (updates: Partial<NonNullable<typeof config.secondaryMaterial>>) => {
      updateConfig({
        secondaryMaterial: { ...config.secondaryMaterial, ...updates },
      });
    },
    [config.secondaryMaterial, updateConfig]
  );

  // Adjustable shelves helper
  const getAdjustableConfig = (): AdjustableShelfConfig | undefined => {
    const shelves = config.features.shelves;
    if ('adjustable' in shelves) {
      return shelves.adjustable;
    }
    // Legacy format
    return shelves as unknown as AdjustableShelfConfig;
  };

  const updateAdjustableShelves = useCallback(
    (updates: Partial<AdjustableShelfConfig>) => {
      const currentShelves = config.features.shelves;
      if ('adjustable' in currentShelves) {
        updateConfig({
          features: {
            ...config.features,
            shelves: {
              ...currentShelves,
              adjustable: { ...currentShelves.adjustable, ...updates },
            },
          },
        });
      }
    },
    [config.features, updateConfig]
  );

  // Fixed shelves helper
  const getFixedConfig = (): FixedShelfConfig | undefined => {
    const shelves = config.features.shelves;
    if ('fixed' in shelves) {
      return shelves.fixed;
    }
    return undefined;
  };

  const updateFixedShelves = useCallback(
    (updates: Partial<FixedShelfConfig>) => {
      const currentShelves = config.features.shelves;
      if ('fixed' in currentShelves) {
        updateConfig({
          features: {
            ...config.features,
            shelves: {
              ...currentShelves,
              fixed: { ...currentShelves.fixed, ...updates },
            },
          },
        });
      }
    },
    [config.features, updateConfig]
  );

  // Shelf runners helper
  const getRunnerConfig = (): ShelfRunnerConfig | undefined => {
    const shelves = config.features.shelves;
    if ('runners' in shelves) {
      return shelves.runners;
    }
    return undefined;
  };

  const updateShelfRunners = useCallback(
    (updates: Partial<ShelfRunnerConfig>) => {
      const currentShelves = config.features.shelves;
      if ('runners' in currentShelves) {
        updateConfig({
          features: {
            ...config.features,
            shelves: {
              ...currentShelves,
              runners: { ...currentShelves.runners, ...updates },
            },
          },
        });
      }
    },
    [config.features, updateConfig]
  );

  // Drawer pull holes helper
  const updateDrawerPulls = useCallback(
    (updates: Partial<DrawerPullConfig>) => {
      updateConfig({
        features: {
          ...config.features,
          drawers: {
            ...config.features.drawers,
            pullHoles: { ...config.features.drawers.pullHoles, ...updates },
          },
        },
      });
    },
    [config.features, updateConfig]
  );

  // Assembly pre-drills helper
  const updateAssemblyPredrills = useCallback(
    (updates: Partial<AssemblyPredrillConfig>) => {
      updateConfig({
        predrills: {
          ...config.predrills,
          assembly: { ...config.predrills?.assembly, ...updates },
        },
      });
    },
    [config.predrills, updateConfig]
  );

  // Slide pre-drills helper
  const updateSlidePredrills = useCallback(
    (updates: Partial<SlidePredrillConfig>) => {
      updateConfig({
        predrills: {
          ...config.predrills,
          slides: { ...config.predrills?.slides, ...updates },
        },
      });
    },
    [config.predrills, updateConfig]
  );

  // Get current config values
  const adjustable = getAdjustableConfig();
  const fixed = getFixedConfig();
  const runners = getRunnerConfig();

  // Local state for comma-separated inputs (to avoid immediate parsing on keystroke)
  const [fixedPositionsInput, setFixedPositionsInput] = useState(
    (fixed?.positions ?? []).join(', ')
  );
  const [runnerPositionsInput, setRunnerPositionsInput] = useState(
    (runners?.positions ?? []).join(', ')
  );

  // Sync local state when external config changes
  React.useEffect(() => {
    setFixedPositionsInput((fixed?.positions ?? []).join(', '));
  }, [fixed?.positions]);

  React.useEffect(() => {
    setRunnerPositionsInput((runners?.positions ?? []).join(', '));
  }, [runners?.positions]);

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Cabinet Parameters</h2>

      {/* Dimensions Section */}
      <Section title="Dimensions">
        <div className="grid grid-cols-3 gap-4">
          <NumberInput
            label="Width"
            value={config.globalBounds.w}
            onChange={(v) => updateGlobalBounds('w', v)}
            min={100}
            max={3000}
            showImperial={showImperial}
          />
          <NumberInput
            label="Height"
            value={config.globalBounds.h}
            onChange={(v) => updateGlobalBounds('h', v)}
            min={100}
            max={3000}
            showImperial={showImperial}
          />
          <NumberInput
            label="Depth"
            value={config.globalBounds.d}
            onChange={(v) => updateGlobalBounds('d', v)}
            min={100}
            max={1000}
            showImperial={showImperial}
          />
        </div>
      </Section>

      {/* Material Section */}
      <Section title="Material">
        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            label="Thickness Preset"
            value={String(config.material.thickness)}
            onChange={(v) => updateMaterial({ thickness: Number(v) })}
            options={[
              { value: String(MATERIAL_THICKNESSES.STANDARD_18MM), label: '18mm (3/4")' },
              { value: String(MATERIAL_THICKNESSES.PLYWOOD_19MM), label: '19mm (Actual 3/4")' },
              { value: String(MATERIAL_THICKNESSES.HALF_INCH), label: '12.7mm (1/2")' },
            ]}
          />
          <NumberInput
            label="Custom Thickness"
            value={config.material.thickness}
            onChange={(v) => updateMaterial({ thickness: v })}
            min={3}
            max={50}
            step={0.1}
            showImperial={showImperial}
          />
        </div>
        <NumberInput
          label="Kerf Width"
          value={config.material.kerf}
          onChange={(v) => updateMaterial({ kerf: v })}
          min={0}
          max={10}
          step={0.1}
          showImperial={showImperial}
        />
        <p className="text-xs text-gray-500">Material removed by the saw blade per cut</p>
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Secondary Materials</h4>
          <div className="grid grid-cols-2 gap-4">
            <SelectInput
              label="Back Panel Thickness"
              value={String(config.secondaryMaterial?.backPanelThickness ?? MATERIAL_THICKNESSES.MDF_6MM)}
              onChange={(v) => updateSecondaryMaterial({ backPanelThickness: Number(v) })}
              options={[
                { value: String(MATERIAL_THICKNESSES.HARDBOARD_3MM), label: '3mm Hardboard' },
                { value: String(MATERIAL_THICKNESSES.MDF_6MM), label: '6mm MDF' },
                { value: String(MATERIAL_THICKNESSES.QUARTER_INCH), label: '6.35mm (1/4")' },
              ]}
            />
            <SelectInput
              label="Drawer Bottom Thickness"
              value={String(config.secondaryMaterial?.drawerBottomThickness ?? MATERIAL_THICKNESSES.MDF_6MM)}
              onChange={(v) => updateSecondaryMaterial({ drawerBottomThickness: Number(v) })}
              options={[
                { value: String(MATERIAL_THICKNESSES.HARDBOARD_3MM), label: '3mm Hardboard' },
                { value: String(MATERIAL_THICKNESSES.MDF_6MM), label: '6mm MDF' },
                { value: String(MATERIAL_THICKNESSES.QUARTER_INCH), label: '6.35mm (1/4")' },
              ]}
            />
          </div>
        </div>
      </Section>

      {/* Back Panel Section */}
      <Section title="Back Panel">
        <SelectInput
          label="Back Panel Type"
          value={config.backPanel.type}
          onChange={(v) => updateBackPanel({ type: v as BackPanelType })}
          options={[
            { value: 'applied', label: 'Applied (nailed to rear)' },
            { value: 'inset', label: 'Inset (in dado/groove)' },
            { value: 'none', label: 'None' },
          ]}
        />
        {config.backPanel.type !== 'none' && (
          <div className="grid grid-cols-2 gap-4">
            <SelectInput
              label="Back Thickness"
              value={String(config.backPanel.thickness)}
              onChange={(v) => updateBackPanel({ thickness: Number(v) })}
              options={[
                { value: String(MATERIAL_THICKNESSES.MDF_6MM), label: '6mm MDF' },
                { value: String(MATERIAL_THICKNESSES.QUARTER_INCH), label: '6.35mm (1/4")' },
                { value: String(MATERIAL_THICKNESSES.HARDBOARD_3MM), label: '3mm Hardboard' },
              ]}
            />
            {config.backPanel.type === 'inset' && (
              <NumberInput
                label="Dado Depth"
                value={config.backPanel.dadoDepth ?? 6}
                onChange={(v) => updateBackPanel({ dadoDepth: v })}
                min={3}
                max={15}
                step={0.5}
                showImperial={showImperial}
              />
            )}
          </div>
        )}
      </Section>

      {/* Adjustable Shelves Section */}
      <Section title="Adjustable Shelves">
        <Toggle
          label="Enable Shelf Pin Holes"
          checked={adjustable?.enabled ?? false}
          onChange={(v) => {
            const currentShelves = config.features.shelves;
            const nextShelves = { ...currentShelves };
            if ('adjustable' in nextShelves) nextShelves.adjustable = { ...nextShelves.adjustable, enabled: v };
            if (v && 'fixed' in nextShelves && nextShelves.fixed) {
              nextShelves.fixed = { ...nextShelves.fixed, enabled: false };
            }
            onChange({ ...config, features: { ...config.features, shelves: nextShelves } });
          }}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Disables fixed shelf dados
        </p>
        {adjustable?.enabled && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <NumberInput
              label="Number of Shelves"
              value={adjustable.count ?? 0}
              onChange={(v) => updateAdjustableShelves({ count: v })}
              min={0}
              max={10}
              unit="shelves"
            />
            <NumberInput
              label="Front Setback"
              value={adjustable.frontSetback ?? 37}
              onChange={(v) => updateAdjustableShelves({ frontSetback: v })}
              min={20}
              max={100}
              showImperial={showImperial}
            />
          </div>
        )}
      </Section>

      {/* Fixed Shelves Section */}
      <Section title="Fixed Shelves (Dados)" defaultOpen={false}>
        <Toggle
          label="Enable Fixed Shelves"
          checked={fixed?.enabled ?? false}
          onChange={(v) => {
            const currentShelves = config.features.shelves;
            const nextShelves = { ...currentShelves };
            if ('fixed' in nextShelves) nextShelves.fixed = { ...nextShelves.fixed, enabled: v };
            if (v && 'adjustable' in nextShelves && nextShelves.adjustable) {
              nextShelves.adjustable = { ...nextShelves.adjustable, enabled: false };
            }
            onChange({ ...config, features: { ...config.features, shelves: nextShelves } });
          }}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Disables adjustable shelf pin holes
        </p>
        {fixed?.enabled && (
          <div className="space-y-4 mt-4">
            <p className="text-xs text-gray-500">
              Fixed shelves are held in dado slots routed into the side panels.
              Enter positions as heights from the bottom interior (in mm), comma-separated.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Shelf Positions (mm from bottom)</label>
              <input
                type="text"
                value={fixedPositionsInput}
                onChange={(e) => setFixedPositionsInput(e.target.value)}
                onBlur={() => {
                  const positions = fixedPositionsInput
                    .split(',')
                    .map((s) => parseFloat(s.trim()))
                    .filter((n) => !isNaN(n) && n >= 0);
                  updateFixedShelves({ positions });
                }}
                placeholder="e.g. 200, 400"
                className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Dado Depth"
                value={fixed.dadoDepth ?? 6}
                onChange={(v) => updateFixedShelves({ dadoDepth: v })}
                min={3}
                max={12}
                step={0.5}
                showImperial={showImperial}
              />
              <Toggle
                label="Use Secondary Thickness"
                checked={fixed.useSecondaryMaterial ?? false}
                onChange={(v) => updateFixedShelves({ useSecondaryMaterial: v })}
              />
            </div>
            {fixed.useSecondaryMaterial && (
              <SelectInput
                label="Fixed Shelf Thickness"
                value={String(config.secondaryMaterial?.fixedShelfThickness ?? MATERIAL_THICKNESSES.HALF_INCH)}
                onChange={(v) => updateSecondaryMaterial({ fixedShelfThickness: Number(v) })}
                options={[
                  { value: String(MATERIAL_THICKNESSES.MDF_6MM), label: '6mm MDF' },
                  { value: String(MATERIAL_THICKNESSES.QUARTER_INCH), label: '6.35mm (1/4")' },
                  { value: String(MATERIAL_THICKNESSES.HALF_INCH), label: '12.7mm (1/2")' },
                  { value: String(MATERIAL_THICKNESSES.STANDARD_18MM), label: '18mm (3/4")' },
                ]}
              />
            )}
          </div>
        )}
      </Section>

      {/* Shelf Runners Section */}
      <Section title="Shelf Runners" defaultOpen={false}>
        <Toggle
          label="Enable Shelf Runners"
          checked={runners?.enabled ?? false}
          onChange={(v) => updateShelfRunners({ enabled: v })}
        />
        {runners?.enabled && (
          <div className="space-y-4 mt-4">
            <p className="text-xs text-gray-500">
              Shelf runners are wooden strips screwed to the side panels.
              Enter positions as heights from the bottom interior (in mm), comma-separated.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Runner Positions (mm from bottom)</label>
              <input
                type="text"
                value={runnerPositionsInput}
                onChange={(e) => setRunnerPositionsInput(e.target.value)}
                onBlur={() => {
                  const positions = runnerPositionsInput
                    .split(',')
                    .map((s) => parseFloat(s.trim()))
                    .filter((n) => !isNaN(n) && n >= 0);
                  updateShelfRunners({ positions });
                }}
                placeholder="e.g. 150, 350"
                className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Front Setback"
                value={runners.frontSetback ?? 50}
                onChange={(v) => updateShelfRunners({ frontSetback: v })}
                min={20}
                max={100}
                showImperial={showImperial}
              />
              <NumberInput
                label="Holes Per Runner"
                value={runners.holesPerRunner ?? 3}
                onChange={(v) => updateShelfRunners({ holesPerRunner: v })}
                min={2}
                max={6}
                unit="holes"
              />
            </div>
          </div>
        )}
      </Section>

      {/* Drawers Section */}
      <Section title="Drawers" defaultOpen={false}>
        <Toggle
          label="Enable Drawers"
          checked={config.features.drawers.enabled}
          onChange={(v) => {
            const next = {
              ...config,
              features: {
                ...config.features,
                drawers: { ...config.features.drawers, enabled: v },
              },
              predrills: { ...config.predrills },
            };
            if (v) {
              // Auto-enable slide pre-drills
              next.predrills = {
                ...next.predrills,
                slides: { ...next.predrills?.slides, enabled: true },
              };
              // Auto-disable shelf runners
              const shelves = next.features.shelves;
              if ('runners' in shelves && shelves.runners) {
                next.features = {
                  ...next.features,
                  shelves: { ...shelves, runners: { ...shelves.runners, enabled: false } },
                };
              }
            }
            onChange(next);
          }}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Enables slide pre-drills; disables shelf runners
        </p>
        {config.features.drawers.enabled && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <NumberInput
                label="Number of Drawers"
                value={config.features.drawers.count}
                onChange={(v) => updateDrawers({ count: v })}
                min={1}
                max={8}
                unit="drawers"
              />
              <NumberInput
                label="Slide Clearance"
                value={config.features.drawers.slideWidth}
                onChange={(v) => updateDrawers({ slideWidth: v })}
                min={10}
                max={20}
                step={0.1}
                showImperial={showImperial}
              />
            </div>

            {/* Drawer Pull Holes */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Pull/Handle Holes</h4>
              <SelectInput
                label="Pull Hole Type"
                value={config.features.drawers.pullHoles?.type ?? 'none'}
                onChange={(v) => updateDrawerPulls({ type: v as DrawerPullType })}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'single', label: 'Single Hole (knob)' },
                  { value: 'double', label: 'Two Holes (bar pull)' },
                ]}
              />
              {config.features.drawers.pullHoles?.type !== 'none' && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <NumberInput
                    label="Hole Diameter"
                    value={config.features.drawers.pullHoles?.holeDiameter ?? DRAWER_PULL_DEFAULTS.HOLE_DIAMETER}
                    onChange={(v) => updateDrawerPulls({ holeDiameter: v })}
                    min={3}
                    max={12}
                    step={0.5}
                    showImperial={showImperial}
                  />
                  <NumberInput
                    label="Vertical Offset"
                    value={config.features.drawers.pullHoles?.verticalOffset ?? DRAWER_PULL_DEFAULTS.VERTICAL_OFFSET}
                    onChange={(v) => updateDrawerPulls({ verticalOffset: v })}
                    min={20}
                    max={100}
                    showImperial={showImperial}
                  />
                </div>
              )}
              {config.features.drawers.pullHoles?.type === 'double' && (
                <div className="mt-3">
                  <SelectInput
                    label="Hole Spacing"
                    value={String(config.features.drawers.pullHoles?.holeSpacing ?? DRAWER_PULL_DEFAULTS.SPACING_96MM)}
                    onChange={(v) => updateDrawerPulls({ holeSpacing: Number(v) })}
                    options={[
                      { value: String(DRAWER_PULL_DEFAULTS.SPACING_64MM), label: '64mm (2.5")' },
                      { value: String(DRAWER_PULL_DEFAULTS.SPACING_96MM), label: '96mm (3.75")' },
                      { value: String(DRAWER_PULL_DEFAULTS.SPACING_128MM), label: '128mm (5")' },
                      { value: String(DRAWER_PULL_DEFAULTS.SPACING_160MM), label: '160mm (6.3")' },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Toe Kick Section */}
      <Section title="Toe Kick" defaultOpen={false}>
        <Toggle
          label="Enable Toe Kick"
          checked={config.features.toeKick.enabled}
          onChange={(v) => updateToeKick({ enabled: v })}
        />
        {config.features.toeKick.enabled && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <NumberInput
              label="Height"
              value={config.features.toeKick.height}
              onChange={(v) => updateToeKick({ height: v })}
              min={50}
              max={200}
              showImperial={showImperial}
            />
            <NumberInput
              label="Depth"
              value={config.features.toeKick.depth}
              onChange={(v) => updateToeKick({ depth: v })}
              min={25}
              max={150}
              showImperial={showImperial}
            />
          </div>
        )}
      </Section>

      {/* Pre-drills Section */}
      <Section title="Pre-Drills" defaultOpen={false}>
        {/* Assembly Pre-drills */}
        <div className="space-y-3">
          <Toggle
            label="Assembly Pre-drills"
            checked={config.predrills?.assembly?.enabled ?? false}
            onChange={(v) => updateAssemblyPredrills({ enabled: v })}
          />
          <p className="text-xs text-gray-500">
            Pre-drilled pilot holes in side panels for screwing into top/bottom panels.
          </p>
          {config.predrills?.assembly?.enabled && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Toggle
                label="Add Countersink"
                checked={config.predrills?.assembly?.countersink ?? true}
                onChange={(v) => updateAssemblyPredrills({ countersink: v })}
              />
              <NumberInput
                label="Pilot Diameter"
                value={config.predrills?.assembly?.pilotDiameter ?? 3}
                onChange={(v) => updateAssemblyPredrills({ pilotDiameter: v })}
                min={2}
                max={6}
                step={0.5}
                showImperial={showImperial}
              />
              <NumberInput
                label="Edge Distance"
                value={config.predrills?.assembly?.edgeDistance ?? 50}
                onChange={(v) => updateAssemblyPredrills({ edgeDistance: v })}
                min={20}
                max={100}
                showImperial={showImperial}
              />
              <NumberInput
                label="Screw Spacing"
                value={config.predrills?.assembly?.screwSpacing ?? 200}
                onChange={(v) => updateAssemblyPredrills({ screwSpacing: v })}
                min={50}
                max={400}
                showImperial={showImperial}
              />
            </div>
          )}
        </div>

        {/* Slide Pre-drills */}
        {config.features.drawers.enabled && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <Toggle
              label="Drawer Slide Pre-drills"
              checked={config.predrills?.slides?.enabled ?? false}
              onChange={(v) => updateSlidePredrills({ enabled: v })}
            />
            <p className="text-xs text-gray-500">
              Pre-drilled holes in side panels for mounting drawer slides.
            </p>
            {config.predrills?.slides?.enabled && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <NumberInput
                  label="Hole Diameter"
                  value={config.predrills?.slides?.holeDiameter ?? 4}
                  onChange={(v) => updateSlidePredrills({ holeDiameter: v })}
                  min={3}
                  max={8}
                  step={0.5}
                  showImperial={showImperial}
                />
                <NumberInput
                  label="Front Offset"
                  value={config.predrills?.slides?.frontOffset ?? 37}
                  onChange={(v) => updateSlidePredrills({ frontOffset: v })}
                  min={20}
                  max={100}
                  showImperial={showImperial}
                />
                <NumberInput
                  label="Hole Spacing"
                  value={config.predrills?.slides?.holeSpacing ?? 32}
                  onChange={(v) => updateSlidePredrills({ holeSpacing: v })}
                  min={20}
                  max={100}
                  showImperial={showImperial}
                />
                <NumberInput
                  label="Holes Per Slide"
                  value={config.predrills?.slides?.holesPerSlide ?? 3}
                  onChange={(v) => updateSlidePredrills({ holesPerSlide: v })}
                  min={2}
                  max={6}
                  unit="holes"
                />
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Machining Section */}
      <Section title="CNC Settings" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            label="Router Bit Diameter"
            value={String(config.machining.bitDiameter)}
            onChange={(v) => updateMachining({ bitDiameter: Number(v) })}
            options={[
              { value: String(BIT_DIAMETERS.MM_6), label: '6mm' },
              { value: String(BIT_DIAMETERS.QUARTER_INCH), label: '6.35mm (1/4")' },
              { value: String(BIT_DIAMETERS.MM_8), label: '8mm' },
              { value: String(BIT_DIAMETERS.HALF_INCH), label: '12.7mm (1/2")' },
            ]}
          />
          <SelectInput
            label="Toolpath Compensation"
            value={config.machining.compensation}
            onChange={(v) => updateMachining({ compensation: v as 'outside' | 'inside' | 'center' })}
            options={[
              { value: 'outside', label: 'Outside (parts)' },
              { value: 'inside', label: 'Inside (holes)' },
              { value: 'center', label: 'On line' },
            ]}
          />
        </div>
      </Section>
    </div>
  );
}

export default ParameterForm;
