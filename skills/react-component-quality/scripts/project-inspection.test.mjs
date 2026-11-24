import assert from 'node:assert/strict'
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { formatInspectionMarkdown, inspectProject, validateProjectRoot } from './project-inspection.mjs'

async function fixture(t, name, packageJson, files = []) {
  const parent = await mkdtemp(join(tmpdir(), 'react inspection '))
  const root = join(parent, name)
  await mkdir(root, { recursive: true })
  await writeFile(join(root, 'package.json'), typeof packageJson === 'string'
    ? packageJson
    : `${JSON.stringify(packageJson, null, 2)}\n`)

  await Promise.all(files.map(async ([relativePath, content = '']) => {
    const target = join(root, relativePath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content)
  }))

  t.after(() => rm(parent, { recursive: true, force: true }))
  return root
}

test('rejects filesystem root, home, and this skill repository by default', async () => {
  assert.throws(() => validateProjectRoot('/'), /Refusing unsafe project root/)
  assert.throws(() => validateProjectRoot(homedir()), /Refusing unsafe project root/)
  assert.throws(() => validateProjectRoot(fileURLToPath(new URL('../../../', import.meta.url))), /Refusing skill repository/)
})

test('requires a readable and valid package.json', async (t) => {
  const missingParent = await mkdtemp(join(tmpdir(), 'inspection-missing-'))
  t.after(() => rm(missingParent, { recursive: true, force: true }))
  assert.throws(() => validateProjectRoot(missingParent), /package\.json/)

  const malformed = await fixture(t, 'malformed', '{ nope')
  await assert.rejects(() => inspectProject(malformed), /Malformed package\.json/)
})

test('detects pnpm workspace, AGENTS policy, languages, frameworks, commands, and profiles', async (t) => {
  const root = await fixture(t, 'pnpm-react', {
    packageManager: 'pnpm@10.0.0',
    scripts: { lint: 'oxlint', test: 'vitest run', typecheck: 'tsc --noEmit' },
    dependencies: { react: '^19', 'react-dom': '^19', zustand: '^5', i18next: '^25' },
    devDependencies: { typescript: '^5', vite: '^7', tailwindcss: '^4', electron: '^38' },
  }, [
    ['pnpm-lock.yaml'],
    ['pnpm-workspace.yaml', "packages:\n  - 'apps/*'\n"],
    ['AGENTS.md', '# Policy'],
    ['components.json', '{}'],
    ['electron.vite.config.ts', ''],
    ['.github/workflows/pr.yml', 'name: PR'],
    ['src/App.tsx', ''],
    ['src/legacy.js', ''],
  ])

  const result = await inspectProject(root)

  assert.equal(result.root, await realpath(root))
  assert.equal(result.packageManager, 'pnpm')
  assert.equal(result.workspace.detected, true)
  assert.deepEqual(result.workspace.patterns, ['apps/*'])
  assert.deepEqual(result.languages, ['javascript', 'typescript'])
  assert.deepEqual(result.frameworks, ['electron', 'react', 'vite'])
  assert.deepEqual(result.profiles, [
    'electron',
    'github-actions',
    'localization',
    'react-core',
    'tailwind-shadcn',
    'typescript',
    'zustand',
  ])
  assert.equal(result.files.agents.exists, true)
  assert.equal(result.files.agents.path, join(result.root, 'AGENTS.md'))
  assert.deepEqual(result.commands, { lint: 'pnpm run lint', test: 'pnpm run test', typecheck: 'pnpm run typecheck' })
  assert.equal(result.dependencies.react, '^19')
  assert.deepEqual(result.conflicts, [])
})

test('records lint, test, PR-template, E2E, and build evidence by category', async (t) => {
  const root = await fixture(t, 'tooling-evidence', {
    packageManager: 'npm@10.0.0',
    scripts: { build: 'vite build', e2e: 'playwright test', test: 'vitest run' },
    dependencies: { react: '^19' },
    devDependencies: {
      '@playwright/test': '^1.54.0',
      eslint: '^9.0.0',
      vite: '^7.0.0',
      vitest: '^3.0.0',
    },
  }, [
    ['package-lock.json'],
    ['eslint.config.mjs', 'export default []\n'],
    ['vitest.config.ts', 'export default {}\n'],
    ['playwright.config.ts', 'export default {}\n'],
    ['config/oxlint-feature.json', '{}\n'],
    ['config/vitest.renderer.ts', 'export default {}\n'],
    ['tests/playwright.desktop.ts', 'export default {}\n'],
    ['vite.config.ts', 'export default {}\n'],
    ['.github/PULL_REQUEST_TEMPLATE/quality.md', '# Quality\n'],
    ['src/App.tsx', 'export const App = () => null\n'],
  ])

  const result = await inspectProject(root)

  assert.deepEqual(result.evidence.lintConfigs, ['config/oxlint-feature.json', 'eslint.config.mjs'])
  assert.deepEqual(result.evidence.testConfigs, ['config/vitest.renderer.ts', 'playwright.config.ts', 'tests/playwright.desktop.ts', 'vitest.config.ts'])
  assert.deepEqual(result.evidence.prTemplates, ['.github/PULL_REQUEST_TEMPLATE/quality.md'])
  assert.deepEqual(result.evidence.tooling.e2e, {
    packages: ['@playwright/test'],
    configs: ['playwright.config.ts', 'tests/playwright.desktop.ts'],
    scripts: ['e2e'],
  })
  assert.deepEqual(result.evidence.tooling.build, {
    packages: ['vite'],
    configs: ['vite.config.ts'],
    scripts: ['build'],
  })

  const markdown = formatInspectionMarkdown(result)
  assert.match(markdown, /Lint configs: config\/oxlint-feature\.json, eslint\.config\.mjs/)
  assert.match(markdown, /Test configs: config\/vitest\.renderer\.ts, playwright\.config\.ts, tests\/playwright\.desktop\.ts, vitest\.config\.ts/)
  assert.match(markdown, /PR templates: \.github\/PULL_REQUEST_TEMPLATE\/quality\.md/)
  assert.match(markdown, /E2E tooling: packages=@playwright\/test; configs=playwright\.config\.ts, tests\/playwright\.desktop\.ts; scripts=e2e/)
  assert.match(markdown, /Build tooling: packages=vite; configs=vite\.config\.ts; scripts=build/)
})

