import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  auditReactQuality,
  countCodeLines,
  formatAuditMarkdown,
} from './audit-react-quality.mjs'

async function fixture(t, files, packageJson = {}) {
  const parent = await mkdtemp(join(tmpdir(), 'react quality audit '))
  const root = join(parent, 'project with spaces')
  await mkdir(root, { recursive: true })
  await writeFile(join(root, 'package.json'), `${JSON.stringify({
    packageManager: 'npm@10.0.0',
    dependencies: { react: '^19', ...(packageJson.dependencies ?? {}) },
    ...packageJson,
  }, null, 2)}\n`)
  await writeFile(join(root, 'package-lock.json'), '{}\n')
  for (const [relativePath, contents] of files) {
    const path = join(root, relativePath)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, contents)
  }
  spawnSync('git', ['init', '-q'], { cwd: root })
  spawnSync('git', ['add', '.'], { cwd: root })
  t.after(() => rm(parent, { recursive: true, force: true }))
  return { parent, root }
}

function ids(report) {
  return report.findings.map((finding) => finding.id)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function installFakeOxlint(root, { exitCode = null, stdout = null, stderr = '' } = {}) {
  const packageDirectory = join(root, 'node_modules/oxlint')
  await mkdir(join(packageDirectory, 'bin'), { recursive: true })
  await writeFile(join(packageDirectory, 'package.json'), `${JSON.stringify({ name: 'oxlint', bin: { oxlint: 'bin/oxlint.js' } })}\n`)
  await writeFile(join(packageDirectory, 'bin/oxlint.js'), [
    '#!/usr/bin/env node',
    "import { readFileSync } from 'node:fs'",
    "const source = process.argv.filter((value) => /\\.tsx?$/.test(value)).map((value) => readFileSync(value, 'utf8')).join('\\n')",
    "const diagnostics = source.includes('.map(') ? [{ message: 'allocating selector' }] : []",
    stdout === null ? "process.stdout.write(JSON.stringify({ diagnostics }))" : `process.stdout.write(${JSON.stringify(stdout)})`,
    `process.stderr.write(${JSON.stringify(stderr)})`,
    exitCode === null ? 'process.exitCode = diagnostics.length > 0 ? 1 : 0' : `process.exitCode = ${exitCode}`,
    '',
  ].join('\n'))
  await chmod(join(packageDirectory, 'bin/oxlint.js'), 0o755)
  await mkdir(join(root, 'node_modules/.bin'), { recursive: true })
  await symlink('../oxlint/bin/oxlint.js', join(root, 'node_modules/.bin/oxlint'))
}

async function installManagedScriptFiles(root, overrides = {}) {
  const scripts = {
    'check-changed-code-quality.mjs': 'process.exitCode = 0\n',
    'check-react-doctor-changed.mjs': 'process.exitCode = 99\n',
    'check-max-lines-ratchet.mjs': 'process.exitCode = 0\n',
    ...overrides,
  }
  for (const [name, source] of Object.entries(scripts)) {
    const path = join(root, '.react-quality/scripts', name)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, source)
  }
  await mkdir(join(root, '.react-quality/config'), { recursive: true })
  const config = '{}\n'
  await writeFile(join(root, '.react-quality/config/oxlint-react-quality.json'), config)
  return Object.fromEntries([
    ...Object.entries(scripts).map(([name, source]) => [`.react-quality/scripts/${name}`, sha256(source)]),
    ['.react-quality/config/oxlint-react-quality.json', sha256(config)],
  ].sort(([left], [right]) => left.localeCompare(right)))
}

function validManifest(scripts, overrides = {}) {
  const manifest = {
    schemaVersion: 2,
    profiles: ['react-core', 'typescript'],
    createdPaths: [],
    updatedPaths: [],
    managedFiles: {},
    maxLinesBaselineEntries: [],
    managedPackageScripts: {
      'create:component': 'node .react-quality/scripts/scaffold-component.mjs',
      'quality:react': 'oxlint --config .react-quality/config/oxlint-react-quality.json .',
      'quality:react:changed': 'node .react-quality/scripts/check-changed-code-quality.mjs',
      'quality:react-doctor:changed': 'node .react-quality/scripts/check-react-doctor-changed.mjs',
      'quality:max-lines': 'node .react-quality/scripts/check-max-lines-ratchet.mjs',
      ...scripts,
    },
    agentsMarkers: {
      start: '<!-- react-component-quality:start -->',
      end: '<!-- react-component-quality:end -->',
    },
    installedAt: null,
    ...overrides,
  }
  manifest.snapshotHash = Object.hasOwn(overrides, 'snapshotHash')
    ? overrides.snapshotHash
    : sha256(JSON.stringify(manifest.managedFiles))
  return manifest
}

async function writeValidInstallation(root, overrides = {}) {
  const managedFiles = await installManagedScriptFiles(root, overrides.scriptSources)
  const manifest = validManifest(overrides.scripts ?? {}, { ...overrides.manifest, managedFiles })
  await mkdir(join(root, '.react-quality'), { recursive: true })
  await writeFile(join(root, '.react-quality/installation.json'), `${JSON.stringify(manifest)}\n`)
  return manifest
}

async function realChangedCodeScriptSources() {
  return {
    'check-changed-code-quality.mjs': await readFile(new URL('../assets/quality-kit/scripts/check-changed-code-quality.mjs', import.meta.url), 'utf8'),
    'git-pull-request-diff-base.mjs': await readFile(new URL('../assets/quality-kit/scripts/git-pull-request-diff-base.mjs', import.meta.url), 'utf8'),
  }
}

async function realMaxLinesScriptSources() {
  return {
    'check-max-lines-ratchet.mjs': await readFile(new URL('../assets/quality-kit/scripts/check-max-lines-ratchet.mjs', import.meta.url), 'utf8'),
    'max-lines-suppressions.mjs': await readFile(new URL('../assets/quality-kit/scripts/max-lines-suppressions.mjs', import.meta.url), 'utf8'),
  }
}

test('counts code lines like max-lines budgets while excluding blank and comment-only lines', () => {
  const source = [
    '',
    '// comment',
    '/* block',
    ' * comment',
    ' */',
    'const url = "https://example.test/path" // trailing comment',
    'const marker = "/* text in a string */"',
    'const template = `// text in a template`',
    'value /* trailing block comment */',
    '',
  ].join('\n')

  assert.equal(countCodeLines(source), 4)
})

