// Maintainer tool: refresh the Orca evidence snapshot from a local checkout of
// https://github.com/stablyai/orca (MIT). Usage:
//   node scripts/snapshot-orca-quality.mjs --source /path/to/orca [--write]
// The manifest and inventory record the public repository URL and commit, never the local path.
import { createHash, randomUUID } from 'node:crypto'
import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const execFile = promisify(execFileCallback)
const qualityKitRoot = 'assets/quality-kit'
const manifestPath = join(qualityKitRoot, 'manifest.json')
const inventoryPath = 'references/orca-source-inventory.md'
export const SOURCE_REPOSITORY = 'https://github.com/stablyai/orca'
export const SOURCE_LICENSE = 'MIT License, Copyright (c) 2026 Lovecast Inc.'

export const SOURCE_DECLARATIONS = [
  ['AGENTS.md', null, 'policy', 'inventory', true],
  ['docs/STYLEGUIDE.md', null, 'style-guide', 'inventory', true],
  ['src/renderer/src/assets/main.css', null, 'token-source', 'inventory', true],
  ['src/renderer/src/components/NewWorkspaceComposerCard.tsx', null, 'representative-react-component', 'inventory', true],
  ['src/renderer/src/components/NewWorkspaceComposerCard.test.tsx', null, 'representative-react-test', 'inventory', true],
  ['src/renderer/src/components/AgentWorkingSpinner.tsx', null, 'representative-react-component', 'inventory', true],
  ['src/renderer/src/components/AgentWorkingSpinner.test.tsx', null, 'representative-react-test', 'inventory', true],
  ['src/renderer/src/App.tsx', null, 'representative-app-composition', 'inventory', true],
  ['src/renderer/src/app-shell/AppBackgroundServices.tsx', null, 'representative-background-services', 'inventory', true],
  ['src/renderer/src/app-shell/AppWorkspaceShell.tsx', null, 'representative-workspace-shell', 'inventory', true],
  ['src/renderer/src/app-shell/AppRootSurfaces.tsx', null, 'representative-lazy-loading', 'inventory', true],
  ['src/renderer/src/app-shell/use-app-startup-hydration.ts', null, 'representative-hook', 'inventory', true],
  ['src/renderer/src/components/pull-request-page/page/surface.tsx', null, 'representative-feature', 'inventory', true],
  ['src/renderer/src/components/pull-request-page-host-boundary.test.ts', null, 'representative-feature-boundary-test', 'inventory', true],
  ['src/renderer/src/components/github-item-dialog-source-boundary.test.ts', null, 'representative-feature-boundary-test', 'inventory', true],
  ['src/renderer/src/components/pull-request-page/cache/file-content.ts', null, 'representative-pure-model', 'inventory', true],
  ['src/renderer/src/components/pull-request-page/cache/file-content.test.ts', null, 'representative-model-test', 'inventory', true],
  ['src/renderer/src/components/sidebar/worktree-list/grouping/build-rows.test.ts', null, 'representative-model-test', 'inventory', true],
  ['src/renderer/src/components/sidebar/worktree-list/viewport/VirtualizedWorktreeViewport.tsx', null, 'representative-virtualization', 'inventory', true],
  ['src/renderer/src/components/sidebar/worktree-list/viewport/virtual-rows.ts', null, 'representative-pure-model', 'inventory', true],
  ['src/renderer/src/components/sidebar/worktree-list/viewport/virtual-rows.test.ts', null, 'representative-model-test', 'inventory', true],
  ['src/renderer/src/components/error-boundaries/RecoverableRenderErrorBoundary.tsx', null, 'representative-error-boundary', 'inventory', true],
  ['src/renderer/src/components/error-boundaries/RecoverableRenderErrorBoundary.lazy-chunk.test.tsx', null, 'representative-boundary-test', 'inventory', true],
  ['src/renderer/src/lib/lazy-with-retry.ts', null, 'representative-lazy-loading', 'inventory', true],
  ['src/renderer/src/store/selectors.ts', null, 'representative-selector', 'inventory', true],
  ['src/renderer/src/store/selectors.test.ts', null, 'representative-model-test', 'inventory', true],
  ['src/renderer/src/app-startup-routing.test.ts', null, 'representative-routing-test', 'inventory', true],
  ['.oxlintrc.json', null, 'oxlint-config', 'orca-only', true],
  ['config/oxlint-react-doctor.json', 'config/oxlint-react-doctor.json', 'react-doctor-config', 'portable', true],
  ['config/oxlint-code-quality-type-aware.json', 'config/oxlint-code-quality-type-aware.json', 'code-quality-config', 'conditional', true],
  ['config/oxlint-code-quality-native-plugins.json', 'config/oxlint-code-quality-native-plugins.json', 'code-quality-config', 'conditional', true],
  ['config/oxlint-plugins/app-store-performance.mjs', 'config/oxlint-plugins/app-store-performance.mjs', 'oxlint-plugin', 'conditional', true],
  ['config/oxlint-plugins/mobile-pairing-qrcode-import.mjs', null, 'oxlint-plugin', 'orca-only', true],
  ['config/oxlint-plugins/quadratic-buffer-concat.mjs', 'config/oxlint-plugins/quadratic-buffer-concat.mjs', 'oxlint-plugin', 'conditional', true],
  ['config/oxlint-plugins/renderer-scrollbar-style.mjs', null, 'oxlint-plugin', 'orca-only', true],
  ['config/scripts/oxlint-plugin-test-runner.mjs', 'config/scripts/oxlint-plugin-test-runner.mjs', 'oxlint-plugin-test-runner', 'conditional', true],
  ['config/scripts/app-store-performance-plugin.test.mjs', 'config/scripts/app-store-performance-plugin.test.mjs', 'oxlint-plugin-test', 'conditional', true],
  ['config/scripts/mobile-pairing-qrcode-import-plugin.test.mjs', null, 'oxlint-plugin-test', 'orca-only', true],
  ['config/scripts/quadratic-buffer-concat-plugin.test.mjs', 'config/scripts/quadratic-buffer-concat-plugin.test.mjs', 'oxlint-plugin-test', 'conditional', true],
  ['config/scripts/renderer-scrollbar-style-plugin.test.mjs', null, 'oxlint-plugin-test', 'orca-only', true],
  ['config/scripts/check-react-doctor-changed.mjs', 'config/scripts/check-react-doctor-changed.mjs', 'changed-code-react-doctor', 'conditional', true],
  ['config/scripts/lint-react-doctor-changed.mjs', 'config/scripts/lint-react-doctor-changed.mjs', 'changed-code-react-doctor', 'conditional', true],
  ['config/scripts/check-changed-code-quality.mjs', 'config/scripts/check-changed-code-quality.mjs', 'changed-code-quality', 'conditional', true],
  ['config/scripts/check-changed-code-quality.test.mjs', 'config/scripts/check-changed-code-quality.test.mjs', 'changed-code-quality-test', 'conditional', true],
  ['config/scripts/git-pull-request-diff-base.mjs', 'config/scripts/git-pull-request-diff-base.mjs', 'diff-base-helper', 'portable', true],
  ['config/scripts/git-pull-request-diff-base.test.mjs', 'config/scripts/git-pull-request-diff-base.test.mjs', 'diff-base-helper-test', 'portable', true],
  ['config/max-lines-baseline.txt', null, 'max-lines-baseline', 'orca-only', true],
  ['config/scripts/check-max-lines-ratchet.mjs', 'config/scripts/check-max-lines-ratchet.mjs', 'max-lines-ratchet', 'conditional', true],
  ['config/scripts/check-max-lines-ratchet.test.mjs', 'config/scripts/check-max-lines-ratchet.test.mjs', 'max-lines-ratchet-test', 'conditional', true],
  ['package.json', null, 'package-script-evidence', 'inventory', true],
  ['.github/workflows/pr.yml', null, 'ci-wiring', 'inventory', true],
  ['.github/pull_request_template.md', null, 'pr-template', 'inventory', true],
].map(([source, bundled, role, portability, required]) => Object.freeze({ source, bundled, role, portability, required }))

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex')
}

