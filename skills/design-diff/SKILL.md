---
name: design-diff
description: Compare a Figma or local reference image with a browser implementation, generate heatmap/composite diffs, and iteratively fix CSS and layout. Use for design diff, pixel accuracy, visual comparison, or matching an implementation to a supplied design.
---

# Design Diff

Compare design screenshots with the browser implementation, analyze visual mismatches, and iterate toward a measurable match.

## Inputs

Establish these before capture. Infer them when the request already supplies enough context; otherwise ask only for what is missing.

- Design source: a Figma URL when a compatible Figma MCP is available, or a local PNG directory/file.
- Implementation URL and, when relevant, the CSS selector for the target component.
- Capture method: a Codex browser capability that can save a screenshot, or the bundled Playwright script.
- Target viewport. Match the reference frame's CSS width and use 2x device scale when possible.

If the current Codex session does not expose a Figma tool, do not invent a tool name or claim to have read the file. Ask for an exported image or use a provided local design image.

## Workspace

Keep generated comparison artifacts outside the repository unless the user asks to retain them:

```text
/tmp/design-diff/<target>/
  design/reference.png
  impl/screenshot.png
  diff/heatmap.png
  diff/composite.png
```

Use a stable, filesystem-safe target name derived from the frame, component, or reference filename.

## Load the design

### Figma

When a compatible Figma MCP is available:

1. Parse the Figma file key and `node-id` from the URL.
2. Convert URL node IDs such as `123-456` to the API form `123:456` when the MCP requires it.
3. Read shallow node data first to confirm the target and its dimensions. Request deeper data only for properties needed to explain a mismatch.
4. Export the exact node as PNG into the design directory.

### Local image

Copy the selected PNG to `design/reference.png`. If a directory contains several plausible screens and the request does not identify one, ask which image is authoritative.

Record the reference pixel dimensions before capturing the implementation.

## Capture the implementation

Prefer an available Codex browser capability when it can set the viewport, reach the required authenticated state, and save the resulting screenshot to the requested path.

For a self-contained public or locally authenticated page, the bundled script is available:

```bash
node <skill-dir>/scripts/capture-impl.mjs \
  <url> \
  /tmp/design-diff/<target>/impl/screenshot.png \
  --width <css-width> \
  --scale 2
```

Useful options:

- `--height <css-height>` sets a fixed viewport height.
- `--selector <css-selector>` captures one element.
- `--full-page` captures the complete scrollable page.

The script resolves a project-local Playwright first, then `${PLAYWRIGHT_MODULE_ROOT}/node_modules`, then the global npm root (`npm root -g`). If none is available, use a Codex browser capability instead of installing dependencies without authorization.

Disable or wait out animation, wait for fonts and images, and reproduce relevant theme, locale, data, and authentication state. A comparison is meaningful only when both images represent the same UI state.

## Generate the diff

Use a heatmap diff tool that writes a heatmap, a side-by-side composite and a JSON match score. If you keep a local `heatmap_diff` Python package (a uv project with a `python -m heatmap_diff` entry point), point `HEATMAP_DIFF_PROJECT` at its folder:

```bash
uv run --project "$HEATMAP_DIFF_PROJECT" \
  python -m heatmap_diff \
  /tmp/design-diff/<target>/design/reference.png \
  /tmp/design-diff/<target>/impl/screenshot.png \
  -o /tmp/design-diff/<target>/diff/heatmap.png \
  -c /tmp/design-diff/<target>/diff/composite.png \
  --threshold 30 \
  --sensitivity 1.5
```

If no such package is available, do not install one without authorization. Use a tool that is already installed instead, for example ImageMagick (`compare -metric AE -fuzz 12% reference.png screenshot.png diff/heatmap.png`, then `magick reference.png screenshot.png diff/heatmap.png +append diff/composite.png`), or a short Pillow script that resizes nothing, marks pixels whose channel difference exceeds the threshold, and reports the matching share. Report which tool produced the score, since percentages are not comparable across tools.

With `heatmap_diff`, use `--regions '[{"name":"Header","x":0,"y":0,"w":560,"h":80}]'` when region scores make the diagnosis clearer.

Inspect the composite image and read the JSON result. Do not rely on the aggregate percentage alone.

## Diagnose mismatches

Use layout/design metadata and the source code to distinguish:

- Large solid regions: missing elements or incorrect fill/background.
- Thin edge bands: size, gap, padding, margin, border, or alignment differences.
- Shifted shapes: parent layout or positioning mismatch.
- Text-local noise: font family, weight, size, line height, antialiasing, or font-load differences.
- Widespread subtle tint: theme, opacity, color-profile, or background mismatch.

Verify image dimensions, device scale, scroll position, animations, and loaded fonts before changing production code. Capture-state mismatch is not an implementation defect.

## Fix the implementation

Use the design data as the source of truth, while preserving the project's component and token system.

For Tailwind projects:

1. Read the project's Tailwind/CSS theme definitions and inspect sibling components before editing.
2. Map colors, spacing, sizes, typography, radii, and shadows to defined tokens.
3. Prefer shared components and their variants over restyling primitives inline.
4. Use an arbitrary value only when no token fits and the codebase already uses that exact value for the same role. Report the token gap when doing so.

Do not optimize only for the screenshot by breaking responsive behavior, accessibility, interaction states, localization, or semantic markup. Run the project's relevant tests and quality checks after code changes.

## Iterate and report

After each meaningful fix, recapture the same state and rerun the diff. Continue until the user's target is met or remaining variance is explained.

Treat match thresholds as guidance, not proof:

- 90%+: generally acceptable when remaining variance is text rendering.
- 95%+: strong visual agreement.
- 97%+: unusually close for text-heavy browser/Figma comparisons.

Report:

- final match percentage and any region scores;
- reference, implementation, heatmap, and composite paths;
- viewport, scale, selector, locale/theme, and capture method;
- implementation files changed and verification run;
- remaining mismatches and whether they are capture, font-rendering, or product-code differences.

