# DOCTIO Stage 2: Objects

## Canonical Entities

### Component (Atomic Unit)
{
  "id": "string",
  "label": "string", // e.g., "Left Side Panel"
  "dimensions": "[number, number, number]", // W, H, D in mm
  "position": "[number, number, number]",
  "rotation": "[number, number, number]",
  "features": "Feature[]" // Holes, slots, or dados
}

### Assembly (Root)
{
  "globalBounds": { "w": "number", "h": "number", "d": "number" },
  "material": { "thickness": "number", "kerf": "number" },
  "machining": { "bitDiameter": "number", "compensation": "outside" },
  "components": "Component[]"
}

### Feature (Subtractive)
- **Hole:** { "type": "hole", "diameter": "number", "depth": "number", "pos": "[x, y]" }
- **Slot:** { "type": "slot", "width": "number", "depth": "number", "path": "Vector2[]" }