test('reports bounded exact lifecycle, literal color, and alternative icon evidence with a stable source/test census', async (t) => {
  const listeners = Array.from({ length: 45 }, (_, index) => [
    `src/Listener${String(index).padStart(2, '0')}.tsx`,
    `import { useEffect } from 'react'\nexport function Listener${index}() { useEffect(() => { window.addEventListener('resize', onResize${index}) }, []); return <div style={{ color: '#ff00aa' }} /> }\n`,
  ])
  const { root } = await fixture(t, [
    ...listeners,
    ['src/Clean.tsx', "import { useEffect } from 'react'\nexport function Clean() { useEffect(() => { const timer = setInterval(tick, 10); return () => clearInterval(timer) }, []); return null }\n"],
    ['src/icons.tsx', "import { FaBeer } from 'react-icons/fa'\nexport const Icon = FaBeer\n"],
    ['src/heuristic.tsx', "export const Maybe = () => <div className=\"bg-[#123456]\" />\n"],
    ['src/Listener00.test.tsx', 'export {}\n'],
    ['src/model.spec.ts', 'export {}\n'],
    ['src/legacy.test.js', 'export {}\n'],
  ])

  const report = await auditReactQuality({ projectRoot: root })
  const cleanup = report.findings.find((item) => item.id === 'effect-cleanup-missing')
  const colors = report.findings.find((item) => item.id === 'hardcoded-color')
  const icons = report.findings.find((item) => item.id === 'alternative-icon-import')
  const arbitraryColor = report.findings.find((item) => item.id === 'hardcoded-color-review')

  assert.equal(cleanup.kind, 'deterministic')
  assert.match(cleanup.evidence, /Listener00\.tsx/)
  assert.match(cleanup.evidence, /5 more lifecycle occurrences omitted/)
  assert.doesNotMatch(cleanup.evidence, /Clean\.tsx/)
  assert.equal(colors.kind, 'deterministic')
  assert.equal(icons.kind, 'deterministic')
  assert.match(icons.evidence, /react-icons\/fa/)
  assert.equal(arbitraryColor.kind, 'review-candidate')
  assert.deepEqual(report.summary.census, {
    sourceFiles: 48,
    testFiles: 3,
    byExtension: { '.js': 1, '.ts': 1, '.tsx': 49 },
  })
  assert.deepEqual(ids(report), [...ids(report)].sort())

  const markdown = formatAuditMarkdown(report)
  assert.match(markdown, /Source\/test census: 48 source, 3 test/)
  assert.match(markdown, /Extensions: \.js=1, \.ts=1, \.tsx=49/)
})

test('keeps unprovable effect cleanup as a review candidate and accepts matching cleanup', async (t) => {
  const { root } = await fixture(t, [
    ['src/Effects.tsx', [
      "import { useEffect } from 'react'",
      'export function Effects() {',
      "  useEffect(() => { const off = bus.subscribe(sync); return () => off() }, [])",
      "  useEffect(() => { window.addEventListener(eventName, handler); return () => cleanupUnknownThing() }, [])",
      "  useEffect(() => { const timer = setTimeout(sync, 10); return () => cleanupTimer(timer) }, [])",
      '  useEffect(buildLifecycle(options), [options])',
      '  return null',
      '}',
      '',
    ].join('\n')],
  ])

  const report = await auditReactQuality({ projectRoot: root })

  assert.equal(ids(report).includes('effect-cleanup-missing'), false)
  const review = report.findings.find((item) => item.id === 'effect-cleanup-review')
  assert.equal(review?.kind, 'review-candidate')
  assert.match(review.evidence, /Effects\.tsx:4/)
  assert.match(review.evidence, /Effects\.tsx:5/)
})

test('proves unassigned known lifecycle resources lack cleanup without matching comments', async (t) => {
  const { root } = await fixture(t, [
    ['src/Timer.tsx', "import { useEffect } from 'react'\nexport function Timer() { useEffect(() => { setInterval(tick, 10) }, []); return null }\n"],
    ['src/Observer.tsx', "import { useEffect } from 'react'\nexport function Observer() { useEffect(() => { new ResizeObserver(sync).observe(node) }, []); return null }\n"],
    ['src/Comment.tsx', "import { useEffect } from 'react'\nexport function Comment() { useEffect(() => { /* setTimeout(fake, 1) */ return () => {} }, []); return null }\n"],
  ])

  const report = await auditReactQuality({ projectRoot: root })
  const missing = report.findings.find((item) => item.id === 'effect-cleanup-missing')

  assert.match(missing.evidence, /Timer\.tsx/)
  assert.match(missing.evidence, /Observer\.tsx/)
  assert.doesNotMatch(missing.evidence, /Comment\.tsx/)
  assert.equal(ids(report).includes('effect-cleanup-review'), false)
})

test('reports deterministic budgets, ratchet and wiring gaps plus review-only component and feature boundaries', async (t) => {
  const oversized = `${Array.from({ length: 401 }, (_, index) => `export const line${index} = ${index}`).join('\n')}\n`
  const { root } = await fixture(t, [
    ['.react-quality/config/max-lines-baseline.txt', '# grandfathered\ninline src/legacy.ts\n'],
    ['src/legacy.ts', '/* oxlint-disable max-lines -- legacy */\nexport const legacy = true\n'],
    ['src/new-bypass.ts', '/* oxlint-disable max-lines */\nexport const bypass = true\n'],
    ['src/LargePanel.tsx', oversized],
    ['src/UntestedCard.tsx', 'export function UntestedCard() { return <section /> }\n'],
    ['src/features/alpha/index.ts', "export { alpha } from './internal'\n"],
    ['src/features/alpha/internal.ts', "import { alpha } from './index'\nimport { beta } from '../beta'\nexport const alpha = beta\n"],
    ['src/features/beta/index.ts', "import { alpha } from '../alpha'\nexport const beta = alpha\n"],
    ['src/features/gamma/index.ts', 'export const gamma = true\n'],
    ['src/features/delta/index.ts', 'export const delta = true\n'],
    ['src/features/epsilon/index.ts', 'export const epsilon = true\n'],
    ['src/features/dashboard/view.ts', [
      "import { alpha } from '../alpha'",
      "import { beta } from '../beta'",
      "import { gamma } from '../gamma'",
      "import { delta } from '../delta'",
      "import type { epsilon } from '../epsilon'",
      'export const dashboard = [alpha, beta, gamma, delta]',
      '',
    ].join('\n')],
  ])

  const report = await auditReactQuality({ projectRoot: root })

  assert.equal(report.findings.some((finding) => finding.id === 'max-lines-budget' && finding.kind === 'deterministic'), true)
  assert.equal(report.findings.find((finding) => finding.id === 'max-lines-budget').evidence.includes('401 counted lines; budget 400'), true)
  assert.equal(report.findings.some((finding) => finding.id === 'max-lines-ratchet' && /src\/new-bypass\.ts/.test(finding.evidence)), true)
  assert.equal(report.findings.some((finding) => finding.id === 'changed-code-quality-wiring'), true)
  assert.equal(report.findings.some((finding) => finding.id === 'react-doctor-wiring'), true)
  assert.equal(report.findings.some((finding) => finding.id === 'agents-quality-policy'), true)
  assert.equal(report.findings.some((finding) => finding.id === 'component-test-coverage' && finding.kind === 'review-candidate'), true)
  assert.equal(report.findings.some((finding) => finding.id === 'feature-dependency-cycle' && finding.kind === 'review-candidate'), true)
  assert.equal(report.findings.some((finding) => finding.id === 'inward-public-barrel-import' && finding.kind === 'review-candidate'), true)
  assert.equal(report.findings.some((finding) => finding.id === 'sibling-domain-coupling' && /alpha, beta, delta, gamma/.test(finding.evidence)), true)
  assert.deepEqual(ids(report), [...ids(report)].sort())
  assert.equal(report.summary.deterministic > 0, true)
  assert.equal(report.summary.reviewCandidates > 0, true)
  assert.deepEqual(report.commands, [])
})

