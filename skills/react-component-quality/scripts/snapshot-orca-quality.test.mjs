import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { buildSnapshot, verifySnapshot } from './snapshot-orca-quality.mjs'

const fixtureFiles = [
  'AGENTS.md',
  'docs/STYLEGUIDE.md',
  'src/renderer/src/assets/main.css',
  'src/renderer/src/components/NewWorkspaceComposerCard.tsx',
  'src/renderer/src/components/NewWorkspaceComposerCard.test.tsx',
  'src/renderer/src/components/AgentWorkingSpinner.tsx',
  'src/renderer/src/components/AgentWorkingSpinner.test.tsx',
  'src/renderer/src/App.tsx',
  'src/renderer/src/app-shell/AppBackgroundServices.tsx',
  'src/renderer/src/app-shell/AppWorkspaceShell.tsx',
  'src/renderer/src/app-shell/AppRootSurfaces.tsx',
  'src/renderer/src/app-shell/use-app-startup-hydration.ts',
  'src/renderer/src/components/pull-request-page/page/surface.tsx',
  'src/renderer/src/components/pull-request-page-host-boundary.test.ts',
  'src/renderer/src/components/github-item-dialog-source-boundary.test.ts',
  'src/renderer/src/components/pull-request-page/cache/file-content.ts',
  'src/renderer/src/components/pull-request-page/cache/file-content.test.ts',
  'src/renderer/src/components/sidebar/worktree-list/grouping/build-rows.test.ts',
  'src/renderer/src/components/sidebar/worktree-list/viewport/VirtualizedWorktreeViewport.tsx',
  'src/renderer/src/components/sidebar/worktree-list/viewport/virtual-rows.ts',
  'src/renderer/src/components/sidebar/worktree-list/viewport/virtual-rows.test.ts',
  'src/renderer/src/components/error-boundaries/RecoverableRenderErrorBoundary.tsx',
  'src/renderer/src/components/error-boundaries/RecoverableRenderErrorBoundary.lazy-chunk.test.tsx',
  'src/renderer/src/lib/lazy-with-retry.ts',
  'src/renderer/src/store/selectors.ts',
  'src/renderer/src/store/selectors.test.ts',
  'src/renderer/src/app-startup-routing.test.ts',
  '.oxlintrc.json',
  'config/oxlint-react-doctor.json',
  'config/oxlint-code-quality-type-aware.json',
  'config/oxlint-code-quality-native-plugins.json',
  'config/oxlint-plugins/app-store-performance.mjs',
  'config/oxlint-plugins/mobile-pairing-qrcode-import.mjs',
  'config/oxlint-plugins/quadratic-buffer-concat.mjs',
  'config/oxlint-plugins/renderer-scrollbar-style.mjs',
  'config/scripts/oxlint-plugin-test-runner.mjs',
  'config/scripts/app-store-performance-plugin.test.mjs',
  'config/scripts/mobile-pairing-qrcode-import-plugin.test.mjs',
  'config/scripts/quadratic-buffer-concat-plugin.test.mjs',
  'config/scripts/renderer-scrollbar-style-plugin.test.mjs',
  'config/scripts/check-react-doctor-changed.mjs',
  'config/scripts/lint-react-doctor-changed.mjs',
  'config/scripts/check-changed-code-quality.mjs',
  'config/scripts/check-changed-code-quality.test.mjs',
  'config/scripts/git-pull-request-diff-base.mjs',
  'config/scripts/git-pull-request-diff-base.test.mjs',
  'config/max-lines-baseline.txt',
  'config/scripts/check-max-lines-ratchet.mjs',
  'config/scripts/check-max-lines-ratchet.test.mjs',
  'package.json',
  '.github/workflows/pr.yml',
  '.github/pull_request_template.md',
]

async function createOrcaFixture() {
  const root = await mkdtemp(join(tmpdir(), 'orca-quality-source-'))

  await Promise.all(fixtureFiles.map(async (relativePath) => {
    const target = join(root, relativePath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, `fixture:${relativePath}\n`)
  }))

  return root
}