async function readContents(path) {
  try {
    return await readFile(path)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function sourceCommit(sourceRoot) {
  try {
    const { stdout } = await execFile('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'])
    return stdout.trim()
  } catch {
    return null
  }
}

async function writeAtomically(path, contents) {
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`
  await writeFile(temporaryPath, contents)
  await rename(temporaryPath, path)
}

async function wouldChange(path, contents) {
  const current = await readContents(path)
  return current === null || !current.equals(contents)
}

function sourceUrl(commit, path) {
  const kind = path.endsWith('/') ? 'tree' : 'blob'
  return `${SOURCE_REPOSITORY}/${kind}/${commit ?? 'main'}/${path}`
}

function inventoryMarkdown(report) {
  const sourcePath = (path) => `[\`${path}\`](${sourceUrl(report.sourceCommit, path)})`
  const lines = [
    '# Orca React Quality Source Inventory',
    '',
    `Source repository: ${SOURCE_REPOSITORY}`,
    `Source commit: \`${report.sourceCommit ?? 'unavailable'}\``,
    `License: ${SOURCE_LICENSE} (see [NOTICE](../NOTICE))`,
    `Generated at: ${report.generatedAt}`,
    '',
    'Orca is an open-source Electron app by Lovecast Inc. (stablyai/orca). Every `Source` value is a path inside that repository at the commit above. Bundled assets under `assets/quality-kit/` are unmodified copies of those files; inventory-only entries are recorded by path and hash so you can read them in the Orca repository.',
    '',
    '| Source | Role | Portability | Bundled asset | SHA-256 | Required |',
    '| --- | --- | --- | --- | --- | --- |',
    ...report.entries.map((entry) => `| \`${entry.source}\` | ${entry.role} | ${entry.portability} | ${entry.bundled ? `\`${entry.bundled}\`` : 'inventory only'} | \`${entry.sha256}\` | ${entry.required ? 'yes' : 'no'} |`),
    '',
    'Portability is an installation contract: portable entries may be reused unchanged; conditional entries are source-backed mechanisms that require target-project adaptation; orca-only entries are Orca-app specifics (its own root config, its file-path baseline, rules for its own modules and CSS classes), kept only as evidence in the Orca repository and never bundled or copied into a target project. Inventory-only entries document policy and CI context without a bundled asset.',
    '',
    '## Architecture and Boundary Evidence',
    '',
    `- App composition and lifetime: ${sourcePath('src/renderer/src/App.tsx')}`,
    `- nonvisual root services: ${sourcePath('src/renderer/src/app-shell/AppBackgroundServices.tsx')}`,
    `- workspace shell: ${sourcePath('src/renderer/src/app-shell/AppWorkspaceShell.tsx')}`,
    `- lazy/recoverable root surfaces: ${sourcePath('src/renderer/src/app-shell/AppRootSurfaces.tsx')}`,
    `- app-shell lifecycle implementations: ${sourcePath('src/renderer/src/app-shell/')}`,
    `- pull-request workflow domains: ${sourcePath('src/renderer/src/components/pull-request-page/')}`,
    `- pull-request workflow feature: ${sourcePath('src/renderer/src/components/pull-request-page/page/surface.tsx')}`,
    `- pull-request host contract: ${sourcePath('src/renderer/src/components/pull-request-page-host-boundary.test.ts')}`,
    `- GitHub item-dialog lifecycle domains: ${sourcePath('src/renderer/src/components/github-item-dialog/')}`,
    `- GitHub item-dialog host/import contract: ${sourcePath('src/renderer/src/components/github-item-dialog-source-boundary.test.ts')}`,
    `- worktree-list interaction domains: ${sourcePath('src/renderer/src/components/sidebar/worktree-list/')}`,
    `- worktree-list interaction and viewport boundary: ${sourcePath('src/renderer/src/components/sidebar/worktree-list/viewport/VirtualizedWorktreeViewport.tsx')}`,
    `- recoverable boundary: ${sourcePath('src/renderer/src/components/error-boundaries/RecoverableRenderErrorBoundary.tsx')}`,
    `- retrying lazy import: ${sourcePath('src/renderer/src/lib/lazy-with-retry.ts')}`,
    '',
    '## State, Effects, Performance, and UI Evidence',
    '',
    `- focused selectors, shallow action selection, abort, cancellation, and cleanup: ${sourcePath('src/renderer/src/app-shell/use-app-startup-hydration.ts')}`,
    `- isolated background subscriptions: ${sourcePath('src/renderer/src/app-shell/AppBackgroundServices.tsx')}`,
    `- reusable focused selectors: ${sourcePath('src/renderer/src/store/selectors.ts')}`,
    `- viewport virtualization and measurement: ${sourcePath('src/renderer/src/components/sidebar/worktree-list/viewport/VirtualizedWorktreeViewport.tsx')} and ${sourcePath('src/renderer/src/components/sidebar/worktree-list/viewport/virtual-rows.ts')}`,
    `- UI policy: ${sourcePath('AGENTS.md')}`,
    `- style roles and resolution order: ${sourcePath('docs/STYLEGUIDE.md')}`,
    `- canonical tokens: ${sourcePath('src/renderer/src/assets/main.css')}`,
    `- shadcn/Radix primitives: ${sourcePath('src/renderer/src/components/ui/')}`,
    `- form/keyboard interaction example: ${sourcePath('src/renderer/src/components/NewWorkspaceComposerCard.tsx')}`,
    '',
    '## Testing Evidence',
    '',
    `- accessible component behavior: ${sourcePath('src/renderer/src/components/NewWorkspaceComposerCard.test.tsx')}`,
    `- static markup behavior: ${sourcePath('src/renderer/src/components/AgentWorkingSpinner.test.tsx')}`,
    `- pure cache model: ${sourcePath('src/renderer/src/components/pull-request-page/cache/file-content.test.ts')}`,
    `- pure grouping model: ${sourcePath('src/renderer/src/components/sidebar/worktree-list/grouping/build-rows.test.ts')}`,
    `- pure virtualization model: ${sourcePath('src/renderer/src/components/sidebar/worktree-list/viewport/virtual-rows.test.ts')}`,
    `- selector behavior: ${sourcePath('src/renderer/src/store/selectors.test.ts')}`,
    `- recoverable lazy-boundary behavior: ${sourcePath('src/renderer/src/components/error-boundaries/RecoverableRenderErrorBoundary.lazy-chunk.test.tsx')}`,
    `- lazy-loading and startup routing contract: ${sourcePath('src/renderer/src/app-startup-routing.test.ts')}`,
    `- browser/Electron suites and configuration: ${sourcePath('tests/e2e/')} and ${sourcePath('tests/playwright.config.ts')}`,
    '',
    '## Quality Gate and Policy Evidence',
    '',
    `- root written policy: ${sourcePath('AGENTS.md')}`,
    `- package commands and dependency pins: ${sourcePath('package.json')}`,
    `- root and custom Oxlint configuration: ${sourcePath('.oxlintrc.json')}, ${sourcePath('config/oxlint-code-quality-native-plugins.json')}, and ${sourcePath('config/oxlint-code-quality-type-aware.json')}`,
    `- custom plugin and contract example: ${sourcePath('config/oxlint-plugins/app-store-performance.mjs')} and ${sourcePath('config/scripts/app-store-performance-plugin.test.mjs')}`,
    `- changed-code gate: ${sourcePath('config/scripts/check-changed-code-quality.mjs')} and ${sourcePath('config/scripts/check-changed-code-quality.test.mjs')}`,
    `- changed-lines React Doctor gate: ${sourcePath('config/scripts/check-react-doctor-changed.mjs')}`,
    `- React Doctor lint config: ${sourcePath('config/oxlint-react-doctor.json')}`,
    `- diff-base behavior: ${sourcePath('config/scripts/git-pull-request-diff-base.mjs')} and ${sourcePath('config/scripts/git-pull-request-diff-base.test.mjs')}`,
    `- ratchet implementation and tests: ${sourcePath('config/scripts/check-max-lines-ratchet.mjs')} and ${sourcePath('config/scripts/check-max-lines-ratchet.test.mjs')}`,
    `- historical suppression baseline: ${sourcePath('config/max-lines-baseline.txt')}`,
    `- PR CI enforcement: ${sourcePath('.github/workflows/pr.yml')}`,
    `- required reviewer evidence: ${sourcePath('.github/pull_request_template.md')}`,
    '',
  ]
  return Buffer.from(lines.join('\n'))
}

function manifestContents(report) {
  return Buffer.from(`${JSON.stringify({
    sourceRepository: SOURCE_REPOSITORY,
    sourceLicense: SOURCE_LICENSE,
    sourceCommit: report.sourceCommit,
    generatedAt: report.generatedAt,
    entries: report.entries,
  }, null, 2)}\n`)
}

export async function buildSnapshot({ sourceRoot, skillRoot, write }) {
  if (!sourceRoot) throw new Error('buildSnapshot requires sourceRoot')
  if (!skillRoot) throw new Error('buildSnapshot requires skillRoot')

  const resolvedSourceRoot = resolve(sourceRoot)
  const resolvedSkillRoot = resolve(skillRoot)
  const entries = []
  const pendingWrites = []
  const changedPaths = []

  for (const declaration of SOURCE_DECLARATIONS) {
    const sourcePath = join(resolvedSourceRoot, declaration.source)
    const contents = await readContents(sourcePath)
    if (contents === null) {
      if (declaration.required) throw new Error(`Required Orca source is missing: ${declaration.source}`)
      continue
    }

    const entry = { ...declaration, sha256: sha256(contents) }
    entries.push(entry)
    if (!entry.bundled) continue

    const destination = join(resolvedSkillRoot, qualityKitRoot, entry.bundled)
    if (await wouldChange(destination, contents)) {
      changedPaths.push(relative(resolvedSkillRoot, destination))
      pendingWrites.push([destination, contents])
    }
  }

  const manifestDestination = join(resolvedSkillRoot, manifestPath)
  const inventoryDestination = join(resolvedSkillRoot, inventoryPath)
  const sourceRevision = await sourceCommit(resolvedSourceRoot)
  const previousManifest = await readContents(manifestDestination)
  let generatedAt = new Date().toISOString()
  if (previousManifest !== null) {
    try {
      const previous = JSON.parse(previousManifest.toString('utf8'))
      if (
        previous.sourceRepository === SOURCE_REPOSITORY &&
        previous.sourceCommit === sourceRevision &&
        JSON.stringify(previous.entries) === JSON.stringify(entries)
      ) {
        generatedAt = previous.generatedAt
      }
    } catch {
      // A malformed prior manifest is replaced by the explicit writer.
    }
  }
  const report = {
    sourceRoot: resolvedSourceRoot,
    sourceCommit: sourceRevision,
    generatedAt,
    entries,
    changedPaths,
  }
  const manifest = manifestContents(report)
  const inventory = inventoryMarkdown(report)

  if (await wouldChange(manifestDestination, manifest)) {
    report.changedPaths.push(manifestPath)
    pendingWrites.push([manifestDestination, manifest])
  }
  if (await wouldChange(inventoryDestination, inventory)) {
    report.changedPaths.push(inventoryPath)
    pendingWrites.push([inventoryDestination, inventory])
  }

  if (write) await Promise.all(pendingWrites.map(([path, contents]) => writeAtomically(path, contents)))
  return report
}

export async function verifySnapshot({ sourceRoot, skillRoot }) {
  if (!skillRoot) throw new Error('verifySnapshot requires skillRoot')
  const resolvedSkillRoot = resolve(skillRoot)
  const resolvedSourceRoot = sourceRoot ? resolve(sourceRoot) : null
  const manifest = await readContents(join(resolvedSkillRoot, manifestPath))
  if (manifest === null) throw new Error(`Snapshot manifest is missing: ${manifestPath}`)

  const errors = []
  let manifestEntries = []
  try {
    const parsedManifest = JSON.parse(manifest.toString('utf8'))
    if (!Array.isArray(parsedManifest.entries)) {
      errors.push('Manifest entries must be an array')
    } else {
      manifestEntries = parsedManifest.entries
    }
  } catch {
    errors.push('Manifest JSON is invalid')
  }
  const declarationsBySource = new Map(SOURCE_DECLARATIONS.map((entry) => [entry.source, entry]))
  const manifestEntriesBySource = new Map()

  for (const entry of manifestEntries) {
    const declaration = declarationsBySource.get(entry?.source)
    if (!declaration) {
      errors.push(`Unexpected manifest declaration: ${entry?.source ?? 'unknown'}`)
      continue
    }
    if (manifestEntriesBySource.has(entry.source)) {
      errors.push(`Duplicate manifest declaration: ${entry.source}`)
      continue
    }
    manifestEntriesBySource.set(entry.source, entry)
    if (
      entry.bundled !== declaration.bundled ||
      entry.role !== declaration.role ||
      entry.portability !== declaration.portability ||
      entry.required !== declaration.required
    ) {
      errors.push(`Manifest declaration mismatch: ${entry.source}`)
    }
    if (typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      errors.push(`Manifest hash is invalid: ${entry.source}`)
    }
  }
  for (const declaration of SOURCE_DECLARATIONS) {
    if (declaration.required && !manifestEntriesBySource.has(declaration.source)) {
      errors.push(`Missing required declaration: ${declaration.source}`)
    }
  }
  const entries = []

  for (const declaration of SOURCE_DECLARATIONS) {
    const manifestEntry = manifestEntriesBySource.get(declaration.source)
    if (!manifestEntry) continue
    const entry = { ...declaration, sha256: manifestEntry.sha256 }
    let matchesBundledHash = true
    let matchesSourceHash = true
    if (entry.bundled) {
      const bundled = await readContents(join(resolvedSkillRoot, qualityKitRoot, entry.bundled))
      matchesBundledHash = bundled !== null && sha256(bundled) === entry.sha256
      if (!matchesBundledHash) errors.push(`Bundled asset drift: ${entry.bundled}`)
    }
    if (resolvedSourceRoot) {
      const source = await readContents(join(resolvedSourceRoot, entry.source))
      matchesSourceHash = source !== null && sha256(source) === entry.sha256
      if (!matchesSourceHash) errors.push(`Source drift: ${entry.source}`)
    }
    entries.push({ ...entry, matchesBundledHash, matchesSourceHash })
  }

  return { skillRoot: resolvedSkillRoot, sourceRoot: resolvedSourceRoot, entries, errors }
}

function parseArguments(argv) {
  const sourceIndex = argv.indexOf('--source')
  return {
    sourceRoot: sourceIndex === -1 ? process.cwd() : argv[sourceIndex + 1],
    write: argv.includes('--write'),
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { sourceRoot, write } = parseArguments(process.argv.slice(2))
  const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const report = await buildSnapshot({ sourceRoot, skillRoot, write })
  const status = write ? 'Snapshot written' : 'Drift only (rerun with --write to update)'
  console.log(`${status}: ${report.changedPaths.length === 0 ? 'none' : report.changedPaths.join(', ')}`)
}