test('labels grandfathered oversized files, excludes ratchet self-fixtures, and bounds evidence', async (t) => {
  const files = [
    ['config/max-lines-baseline.txt', 'inline src/legacy.ts\n'],
    ['config/scripts/check-max-lines-ratchet.mjs', "const fixture = 'oxlint-disable max-lines'\n"],
    ['config/scripts/check-max-lines-ratchet.test.mjs', "const fixture = 'eslint-disable max-lines'\n"],
    ['src/legacy.ts', `/* oxlint-disable max-lines */\n${'export const legacy = true\n'.repeat(301)}`],
    ...Array.from({ length: 60 }, (_, index) => [
      `src/large-${String(index).padStart(2, '0')}.ts`,
      'export const value = true\n'.repeat(301),
    ]),
  ]
  const { root } = await fixture(t, files)

  const report = await auditReactQuality({ projectRoot: root })
  const budget = report.findings.find((item) => item.id === 'max-lines-budget')

  assert.match(budget.evidence, /src\/legacy\.ts.*grandfathered/)
  assert.match(budget.evidence, /more oversized file/)
  assert.equal(budget.evidence.length < 8_000, true)
  assert.equal(ids(report).includes('max-lines-ratchet'), false)
})

test('treats baselined mobile max-lines overrides as grandfathered and reports only new bumps', async (t) => {
  const mobileConfig = {
    overrides: [{
      files: ['app/legacy.tsx', 'app/new.tsx'],
      rules: { 'max-lines': ['error', { max: 500 }] },
    }],
  }
  const { root } = await fixture(t, [
    ['config/max-lines-baseline.txt', 'mobile-config app/legacy.tsx\n'],
    ['mobile/.oxlintrc.json', `${JSON.stringify(mobileConfig)}\n`],
    ['mobile/app/legacy.tsx', 'export const legacy = true\n'.repeat(450)],
    ['mobile/app/new.tsx', 'export const next = true\n'.repeat(450)],
  ])

  const report = await auditReactQuality({ projectRoot: root })
  const budget = report.findings.find((item) => item.id === 'max-lines-budget')
  const ratchet = report.findings.find((item) => item.id === 'max-lines-ratchet')

  assert.match(budget.evidence, /mobile\/app\/legacy\.tsx.*grandfathered/)
  assert.match(ratchet.evidence, /mobile-config app\/new\.tsx/)
  assert.doesNotMatch(ratchet.evidence, /mobile-config app\/legacy\.tsx/)
})

test('type-only feature imports do not create runtime boundary candidates', async (t) => {
  const { root } = await fixture(t, [
    ['src/features/alpha/index.ts', "import type { Beta } from '../beta'\nexport type Alpha = Beta\n"],
    ['src/features/beta/index.ts', "import type { Alpha } from '../alpha'\nexport type Beta = Alpha\n"],
    ['src/features/alpha/internal.ts', "import type { Alpha } from './index'\nexport type Internal = Alpha\n"],
  ], {
    scripts: {
      'quality:react:changed': 'node .react-quality/scripts/check-changed-code-quality.mjs',
      'quality:react-doctor:changed': 'node .react-quality/scripts/check-react-doctor-changed.mjs',
    },
  })

  const report = await auditReactQuality({ projectRoot: root })

  assert.equal(ids(report).includes('feature-dependency-cycle'), false)
  assert.equal(ids(report).includes('inward-public-barrel-import'), false)
  assert.equal(ids(report).includes('sibling-domain-coupling'), false)
})

test('prefers tracked files and never follows a source symlink outside the project', async (t) => {
  const { parent, root } = await fixture(t, [
    ['src/Tracked.tsx', 'export function Tracked() { return <div /> }\n'],
  ])
  await writeFile(join(root, 'src/Untracked.tsx'), `${'export const x = 1\n'.repeat(401)}`)
  const outside = join(parent, 'outside.tsx')
  await writeFile(outside, `${'export const outside = 1\n'.repeat(401)}`)
  await symlink(outside, join(root, 'src/linked.tsx'))
  spawnSync('git', ['add', 'src/linked.tsx'], { cwd: root })

  const report = await auditReactQuality({ projectRoot: root })

  assert.equal(report.inspection.files.strategy, 'git-tracked')
  assert.equal(report.findings.some((finding) => /Untracked|linked|outside/.test(finding.evidence)), false)
})

test('runs the bundled Zustand selector plugin only when tools are enabled', async (t) => {
  const { root } = await fixture(t, [
    ['src/store.ts', 'export const useAppStore = () => ({ items: [] })\n'],
    ['src/Panel.tsx', [
      "import { useAppStore } from './store'",
      'export function Panel() {',
      '  const items = useAppStore((state) => state.items.map((item) => item))',
      '  return <div>{items.length}</div>',
      '}',
      '',
    ].join('\n')],
    ['src/Panel.test.tsx', 'export {}\n'],
  ], {
    dependencies: { react: '^19', zustand: '^5' },
    scripts: {
      'quality:react:changed': 'node .react-quality/scripts/check-changed-code-quality.mjs',
      'quality:react-doctor:changed': 'node .react-quality/scripts/check-react-doctor-changed.mjs',
    },
  })
  await installFakeOxlint(root)

  const skipped = await auditReactQuality({ projectRoot: root })
  const executed = await auditReactQuality({ projectRoot: root, runTools: true })

  assert.deepEqual(skipped.commands, [])
  assert.equal(ids(skipped).includes('zustand-selector-allocation'), false)
  assert.equal(executed.commands.length, 1)
  assert.equal(executed.commands[0].tool, 'bundled-zustand-selectors')
  assert.equal(executed.commands[0].status, 1)
  assert.equal(ids(executed).includes('zustand-selector-allocation'), true)
})

