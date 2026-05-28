# Ship Models

This directory contains GLTF 3D models for different ship classes.

## Ship Types

- `scout.gltf` - Fast, agile scout ship
- `freighter.gltf` - Heavy cargo transport
- `warship.gltf` - Combat vessel
- `explorer.gltf` - Long-range exploration ship

## Adding Models

Place your GLTF files in this directory with the corresponding filenames. The ShipModel component will automatically load them based on the ship class.

If no model file is found, the component will use a fallback geometric representation.
