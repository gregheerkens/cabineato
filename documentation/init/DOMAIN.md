# DOCTIO Stage 1: Domain

## Project: Cabineato (Working Title)
A parametric web app for generating "rough and ready" cabinetry and utility furniture.

## Problem Statement
Makers need a low-friction way to generate assembly-ready cut lists and CNC toolpaths for functional storage without the overhead of professional CAD software.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Geometry Engine:** Make.js
- **Rendering:** Three.js (via React Three Fiber)
- **Deployment:** Vercel

## Scope & Goals
- Parametric "Box" generation (Carcass).
- CNC-aware logic: Outside-of-the-line routing, bit compensation, and dogbone fillets.
- Internal features: Adjustable shelves via plug-style shelf pins and slots/dados.
- Export: SVG/DXF for CNC routing and simple text-based cut lists.

## Constraints
- **Primary Tool:** CNC Router.
- **Unit System:** Internal Metric (mm), display-only Imperial.
- **Non-Goals:** High-fidelity photorealistic rendering or complex decorative joinery.