test('buildSnapshot plans an Orca quality snapshot without writing assets', async (t) => {
  const sourceRoot = await createOrcaFixture()
  const skillRoot = await mkdtemp(join(tmpdir(), 'react-component-quality-skill-'))
  t.after(() => Promise.all([rm(sourceRoot, { recursive: true, force: true }), rm(skillRoot, { recursive: true, force: true })]))

  const report = await buildSnapshot({ sourceRoot, skillRoot, write: false })

  assert.equal(report.entries.some((entry) => entry.source === 'AGENTS.md'), true)
  assert.equal(report.entries.some((entry) => entry.role === 'ci-wiring'), true)
  assert.equal(report.entries.some((entry) => entry.source === 'config/scripts/check-changed-code-quality.mjs'), true)
  assert.equal(report.entries.find((entry) => entry.source === '.oxlintrc.json')?.portability, 'orca-only')
  assert.equal(report.entries.find((entry) => entry.source === 'config/max-lines-baseline.txt')?.portability, 'orca-only')
  assert.equal(report.changedPaths.length > 0, true)
  assert.equal(existsSync(join(skillRoot, 'assets/quality-kit/manifest.json')), false)
})

test('buildSnapshot inventories representative architecture, state, performance, and test evidence', async (t) => {
  const sourceRoot = await createOrcaFixture()
  const skillRoot = await mkdtemp(join(tmpdir(), 'react-component-quality-skill-'))
  t.after(() => Promise.all([rm(sourceRoot, { recursive: true, force: true }), rm(skillRoot, { recursive: true, force: true })]))

  const report = await buildSnapshot({ sourceRoot, skillRoot, write: true })
  const inventory = await readFile(join(skillRoot, 'references/orca-source-inventory.md'), 'utf8')
  const expectedRoles = [
    'representative-feature',
    'representative-feature-boundary-test',
    'representative-hook',
    'representative-pure-model',
    'representative-error-boundary',
    'representative-lazy-loading',
    'representative-selector',
    'representative-virtualization',
    'representative-model-test',
    'representative-boundary-test',
    'representative-routing-test',
  ]

  for (const role of expectedRoles) {
    const entries = report.entries.filter((entry) => entry.role === role)
    assert.equal(entries.length > 0, true, `missing ${role}`)
    assert.equal(entries.every((entry) => entry.bundled === null), true, `${role} must remain inventory-only`)
    assert.equal(entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256)), true, `${role} must be hashed`)
  }

  const headings = [
    '## Architecture and Boundary Evidence',
    '## State, Effects, Performance, and UI Evidence',
    '## Testing Evidence',
    '## Quality Gate and Policy Evidence',
  ]
  let previousIndex = -1
  for (const heading of headings) {
    const index = inventory.indexOf(heading)
    assert.equal(index > previousIndex, true, `${heading} must be generated in a stable order`)
    previousIndex = index
  }

  const link = (path) => `[\`${path}\`](https://github.com/stablyai/orca/blob/main/${path})`
  assert.equal(inventory.includes(`App composition and lifetime: ${link('src/renderer/src/App.tsx')}`), true)
  assert.equal(inventory.includes(`focused selectors, shallow action selection, abort, cancellation, and cleanup: ${link('src/renderer/src/app-shell/use-app-startup-hydration.ts')}`), true)
  assert.equal(inventory.includes(`pure cache model: ${link('src/renderer/src/components/pull-request-page/cache/file-content.test.ts')}`), true)
  assert.equal(inventory.includes(`PR CI enforcement: ${link('.github/workflows/pr.yml')}`), true)
  assert.equal(inventory.includes('MIT License, Copyright (c) 2026 Lovecast Inc.'), true)
})

test('buildSnapshot never records the local source path and keeps Orca-only files unbundled', async (t) => {
  const sourceRoot = await createOrcaFixture()
  const skillRoot = await mkdtemp(join(tmpdir(), 'react-component-quality-skill-'))
  t.after(() => Promise.all([rm(sourceRoot, { recursive: true, force: true }), rm(skillRoot, { recursive: true, force: true })]))

  const report = await buildSnapshot({ sourceRoot, skillRoot, write: true })
  const manifest = await readFile(join(skillRoot, 'assets/quality-kit/manifest.json'), 'utf8')
  const inventory = await readFile(join(skillRoot, 'references/orca-source-inventory.md'), 'utf8')

  assert.equal(manifest.includes(sourceRoot), false)
  assert.equal(inventory.includes(sourceRoot), false)
  assert.equal(JSON.parse(manifest).sourceRepository, 'https://github.com/stablyai/orca')
  for (const entry of report.entries.filter((item) => item.portability === 'orca-only')) {
    assert.equal(entry.bundled, null, `${entry.source} must not be bundled`)
    assert.equal(existsSync(join(skillRoot, 'assets/quality-kit', entry.source)), false)
  }
})