test('captures missing external tool diagnostics instead of crashing', async (t) => {
  const { root } = await fixture(t, [], {
    dependencies: { react: '^19', zustand: '^5' },
  })

  const originalPath = process.env.PATH
  process.env.PATH = ''
  try {
    const report = await auditReactQuality({ projectRoot: root, runTools: true })
    assert.equal(report.commands[0].status, null)
    assert.match(report.commands[0].stderr, /oxlint|module/i)
    assert.equal(ids(report).includes('zustand-tool-unavailable'), true)
  } finally {
    process.env.PATH = originalPath
  }
})

test('JSON and Markdown CLI output contain exactly the same stable finding IDs', async (t) => {
  const { root } = await fixture(t, [
    ['src/Card.tsx', 'export function Card() { return <div /> }\n'],
  ])
  const cli = fileURLToPath(new URL('./audit-react-quality.mjs', import.meta.url))
  const jsonRun = spawnSync(process.execPath, [cli, '--project', root, '--format', 'json'], { encoding: 'utf8' })
  const markdownRun = spawnSync(process.execPath, [cli, '--project', root, '--format', 'markdown'], { encoding: 'utf8' })

  assert.equal(jsonRun.status, 0, jsonRun.stderr)
  assert.equal(markdownRun.status, 0, markdownRun.stderr)
  const report = JSON.parse(jsonRun.stdout)
  const markdownIds = [...markdownRun.stdout.matchAll(/^### `([^`]+)`/gm)].map((match) => match[1])
  assert.deepEqual(markdownIds, ids(report))
  assert.equal(markdownRun.stdout, formatAuditMarkdown(report))
})

test('installation evidence verifies hashes, exact scripts, AGENTS markers, and pull-request wiring', async (t) => {
  const managed = 'managed contents\n'
  const start = '<!-- react-component-quality:start -->'
  const end = '<!-- react-component-quality:end -->'
  const scripts = {
    'quality:react': 'oxlint --config .react-quality/config/oxlint-react-quality.json .',
    'quality:react:changed': 'node .react-quality/scripts/check-changed-code-quality.mjs',
    'quality:react-doctor:changed': 'node .react-quality/scripts/check-react-doctor-changed.mjs',
    'quality:max-lines': 'node .react-quality/scripts/check-max-lines-ratchet.mjs',
  }
  const workflow = 'on: pull_request\njobs:\n  quality:\n    steps:\n      - run: npm run quality:react:changed\n      - run: npm run quality:react-doctor:changed\n      - run: npm run quality:max-lines\n'
  const manifest = validManifest(scripts, {
    managedFiles: {
      '.react-quality/config/example.json': sha256(managed),
      '.github/workflows/react-quality.yml': sha256(workflow),
    },
    createdPaths: ['.github/workflows/react-quality.yml'],
    agentsMarkers: { start, end },
  })
  const { root } = await fixture(t, [
    ['.react-quality/config/example.json', 'tampered\n'],
    ['.react-quality/installation.json', `${JSON.stringify(manifest)}\n`],
    ['AGENTS.md', `${start}\npolicy\n`],
    ['.github/workflows/react-quality.yml', workflow],
  ], { scripts: { ...scripts, 'quality:react:changed': 'echo wrong-command' } })

  const report = await auditReactQuality({ projectRoot: root })
  const drift = report.findings.find((item) => item.id === 'installation-drift')

  assert.match(drift.evidence, /hash mismatch.*example\.json/is)
  assert.match(drift.evidence, /quality:react:changed.*exact command/is)
  assert.match(drift.evidence, /AGENTS.*marker/is)
  assert.equal(report.findings.some((item) => item.id === 'changed-code-quality-wiring'), true)
})

test('ratchet reports added and stale entries with kind-aware paths and never grandfathers a stale bypass', async (t) => {
  const { root } = await fixture(t, [
    ['config/max-lines-baseline.txt', 'inline src/stale.ts\nmobile-config app/stale.tsx\n'],
    ['src/stale.ts', 'export const stale = true\n'.repeat(301)],
    ['src/new.ts', '/* oxlint-disable max-lines */\nexport const next = true\n'],
  ])

  const report = await auditReactQuality({ projectRoot: root })
  const ratchet = report.findings.find((item) => item.id === 'max-lines-ratchet')
  const budget = report.findings.find((item) => item.id === 'max-lines-budget')

  assert.match(ratchet.evidence, /added.*inline src\/new\.ts/is)
  assert.match(ratchet.evidence, /stale.*inline src\/stale\.ts/is)
  assert.match(ratchet.evidence, /stale.*mobile-config app\/stale\.tsx/is)
  assert.equal(ratchet.path, 'src/new.ts')
  assert.doesNotMatch(budget.evidence, /src\/stale\.ts.*grandfathered/)
})

test('tracked generated outputs and configured outDir are excluded and depth truncation is surfaced', async (t) => {
  const deepPath = `${Array.from({ length: 18 }, (_, index) => `level-${index}`).join('/')}/Deep.tsx`
  const { root } = await fixture(t, [
    ['tsconfig.json', `${JSON.stringify({ compilerOptions: { outDir: 'custom-generated' } })}\n`],
    ['dist/Large.tsx', 'export const dist = true\n'.repeat(401)],
    ['custom-generated/Large.tsx', 'export const generated = true\n'.repeat(401)],
    [deepPath, 'export function Deep() { return <div /> }\n'],
    ['src/App.tsx', 'export function App() { return <div /> }\n'],
  ])

  const tracked = await auditReactQuality({ projectRoot: root })
  assert.equal(tracked.inspection.files.excluded.some((path) => path.startsWith('dist/')), true)
  assert.equal(tracked.inspection.files.excluded.some((path) => path.startsWith('custom-generated/')), true)
  assert.equal(tracked.findings.some((item) => /dist\/Large|custom-generated\/Large/.test(item.evidence)), false)

  await rm(join(root, '.git'), { recursive: true, force: true })
  const walked = await auditReactQuality({ projectRoot: root })
  assert.equal(walked.inspection.files.depthTruncated, true)
  assert.equal(ids(walked).includes('audit-scan-limit'), true)
})

test('feature cycles are keyed by container and report the actual common feature root', async (t) => {
  const { root } = await fixture(t, [
    ['apps/one/features/alpha/index.ts', "import { beta } from '../beta'\nexport const alpha = beta\n"],
    ['apps/one/features/beta/index.ts', 'export const beta = true\n'],
    ['apps/two/features/beta/index.ts', "import { alpha } from '../alpha'\nexport const beta = alpha\n"],
    ['apps/two/features/alpha/index.ts', 'export const alpha = true\n'],
  ])
  const noCycle = await auditReactQuality({ projectRoot: root })
  assert.equal(ids(noCycle).includes('feature-dependency-cycle'), false)

  await writeFile(join(root, 'apps/one/features/beta/index.ts'), "import { alpha } from '../alpha'\nexport const beta = alpha\n")
  spawnSync('git', ['add', 'apps/one/features/beta/index.ts'], { cwd: root })
  const cycle = await auditReactQuality({ projectRoot: root })
  assert.equal(cycle.findings.find((item) => item.id === 'feature-dependency-cycle').path, 'apps/one/features')
})

test('run-tools batches Zustand files into one bounded process and diagnostics payload', async (t) => {
  const files = Array.from({ length: 60 }, (_, index) => [
    `src/Panel${index}.tsx`,
    `import { useAppStore } from './store'\nexport const Panel${index} = () => useAppStore((state) => state.items.map((item) => item))\n`,
  ])
  const { root } = await fixture(t, [['src/store.ts', 'export const useAppStore = () => ({ items: [] })\n'], ...files], {
    dependencies: { react: '^19', zustand: '^5', oxlint: '^1' },
  })
  await installFakeOxlint(root)

  const report = await auditReactQuality({ projectRoot: root, runTools: true })
  const command = report.commands.find((item) => item.tool === 'bundled-zustand-selectors')

  assert.equal(command.processes, 1)
  assert.equal(command.diagnostics <= 40, true)
  assert.equal(command.stdout.length < 8_000, true)
})

test('rejects Oxlint resolved from an ancestor outside a nested target', async (t) => {
  const parent = await mkdtemp(join(tmpdir(), 'nested oxlint audit '))
  const root = join(parent, 'workspace/project')
  await mkdir(root, { recursive: true })
  await writeFile(join(root, 'package.json'), `${JSON.stringify({ dependencies: { react: '^19', zustand: '^5', oxlint: '^1' } })}\n`)
  await writeFile(join(root, 'package-lock.json'), '{}\n')
  await installFakeOxlint(join(parent, 'workspace'))
  spawnSync('git', ['init', '-q'], { cwd: root })
  spawnSync('git', ['add', '.'], { cwd: root })
  t.after(() => rm(parent, { recursive: true, force: true }))

  const report = await auditReactQuality({ projectRoot: root, runTools: true })

  assert.equal(ids(report).includes('zustand-tool-unavailable'), true)
  assert.match(report.commands[0].stderr, /outside project root/i)
})

test('installed quality verification rejects Oxlint resolved from an ancestor', async (t) => {
  const parent = await mkdtemp(join(tmpdir(), 'nested installed audit '))
  const root = join(parent, 'workspace/project')
  const scripts = validManifest({}).managedPackageScripts
  await mkdir(root, { recursive: true })
  await writeFile(join(root, 'package.json'), `${JSON.stringify({
    packageManager: 'npm@10.0.0', dependencies: { react: '^19' }, devDependencies: { oxlint: '^1' }, scripts,
  })}\n`)
  await writeFile(join(root, 'package-lock.json'), '{}\n')
  await installFakeOxlint(join(parent, 'workspace'))
  await writeValidInstallation(root)
  spawnSync('git', ['init', '-q'], { cwd: root })
  spawnSync('git', ['add', '.'], { cwd: root })
  t.after(() => rm(parent, { recursive: true, force: true }))

  const report = await auditReactQuality({ projectRoot: root, runTools: true })
  const quality = report.commands.find((item) => item.tool === 'installed:quality:react')

  assert.equal(quality.status, null)
  assert.match(quality.stderr, /outside project root/i)
  assert.equal(ids(report).includes('installed-tool-unavailable'), true)
})

test('real changed-code verification uses only target-local Oxlint and rejects an ancestor fallback', async (t) => {
  const scripts = validManifest({}).managedPackageScripts
  const sourceScripts = await realChangedCodeScriptSources()
  const host = await mkdtemp(join(tmpdir(), 'host oxlint '))
  const hostBin = join(host, 'bin')
  const sentinel = join(host, 'ancestor-oxlint-ran')
  await mkdir(hostBin, { recursive: true })
  await writeFile(join(hostBin, 'oxlint'), `#!/usr/bin/env node\nrequire('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'ran')\n`)
  await chmod(join(hostBin, 'oxlint'), 0o755)
  const originalPath = process.env.PATH
  process.env.PATH = `${hostBin}:${originalPath ?? ''}`
  t.after(async () => {
    process.env.PATH = originalPath
    await rm(host, { recursive: true, force: true })
  })

  const local = await fixture(t, [['src/App.tsx', 'export const App = () => <main />\n']], { scripts, devDependencies: { oxlint: '^1' } })
  await installFakeOxlint(local.root, { stdout: '{"diagnostics":[]}', exitCode: 0 })
  await writeValidInstallation(local.root, { scriptSources: sourceScripts })
  spawnSync('git', ['add', '.'], { cwd: local.root })
  spawnSync('git', ['-c', 'user.name=Audit', '-c', 'user.email=audit@example.test', 'commit', '-qm', 'base'], { cwd: local.root })
  const localBase = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: local.root, encoding: 'utf8' }).stdout.trim()
  await writeFile(join(local.root, 'src/App.tsx'), 'export const App = () => <section />\n')

  const direct = spawnSync(process.execPath, [join(local.root, '.react-quality/scripts/check-changed-code-quality.mjs'), localBase], {
    cwd: local.root,
    encoding: 'utf8',
    env: {
      ...process.env,
      REACT_QUALITY_OXLINT_BIN: join(local.root, 'node_modules/oxlint/bin/oxlint.js'),
    },
  })
  assert.equal(direct.status, 0, direct.stderr)
  assert.equal(await readFile(sentinel, 'utf8').catch(() => null), null)

  const localReport = await auditReactQuality({ projectRoot: local.root, base: localBase, runTools: true })
  assert.equal(localReport.commands.find((item) => item.tool === 'installed:quality:react:changed').status, 0)
  assert.equal(await readFile(sentinel, 'utf8').catch(() => null), null)

  const missing = await fixture(t, [['src/App.tsx', 'export const App = () => <main />\n']], { scripts, devDependencies: { oxlint: '^1' } })
  await writeValidInstallation(missing.root, { scriptSources: sourceScripts })
  spawnSync('git', ['add', '.'], { cwd: missing.root })
  spawnSync('git', ['-c', 'user.name=Audit', '-c', 'user.email=audit@example.test', 'commit', '-qm', 'base'], { cwd: missing.root })
  const missingBase = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: missing.root, encoding: 'utf8' }).stdout.trim()
  await writeFile(join(missing.root, 'src/App.tsx'), 'export const App = () => <aside />\n')

  const missingReport = await auditReactQuality({ projectRoot: missing.root, base: missingBase, runTools: true })
  const missingCommand = missingReport.commands.find((item) => item.tool === 'installed:quality:react:changed')
  assert.equal(missingCommand.status, null)
  assert.match(missingCommand.stderr, /target-local|outside project root/i)
  assert.equal(await readFile(sentinel, 'utf8').catch(() => null), null)
})

