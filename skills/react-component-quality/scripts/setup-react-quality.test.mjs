import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { chmod, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { applyQualitySetup, planQualitySetup, verifyQualitySetup } from './setup-react-quality.mjs'

const START = '<!-- react-component-quality:start -->'
const END = '<!-- react-component-quality:end -->'
const REQUIRED_DEV_DEPENDENCIES = {
  '@testing-library/jest-dom': '^6',
  '@testing-library/react': '^16',
  '@types/react': '^19',
  jsdom: '^26',
  'oxlint-plugin-react-doctor': '^0.9.1',
  oxlint: '^1',
  typescript: '^5',
  vitest: '^3',
}

function readyPackage(overrides = {}) {
  return {
    packageManager: 'pnpm@10.0.0',
    dependencies: { react: '^19', ...(overrides.dependencies ?? {}) },
    devDependencies: { ...REQUIRED_DEV_DEPENDENCIES, ...(overrides.devDependencies ?? {}) },
    ...overrides,
    dependencies: { react: '^19', ...(overrides.dependencies ?? {}) },
    devDependencies: { ...REQUIRED_DEV_DEPENDENCIES, ...(overrides.devDependencies ?? {}) },
  }
}

async function fixture(t, {
  name = 'project',
  packageJson = readyPackage(),
  files = [],
  lockfile = ['pnpm-lock.yaml', 'lockfileVersion: 9\n'],
} = {}) {
  const parent = await mkdtemp(join(tmpdir(), 'react quality setup '))
  const root = join(parent, name)
  await mkdir(root, { recursive: true })
  await writeFile(join(root, 'package.json'), typeof packageJson === 'string'
    ? packageJson
    : `${JSON.stringify(packageJson, null, 2)}\n`)
  await writeFile(join(root, lockfile[0]), lockfile[1])
  for (const [relativePath, contents = ''] of files) {
    const path = join(root, relativePath)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, contents)
  }
  spawnSync('git', ['init', '-q'], { cwd: root })
  spawnSync('git', ['add', '.'], { cwd: root })
  t.after(() => rm(parent, { recursive: true, force: true }))
  return { parent, root }
}

async function snapshotTree(root) {
  const result = []
  async function visit(directory, prefix = '') {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.git') continue
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) await visit(join(directory, entry.name), relativePath)
      else result.push([relativePath, await readFile(join(directory, entry.name), 'utf8')])
    }
  }
  await visit(root)
  return result
}

test('dry-run plans a portable kit without mutating the target', async (t) => {
  const { root } = await fixture(t)
  const before = await snapshotTree(root)

  const plan = await planQualitySetup({ projectRoot: root })

  assert.equal(existsSync(join(root, '.react-quality/installation.json')), false)
  assert.deepEqual(await snapshotTree(root), before)
  assert.equal(plan.conflicts.length, 0)
  assert.equal(plan.creates.includes('.react-quality/config/oxlint-react-quality.json'), true)
  assert.equal(plan.creates.includes('.react-quality/scripts/scaffold-component.mjs'), true)
  assert.equal(plan.creates.includes('.react-quality/installation.json'), true)
  assert.equal(plan.creates.some((path) => path.includes('app-store-performance')), false)
  assert.equal(plan.packageScripts['create:component'], 'node .react-quality/scripts/scaffold-component.mjs')
  assert.equal(plan.verificationCommands.includes('pnpm run quality:react:changed'), true)
})