test('verifySnapshot succeeds from bundled assets when sourceRoot is absent', async (t) => {
  const sourceRoot = await createOrcaFixture()
  const skillRoot = await mkdtemp(join(tmpdir(), 'react-component-quality-skill-'))
  t.after(() => Promise.all([rm(sourceRoot, { recursive: true, force: true }), rm(skillRoot, { recursive: true, force: true })]))

  await buildSnapshot({ sourceRoot, skillRoot, write: true })
  const report = await verifySnapshot({ skillRoot })

  assert.deepEqual(report.errors, [])
  assert.equal(report.entries.every((entry) => entry.matchesBundledHash), true)
})

test('buildSnapshot reports no drift after writing an unchanged source snapshot', async (t) => {
  const sourceRoot = await createOrcaFixture()
  const skillRoot = await mkdtemp(join(tmpdir(), 'react-component-quality-skill-'))
  t.after(() => Promise.all([rm(sourceRoot, { recursive: true, force: true }), rm(skillRoot, { recursive: true, force: true })]))

  await buildSnapshot({ sourceRoot, skillRoot, write: true })
  const report = await buildSnapshot({ sourceRoot, skillRoot, write: false })

  assert.deepEqual(report.changedPaths, [])
})

async function writeManifest(skillRoot, transform) {
  const manifestPath = join(skillRoot, 'assets/quality-kit/manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  await writeFile(manifestPath, `${JSON.stringify(transform(manifest), null, 2)}\n`)
}

test('verifySnapshot rejects empty, incomplete, extra, and tampered manifests', async (t) => {
  const sourceRoot = await createOrcaFixture()
  const skillRoot = await mkdtemp(join(tmpdir(), 'react-component-quality-skill-'))
  t.after(() => Promise.all([rm(sourceRoot, { recursive: true, force: true }), rm(skillRoot, { recursive: true, force: true })]))

  await buildSnapshot({ sourceRoot, skillRoot, write: true })

  await writeManifest(skillRoot, () => ({}))
  let report = await verifySnapshot({ skillRoot })
  assert.equal(report.errors.some((error) => error.includes('Manifest entries must be an array')), true)

  await writeFile(join(skillRoot, 'assets/quality-kit/manifest.json'), '{"entries":')
  report = await verifySnapshot({ skillRoot })
  assert.equal(report.errors.includes('Manifest JSON is invalid'), true)

  await buildSnapshot({ sourceRoot, skillRoot, write: true })
  await writeManifest(skillRoot, (manifest) => ({ ...manifest, entries: [] }))
  report = await verifySnapshot({ skillRoot })
  assert.equal(report.errors.includes('Missing required declaration: AGENTS.md'), true)

  await buildSnapshot({ sourceRoot, skillRoot, write: true })
  await writeManifest(skillRoot, (manifest) => ({
    ...manifest,
    entries: manifest.entries.filter((entry) => entry.source !== 'AGENTS.md'),
  }))
  report = await verifySnapshot({ skillRoot })
  assert.equal(report.errors.includes('Missing required declaration: AGENTS.md'), true)

  await buildSnapshot({ sourceRoot, skillRoot, write: true })
  await writeManifest(skillRoot, (manifest) => ({
    ...manifest,
    entries: [...manifest.entries, { ...manifest.entries[0], source: 'unexpected.mjs' }],
  }))
  report = await verifySnapshot({ skillRoot })
  assert.equal(report.errors.some((error) => error.includes('Unexpected manifest declaration: unexpected.mjs')), true)

  await buildSnapshot({ sourceRoot, skillRoot, write: true })
  await writeManifest(skillRoot, (manifest) => ({
    ...manifest,
    entries: manifest.entries.map((entry) => entry.source === 'AGENTS.md' ? { ...entry, role: 'tampered' } : entry),
  }))
  report = await verifySnapshot({ skillRoot })
  assert.equal(report.errors.includes('Manifest declaration mismatch: AGENTS.md'), true)
})
