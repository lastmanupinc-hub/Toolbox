# Collection Map — avery-pay-platform

Generated: 2026-04-05T07:37:21.799Z

## Collection Overview

A curated set of generative art pieces derived from the structure,
metrics, and architecture of avery-pay-platform.

## Pieces

### 1. Dependency Network

- **Type**: Force-directed graph
- **Nodes**: 11 (entry points + hotspots)
- **Edges**: Based on import graph density
- **Color mapping**: Language → hue
- **Animation**: Continuous force simulation
- **Source**: generative-sketch.ts

### 2. Language Ring

- **Type**: Concentric ring visualization
- **Rings**: One per language, radius ∝ LOC percentage
  - Go: 73.4% → radius 220px
  - YAML: 9.6% → radius 29px
  - Svelte: 6.6% → radius 20px
  - TypeScript: 4.2% → radius 13px
  - Markdown: 3.4% → radius 10px
  - SQL: 1.2% → radius 4px
  - HTML: 0.7% → radius 2px
  - JSON: 0.2% → radius 1px
  - PowerShell: 0.2% → radius 1px
  - Shell: 0.2% → radius 1px
  - CSS: 0.1% → radius 0px
  - JavaScript: 0% → radius 0px
  - Dockerfile: 0% → radius 0px
  - XML: 0% → radius 0px
  - TOML: 0% → radius 0px
- **Animation**: Slow rotation, pulse on interaction

### 3. Architecture Terrain

- **Type**: Topographic height map
- **Elevation**: Architecture score 0/100 → height multiplier
- **Ridges**: containerized
- **Animation**: Perlin noise drift

### 4. Hotspot Constellation

- **Type**: Star field / particle system
- **Stars**: 10 hotspot files
- **Brightest stars (highest risk)**:
  - `frontend/src/lib/api/types.ts` (risk: 1.0, connections: 103)
  - `frontend/src/lib/api/client.ts` (risk: 1.0, connections: 103)
  - `trust-fabric-frontend/src/lib/api/types.ts` (risk: 1.0, connections: 104)
  - `trust-fabric-frontend/src/lib/api/client.ts` (risk: 1.0, connections: 104)
  - `archive/trust-fabric-frontend/src/lib/api/client.ts` (risk: 0.9, connections: 18)
- **Brightness**: risk_score mapped to luminosity
- **Size**: inbound + outbound connections
- **Animation**: Twinkling, slow drift

## Collection Metadata

| Property | Value |
|----------|-------|
| Total Pieces | 4 |
| Source Project | avery-pay-platform |
| Data Points | 27 |
| Render Target | Canvas 2D / WebGL |
| Parameter Pack | parameter-pack.json |