test('apply preserves target-owned package data and AGENTS content, then repeat plan is deterministic', async (t) => {
  const { root } = await fixture(t, {
    packageJson: readyPackage({
      name: 'keep-name',
      scripts: { test: 'vitest run', custom: 'keep-this' },
    }),
    files: [['AGENTS.md', '# Existing policy\n\nKeep this paragraph.\n']],
  })
  const plan = await planQualitySetup({ projectRoot: root })

  const result = await applyQualitySetup(plan)
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const agents = await readFile(join(root, 'AGENTS.md'), 'utf8')
  const installation = JSON.parse(await readFile(join(root, '.react-quality/installation.json'), 'utf8'))
  const secondPlan = await planQualitySetup({ projectRoot: root })

  assert.equal(packageJson.name, 'keep-name')
  assert.equal(packageJson.scripts.test, 'vitest run')
  assert.equal(packageJson.scripts.custom, 'keep-this')
  assert.equal(packageJson.scripts['quality:react:changed'], 'node .react-quality/scripts/check-changed-code-quality.mjs')
  assert.match(agents, /^# Existing policy/m)
  assert.match(agents, /Keep this paragraph\./)
  assert.equal(agents.split(START).length - 1, 1)
  assert.equal(agents.split(END).length - 1, 1)
  assert.match(agents, /create:component/)
  assert.match(agents, /changed-code.*React Doctor/is)
  assert.match(agents, /max-lines.*ratchet.*prune/is)
  assert.equal(result.verificationCommands.includes('pnpm run quality:react:changed'), true)
  assert.deepEqual(result.verification, { ran: false, passed: null })
  assert.equal(typeof installation.installedAt, 'string')
  assert.equal(typeof installation.snapshotHash, 'string')
  assert.deepEqual(secondPlan.creates, [])
  assert.deepEqual(secondPlan.updates, [])
  assert.deepEqual(secondPlan.conflicts, [])
})

test('Zustand profile installs only the adapted generic selector plugin and documents its rules', async (t) => {
  const { root } = await fixture(t, {
    packageJson: readyPackage({ dependencies: { zustand: '^5' } }),
  })

  const plan = await planQualitySetup({ projectRoot: root })
  await applyQualitySetup(plan)

  const config = JSON.parse(await readFile(join(root, '.react-quality/config/oxlint-react-quality.json'), 'utf8'))
  const agents = await readFile(join(root, 'AGENTS.md'), 'utf8')
  assert.equal(existsSync(join(root, '.react-quality/plugins/zustand-selectors.mjs')), true)
  assert.equal(config.jsPlugins.some((plugin) => plugin.name === 'zustand-selectors'), true)
  assert.equal(config.rules['zustand-selectors/require-selector'], 'error')
  assert.match(agents, /Zustand.*require-selector.*no-fresh-selector-result/is)
  assert.equal(plan.creates.some((path) => path.includes('mobile-pairing-qrcode')), false)
  assert.equal(plan.creates.some((path) => path === '.react-quality/config/max-lines-baseline.txt'), true)
})

test('differing managed script is a conflict and apply aborts before any mutation', async (t) => {
  const { root } = await fixture(t, {
    packageJson: {
      scripts: { 'quality:react': 'eslint .' },
      dependencies: { react: '^19' },
    },
  })
  const before = await snapshotTree(root)
  const plan = await planQualitySetup({ projectRoot: root })

  assert.equal(plan.conflicts.some((item) => item.code === 'package-script-conflict'), true)
  await assert.rejects(() => applyQualitySetup(plan), /conflict/i)
  assert.deepEqual(await snapshotTree(root), before)
})

test('malformed package JSON rejects during planning without mutation', async (t) => {
  const { root } = await fixture(t, { packageJson: '{ nope' })
  const before = await snapshotTree(root)

  await assert.rejects(() => planQualitySetup({ projectRoot: root }), /Malformed package\.json/)

  assert.deepEqual(await snapshotTree(root), before)
})

test('unmanaged differing destination is a conflict and is never overwritten', async (t) => {
  const { root } = await fixture(t, {
    files: [['.react-quality/scripts/scaffold-component.mjs', 'target owned\n']],
  })
  const plan = await planQualitySetup({ projectRoot: root })

  assert.equal(plan.conflicts.some((item) => item.code === 'unmanaged-destination'), true)
  await assert.rejects(() => applyQualitySetup(plan), /conflict/i)
  assert.equal(await readFile(join(root, '.react-quality/scripts/scaffold-component.mjs'), 'utf8'), 'target owned\n')
})

test('malformed managed AGENTS markers are conflicts and surrounding content is untouched', async (t) => {
  const original = `# Keep\n\n${START}\nbroken\n`
  const { root } = await fixture(t, { files: [['AGENTS.md', original]] })
  const plan = await planQualitySetup({ projectRoot: root })

  assert.equal(plan.conflicts.some((item) => item.code === 'agents-marker-conflict'), true)
  await assert.rejects(() => applyQualitySetup(plan), /conflict/i)
  assert.equal(await readFile(join(root, 'AGENTS.md'), 'utf8'), original)
})

test('GitHub workflow is added only when the workflow directory is present and unambiguous', async (t) => {
  const without = await fixture(t, { name: 'without-github' })
  const withGithub = await fixture(t, {
    name: 'with-github',
    files: [['.github/workflows/test.yml', 'name: Test\non: pull_request\njobs: {}\n']],
  })

  const absentPlan = await planQualitySetup({ projectRoot: without.root })
  const presentPlan = await planQualitySetup({ projectRoot: withGithub.root })

  assert.equal(absentPlan.creates.some((path) => path.startsWith('.github/')), false)
  assert.equal(presentPlan.creates.includes('.github/workflows/react-quality.yml'), true)
})

test('an existing quality workflow is reported as ambiguous instead of being guessed or rewritten', async (t) => {
  const original = 'name: Existing quality\non: pull_request\njobs:\n  lint:\n    steps:\n      - run: pnpm run quality:react\n'
  const { root } = await fixture(t, {
    files: [['.github/workflows/existing-quality.yml', original]],
  })
  const plan = await planQualitySetup({ projectRoot: root })

  assert.equal(plan.conflicts.some((item) => item.code === 'github-quality-ambiguous'), true)
  assert.equal(plan.creates.includes('.github/workflows/react-quality.yml'), false)
  await assert.rejects(() => applyQualitySetup(plan), /conflict/i)
  assert.equal(await readFile(join(root, '.github/workflows/existing-quality.yml'), 'utf8'), original)
})

test('baseline captures only existing tracked max-lines suppressions and prune never adds bypasses', async (t) => {
  const { root } = await fixture(t, {
    files: [
      ['src/legacy.ts', '/* oxlint-disable max-lines -- legacy */\nexport const legacy = true\n'],
      ['src/untracked.ts', '/* oxlint-disable max-lines */\nexport const nope = true\n'],
      ['src/reason.ts', '/* oxlint-disable no-console -- max-lines is still enforced */\nexport const reason = true\n'],
    ],
  })
  spawnSync('git', ['reset', '-q', 'src/untracked.ts'], { cwd: root })
  const plan = await planQualitySetup({ projectRoot: root })
  await applyQualitySetup(plan)
  const baseline = await readFile(join(root, '.react-quality/config/max-lines-baseline.txt'), 'utf8')
  const installedParser = await import(pathToFileURL(join(root, '.react-quality/scripts/max-lines-suppressions.mjs')).href)

  assert.match(baseline, /^inline src\/legacy\.ts$/m)
  assert.doesNotMatch(baseline, /untracked/)
  assert.doesNotMatch(baseline, /reason/)
  assert.equal(installedParser.hasMaxLinesDisable('/* oxlint-disable no-console -- reason mentions max-lines */'), false)
  assert.equal(installedParser.hasMaxLinesDisable('/* oxlint-disable no-console, max-lines -- legacy */'), true)

  await writeFile(join(root, 'src/new.ts'), '/* oxlint-disable max-lines */\nexport const nope = true\n')
  spawnSync('git', ['add', 'src/new.ts'], { cwd: root })
  const check = spawnSync(process.execPath, [join(root, '.react-quality/scripts/check-max-lines-ratchet.mjs'), '--prune'], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.equal(check.status, 1)
  assert.match(check.stderr, /does not add|new bypass/i)
  assert.doesNotMatch(await readFile(join(root, '.react-quality/config/max-lines-baseline.txt'), 'utf8'), /src\/new\.ts/)
})

test('repeat setup reports a new max-lines bypass instead of grandfathering it', async (t) => {
  const { root } = await fixture(t)
  await applyQualitySetup(await planQualitySetup({ projectRoot: root }))
  const baselinePath = join(root, '.react-quality/config/max-lines-baseline.txt')
  const originalBaseline = await readFile(baselinePath, 'utf8')
  await mkdir(join(root, 'src'))
  await writeFile(join(root, 'src/new-bypass.ts'), '/* oxlint-disable max-lines */\nexport const bypass = true\n')
  spawnSync('git', ['add', 'src/new-bypass.ts'], { cwd: root })

  const plan = await planQualitySetup({ projectRoot: root })

  assert.equal(plan.conflicts.some((item) => item.code === 'new-max-lines-bypass'), true)
  await assert.rejects(() => applyQualitySetup(plan), /conflict/i)
  assert.equal(await readFile(baselinePath, 'utf8'), originalBaseline)
})

test('repeat setup rejects a manually expanded baseline even when the matching bypass is tracked', async (t) => {
  const { root } = await fixture(t)
  await applyQualitySetup(await planQualitySetup({ projectRoot: root }))
  const baselinePath = join(root, '.react-quality/config/max-lines-baseline.txt')
  await mkdir(join(root, 'src'))
  await writeFile(join(root, 'src/manual.ts'), '/* oxlint-disable max-lines */\nexport const bypass = true\n')
  spawnSync('git', ['add', 'src/manual.ts'], { cwd: root })
  await writeFile(baselinePath, `${await readFile(baselinePath, 'utf8')}inline src/manual.ts\n`)

  const plan = await planQualitySetup({ projectRoot: root })

  assert.equal(plan.conflicts.some((item) => item.code === 'managed-baseline-edited'), true)
  await assert.rejects(() => applyQualitySetup(plan), /conflict/i)
})

test('prune is accepted as an authoritative shrink and refreshes the manifest hash', async (t) => {
  const { root } = await fixture(t, {
    files: [['src/legacy.ts', '/* oxlint-disable max-lines */\nexport const legacy = true\n']],
  })
  await applyQualitySetup(await planQualitySetup({ projectRoot: root }))
  await writeFile(join(root, 'src/legacy.ts'), 'export const legacy = true\n')
  spawnSync('git', ['add', 'src/legacy.ts'], { cwd: root })
  const prune = spawnSync(process.execPath, [join(root, '.react-quality/scripts/check-max-lines-ratchet.mjs'), '--prune'], { cwd: root, encoding: 'utf8' })
  assert.equal(prune.status, 0, prune.stderr)

  const plan = await planQualitySetup({ projectRoot: root })
  assert.equal(plan.conflicts.length, 0)
  assert.equal(plan.updates.includes('.react-quality/installation.json'), true)
  await applyQualitySetup(plan)

  const manifest = JSON.parse(await readFile(join(root, '.react-quality/installation.json'), 'utf8'))
  const baseline = await readFile(join(root, '.react-quality/config/max-lines-baseline.txt'), 'utf8')
  assert.equal(manifest.maxLinesBaselineEntries.length, 0)
  assert.equal(typeof manifest.managedFiles['.react-quality/config/max-lines-baseline.txt'], 'string')
  assert.doesNotMatch(baseline, /^inline /m)
  assert.deepEqual((await planQualitySetup({ projectRoot: root })).updates, [])
})

test('installation manifest records created and updated paths and evolves for an added profile', async (t) => {
  const { root } = await fixture(t, { files: [['AGENTS.md', '# Existing\n']] })
  await applyQualitySetup(await planQualitySetup({ projectRoot: root }))
  let manifest = JSON.parse(await readFile(join(root, '.react-quality/installation.json'), 'utf8'))
  assert.equal(manifest.createdPaths.includes('.react-quality/installation.json'), true)
  assert.equal(manifest.updatedPaths.includes('package.json'), true)
  assert.equal(manifest.updatedPaths.includes('AGENTS.md'), true)

  const packagePath = join(root, 'package.json')
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
  packageJson.dependencies.zustand = '^5'
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
  const profilePlan = await planQualitySetup({ projectRoot: root })
  assert.equal(profilePlan.creates.includes('.react-quality/plugins/zustand-selectors.mjs'), true)
  await applyQualitySetup(profilePlan)
  manifest = JSON.parse(await readFile(join(root, '.react-quality/installation.json'), 'utf8'))
  assert.equal(manifest.createdPaths.includes('.react-quality/plugins/zustand-selectors.mjs'), true)
  assert.equal(manifest.updatedPaths.includes('.react-quality/config/oxlint-react-quality.json'), true)
})

test('unknown and capability-incompatible profiles are explicit conflicts', async (t) => {
  const { root } = await fixture(t)
  const unknown = await planQualitySetup({ projectRoot: root, profiles: ['react-core', 'made-up'] })
  const noZustand = await planQualitySetup({ projectRoot: root, profiles: ['react-core', 'zustand'] })
  const noGithub = await planQualitySetup({ projectRoot: root, profiles: ['react-core', 'github-actions'] })
  assert.equal(unknown.conflicts.some((item) => item.code === 'unknown-profile'), true)
  assert.equal(noZustand.conflicts.some((item) => item.code === 'profile-not-supported'), true)
  assert.equal(noGithub.conflicts.some((item) => item.code === 'profile-not-supported'), true)
})

test('JS-only or dependency-incomplete projects get actionable compatibility conflicts', async (t) => {
  const jsOnly = await fixture(t, {
    name: 'js-only',
    packageJson: { packageManager: 'pnpm@10.0.0', dependencies: { react: '^19' }, devDependencies: { oxlint: '^1' } },
    files: [['src/App.jsx', 'export function App() { return null }\n']],
  })
  const missingDeps = await fixture(t, {
    name: 'missing-deps',
    packageJson: { packageManager: 'pnpm@10.0.0', dependencies: { react: '^19' }, devDependencies: { typescript: '^5' } },
    files: [['src/App.tsx', 'export function App() { return null }\n']],
  })

  const jsPlan = await planQualitySetup({ projectRoot: jsOnly.root })
  const dependencyPlan = await planQualitySetup({ projectRoot: missingDeps.root })
  assert.equal(jsPlan.conflicts.some((item) => item.code === 'typescript-required'), true)
  assert.equal(jsPlan.conflicts.some((item) => item.code === 'missing-quality-dependencies'), true)
  assert.equal(dependencyPlan.conflicts.some((item) => item.code === 'missing-quality-dependencies'), true)
})

test('verification is explicit and apply never claims that commands ran', async (t) => {
  const { root } = await fixture(t)
  const applied = await applyQualitySetup(await planQualitySetup({ projectRoot: root }))
  assert.deepEqual(applied.verification, { ran: false, passed: null })

  const seen = []
  const verified = await verifyQualitySetup({
    projectRoot: root,
    commandRunner(command, args) {
      seen.push([command, args])
      return { status: 0, stdout: '', stderr: '' }
    },
  })
  assert.equal(verified.ran, true)
  assert.equal(verified.passed, true)
  assert.equal(seen.length, 4)
  assert.deepEqual(seen[0], ['pnpm', ['run', 'quality:react']])
})

test('setup omits the unused Oxlint React Doctor config from files and manifest', async (t) => {
  const { root } = await fixture(t)
  const plan = await planQualitySetup({ projectRoot: root })
  assert.equal(plan.creates.includes('.react-quality/config/oxlint-react-doctor.json'), false)

  await applyQualitySetup(plan)
  const manifest = JSON.parse(await readFile(join(root, '.react-quality/installation.json'), 'utf8'))
  assert.equal(existsSync(join(root, '.react-quality/config/oxlint-react-doctor.json')), false)
  assert.equal(Object.hasOwn(manifest.managedFiles, '.react-quality/config/oxlint-react-doctor.json'), false)
})

test('GitHub wiring requires a reproducibly provisioned pnpm or yarn version', async (t) => {
  const { root } = await fixture(t, {
    packageJson: { ...readyPackage(), packageManager: undefined },
    files: [['.github/workflows/test.yml', 'name: Test\non: pull_request\njobs: {}\n']],
  })
  const plan = await planQualitySetup({ projectRoot: root })
  assert.equal(plan.conflicts.some((item) => item.code === 'github-package-manager-unpinned'), true)
  assert.equal(plan.creates.includes('.github/workflows/react-quality.yml'), false)
})

test('GitHub wiring accepts exact semver pins and rejects tags, ranges, wildcards, and partial versions', async (t) => {
  const rejected = ['latest', 'stable', '*', '^10.0.0', '~10.0.0', 'workspace:*', '10', '10.0', '01.0.0', '10.0.0-01']
  for (const manager of ['pnpm', 'yarn']) {
    for (const version of rejected) {
      const { root } = await fixture(t, {
        name: `${manager}-${version.replaceAll(/[^a-z0-9]/gi, '-')}`,
        packageJson: { ...readyPackage(), packageManager: `${manager}@${version}` },
        lockfile: manager === 'yarn' ? ['yarn.lock', '__metadata:\n  version: 8\n'] : ['pnpm-lock.yaml', 'lockfileVersion: 9\n'],
        files: [['.github/workflows/test.yml', 'name: Test\non: pull_request\njobs: {}\n']],
      })
      const plan = await planQualitySetup({ projectRoot: root })
      assert.equal(plan.conflicts.some((item) => item.code === 'github-package-manager-unpinned'), true, `${manager}@${version}`)
      assert.equal(plan.creates.includes('.github/workflows/react-quality.yml'), false, `${manager}@${version}`)
    }
  }

  const { root: exactRoot } = await fixture(t, {
    name: 'pnpm-exact',
    packageJson: { ...readyPackage(), packageManager: 'pnpm@10.2.1-rc.1+build.7' },
    files: [['.github/workflows/test.yml', 'name: Test\non: pull_request\njobs: {}\n']],
  })
  const exact = await planQualitySetup({ projectRoot: exactRoot })
  assert.equal(exact.conflicts.some((item) => item.code === 'github-package-manager-unpinned'), false)
  assert.equal(exact.creates.includes('.github/workflows/react-quality.yml'), true)
})

test('pinned Yarn workflow explicitly enables Corepack before install', async (t) => {
  const { root } = await fixture(t, {
    packageJson: { ...readyPackage(), packageManager: 'yarn@4.5.0' },
    lockfile: ['yarn.lock', '__metadata:\n  version: 8\n'],
    files: [['.github/workflows/test.yml', 'name: Test\non: pull_request\njobs: {}\n']],
  })
  const plan = await planQualitySetup({ projectRoot: root })
  const workflow = plan.operations.find((operation) => operation.path === '.github/workflows/react-quality.yml')?.contents ?? ''
  assert.match(workflow, /run: corepack enable/)
  assert.match(workflow, /run: yarn install --immutable/)
})

test('React Doctor CLI setup does not require the unused Oxlint React Doctor plugin', async (t) => {
  const packageJson = readyPackage({ devDependencies: { 'oxlint-plugin-react-doctor': undefined } })
  const { root } = await fixture(t, { packageJson })

  const plan = await planQualitySetup({ projectRoot: root })

  assert.equal(plan.conflicts.some((item) => item.code === 'missing-quality-dependencies' && item.dependencies.includes('oxlint-plugin-react-doctor')), false)
  assert.equal(plan.conflicts.length, 0)
})

test('apply rechecks preconditions and aborts before mutation when a target changes after planning', async (t) => {
  const { root } = await fixture(t, { files: [['AGENTS.md', '# Before\n']] })
  const plan = await planQualitySetup({ projectRoot: root })
  await writeFile(join(root, 'AGENTS.md'), '# Changed after plan\n')

  await assert.rejects(() => applyQualitySetup(plan), /changed after planning/i)

  assert.equal(existsSync(join(root, '.react-quality')), false)
  assert.equal(await readFile(join(root, 'AGENTS.md'), 'utf8'), '# Changed after plan\n')
})

test('a mid-commit rename failure rolls back every earlier write and created directory', async (t) => {
  const { root } = await fixture(t, { files: [['AGENTS.md', '# Original\n']] })
  const before = await snapshotTree(root)
  const plan = await planQualitySetup({ projectRoot: root })
  let commits = 0

  await assert.rejects(
    () => applyQualitySetup(plan, {
      commitRename: async (source, destination) => {
        commits += 1
        if (commits === 2) throw new Error('injected commit failure')
        const { rename } = await import('node:fs/promises')
        await rename(source, destination)
      },
    }),
    /injected commit failure/,
  )

  assert.deepEqual(await snapshotTree(root), before)
  assert.equal(existsSync(join(root, '.react-quality')), false)
})

test('post-commit backup cleanup failure never rolls back committed destinations', async (t) => {
  const { root } = await fixture(t, { files: [['AGENTS.md', '# Existing\n']] })
  const plan = await planQualitySetup({ projectRoot: root })
  let failed = false
  const result = await applyQualitySetup(plan, {
    removeBackup: async (path) => {
      if (!failed) {
        failed = true
        throw new Error('injected backup cleanup failure')
      }
      const { unlink } = await import('node:fs/promises')
      await unlink(path)
    },
  })

  assert.equal(result.cleanupWarnings.length, 1)
  assert.match(result.cleanupWarnings[0], /injected backup cleanup failure/)
  assert.equal(JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).scripts['quality:react'].startsWith('oxlint'), true)
  assert.equal(existsSync(join(root, '.react-quality/installation.json')), true)
})

test('rollback attempts every restoration and aggregates cleanup errors', async (t) => {
  const { root } = await fixture(t, { files: [['AGENTS.md', '# Original\n']] })
  const originalPackage = await readFile(join(root, 'package.json'), 'utf8')
  const plan = await planQualitySetup({ projectRoot: root })
  let commits = 0
  let rollbackUnlinks = 0

  await assert.rejects(
    () => applyQualitySetup(plan, {
      commitRename: async (source, destination) => {
        commits += 1
        if (commits === plan.operations.length) throw new Error('commit failed late')
        await rename(source, destination)
      },
      rollbackUnlink: async (path) => {
        rollbackUnlinks += 1
        if (rollbackUnlinks === 1) throw new Error('one rollback unlink failed')
        const { unlink } = await import('node:fs/promises')
        await unlink(path)
      },
    }),
    (error) => error instanceof AggregateError && error.errors.some((item) => /commit failed late/.test(item.message)) && error.errors.some((item) => /rollback unlink failed/.test(item.message)),
  )

  assert.equal(await readFile(join(root, 'package.json'), 'utf8'), originalPackage)
  assert.match(await readFile(join(root, 'AGENTS.md'), 'utf8'), /^# Original/m)
})

test('apply rejects a symlink escape introduced after planning before writing outside', async (t) => {
  const { parent, root } = await fixture(t)
  const outside = join(parent, 'outside')
  const plan = await planQualitySetup({ projectRoot: root })
  await mkdir(outside)
  await symlink(outside, join(root, '.react-quality'))

  await assert.rejects(() => applyQualitySetup(plan), /outside|symlink/i)

  assert.deepEqual(await readdir(outside), [])
})

test('CLI dry-run is non-mutating and emits Markdown for a path containing spaces', async (t) => {
  const { root } = await fixture(t, { name: 'project with spaces' })
  const before = await snapshotTree(root)
  const cli = fileURLToPath(new URL('./setup-react-quality.mjs', import.meta.url))

  const run = spawnSync(process.execPath, [cli, '--project', root, '--format', 'markdown'], { encoding: 'utf8' })

  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stdout, /^# React quality setup plan/m)
  assert.match(run.stdout, /Mode: dry-run/)
  assert.deepEqual(await snapshotTree(root), before)
})

test('CLI apply Markdown explicitly says verification was not executed', async (t) => {
  const { root } = await fixture(t, { name: 'apply status' })
  const cli = fileURLToPath(new URL('./setup-react-quality.mjs', import.meta.url))

  const run = spawnSync(process.execPath, [cli, '--project', root, '--apply', '--format', 'markdown'], { encoding: 'utf8' })

  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stdout, /Verification executed: no/)
  assert.match(run.stdout, /Result: not run/)
  assert.doesNotMatch(run.stdout, /Result: failed/)
  assert.equal(existsSync(join(root, '.react-quality/installation.json')), true)
})

test('CLI verify exits nonzero when any verification command fails and zero when all pass', async (t) => {
  const cli = fileURLToPath(new URL('./setup-react-quality.mjs', import.meta.url))

  async function runVerification(name, failingScript = null) {
    const { root } = await fixture(t, { name })
    await applyQualitySetup(await planQualitySetup({ projectRoot: root }))
    const bin = join(root, 'test-bin')
    const executable = join(bin, 'pnpm')
    await mkdir(bin)
    await writeFile(executable, [
      '#!/usr/bin/env node',
      `process.exit(process.argv.includes(${JSON.stringify(failingScript)}) ? 7 : 0)`,
      '',
    ].join('\n'))
    await chmod(executable, 0o755)
    return spawnSync(process.execPath, [cli, '--project', root, '--verify', '--format', 'json'], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ''}` },
    })
  }

  const failed = await runVerification('verify failure', 'quality:react-doctor:changed')
  assert.notEqual(failed.status, 0, failed.stdout)
  assert.equal(JSON.parse(failed.stdout).result.verification.passed, false)

  const passed = await runVerification('verify success')
  assert.equal(passed.status, 0, passed.stderr)
  assert.equal(JSON.parse(passed.stdout).result.verification.passed, true)
})

test('CLI verify refuses malformed or drifted installation state before any command runs', async (t) => {
  const cli = fileURLToPath(new URL('./setup-react-quality.mjs', import.meta.url))
  const cases = [
    ['empty manifest', async (root) => {
      await writeFile(join(root, '.react-quality/installation.json'), '{}\n')
    }],
    ['snapshot hash tamper', async (root) => {
      const path = join(root, '.react-quality/installation.json')
      const manifest = JSON.parse(await readFile(path, 'utf8'))
      manifest.snapshotHash = '0'.repeat(64)
      await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)
    }],
    ['manifest script tamper', async (root) => {
      const path = join(root, '.react-quality/installation.json')
      const manifest = JSON.parse(await readFile(path, 'utf8'))
      manifest.managedPackageScripts['quality:react'] = 'node malicious.mjs'
      await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)
    }],
    ['package script tamper', async (root) => {
      const path = join(root, 'package.json')
      const packageJson = JSON.parse(await readFile(path, 'utf8'))
      packageJson.scripts['quality:react'] = 'node malicious.mjs'
      await writeFile(path, `${JSON.stringify(packageJson, null, 2)}\n`)
    }],
    ['transitive helper drift', async (root) => {
      const path = join(root, '.react-quality/scripts/git-pull-request-diff-base.mjs')
      await writeFile(path, `${await readFile(path, 'utf8')}\n// tampered\n`)
    }],
    ['AGENTS marker tamper', async (root) => {
      const path = join(root, 'AGENTS.md')
      await writeFile(path, (await readFile(path, 'utf8')).replace(START, '<!-- changed:start -->'))
    }],
  ]

  for (const [name, tamper] of cases) {
    const { root } = await fixture(t, { name })
    await applyQualitySetup(await planQualitySetup({ projectRoot: root }))
    await tamper(root)
    const bin = join(root, 'test-bin')
    const executable = join(bin, 'pnpm')
    const sentinel = join(root, 'verification-command-ran')
    await mkdir(bin)
    await writeFile(executable, [
      '#!/usr/bin/env node',
      "require('node:fs').writeFileSync(process.env.SENTINEL_FILE, 'ran')",
      '',
    ].join('\n'))
    await chmod(executable, 0o755)

    const run = spawnSync(process.execPath, [cli, '--project', root, '--verify', '--format', 'json'], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`, SENTINEL_FILE: sentinel },
    })

    assert.notEqual(run.status, 0, `${name}: ${run.stdout}`)
    assert.equal(existsSync(sentinel), false, `${name}: verification command ran before integrity validation`)
  }
})