test('base scopes source findings to changed files and reports invalid refs explicitly', async (t) => {
  const { root } = await fixture(t, [
    ['src/Legacy.tsx', 'export const legacy = true\n'.repeat(401)],
    ['src/Card.tsx', 'export function Card() { return <div /> }\n'],
  ])
  spawnSync('git', ['-c', 'user.name=Audit', '-c', 'user.email=audit@example.test', 'commit', '-qm', 'base'], { cwd: root })
  const base = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()
  await writeFile(join(root, 'src/Card.tsx'), 'export function Card() { return <section /> }\n')

  const scoped = await auditReactQuality({ projectRoot: root, base })
  assert.deepEqual(scoped.inspection.scope.changedFiles, ['src/Card.tsx'])
  assert.equal(scoped.findings.some((item) => item.id === 'max-lines-budget'), false)
  assert.equal(scoped.findings.some((item) => item.id === 'component-test-coverage'), true)

  const invalid = await auditReactQuality({ projectRoot: root, base: 'missing-ref' })
  assert.equal(ids(invalid).includes('audit-base-invalid'), true)
})

test('max-lines finding reports the physical source line where counted code exceeds budget', async (t) => {
  const source = `${'// comment\n'.repeat(10)}${'export const line = true\n'.repeat(301)}`
  const { root } = await fixture(t, [['src/Physical.ts', source]])

  const report = await auditReactQuality({ projectRoot: root })

  assert.equal(report.findings.find((item) => item.id === 'max-lines-budget').line, 311)
})

