'use client';

/**
 * 3D Preview Component
 *
 * Renders the cabinet assembly in 3D using React Three Fiber.
 * Supports orbit controls and component highlighting.
 */

import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Assembly, Component, ComponentRole } from '@/lib/types';

/**
 * Color mapping for component roles
 */
const ROLE_COLORS: Record<ComponentRole, string> = {
  side_panel_left: '#8B4513',    // Saddle brown
  side_panel_right: '#8B4513',
  top_panel: '#A0522D',          // Sienna
  bottom_panel: '#A0522D',
  back_panel: '#D2B48C',         // Tan
  shelf: '#DEB887',              // Burlywood
  drawer_front: '#CD853F',       // Peru
  drawer_side: '#F5DEB3',        // Wheat
  drawer_back: '#F5DEB3',
  drawer_bottom: '#FFE4C4',      // Bisque
};

/**
 * Single panel component
 */
function Panel({
  component,
  selected,
  onSelect,
}: {
  component: Component;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  const [width, height, depth] = component.dimensions;
  const [posX, posY, posZ] = component.position;

  // Convert mm to scene units (1 unit = 100mm for better viewing)
  const scale = 0.01;

  const color = ROLE_COLORS[component.role] || '#888888';

  return (
    <mesh
      position={[
        (posX + width / 2) * scale,
        (posY + height / 2) * scale,
        (posZ + depth / 2) * scale,
      ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(component.id);
      }}
    >
      <boxGeometry args={[width * scale, height * scale, depth * scale]} />
      <meshStandardMaterial
        color={color}
        transparent={selected}
        opacity={selected ? 0.8 : 1}
        emissive={selected ? '#ffffff' : '#000000'}
        emissiveIntensity={selected ? 0.2 : 0}
      />
    </mesh>
  );
}

/**
 * Assembly view component
 */
function AssemblyView({
  assembly,
  selectedId,
  onSelectComponent,
  exploded = false,
}: {
  assembly: Assembly;
  selectedId?: string;
  onSelectComponent?: (id: string) => void;
  exploded?: boolean;
}) {
  // Calculate center offset to center the assembly
  const centerOffset = useMemo(() => {
    const { w, h, d } = assembly.config.globalBounds;
    return {
      x: -w / 2 * 0.01,
      y: -h / 2 * 0.01,
      z: -d / 2 * 0.01,
    };
  }, [assembly.config.globalBounds]);

  // Apply explosion offset based on component role
  const getExplosionOffset = (role: ComponentRole): [number, number, number] => {
    if (!exploded) return [0, 0, 0];

    const offset = 0.5; // 50mm explosion offset
    switch (role) {
      case 'side_panel_left':
        return [-offset, 0, 0];
      case 'side_panel_right':
        return [offset, 0, 0];
      case 'top_panel':
        return [0, offset, 0];
      case 'bottom_panel':
        return [0, -offset, 0];
      case 'back_panel':
        return [0, 0, offset];
      case 'shelf':
        return [0, 0, -offset * 0.5];
      default:
        return [0, 0, 0];
    }
  };

  return (
    <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
      {assembly.components.map((component) => {
        const [ex, ey, ez] = getExplosionOffset(component.role);
        return (
          <group key={component.id} position={[ex, ey, ez]}>
            <Panel
              component={component}
              selected={selectedId === component.id}
              onSelect={onSelectComponent}
            />
          </group>
        );
      })}
    </group>
  );
}

/**
 * Loading fallback
 */
function LoadingFallback() {
  return (
    <Html center>
      <div className="text-gray-500 text-sm">Loading 3D preview...</div>
    </Html>
  );
}

/**
 * Scene setup with lights and controls
 */
function Scene({
  assembly,
  selectedId,
  onSelectComponent,
  exploded,
}: {
  assembly: Assembly;
  selectedId?: string;
  onSelectComponent?: (id: string) => void;
  exploded: boolean;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Grid helper */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6e6e6e"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        position={[0, -3, 0]}
      />

      {/* Assembly */}
      <Suspense fallback={<LoadingFallback />}>
        <AssemblyView
          assembly={assembly}
          selectedId={selectedId}
          onSelectComponent={onSelectComponent}
          exploded={exploded}
        />
      </Suspense>

      {/* Controls */}
      <OrbitControls
        makeDefault
        minDistance={2}
        maxDistance={20}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />
    </>
  );
}

/**
 * Main Preview3D Component
 */
export interface Preview3DProps {
  assembly: Assembly;
  selectedComponentId?: string;
  onSelectComponent?: (id: string) => void;
  className?: string;
}

export function Preview3D({
  assembly,
  selectedComponentId,
  onSelectComponent,
  className = '',
}: Preview3DProps) {
  const [exploded, setExploded] = React.useState(false);

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {/* Controls overlay */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button
          onClick={() => setExploded(!exploded)}
          className={`px-3 py-1 text-sm rounded ${
            exploded
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          {exploded ? 'Assembled' : 'Exploded'}
        </button>
      </div>

      {/* Component info overlay */}
      {selectedComponentId && (
        <div className="absolute bottom-2 left-2 z-10 bg-white/90 px-3 py-2 rounded shadow-sm">
          <p className="text-sm font-medium">
            {assembly.components.find((c) => c.id === selectedComponentId)?.label}
          </p>
          <p className="text-xs text-gray-500">
            {assembly.components
              .find((c) => c.id === selectedComponentId)
              ?.dimensions.map((d) => `${d}mm`)
              .join(' × ')}
          </p>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        shadows
        onClick={() => onSelectComponent?.('')}
      >
        <Scene
          assembly={assembly}
          selectedId={selectedComponentId}
          onSelectComponent={onSelectComponent}
          exploded={exploded}
        />
      </Canvas>
    </div>
  );
}

export default Preview3D;
