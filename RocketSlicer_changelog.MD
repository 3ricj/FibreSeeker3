# Rocket Slicer — Changelog

A history of changes for Rocket Slicer, the slicer for the FibreSeeker 3 continuous-fiber 3D printer.

---

## Rocket Slicer 1.4.0 — September 2026

This update focuses on improving slicing quality for complex models, continuous fiber printing, preview and analysis tools, and overall application stability.

### Improved Slicing Quality

- Added adaptive-width walls and gap infill for thin walls, narrow gaps, and complex contours.
- Reworked region ownership and physical-overlap arbitration across top/bottom surfaces, bridges, overhangs, fiber perimeters, solid infill, and sparse infill. This reduces missing paths, duplicate paths, overlaps, and incorrect path takeover.
- Fixed first-layer "Bottom Most" generation, zero-bottom-layer behavior, adaptive-fiber ownership, overlapping adaptive-fiber rings, Top Intermediate regions incorrectly occupied by fiber perimeters, and skin-fill endpoint alignment.
- Improved overhang, bridge, dynamic slowdown, short-layer cooling slowdown, curl-risk slowdown, and wall-speed smoothing strategies for high-speed printing.
- Improved multiple infill algorithms and consolidated Gap Infill diagnostics into a single debug log.

### Enhanced Support Generation

- Improved tree-support branching, model avoidance, build-plate connections, base stability, slender structures, and small overhangs.
- Continued development of tree supports, key-region support, tiny-overhang filtering, support wall/interface parameters, and Clipper2-based support and sparse-infill geometry.

### Continuous Fiber Printing Improvements

- Improved fiber perimeters, seams, hole boundaries, solid infill paths, and first-layer fiber-region handling.
- Enhanced Isogrid, Anisogrid, and adaptive-fiber planning; reduced duplicate, out-of-bounds, overlapping, and failed fiber paths.
- Restructured the fiber-perimeter tree model and added regression coverage for clearer geometry and path analysis.

### Upgraded G-code Preview

- Added color schemes for speed, flow, layer height, and estimated layer time, plus true line-width rendering, toolpath visibility controls, and printhead visualization.
- Continued preview/workspace refactoring with embedded-thumbnail support, render-buffer/resource cleanup, camera ownership, layer-height normalization, color-scale controls, stale-slice invalidation, out-of-bounds warnings, and improved large-file interaction. These changes remain in feature branches pending merge and performance validation.

### Better Model and Project Workflows

- Added native STEP import and improved 3MF compatibility, model repair, large-file import, recent files, system file associations, and legacy-project handling.
- Added file-dialog path memory and storage-file recovery validation; improved sample-model/workspace entry points.
- Improved slice progress from percentage-only feedback to percentage plus stage messages, and explicitly unsubscribe completion events to avoid long-run accumulation.

### Profiles and Presets

- Upgraded multi-mode profiles and material/process presets.
- Added short-layer cooling slowdown defaults to PETG, PETG GF, PA CF, PPS CF, and PLA; aligned slowdown and extrusion-compensation fields across Speedy, ReinForced, and Fortified profiles.
- Added curl-risk slowdown and wall-speed smoothing controls, synchronized through frontend DTOs, backend persistence/migration, engine settings, Hub updates, and project import.
- Improved parameter dependencies, legacy key migration, override/base consistency, unsaved-change prompts, and preset editing/import/export workflows.

### Improved 3D Visualization

- Enhanced scene lighting, materials, shadows, anti-aliasing, model thumbnails, and G-code toolpaths.
- Optimized scene resource management and preview switching; ongoing GPU/render-worker and memory work requires final large-file validation.

### Updates, Installation, and Stability

- Improved version checks, release notes, safe restart, shutdown, installation/uninstallation messages, file associations, and application-data migration.
- Fixed project loading/saving, configuration synchronization, legacy compatibility, preview rendering, fan-command ordering, and progress-event lifecycle issues.

---

## Rocket Slicer 1.3.0 — July 2026

> *Historical entry — details available in the [Rocket Slicer Quick Start Guide V1.3.0](Documentation/Rocket%20Slicer%20Quick%20Start%20Guide%20V1.3.0%202026-07-11.pdf).*
