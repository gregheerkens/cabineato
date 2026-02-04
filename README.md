# Cabineato

A parametric web application for generating "rough and ready" cabinetry and utility furniture, optimized for CNC workflows. Built with a "no muss" ethos focused on speed and function over form.

## Features

- **Parametric Cabinet Generation**: Configure dimensions, materials, and features
- **CNC-Ready Export**: SVG and DXF with layered output for Vectric and other CAM software
- **3D Preview**: Real-time visualization of cabinet assembly
- **System 32 Support**: Standard 5mm shelf pin holes at 32mm spacing
- **Dogbone Fillets**: Automatic corner relief for CNC routing
- **Cut List Generation**: Markdown-formatted parts list

### Shelf Options
- **Adjustable Shelves**: System 32 pin holes for repositionable shelves
- **Fixed Shelves**: Dados routed into side panels for permanent shelves
- **Shelf Runners**: Mounting holes for wooden shelf support strips

### Pre-drill Options
- **Assembly Pre-drills**: Pilot holes with optional countersinks for carcass assembly
- **Drawer Slide Pre-drills**: Mounting holes for drawer slides
- **Drawer Pull Holes**: Single or double holes for knobs/bar pulls (64mm-160mm spacing)

### Material Support
- Primary material thickness for carcass panels
- Secondary material settings for back panels, drawer bottoms, and fixed shelves
- Automatic dado width matching to target material thickness

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Geometry**: Maker.js
- **3D Rendering**: Three.js via React Three Fiber
- **Testing**: Vitest

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ParameterForm.tsx   # Configuration input form
│   ├── Preview3D.tsx       # Three.js 3D preview
│   ├── CutList.tsx         # Cut list display
│   └── ExportPanel.tsx     # Export buttons
├── lib/
│   ├── geometry/           # Geometry engine
│   │   ├── assembly.ts     # Main assembly builder
│   │   ├── carcass.ts      # Carcass generation + predrills
│   │   ├── shelves.ts      # Shelf pins, dados, runners
│   │   ├── drawers.ts      # Drawer boxes + pull holes
│   │   ├── backPanel.ts    # Back panel generation
│   │   └── dogbone.ts      # Corner fillets
│   ├── export/             # Export modules
│   │   ├── svg.ts          # SVG export
│   │   ├── dxf.ts          # DXF export
│   │   └── cutlist.ts      # Cut list markdown
│   └── types/              # TypeScript types & constants
└── hooks/                  # React hooks
```

## CNC Layer Convention

Exports follow Vectric-compatible layer naming:

| Layer | Purpose |
|-------|---------|
| `OUTSIDE_CUT` | External boundaries for through-cutting |
| `DRILL_5MM` | Shelf pin holes (System 32) |
| `DRILL_3MM` | Pilot holes for assembly |
| `DRILL_8MM` | Drawer pull holes |
| `POCKET_DADO` | Closed vectors for dados/grooves |
| `COUNTERSINK` | Countersink locations |

## Cabinet Features

### Carcass Construction
- Butt joint construction (top/bottom captured between sides)
- Automatic width deduction: `Width - (2 × Material Thickness)`
- Optional toe kick notches
- Assembly pre-drill holes with optional countersinks

### Shelving
- **Adjustable**: System 32 shelf pin holes (5mm diameter, 32mm spacing)
- **Fixed**: Dados routed to match shelf material thickness
- **Runners**: Mounting holes for wooden shelf support strips
- Configurable front/rear setback for all types

### Back Panel
- Applied (nailed to rear) or inset (in dado) options
- Configurable thickness and dado depth
- Dado width matches back panel material

### Drawers
- Ball-bearing slide clearance (12.7mm per side)
- Full overlay fronts
- Dado-joined bottoms (width matches material)
- Pre-drill options for drawer pulls (single/double hole)
- Slide mounting hole pre-drills

## Documentation

See the `/documentation` folder for:
- Domain specification (DOMAIN.md)
- Object definitions (OBJECTS.md)
- Code ethos (CODE_ETHOS.md)
- Test specifications (TESTS.md)
- Additional context (AdditionalContext.md)

## License

MIT