test('detects npm, yarn, and JavaScript-only React projects', async (t) => {
  const npmRoot = await fixture(t, 'npm-react', {
    scripts: { test: 'node --test' },
    dependencies: { react: '^18' },
  }, [['package-lock.json'], ['src/App.jsx']])
  const yarnRoot = await fixture(t, 'yarn-react', {
    dependencies: { react: '^18', next: '^15' },
  }, [['yarn.lock'], ['src/App.js']])

  const npmResult = await inspectProject(npmRoot)
  const yarnResult = await inspectProject(yarnRoot)

  assert.equal(npmResult.packageManager, 'npm')
  assert.deepEqual(npmResult.languages, ['javascript'])
  assert.deepEqual(npmResult.profiles, ['react-core'])
  assert.equal(npmResult.commands.test, 'npm run test')
  assert.equal(yarnResult.packageManager, 'yarn')
  assert.deepEqual(yarnResult.frameworks, ['next', 'react'])
})

test('reports lockfile and packageManager declaration conflicts without hiding evidence', async (t) => {
  const root = await fixture(t, 'conflicting-locks', {
    packageManager: 'yarn@4.5.0',
    scripts: { lint: 'eslint .' },
    dependencies: { react: '^19' },
  }, [['pnpm-lock.yaml'], ['package-lock.json'], ['src/App.tsx']])

  const result = await inspectProject(root)

  assert.equal(result.packageManager, 'yarn')
  assert.equal(result.conflicts.some((item) => item.code === 'multiple-lockfiles'), true)
  assert.equal(result.conflicts.some((item) => item.code === 'package-manager-mismatch'), true)
  assert.deepEqual(result.files.lockfiles.found, ['package-lock.json', 'pnpm-lock.yaml'])
  assert.deepEqual(result.commands, {})
})

test('does not guess runnable commands when no package manager evidence exists', async (t) => {
  const root = await fixture(t, 'no-manager', {
    scripts: { lint: 'eslint .' },
    dependencies: { react: '^19' },
  }, [['src/App.jsx']])

  const result = await inspectProject(root)

  assert.equal(result.packageManager, 'unknown')
  assert.deepEqual(result.commands, {})
})

test('reports simultaneous Bun lockfile variants as conflicting evidence', async (t) => {
  const root = await fixture(t, 'bun-lock-conflict', {
    scripts: { test: 'bun test' },
    dependencies: { react: '^19' },
  }, [['bun.lock'], ['bun.lockb'], ['src/App.jsx']])

  const result = await inspectProject(root)

  assert.equal(result.packageManager, 'bun')
  assert.equal(result.conflicts.some((item) => item.code === 'multiple-lockfiles'), true)
  assert.deepEqual(result.files.lockfiles.found, ['bun.lock', 'bun.lockb'])
  assert.deepEqual(result.commands, {})
})

test('CLI emits parseable JSON and readable Markdown from a path containing spaces', async (t) => {
  const root = await fixture(t, 'cli project', {
    dependencies: { react: '^19' },
  }, [['package-lock.json'], ['AGENTS.md', '# Rules']])
  const cli = fileURLToPath(new URL('./inspect-project.mjs', import.meta.url))

  const jsonRun = spawnSync(process.execPath, [cli, '--project', root, '--format', 'json'], { encoding: 'utf8' })
  assert.equal(jsonRun.status, 0, jsonRun.stderr)
  assert.equal(JSON.parse(jsonRun.stdout).root, await realpath(root))

  const markdownRun = spawnSync(process.execPath, [cli, '--project', root, '--format', 'markdown'], { encoding: 'utf8' })
  assert.equal(markdownRun.status, 0, markdownRun.stderr)
  assert.match(markdownRun.stdout, /^# React project inspection/m)
  assert.match(markdownRun.stdout, /Package manager: npm/)
  assert.match(markdownRun.stdout, /AGENTS\.md: found/)
})
