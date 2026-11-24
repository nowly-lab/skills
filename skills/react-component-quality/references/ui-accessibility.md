# UI and Accessibility

## Build from Existing Contracts

Use the target project's primitives and semantic tokens before custom controls or literal colors. In Orca, the policy points UI work to the style guide, canonical CSS tokens, and shadcn primitives; see [Orca source inventory](orca-source-inventory.md#state-effects-performance-and-ui-evidence). Treat that as evidence of Orca's convention, not permission to copy its palette into another project.

For forms, pair labels, descriptions, validation, and errors with programmatic relationships. Use native controls when possible; otherwise preserve focus, role, name, state, keyboard operation, and disabled behavior. Icon-only actions need an accessible name and usually a tooltip. A tooltip supplements a name; it does not replace one.

## Interaction Checklist

- keyboard: logical tab order, Enter/Space semantics, Escape, arrow navigation where the widget pattern requires it;
- focus: visible focus, intentional initial/return focus, no focus loss across portals or lazy mounts;
- IME: do not submit on Enter while `isComposing`; test composition start/end around shortcuts;
- async latency: acknowledge the action immediately, prevent ambiguous duplicates, preserve error/retry context;
- cross-platform: inspect Ctrl/Meta shortcuts, path separators, native drag regions, portal/window behavior, and platform-specific labels;
- responsive/zoom: no clipped controls or unreachable content at supported sizes and zoom levels.

For visible changes, record before/after visual proof and perform a real interaction pass in addition to DOM assertions. Use browser or Electron E2E when portals, window chrome, native drag/drop, filesystem dialogs, or OS shortcuts are part of the contract.
