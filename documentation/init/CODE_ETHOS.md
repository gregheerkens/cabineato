# DOCTIO Stage 3: Code Ethos

## Architectural Principles
- **Functional Geometry:** Geometry generation must be a pure function: `(Assembly) => Component[]`.
- **Top-Down Hierarchy:** Carcass -> Internal Components -> Features.
- **CNC First:** All geometry must account for the `bitDiameter`. Internal corners in slots must be "dogboned" automatically.

## Development Rules
- **No Magic Numbers:** All offsets (e.g., shelf pin inset) must be defined in the `Assembly` config.
- **Verbose Naming:** Use clear descriptors (`right_side_panel_height`) to prevent AI context drift.
- **Validation:** Clamp inputs to physical limits (e.g., shelf width cannot exceed interior carcass width).