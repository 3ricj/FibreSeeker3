# Rocket Slicer — Changelog

A history of changes for Rocket Slicer, the slicer for the FibreSeeker 3 continuous-fiber 3D printer.

---

## Rocket Slicer 1.4.1 — October 2026 (Hotfix)

> *Source: [FIBRESEEK Wiki — Rocket Slicer 1.4.1 Release Note](https://wiki.fibreseek3d.com/en/software/rocket-slicer/release-notes/rs-v141)*

This hotfix improves slicing performance, progress and cancellation handling, and G-code correctness, and adds new infill capabilities and UI features.

### Major New Features

- Added pause before layer start.
- Added basic model creation: cubes, cylinders, spheres, tori, and other primitives from the context menu.
- Redesigned the printer control page with a printer status panel and improved display of temperatures, print progress, layer counts, and filenames.
- Added a Pro mode toggle that controls access to Fortified mode and the visibility of related parameters.
- Added eleven new sparse infill patterns, each requiring individual validation: Lateral Grid, Lateral Triangles, Lateral Honeycomb, Octahedral Cells, Cuboidal Cells, Lateral Zigzag, Lateral Diagonal, Adaptive Cubic, Support Cubic, Alternating Line, and Lightning.
- Added multi-line infill via a new Multi-Line parameter (default 1, range 1–10). Supported for most patterns including Line, Grid, Triangles, Concentric, Honeycomb, TriHexagon, Gyroid, 3D Honeycomb, all lateral cell-based patterns, Cubic variants, Cross Hatch, Hilbert Curve, Archimedean Chords, Octagram Spiral, Diamond, TPMS FK, Alternating Line, and Lightning. Excluded: Zigzag, Lateral Zigzag, Lateral Diagonal, Primitive, Neovius, and Lidinoid.
- Added infill anchors via new Anchor Length (default 2 mm) and Maximum Anchor Length (default 20 mm) parameters, range 0–1000 mm; 0 disables anchors. Concentric does not support anchors, and Zigzag, Lateral Zigzag, and Lateral Diagonal are not in the anchor support list. Some continuous planar patterns may not generate anchors above 50% infill density.
- Added pattern-specific parameters: Lateral Grid Angle 1/2, Lateral Triangles Side Angle, Lateral Honeycomb Overhang Angle, Octahedral Side Angle, Octahedral Minimum Interlayer Overlap, Cuboidal Height Ratio, and Lightning Overhang, Pruning, and Straightening angles.

### Correctness Fixes

- Removed the `M1001` and `M1002` commands.
- Fixed the extruder using the first-layer temperature when switching from a fiber layer to a plastic layer.
- Fixed top-layer generation failures and missing topmost infill after the migration to floating-point geometry.
- Fixed missing synchronization of bridge and fiber candidates before ownership is finalized.
- Corrected the plastic extrusion area and skin parameter mappings.
- Preserved the coasting state and entity type when switching between model paths and legacy plastic paths, and model ownership during top/bottom surface classification and infill generation.
- Restored per-layer time information in G-code.
- Retract before issuing the `M400` command during tool changes.
- Optimized printing time.
- Fixed incorrect mask intersection calculations: region errors caused by relying solely on bounding boxes are resolved by using actual geometric intersections.
- Fixed incomplete validation after model repair; repair results are rechecked after rebuilding the geometry.
- Fixed insufficient model placement margins: Brim/Skirt margins are now accounted for during import, arrangement, and position adjustments, preventing large models from exceeding the build area after centering.
- Fixed hidden models occupying placement space when positioning new models.
- Fixed inconsistent top-view orientation when clicking the top face of the view cube.

### Performance, Progress, and Cancellation

- Replaced repeated linear contour scans with indexed queries; adjusted per-layer task scheduling and limited infill concurrency.
- Reduced temporary object allocations during streaming and post-processing; pre-quantized geometry for overhang region containment checks; reused clipping subjects, prepared results, and support carriers.
- Added detailed performance diagnostics, disabled by default in production builds.
- Provided more granular progress reporting for input preparation, slicing, infill, support generation, and post-processing.
- Extended cancellation checks into mesh processing, infill, support generation, and post-processing, with proper resource release and state cleanup after a canceled slice.

### UI and Rendering Improvements

- Added reference model controls in preview: show/hide reference models and adjust their opacity.
- Added five STP import accuracy levels — Coarse, Low, Medium, High, and Fine — with updated accuracy parameters, descriptions, and compatibility handling for legacy settings.
- Made the title bar device icon clickable and adjusted list button visibility based on whether a printer is linked.
- Used Chinese time units consistently in material usage statistics and per-layer timing.
- Improved macOS graphics compatibility by migrating legacy GPU settings and restoring the default graphics backend so legacy software-rendering settings no longer affect WebGPU initialization.

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

## Rocket Slicer 1.3.2 — July 2026

> *Source: [FIBRESEEK Wiki — Rocket Slicer 1.3.2 Public Release Note](https://wiki.fibreseek3d.com/en/software/rocket-slicer/release-notes/rs-v132)*

### New/Updated Material Profiles

- Added new material profiles for PA and PPS.
- Optimized the material profiles for PETG and PET-GF.

### Bug Fixes

- Fixed an issue where plastic perimeters could extend beyond the model boundary under certain conditions.
- Fixed an issue where, after enabling adaptive fiber perimeter count, fiber infill segments could be generated outside the outer shell and overlap with the solid infill associated with the fiber perimeters.
- Fixed an issue where the plastic and fiber extrusion compensation factors were not set to the default value of 1.0 after opening older projects.

---

## Rocket Slicer 1.3.1 — July 2026

> *Source: [FIBRESEEK Wiki — Rocket Slicer 1.3.1 Public Release Note](https://wiki.fibreseek3d.com/en/software/rocket-slicer/release-notes/rs-v131)*

### New Features

- Added new parameters related to micro infill.
- Added separate plastic and fiber extrusion compensation ratios, allowing the extrusion amounts to be adjusted independently. The default value is 1.0, with an effective range of approximately 0.01–2.0.
- Added Overhang Infill controls, including infill pattern, extrusion multiplier, line width, speed, infill angle, and extension distance. Overhang infill toolpaths can now be viewed and toggled independently in the preview.
- Added parameters related to Replace Fiber Plastic Solid.
- Replaced the previous fiber perimeter count setting with separate inner and outer contour settings, and moved them to the commonly used parameters section.
- Added the "Place Fiber Seam at the End of the Longest Edge" option. When enabled, other seam position adjustment options are automatically disabled to prevent conflicts.
- Added three new top surface infill patterns: Hilbert Curve, Archimedean Chords, and Octagram Spiral.

### Experience Improvements

- Fixed an issue where printer acceleration and other parameters could be incorrectly set to excessively low values, such as 50, when opening or importing legacy 3MF files or older projects.
- Missing new parameters in older projects are now automatically populated with reasonable default values, reducing parameter errors and slicing result deviations after import.
- Fixed an issue where templates contained in a project could not be exported after opening the project.

---

## Rocket Slicer 1.3.0 — July 2026

> *Historical entry — details available in the [Rocket Slicer Quick Start Guide V1.3.0](Documentation/Rocket%20Slicer%20Quick%20Start%20Guide%20V1.3.0%202026-07-11.pdf).*
