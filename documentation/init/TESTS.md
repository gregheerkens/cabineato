# DOCTIO Stage 4: Tests (ABA Triangulation)

## Test 1: Carcass Dimensional Accuracy
- **A (High):** W=1000, T=0 | Top Panel W = 1000mm.
- **B (Target):** W=1000, T=18 | Top Panel W = 964mm (W - 2T).
- **A' (Low):** W=1000, T=500 | Top Panel W = 0mm.

## Test 2: CNC Toolpath Compensation
- **A (High):** Bit=0, Part=500 | Centerline = 500mm.
- **B (Target):** Bit=6.35, Part=500 | Centerline = 506.35mm (Outside Routing).
- **A' (Low):** Bit=20, Part=500 | Centerline = 520mm.

## Test 3: Shelf Pin Alignment
- **B (Target):** `left_panel.holes[y]` must strictly equal `right_panel.holes[y]`. Deviation > 0.01mm is a fail.