test('run-tools executes at most the four exact verification scripts recorded by installation', async (t) => {
  const scripts = validManifest({}).managedPackageScripts
  const sentinel = join('lifecycle-hook-ran')
  const hook = `node -e "require('node:fs').appendFileSync('${sentinel}', 'hook')"`
  const { root } = await fixture(t, [], { scripts: {
    ...scripts,
    'prequality:react': hook,
    'postquality:react': hook,
    'prequality:react:changed': hook,
    'postquality:react:changed': hook,
    'prequality:react-doctor:changed': hook,
    'postquality:react-doctor:changed': hook,
    'prequality:max-lines': hook,
    'postquality:max-lines': hook,
  }, devDependencies: { oxlint: '^1' } })
  await installFakeOxlint(root, { stdout: '{"diagnostics":[]}', exitCode: 0 })
  await writeValidInstallation(root)

  const report = await auditReactQuality({ projectRoot: root, runTools: true })
  const commands = report.commands.filter((item) => item.tool.startsWith('installed:'))

  assert.equal(commands.length, 4)
  assert.equal(commands.filter((item) => item.tool !== 'installed:quality:react-doctor:changed').every((item) => item.status === 0), true)
  assert.equal(commands.find((item) => item.tool === 'installed:quality:react-doctor:changed').status, null)
  assert.equal(commands.filter((item) => item.status === 0).some((item) => ['npm', 'pnpm', 'yarn', 'bun'].includes(item.argv[0])), false)
  assert.equal(commands.find((item) => item.tool === 'installed:quality:react:changed').argv[0], process.execPath)
  assert.equal(commands.find((item) => item.tool === 'installed:quality:max-lines').argv[0], process.execPath)
  assert.match(commands.find((item) => item.tool === 'installed:quality:react').argv[0], /node_modules\/oxlint\/bin\/oxlint\.js$/)
  assert.equal(await readFile(join(root, sentinel), 'utf8').catch(() => null), null)
})

test('run-tools never executes installer-backed React Doctor and emits the exact manual command', async (t) => {
  const sentinel = 'react-doctor-installer-ran'
  const scripts = validManifest({}).managedPackageScripts
  const { root } = await fixture(t, [], { scripts })
  await writeValidInstallation(root, { scriptSources: {
    'check-react-doctor-changed.mjs': `import { writeFileSync } from 'node:fs'\nwriteFileSync('${sentinel}', 'npx --yes react-doctor')\n`,
  } })

  const report = await auditReactQuality({ projectRoot: root, runTools: true })
  const doctor = report.commands.find((item) => item.tool === 'installed:quality:react-doctor:changed')

  assert.equal(doctor.status, null)
  assert.equal(await readFile(join(root, sentinel), 'utf8').catch(() => null), null)
  assert.match(doctor.stderr, /target-local React Doctor/i)
  assert.match(report.findings.find((item) => item.id === 'installed-tool-unavailable').evidence, /npm run quality:react-doctor:changed/)
})

test('invalid empty installation manifest is never trusted or executed', async (t) => {
  const { root } = await fixture(t, [
    ['.react-quality/installation.json', '{}\n'],
  ], { scripts: { 'quality:react': 'node -e "process.exit(99)"' } })

  const report = await auditReactQuality({ projectRoot: root, runTools: true })

  assert.equal(ids(report).includes('installation-invalid'), true)
  assert.equal(report.commands.some((item) => item.tool.startsWith('installed:')), false)
})

