# DOCTIO Addendum: Cabinetry & CNC Domain Knowledge

## A. The Anatomy of the Carcass
- **Standard Joinery:** This app defaults to "Butt Joints" where the Top and Bottom plates are captured between the two Side panels.
- **Deduction Rule:** Top/Bottom width = `GlobalWidth - (2 * MaterialThickness)`.
- **The Back Panel:** Usually an "applied" back (nailed to the rear) or "inset" (slotted into a groove/dado). 
- **The "Toe Kick":** For floor-standing units, the side panels should have a 100mm x 75mm notch at the bottom front.

## B. Internal Features & Hardware
- **Adjustable Shelves:** - **Clearance:** Shelves should be 1mm narrower than the interior width to prevent binding.
    - **Shelf Pins (Plugs):** Uses 5mm holes spaced 32mm apart (System 32). 
    - **Setback:** Holes are typically inset 37mm from the front and rear internal edges.
- **Drawers:**
    - **Box Construction:** 12.7mm (1/2") clearance on each side for standard ball-bearing slides.
    - **Overlay:** Drawer fronts usually overlap the carcass frame by 19mm on all sides (Full Overlay).

## C. CNC Routing & CAM Integration
- **CAD to CAM Bridge:** The site acts as the CAD engine; the user utilizes CAM software (e.g., Vectric VCarve) to define toolpaths and G-code.
- **Layer-Based Export Strategy:** To facilitate one-click "Vector Selection" in CAM, exports must follow strict naming:
    - **Layer "OUTSIDE_CUT":** External boundaries for through-cutting.
    - **Layer "DRILL_5MM":** Center points for shelf pin drilling operations.
    - **Layer "POCKET_DADO":** Closed vectors for material subtraction (slots/grooves).
- **Workholding (Tabs):** The site does NOT generate tabs. Tabs must be applied in the CAM software during the Profile Toolpath setup.


## D. The "Inside Corner" Problem
- **Bit Geometry:** A round bit cannot cut a sharp internal 90° corner.
- **Dogbone Fillets:** The engine must automatically add circular reliefs (dogbones) at the corners of slots so square panels seat fully.


## E. User Experience & Exports
- **The "Rough and Ready" Ethos:** Prioritize speed of generation over aesthetic flourishes.
- **Cut List:** A markdown table listing every component, its final dimensions, and its label.
- **DXF/SVG Export:** Must provide a layered file where each layer corresponds to a specific CNC bit or operation.