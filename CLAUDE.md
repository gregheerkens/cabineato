# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cabineato is a parametric web app for generating CNC-ready cabinetry. It takes an `AssemblyConfig` and produces cut lists, 3D previews, and SVG/DXF exports for CNC routing. All internal units are millimeters; imperial is display-only.

## Commands

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, ESLint 9)
npm test             # Vitest in watch mode
npm run test:run     # Vitest single run
```

Run a single test file:
```bash
npx vitest run src/lib/geometry/assembly.test.ts
```

## Architecture

### Data Flow

```
AssemblyConfig → validateConfig() → buildAssembly() → Assembly
                                                        ↓
                              UI (useAssembly hook) ← components[]
                                    ↓                    ↓
                              Preview3D (Three.js)   Export (SVG/DXF/CutList)
```

### Core Pipeline (`src/lib/geometry/`)

`buildAssembly()` in `assembly.ts` is the main orchestrator — a pure function: `(AssemblyConfig) => Assembly`. It calls generators in order:

1. **Carcass** (`carcass.ts`) — Side panels, top, bottom. Butt joints: top/bottom width = overall width minus 2× material thickness.
2. **Back Panel** (`backPanel.ts`) — Applied (nailed to rear) or inset (seated in dado). Inset mode adds dado features to side panels.
3. **Shelves** (`shelves.ts`) — System 32 shelf pin holes (5mm at 32mm spacing, 37mm setback), fixed shelf dados, adjustable shelf components.
4. **Drawers** (`drawers.ts`) — Drawer boxes with fronts, sides, back, bottom, pull holes, slide mounting holes.
5. **Dogbones** (`dogbone.ts`) — Automatic circular reliefs at internal 90° corners for CNC router bit clearance.

### Type System (`src/lib/types/`)

- `assembly.ts` — All types: `Assembly`, `Component`, `Feature` (Hole/Slot/Notch/Countersink), `AssemblyConfig`, `Vector2`, `Vector3`
- `constants.ts` — All magic numbers: `SYSTEM_32`, `MATERIAL_THICKNESSES`, `BIT_DIAMETERS`, `DRAWER_DEFAULTS`, `TOLERANCES`, etc.

### Export Layer (`src/lib/export/`)

- `svg.ts` — Layered SVG via Maker.js, grouped by CNC layer with bit diameter compensation
- `dxf.ts` — DXF export (Vectric VCarve compatible layer naming)
- `cutlist.ts` — Markdown table with dimensions, material, and optional imperial conversion

### CNC Layer Convention

Layers map to CAM operations: `OUTSIDE_CUT`, `DRILL_SHELF_PIN`, `DRILL_ASSEMBLY`, `DRILL_SLIDE`, `COUNTERSINK`, `POCKET_DADO`.

### UI (`src/components/`)

- `ParameterForm.tsx` — Multi-section config form (dimensions, material, machining, back panel, shelves, drawers, toe kick, pre-drills)
- `Preview3D.tsx` — Three.js 3D preview via React Three Fiber (dynamically imported to avoid SSR)
- `CutList.tsx` — Interactive cut list table
- `ExportPanel.tsx` — SVG/DXF/cut list download buttons

### State Management

`useAssembly` hook (`src/hooks/useAssembly.ts`) — manages config, runs validation, memoizes assembly generation. Returns config, assembly, validation results, and setters.

## DOCTIO Protocol

This project follows **DOCTIO** (Domain, Objects, Code Ethos, Tests, Implementation, Optimization) — a task-level micro-workflow for AI-assisted development. Specification artifacts live in `documentation/`:

- `documentation/init/DOMAIN.md` — Problem statement, scope, constraints
- `documentation/init/OBJECTS.md` — Canonical entity definitions (Component, Assembly, Feature)
- `documentation/init/CODE_ETHOS.md` — Architectural rules
- `documentation/init/TESTS.md` — ABA triangulation test specs
- `documentation/init/AdditionalContext.md` — CNC/cabinetry domain knowledge
- `documentation/seed/DOCTIO.md` — Full protocol definition

**Hierarchy for conflict resolution:** Domain > Objects > Code Ethos > Tests > Implementation > Optimization. If stages conflict, defer to the earlier one and ask for clarification.

## Key Rules

- **Functional geometry:** All geometry functions must be pure — `(AssemblyConfig) => Assembly`. No side effects.
- **No magic numbers:** All constants must be in `src/lib/types/constants.ts`.
- **Verbose naming:** Use descriptive names like `right_side_panel_height` to prevent context drift.
- **CNC-first:** All geometry must account for `bitDiameter`. Internal corners in slots get dogbone fillets automatically.
- **Validation at entry:** `validateConfig()` clamps inputs to physical limits before generation.
- **ABA triangulation:** Tests define behavior corridors with high anchor (A), target (B), and low anchor (A'). When a test fails, classify the drift (high/low/spec inconsistency/global) before fixing.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4
- Three.js via @react-three/fiber + @react-three/drei
- Maker.js for geometry/SVG generation
- Vitest for testing
- Path alias: `@/*` maps to `./src/*`