test('installation manifest requires the canonical managed-files hash and exact AGENTS markers', async (t) => {
  const wrongHash = validManifest({}, { snapshotHash: 'b'.repeat(64) })
  const hashFixture = await fixture(t, [['.react-quality/installation.json', `${JSON.stringify(wrongHash)}\n`]])
  const hashReport = await auditReactQuality({ projectRoot: hashFixture.root, runTools: true })
  assert.match(hashReport.findings.find((item) => item.id === 'installation-invalid').evidence, /snapshotHash.*canonical/i)
  assert.equal(hashReport.commands.some((item) => item.tool.startsWith('installed:')), false)

  const arbitraryMarkers = validManifest({}, { agentsMarkers: { start: '<!-- any:start -->', end: '<!-- any:end -->' } })
  const markerFixture = await fixture(t, [['.react-quality/installation.json', `${JSON.stringify(arbitraryMarkers)}\n`]])
  const markerReport = await auditReactQuality({ projectRoot: markerFixture.root, runTools: true })
  assert.match(markerReport.findings.find((item) => item.id === 'installation-invalid').evidence, /agentsMarkers.*exact/i)
  assert.equal(markerReport.commands.some((item) => item.tool.startsWith('installed:')), false)
})

test('run-tools refuses a managed Node script whose installed file hash drifted', async (t) => {
  const scripts = validManifest({}).managedPackageScripts
  const sentinel = 'tampered-managed-script-ran'
  const { root } = await fixture(t, [], { scripts })
  await writeValidInstallation(root)
  await writeFile(join(root, '.react-quality/scripts/check-max-lines-ratchet.mjs'), `import { writeFileSync } from 'node:fs'\nwriteFileSync('${sentinel}', 'ran')\n`)

  const report = await auditReactQuality({ projectRoot: root, runTools: true })
  const maxLines = report.commands.find((item) => item.tool === 'installed:quality:max-lines')

  assert.equal(maxLines.status, null)
  assert.match(maxLines.stderr, /hash mismatch/i)
  assert.equal(await readFile(join(root, sentinel), 'utf8').catch(() => null), null)
  assert.equal(ids(report).includes('installed-tool-unavailable'), true)
})

test('any transitive managed helper drift refuses every installed verification spawn', async (t) => {
  const scripts = validManifest({}).managedPackageScripts

  const changedFixture = await fixture(t, [], { scripts, devDependencies: { oxlint: '^1' } })
  const changedHelperSentinel = join(changedFixture.root, 'changed-helper-ran')
  const otherChangedSentinel = join(changedFixture.root, 'other-command-ran')
  const changedSources = await realChangedCodeScriptSources()
  await installFakeOxlint(changedFixture.root, { stdout: '{"diagnostics":[]}', exitCode: 0 })
  await writeValidInstallation(changedFixture.root, { scriptSources: {
    ...changedSources,
    'check-max-lines-ratchet.mjs': `import { writeFileSync } from 'node:fs'\nwriteFileSync(${JSON.stringify(otherChangedSentinel)}, 'ran')\n`,
  } })
  await writeFile(join(changedFixture.root, '.react-quality/scripts/git-pull-request-diff-base.mjs'), `import { writeFileSync } from 'node:fs'\nwriteFileSync(${JSON.stringify(changedHelperSentinel)}, 'ran')\n${changedSources['git-pull-request-diff-base.mjs']}`)

  const changedReport = await auditReactQuality({ projectRoot: changedFixture.root, runTools: true })
  assert.equal(changedReport.commands.filter((item) => item.tool.startsWith('installed:')).every((item) => item.status === null), true)
  assert.equal(await readFile(changedHelperSentinel, 'utf8').catch(() => null), null)
  assert.equal(await readFile(otherChangedSentinel, 'utf8').catch(() => null), null)

  const maxFixture = await fixture(t, [], { scripts, devDependencies: { oxlint: '^1' } })
  const maxHelperSentinel = join(maxFixture.root, 'max-helper-ran')
  const otherMaxSentinel = join(maxFixture.root, 'other-command-ran')
  const maxSources = await realMaxLinesScriptSources()
  await installFakeOxlint(maxFixture.root, { stdout: '{"diagnostics":[]}', exitCode: 0 })
  await writeValidInstallation(maxFixture.root, { scriptSources: {
    ...maxSources,
    'check-changed-code-quality.mjs': `import { writeFileSync } from 'node:fs'\nwriteFileSync(${JSON.stringify(otherMaxSentinel)}, 'ran')\n`,
  } })
  await writeFile(join(maxFixture.root, '.react-quality/scripts/max-lines-suppressions.mjs'), `import { writeFileSync } from 'node:fs'\nwriteFileSync(${JSON.stringify(maxHelperSentinel)}, 'ran')\n${maxSources['max-lines-suppressions.mjs']}`)

  const maxReport = await auditReactQuality({ projectRoot: maxFixture.root, runTools: true })
  assert.equal(maxReport.commands.filter((item) => item.tool.startsWith('installed:')).every((item) => item.status === null), true)
  assert.equal(await readFile(maxHelperSentinel, 'utf8').catch(() => null), null)
  assert.equal(await readFile(otherMaxSentinel, 'utf8').catch(() => null), null)
})

test('base uses merge-base, includes safe untracked files, and forwards it to changed-code tools', async (t) => {
  const scripts = validManifest({}).managedPackageScripts
  const { root } = await fixture(t, [
    ['src/Base.tsx', 'export const Base = () => <div />\n'],
  ], { scripts })
  await installFakeOxlint(root, { stdout: '{"diagnostics":[]}', exitCode: 0 })
  await writeValidInstallation(root, { scriptSources: { 'check-changed-code-quality.mjs': 'process.stdout.write(process.argv.at(-1))\n' } })
  spawnSync('git', ['add', '.react-quality'], { cwd: root })
  spawnSync('git', ['-c', 'user.name=Audit', '-c', 'user.email=audit@example.test', 'commit', '-qm', 'base'], { cwd: root })
  const common = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()
  await writeFile(join(root, 'src/Base.tsx'), 'export const Base = () => <main />\n')
  spawnSync('git', ['add', 'src/Base.tsx'], { cwd: root })
  spawnSync('git', ['-c', 'user.name=Audit', '-c', 'user.email=audit@example.test', 'commit', '-qm', 'branch change'], { cwd: root })
  spawnSync('git', ['branch', 'main-side'], { cwd: root })
  spawnSync('git', ['checkout', '-qb', 'other-side', common], { cwd: root })
  await writeFile(join(root, 'src/Other.tsx'), 'export const Other = () => <aside />\n')
  spawnSync('git', ['add', 'src/Other.tsx'], { cwd: root })
  spawnSync('git', ['-c', 'user.name=Audit', '-c', 'user.email=audit@example.test', 'commit', '-qm', 'other change'], { cwd: root })
  await writeFile(join(root, 'src/Untracked.tsx'), 'export function Untracked() { return <section /> }\n')

  const report = await auditReactQuality({ projectRoot: root, base: 'main-side', runTools: true })

  assert.equal(report.inspection.scope.base, common)
  assert.deepEqual(report.inspection.scope.changedFiles, ['src/Other.tsx', 'src/Untracked.tsx'])
  assert.equal(report.findings.some((item) => item.id === 'component-test-coverage' && /Untracked/.test(item.evidence)), true)
  assert.equal(report.commands.find((item) => item.tool === 'installed:quality:react:changed').argv.at(-1), common)
})

