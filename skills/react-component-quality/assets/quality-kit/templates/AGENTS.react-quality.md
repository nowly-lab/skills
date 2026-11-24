<!-- react-component-quality:start -->
## React component quality (managed)

- Create components with `__RUN__ create:component -- --target <path/PascalCaseName>`; add `--with-hook` or `--with-model` only when those files own distinct behavior.
__ZUSTAND_POLICY__
- Run changed-code gates with `__RUN__ quality:react:changed` and React Doctor with `__RUN__ quality:react-doctor:changed` before review.
- Setup apply does not run verification. After installation, explicitly run `__VERIFY_COMMAND__`; treat the installation as unverified until it passes.
- File budgets are 300 lines for `.ts`, 400 for `.tsx`, 600 for `.mjs`, and 800 for tests, excluding blank/comment lines. `__RUN__ quality:max-lines` is a ratchet: existing tracked bypasses are grandfathered, new bypasses fail, and the baseline may only shrink. Remove stale entries with `__RUN__ quality:max-lines -- --prune`; never add an entry merely to make CI green.
<!-- react-component-quality:end -->