test('Zustand byte/file caps and nonzero JSON exit are explicit findings, never false clean', async (t) => {
  const huge = `import { useAppStore } from './store'\n${' '.repeat(2 * 1024 * 1024)}\nuseAppStore((s) => s.items)\n`
  const { root } = await fixture(t, [
    ['src/Huge.tsx', huge],
    ['src/store.ts', 'export const useAppStore = () => ({ items: [] })\n'],
  ], { dependencies: { react: '^19', zustand: '^5', oxlint: '^1' } })
  await installFakeOxlint(root)
  const hugeReport = await auditReactQuality({ projectRoot: root, runTools: true })
  assert.equal(ids(hugeReport).includes('audit-tool-limit'), true)

  const manyFiles = Array.from({ length: 205 }, (_, index) => [`src/P${index}.tsx`, `import { useAppStore } from './store'\nexport const P${index} = () => useAppStore((s) => s.items)\n`])
  const many = await fixture(t, [['src/store.ts', 'export const useAppStore = () => ({ items: [] })\n'], ...manyFiles], { dependencies: { react: '^19', zustand: '^5', oxlint: '^1' } })
  await installFakeOxlint(many.root)
  const manyReport = await auditReactQuality({ projectRoot: many.root, runTools: true })
  assert.equal(ids(manyReport).includes('audit-tool-limit'), true)

  const nonzero = await fixture(t, [['src/store.ts', 'export const useAppStore = () => ({ items: [] })\n']], { dependencies: { react: '^19', zustand: '^5', oxlint: '^1' } })
  await installFakeOxlint(nonzero.root, { exitCode: 2, stdout: '{"diagnostics":[]}', stderr: 'native failure' })
  const nonzeroReport = await auditReactQuality({ projectRoot: nonzero.root, runTools: true })
  assert.equal(nonzeroReport.commands[0].status, 2)
  assert.equal(ids(nonzeroReport).includes('zustand-tool-failure'), true)
})

test('installed tool failures include bounded stdout and stderr evidence', async (t) => {
  const scripts = validManifest({}).managedPackageScripts
  const { root } = await fixture(t, [], { scripts })
  await installFakeOxlint(root, { stdout: 'OUT-EVIDENCE', stderr: 'ERR-EVIDENCE', exitCode: 2 })
  await writeValidInstallation(root)

  const report = await auditReactQuality({ projectRoot: root, runTools: true })
  const evidence = report.findings.find((item) => item.id === 'installed-tool-failure').evidence

  assert.match(evidence, /OUT-EVIDENCE/)
  assert.match(evidence, /ERR-EVIDENCE/)
  assert.equal(evidence.length < 16_000, true)
})

test('JSONC workspace configs and safe extends exclude generated dirs; bad config is surfaced', async (t) => {
  const { parent, root } = await fixture(t, [
    ['tsconfig.json', '{\n // root output\n "compilerOptions": { "outDir": "generated-root", },\n}\n'],
    ['config/base.jsonc', '{ "compilerOptions": { "outDir": "built", }, }\n'],
    ['packages/app/tsconfig.json', '{ "extends": "../../config/base.jsonc", }\n'],
    ['packages/bad/jsconfig.json', '{ nope'],
    ['generated-root/Large.tsx', 'export const rootBuild = true\n'.repeat(401)],
    ['config/built/Large.tsx', 'export const extendedBuild = true\n'.repeat(401)],
    ['src/App.tsx', 'export const App = () => <div />\n'],
  ])
  const outside = join(parent, 'outside.json')
  await writeFile(outside, '{ "compilerOptions": { "outDir": "escape" } }\n')
  await symlink(outside, join(root, 'packages/app/jsconfig.json'))
  spawnSync('git', ['add', 'packages/app/jsconfig.json'], { cwd: root })

  const report = await auditReactQuality({ projectRoot: root })

  assert.equal(report.inspection.files.excluded.some((path) => path.startsWith('generated-root/')), true)
  assert.equal(report.inspection.files.excluded.some((path) => path.startsWith('config/built/')), true)
  assert.equal(ids(report).includes('scan-config'), true)
  assert.match(report.findings.find((item) => item.id === 'scan-config').evidence, /malformed|symlink|outside/i)
})

test('JSONC trailing commas are string-aware and extends arrays are inspected', async (t) => {
  const { root } = await fixture(t, [
    ['tsconfig.json', '{ "extends": ["./config/one.jsonc", "./config/two.jsonc"], }\n'],
    ['config/one.jsonc', '{ "compilerOptions": { "outDir": "generated,}", }, }\n'],
    ['config/two.jsonc', '{ "compilerOptions": { "outDir": "generated-two", }, }\n'],
    ['config/generated,}/One.tsx', 'export const one = true\n'.repeat(401)],
    ['config/generated-two/Two.tsx', 'export const two = true\n'.repeat(401)],
    ['src/App.tsx', 'export const App = () => <main />\n'],
  ])

  const report = await auditReactQuality({ projectRoot: root })

  assert.equal(report.inspection.files.excluded.some((path) => path.startsWith('config/generated,}/')), true)
  assert.equal(report.inspection.files.excluded.some((path) => path.startsWith('config/generated-two/')), true)
  assert.equal(report.findings.some((item) => item.id === 'max-lines-budget'), false)
})

test('PR workflow requires exact script tokens and rejects suffix lookalikes', async (t) => {
  const workflow = 'on: pull_request\njobs:\n  q:\n    steps:\n      - run: npm run quality:react:changed-extra\n      - run: npm run quality:react-doctor:changed-extra\n      - run: npm run quality:max-lines-extra\n'
  const scripts = validManifest({}).managedPackageScripts
  const { root } = await fixture(t, [['.github/workflows/pr.yml', workflow]], { scripts })

  const report = await auditReactQuality({ projectRoot: root })

  assert.equal(ids(report).includes('pr-ci-wiring'), true)
})
