#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync, realpathSync, readdirSync } from 'node:fs'
import { mkdir, open, rename, rmdir, unlink } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { hasMaxLinesDisable } from '../assets/quality-kit/scripts/max-lines-suppressions.mjs'
import { inspectProject, validateProjectRoot } from './project-inspection.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const assetRoot = resolve(scriptDirectory, '../assets/quality-kit')
const START = '<!-- react-component-quality:start -->'
const END = '<!-- react-component-quality:end -->'
const INSTALLATION = '.react-quality/installation.json'
const KNOWN_PROFILES = new Set(['electron', 'github-actions', 'localization', 'react-core', 'tailwind-shadcn', 'typescript', 'zustand'])
const REQUIRED_DEPENDENCIES = ['@testing-library/react', '@types/react', 'oxlint', 'typescript', 'vitest']
const EXACT_SEMVER = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
const MANAGED_SCRIPTS = {
  'create:component': 'node .react-quality/scripts/scaffold-component.mjs',
  'quality:react': 'oxlint --config .react-quality/config/oxlint-react-quality.json .',
  'quality:react:changed': 'node .react-quality/scripts/check-changed-code-quality.mjs',
  'quality:react-doctor:changed': 'node .react-quality/scripts/check-react-doctor-changed.mjs',
  'quality:max-lines': 'node .react-quality/scripts/check-max-lines-ratchet.mjs',
}
const CORE_ASSETS = [
  ['scripts/scaffold-component.mjs', 'scripts/scaffold-component.mjs'],
  ['scripts/check-changed-code-quality.mjs', 'scripts/check-changed-code-quality.mjs'],
  ['scripts/check-react-doctor-changed.mjs', 'scripts/check-react-doctor-changed.mjs'],
  ['scripts/check-max-lines-ratchet.mjs', 'scripts/check-max-lines-ratchet.mjs'],
  ['scripts/max-lines-suppressions.mjs', 'scripts/max-lines-suppressions.mjs'],
  ['scripts/git-pull-request-diff-base.mjs', 'scripts/git-pull-request-diff-base.mjs'],
  ['templates/component.tsx.txt', 'templates/component.tsx.txt'],
  ['templates/component.test.tsx.txt', 'templates/component.test.tsx.txt'],
  ['templates/hook.ts.txt', 'templates/hook.ts.txt'],
  ['templates/hook.test.tsx.txt', 'templates/hook.test.tsx.txt'],
  ['templates/model.ts.txt', 'templates/model.ts.txt'],
  ['templates/model.test.ts.txt', 'templates/model.test.ts.txt'],
]

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizedJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function readJson(path, label) {
  try {
    const result = JSON.parse(readFileSync(path, 'utf8'))
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('expected an object')
    return result
  } catch (error) {
    throw new Error(`Malformed ${label} at ${path}: ${error.message}`)
  }
}

function pathInside(root, candidate) {
  const difference = relative(root, candidate)
  return difference === '' || (difference !== '..' && !difference.startsWith(`..${sep}`) && !isAbsolute(difference))
}

function nearestExisting(path) {
  let candidate = path
  while (!existsSync(candidate)) candidate = dirname(candidate)
  return realpathSync(candidate)
}

function assertSafeDestination(root, destination) {
  if (!pathInside(root, destination)) throw new Error(`Destination is outside project root: ${destination}`)
  const ancestor = nearestExisting(destination)
  if (!pathInside(root, ancestor)) throw new Error(`Destination resolves outside project root through a symlink: ${destination}`)
  if (existsSync(destination) && lstatSync(destination).isSymbolicLink()) throw new Error(`Refusing symlink destination: ${destination}`)
}

function currentContents(path) {
  try {
    if (!lstatSync(path).isFile()) return { exists: true, contents: null, hash: null, type: 'non-file' }
    const contents = readFileSync(path, 'utf8')
    return { exists: true, contents, hash: sha256(contents), type: 'file' }
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false, contents: null, hash: null, type: 'missing' }
    throw error
  }
}

function renderAsset(source, replacements = {}) {
  let contents = readFileSync(join(assetRoot, source), 'utf8')
  for (const [token, value] of Object.entries(replacements)) contents = contents.replaceAll(token, value)
  return contents
}

function renderQualityConfig(zustand) {
  const config = JSON.parse(renderAsset('config/oxlint-react-quality.json'))
  config.jsPlugins = []
  if (zustand) {
    config.jsPlugins.push({ name: 'zustand-selectors', specifier: '../plugins/zustand-selectors.mjs' })
    config.rules['zustand-selectors/require-selector'] = 'error'
    config.rules['zustand-selectors/no-fresh-selector-result'] = 'error'
  }
  return normalizedJson(config)
}

function packageRun(manager) {
  return manager === 'yarn' ? 'yarn' : manager === 'unknown' ? 'npm run' : `${manager} run`
}

function renderAgents(manager, zustand) {
  return renderAsset('templates/AGENTS.react-quality.md', {
    __RUN__: packageRun(manager),
    __VERIFY_COMMAND__: `node ${fileURLToPath(import.meta.url)} --project . --verify`,
    __ZUSTAND_POLICY__: zustand
      ? '- Zustand components must pass focused selectors. Custom Oxlint rules `zustand-selectors/require-selector` and `zustand-selectors/no-fresh-selector-result` reject whole-store subscriptions and allocating selector results.'
      : '- If Zustand is introduced, rerun setup so selector-specific custom Oxlint rules are installed.',
  }).trim()
}

function mergeAgents(existing, section, conflicts) {
  const starts = existing.split(START).length - 1
  const ends = existing.split(END).length - 1
  if (starts !== ends || starts > 1) {
    conflicts.push({ code: 'agents-marker-conflict', path: 'AGENTS.md', message: 'AGENTS.md has malformed or duplicate react quality markers.' })
    return existing
  }
  if (starts === 1) {
    const start = existing.indexOf(START)
    const end = existing.indexOf(END, start)
    if (end < start) {
      conflicts.push({ code: 'agents-marker-conflict', path: 'AGENTS.md', message: 'AGENTS.md managed markers are out of order.' })
      return existing
    }
    return `${existing.slice(0, start)}${section}${existing.slice(end + END.length)}`
  }
  const prefix = existing.length === 0 ? '' : `${existing.trimEnd()}\n\n`
  return `${prefix}${section}\n`
}

function trackedSuppressions(root) {
  const result = spawnSync('git', ['ls-files', '*.js', '*.jsx', '*.ts', '*.tsx', '*.mjs', '*.cjs'], { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) throw new Error('React quality setup requires a Git repository to create a tracked-only max-lines baseline.')
  return result.stdout.split(/\r?\n/).filter(Boolean).filter((path) => path !== '.react-quality/scripts/check-max-lines-ratchet.mjs').filter((path) => {
    try {
      return hasMaxLinesDisable(readFileSync(join(root, path), 'utf8'))
    } catch { return false }
  }).map((path) => `inline ${path}`).sort()
}

function baselineContents(entries) {
  return ['# Existing tracked max-lines suppressions. This ratchet may only shrink.', '# New entries are not accepted by --prune; split the file instead.', '', ...entries, ''].join('\n')
}

function baselineEntries(contents) {
  return new Set(contents.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')))
}

function githubWorkflow(manager) {
  const run = packageRun(manager)
  const setup = manager === 'bun'
    ? ['      - uses: oven-sh/setup-bun@v2']
    : [
        ...(manager === 'pnpm' ? ['      - uses: pnpm/action-setup@v4'] : []),
        '      - uses: actions/setup-node@v4',
        '        with:',
        '          node-version: 22',
        ...(manager === 'yarn' ? [] : [`          cache: ${manager}`]),
        ...(manager === 'yarn' ? ['      - run: corepack enable'] : []),
      ]
  const install = manager === 'yarn' ? 'yarn install --immutable' : manager === 'pnpm' ? 'pnpm install --frozen-lockfile' : manager === 'bun' ? 'bun install --frozen-lockfile' : 'npm ci'
  return [
    '# Managed by react-component-quality.',
    'name: React quality',
    '',
    'on:',
    '  pull_request:',
    '',
    'jobs:',
    '  react-quality:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '        with:',
    '          fetch-depth: 0',
    ...setup,
    `      - run: ${install}`,
    `      - run: ${run} quality:react:changed -- \${{ github.event.pull_request.base.sha }}`,
    `      - run: ${run} quality:react-doctor:changed -- \${{ github.event.pull_request.base.sha }}`,
    `      - run: ${run} quality:max-lines`,
    '',
  ].join('\n')
}

function workflowAmbiguity(root) {
  const directory = join(root, '.github/workflows')
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name) && entry.name !== 'react-quality.yml').filter((entry) => /quality:react|react-doctor|check-max-lines-ratchet/.test(readFileSync(join(directory, entry.name), 'utf8'))).map((entry) => `.github/workflows/${entry.name}`)
}

function hasExactPackageManagerVersion(declared, manager) {
  if (typeof declared !== 'string' || !declared.startsWith(`${manager}@`)) return false
  const match = EXACT_SEMVER.exec(declared.slice(manager.length + 1))
  if (!match) return false
  return !(match[1]?.split('.').some((identifier) => /^0\d+$/.test(identifier)) ?? false)
}

function addManagedFile({ root, relativePath, contents, previous, operations, creates, updates, conflicts }) {
  const destination = join(root, relativePath)
  assertSafeDestination(root, destination)
  const current = currentContents(destination)
  const desiredHash = sha256(contents)
  if (!current.exists) {
    creates.push(relativePath)
    operations.push({ path: relativePath, contents, beforeHash: null, desiredHash })
    return
  }
  if (current.type !== 'file') {
    conflicts.push({ code: 'unmanaged-destination', path: relativePath, message: `${relativePath} exists and is not a regular file.` })
    return
  }
  if (current.hash === desiredHash) return
  if (previous?.managedFiles?.[relativePath] === current.hash) {
    updates.push(relativePath)
    operations.push({ path: relativePath, contents, beforeHash: current.hash, desiredHash })
    return
  }
  conflicts.push({ code: 'unmanaged-destination', path: relativePath, message: `Refusing to overwrite target-owned or locally edited ${relativePath}.` })
}

function readPreviousInstallation(root, conflicts) {
  const path = join(root, INSTALLATION)
  if (!existsSync(path)) return null
  try { return readJson(path, 'installation manifest') } catch (error) {
    conflicts.push({ code: 'installation-manifest-conflict', path: INSTALLATION, message: error.message })
    return null
  }
}

function planDigest(plan) {
  return sha256(JSON.stringify({ projectRoot: plan.projectRoot, profiles: plan.profiles, conflicts: plan.conflicts, operations: plan.operations, packageScripts: plan.packageScripts, agentsSection: plan.agentsSection, verificationCommands: plan.verificationCommands }))
}

export async function planQualitySetup({ projectRoot, profiles } = {}) {
  const root = validateProjectRoot(projectRoot)
  const inspection = await inspectProject(root)
  const packagePath = join(root, 'package.json')
  const packageJson = readJson(packagePath, 'package.json')
  const selectedProfiles = [...new Set(profiles ?? inspection.profiles)].sort()
  const conflicts = inspection.conflicts.map((conflict) => ({ ...conflict }))
  for (const profile of selectedProfiles) {
    if (!KNOWN_PROFILES.has(profile)) conflicts.push({ code: 'unknown-profile', profile, message: `Unknown React quality profile: ${profile}` })
    else if (!inspection.profiles.includes(profile)) conflicts.push({ code: 'profile-not-supported', profile, message: `Profile ${profile} is not supported by detected project capabilities.` })
  }
  if (!inspection.frameworks.includes('react')) conflicts.push({ code: 'react-not-detected', message: 'React dependency was not detected; setup will not guess a React target.' })
  if (inspection.packageManager === 'unknown') conflicts.push({ code: 'package-manager-unknown', message: 'No unambiguous package manager was detected.' })
  if (!inspection.languages.includes('typescript')) conflicts.push({ code: 'typescript-required', message: 'The bundled scaffold is TypeScript/Vitest-only; add TypeScript support or use a future JavaScript profile.' })
  const missingDependencies = REQUIRED_DEPENDENCIES.filter((name) => !Object.hasOwn(inspection.dependencies, name))
  if (missingDependencies.length > 0) conflicts.push({ code: 'missing-quality-dependencies', dependencies: missingDependencies, message: `Install required React quality dependencies before setup: ${missingDependencies.join(', ')}` })
  if (!['jsdom', 'happy-dom'].some((name) => Object.hasOwn(inspection.dependencies, name))) conflicts.push({ code: 'missing-test-environment', message: 'Install jsdom or happy-dom so generated React component tests have a DOM environment.' })

  const previous = readPreviousInstallation(root, conflicts)
  const operations = []
  const creates = []
  const updates = []
  const zustand = selectedProfiles.includes('zustand') && Object.hasOwn(inspection.dependencies, 'zustand')
  const files = new Map()
  files.set('.react-quality/config/oxlint-react-quality.json', renderQualityConfig(zustand))
  for (const [source, destination] of CORE_ASSETS) {
    files.set(`.react-quality/${destination}`, renderAsset(source, { __PACKAGE_MANAGER__: inspection.packageManager }))
  }
  if (zustand) files.set('.react-quality/plugins/zustand-selectors.mjs', renderAsset('plugins/zustand-selectors.mjs'))
  const currentSuppressions = trackedSuppressions(root)
  const baselineRelativePath = '.react-quality/config/max-lines-baseline.txt'
  const baselinePath = join(root, baselineRelativePath)
  if (previous && existsSync(baselinePath)) {
    const existingBaseline = readFileSync(baselinePath, 'utf8')
    const existingEntries = baselineEntries(existingBaseline)
    const authoritativeEntries = Array.isArray(previous.maxLinesBaselineEntries)
      ? new Set(previous.maxLinesBaselineEntries)
      : null
    if (previous.managedFiles?.[baselineRelativePath] !== sha256(existingBaseline)) {
      const additions = authoritativeEntries ? [...existingEntries].filter((entry) => !authoritativeEntries.has(entry)) : [...existingEntries]
      if (additions.length > 0 || !authoritativeEntries) conflicts.push({ code: 'managed-baseline-edited', path: baselineRelativePath, paths: additions, message: 'Managed max-lines baseline contains additions outside the shrink-only setup/prune flow.' })
    }
    const priorEntries = existingEntries
    const newBypasses = currentSuppressions.filter((entry) => !priorEntries.has(entry))
    if (newBypasses.length > 0) {
      conflicts.push({ code: 'new-max-lines-bypass', paths: newBypasses, message: `New max-lines bypasses cannot be added by setup: ${newBypasses.join(', ')}` })
    }
    files.set(baselineRelativePath, baselineContents([...priorEntries].filter((entry) => currentSuppressions.includes(entry)).sort()))
  } else if (previous) {
    conflicts.push({ code: 'managed-baseline-missing', path: baselineRelativePath, message: 'Managed max-lines baseline is missing; restore it before setup so new bypasses cannot be grandfathered.' })
  } else {
    files.set(baselineRelativePath, baselineContents(currentSuppressions))
  }

  if (inspection.files.githubActions.exists && selectedProfiles.includes('github-actions')) {
    const ambiguous = workflowAmbiguity(root)
    if (ambiguous.length > 0) conflicts.push({ code: 'github-quality-ambiguous', paths: ambiguous, message: `Existing workflows already wire React quality: ${ambiguous.join(', ')}` })
    const needsPin = ['pnpm', 'yarn', 'bun'].includes(inspection.packageManager)
    const reproducible = !needsPin || hasExactPackageManagerVersion(packageJson.packageManager, inspection.packageManager)
    if (!reproducible) conflicts.push({ code: 'github-package-manager-unpinned', message: `GitHub Actions wiring requires packageManager to pin ${inspection.packageManager}.` })
    else if (ambiguous.length === 0) files.set('.github/workflows/react-quality.yml', githubWorkflow(inspection.packageManager))
  }

  for (const [relativePath, contents] of files) addManagedFile({ root, relativePath, contents, previous, operations, creates, updates, conflicts })

  const nextPackage = structuredClone(packageJson)
  nextPackage.scripts = { ...(nextPackage.scripts ?? {}) }
  for (const [name, value] of Object.entries(MANAGED_SCRIPTS)) {
    const existing = nextPackage.scripts[name]
    if (existing !== undefined && existing !== value) conflicts.push({ code: 'package-script-conflict', path: 'package.json', script: name, message: `package.json script ${name} already has a different value.` })
    else nextPackage.scripts[name] = value
  }
  if (JSON.stringify(packageJson) !== JSON.stringify(nextPackage)) {
    const contents = normalizedJson(nextPackage)
    updates.push('package.json')
    operations.push({ path: 'package.json', contents, beforeHash: sha256(readFileSync(packagePath, 'utf8')), desiredHash: sha256(contents) })
  }

  const agentsPath = join(root, 'AGENTS.md')
  const existingAgents = existsSync(agentsPath) ? readFileSync(agentsPath, 'utf8') : ''
  const agentsSection = renderAgents(inspection.packageManager, zustand)
  const nextAgents = mergeAgents(existingAgents, agentsSection, conflicts)
  if (nextAgents !== existingAgents) {
    const kind = existsSync(agentsPath) ? updates : creates
    kind.push('AGENTS.md')
    operations.push({ path: 'AGENTS.md', contents: nextAgents, beforeHash: existsSync(agentsPath) ? sha256(existingAgents) : null, desiredHash: sha256(nextAgents) })
  }

  const managedFiles = Object.fromEntries([...files.entries()].map(([path, contents]) => [path, sha256(contents)]).sort(([left], [right]) => left.localeCompare(right)))
  const snapshotHash = sha256(JSON.stringify(managedFiles))
  const currentInstallation = currentContents(join(root, INSTALLATION))
  const createdPaths = [...new Set([...(previous?.createdPaths ?? []), ...creates, ...(!currentInstallation.exists ? [INSTALLATION] : [])])].sort()
  const historicalUpdates = [...new Set([...(previous?.updatedPaths ?? []), ...updates])].sort()
  const installedAt = previous?.installedAt ?? null
  const installationBase = {
    schemaVersion: 2,
    snapshotHash,
    profiles: selectedProfiles,
    createdPaths,
    updatedPaths: historicalUpdates,
    managedFiles,
    maxLinesBaselineEntries: [...baselineEntries(files.get(baselineRelativePath) ?? '')].sort(),
    managedPackageScripts: MANAGED_SCRIPTS,
    agentsMarkers: { start: START, end: END },
    installedAt,
  }
  const semanticChanged = previous && JSON.stringify({ ...previous, installedAt: null }) !== JSON.stringify({ ...installationBase, installedAt: null })
  const installation = semanticChanged
    ? { ...installationBase, updatedPaths: [...new Set([...historicalUpdates, INSTALLATION])].sort() }
    : installationBase
  const installationContents = normalizedJson(installation)
  if (!currentInstallation.exists) {
    creates.push(INSTALLATION)
    operations.push({ path: INSTALLATION, contents: installationContents, beforeHash: null, desiredHash: sha256(installationContents), dynamicInstalledAt: true })
  } else if (previous && JSON.stringify({ ...previous, installedAt: null }) !== JSON.stringify({ ...installation, installedAt: null })) {
    updates.push(INSTALLATION)
    operations.push({ path: INSTALLATION, contents: installationContents, beforeHash: currentInstallation.hash, desiredHash: sha256(installationContents), dynamicInstalledAt: true })
  }

  const verificationCommands = [
    `${packageRun(inspection.packageManager)} quality:react`,
    `${packageRun(inspection.packageManager)} quality:react:changed`,
    `${packageRun(inspection.packageManager)} quality:react-doctor:changed`,
    `${packageRun(inspection.packageManager)} quality:max-lines`,
  ]
  const plan = { projectRoot: root, profiles: selectedProfiles, creates: [...new Set(creates)].sort(), updates: [...new Set(updates)].sort(), conflicts, packageScripts: MANAGED_SCRIPTS, agentsSection, verificationCommands, operations }
  plan.integrity = planDigest(plan)
  return plan
}

async function ensureDirectories(root, destination, createdDirectories) {
  const missing = []
  let directory = dirname(destination)
  while (directory !== root && !existsSync(directory)) {
    missing.push(directory)
    directory = dirname(directory)
  }
  assertSafeDestination(root, directory)
  for (const path of missing.toReversed()) {
    assertSafeDestination(root, path)
    await mkdir(path)
    createdDirectories.push(path)
    assertSafeDestination(root, path)
  }
}

function assertPlanCurrent(plan, operation) {
  const destination = join(plan.projectRoot, operation.path)
  assertSafeDestination(plan.projectRoot, destination)
  const current = currentContents(destination)
  if (current.type === 'non-file' || current.hash !== operation.beforeHash) throw new Error(`${operation.path} changed after planning; refusing partial setup.`)
}

async function removeIfPresent(path, remove, errors) {
  try { await remove(path) } catch (error) { if (error.code !== 'ENOENT') errors.push(error) }
}

async function rollbackTransaction({ committed, staged, createdDirectories, rollbackUnlink, rollbackRename }) {
  const errors = []
  for (const item of committed.toReversed()) {
    await removeIfPresent(item.destination, rollbackUnlink, errors)
    if (item.backup) {
      try { await rollbackRename(item.backup, item.destination) } catch (error) { errors.push(error) }
    }
  }
  for (const item of staged) await removeIfPresent(item.temporary, unlink, errors)
  for (const directory of createdDirectories.toReversed()) {
    try { await rmdir(directory) } catch (error) { if (!['ENOENT', 'ENOTEMPTY'].includes(error.code)) errors.push(error) }
  }
  return errors
}

export async function applyQualitySetup(plan, {
  commitRename = rename,
  removeBackup = unlink,
  rollbackRename = rename,
  rollbackUnlink = unlink,
} = {}) {
  if (!plan || plan.integrity !== planDigest(plan)) throw new Error('Invalid or mutated React quality setup plan.')
  if (plan.conflicts.length > 0) throw new Error(`React quality setup has ${plan.conflicts.length} conflict(s); resolve them before apply.`)
  for (const operation of plan.operations) assertPlanCurrent(plan, operation)

  const createdDirectories = []
  const staged = []
  const committed = []
  try {
    for (const operation of plan.operations) {
      const destination = join(plan.projectRoot, operation.path)
      await ensureDirectories(plan.projectRoot, destination, createdDirectories)
      assertPlanCurrent(plan, operation)
      const temporary = join(dirname(destination), `.${operation.path.split('/').at(-1)}.react-quality-${randomUUID()}.tmp`)
      assertSafeDestination(plan.projectRoot, temporary)
      const contents = operation.dynamicInstalledAt
        ? normalizedJson({ ...JSON.parse(operation.contents), installedAt: new Date().toISOString() })
        : operation.contents
      const handle = await open(temporary, 'wx')
      try { await handle.writeFile(contents, 'utf8') } finally { await handle.close() }
      staged.push({ ...operation, destination, temporary })
    }

    for (const item of staged) {
      assertPlanCurrent(plan, item)
      assertSafeDestination(plan.projectRoot, item.destination)
      const backup = item.beforeHash === null ? null : join(dirname(item.destination), `.${item.path.split('/').at(-1)}.react-quality-${randomUUID()}.bak`)
      if (backup) {
        assertSafeDestination(plan.projectRoot, backup)
        await rename(item.destination, backup)
      }
      const transactionItem = { ...item, backup }
      committed.push(transactionItem)
      await commitRename(item.temporary, item.destination)
    }
  } catch (error) {
    const rollbackErrors = await rollbackTransaction({ committed, staged, createdDirectories, rollbackUnlink, rollbackRename })
    if (rollbackErrors.length > 0) throw new AggregateError([error, ...rollbackErrors], `React quality setup failed and rollback reported ${rollbackErrors.length} error(s).`)
    throw error
  }

  const cleanupWarnings = []
  for (const item of committed) {
    if (!item.backup) continue
    try { await removeBackup(item.backup) } catch (error) { cleanupWarnings.push(`${item.path}: ${error.message}`) }
  }
  return {
    creates: plan.creates,
    updates: plan.updates,
    verificationCommands: plan.verificationCommands,
    verification: { ran: false, passed: null },
    cleanupWarnings,
  }
}

function verificationInvocations(manager) {
  const prefix = manager === 'yarn' ? [] : ['run']
  return ['quality:react', 'quality:react:changed', 'quality:react-doctor:changed', 'quality:max-lines'].map((script) => ({
    command: manager,
    args: [...prefix, script],
  }))
}

async function validateInstalledState(root) {
  const errors = []
  let installation
  try {
    installation = readJson(join(root, INSTALLATION), 'installation manifest')
  } catch (error) {
    throw new Error(`React quality installation integrity failed: ${error.message}`)
  }
  if (installation.schemaVersion !== 2) errors.push('schemaVersion must be 2')
  if (!Array.isArray(installation.profiles) || !installation.profiles.every((value) => typeof value === 'string')) errors.push('profiles must be a string array')
  if (!Array.isArray(installation.maxLinesBaselineEntries) || !installation.maxLinesBaselineEntries.every((value) => typeof value === 'string')) errors.push('maxLinesBaselineEntries must be a string array')
  if (!installation.managedFiles || typeof installation.managedFiles !== 'object' || Array.isArray(installation.managedFiles)) {
    errors.push('managedFiles must be an object')
  } else {
    for (const [relativePath, expectedHash] of Object.entries(installation.managedFiles).sort(([left], [right]) => left.localeCompare(right))) {
      if (!relativePath || !/^[a-f0-9]{64}$/.test(expectedHash)) {
        errors.push(`managedFiles has an invalid entry: ${relativePath || '<empty>'}`)
        continue
      }
      const destination = join(root, relativePath)
      try { assertSafeDestination(root, destination) } catch (error) { errors.push(error.message); continue }
      const current = currentContents(destination)
      if (current.type !== 'file') errors.push(`managed file is missing or unsafe: ${relativePath}`)
      else if (current.hash !== expectedHash) errors.push(`managed file hash mismatch: ${relativePath}`)
    }
    const expectedSnapshotHash = sha256(JSON.stringify(installation.managedFiles))
    if (installation.snapshotHash !== expectedSnapshotHash) errors.push('snapshotHash does not match canonical managedFiles')
  }
  if (!installation.managedPackageScripts || typeof installation.managedPackageScripts !== 'object' || Array.isArray(installation.managedPackageScripts)) {
    errors.push('managedPackageScripts must be an object')
  }
  for (const [name, expected] of Object.entries(MANAGED_SCRIPTS)) {
    if (installation.managedPackageScripts?.[name] !== expected) errors.push(`managedPackageScripts.${name} does not match the command contract`)
  }
  if (installation.agentsMarkers?.start !== START || installation.agentsMarkers?.end !== END) errors.push('agentsMarkers must contain the exact managed markers')

  const packageJson = readJson(join(root, 'package.json'), 'package.json')
  for (const [name, expected] of Object.entries(MANAGED_SCRIPTS)) {
    if (packageJson.scripts?.[name] !== expected) errors.push(`package.json script ${name} does not match the installed command contract`)
  }
  const agents = currentContents(join(root, 'AGENTS.md'))
  if (agents.type !== 'file') errors.push('AGENTS.md is missing or unsafe')
  else {
    const starts = agents.contents.split(START).length - 1
    const ends = agents.contents.split(END).length - 1
    if (starts !== 1 || ends !== 1 || agents.contents.indexOf(START) > agents.contents.indexOf(END)) errors.push('AGENTS managed marker pair is missing, duplicated, or out of order')
  }

  const plan = await planQualitySetup({ projectRoot: root })
  if (plan.conflicts.length > 0) errors.push(`setup plan has ${plan.conflicts.length} conflict(s)`)
  if (plan.creates.length > 0 || plan.updates.length > 0) errors.push(`setup plan has drift (${plan.creates.length} create(s), ${plan.updates.length} update(s))`)
  if (errors.length > 0) throw new Error(`React quality installation integrity failed:\n- ${errors.join('\n- ')}`)
  return installation
}

export async function verifyQualitySetup({ projectRoot, commandRunner = spawnSync } = {}) {
  const root = validateProjectRoot(projectRoot)
  if (!existsSync(join(root, INSTALLATION))) throw new Error(`Missing ${INSTALLATION}; apply setup before verification.`)
  await validateInstalledState(root)
  const inspection = await inspectProject(root)
  if (inspection.packageManager === 'unknown' || inspection.conflicts.length > 0) throw new Error('Cannot verify with an ambiguous package manager.')
  const results = verificationInvocations(inspection.packageManager).map(({ command, args }) => {
    const result = commandRunner(command, args, { cwd: root, encoding: 'utf8' })
    return { command: [command, ...args].join(' '), status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
  })
  return { ran: true, passed: results.every((result) => result.status === 0), results }
}

export function formatSetupPlanMarkdown(plan, applied = false, verification = null) {
  const items = (values) => values.length ? values.map((value) => `- ${value}`) : ['- none']
  const verificationResult = verification?.ran === false ? 'not run' : verification?.passed ? 'passed' : 'failed'
  return ['# React quality setup plan', '', `- Mode: ${applied ? 'apply' : verification ? 'verify' : 'dry-run'}`, `- Project: ${plan.projectRoot}`, `- Profiles: ${plan.profiles.join(', ') || 'none'}`, ...(applied || verification ? [`- Verification executed: ${verification?.ran ? 'yes' : 'no'}`] : []), '', '## Creates', '', ...items(plan.creates), '', '## Updates', '', ...items(plan.updates), '', '## Conflicts', '', ...items(plan.conflicts.map((conflict) => conflict.message)), '', '## Verification', '', ...items(plan.verificationCommands.map((command) => `\`${command}\``)), ...(verification ? ['', `- Result: ${verificationResult}`] : []), ''].join('\n')
}

function parseArguments(argv) {
  const options = { project: process.cwd(), profiles: [], apply: false, verify: false, format: 'json' }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--project') options.project = argv[++index]
    else if (argument === '--profile') options.profiles.push(argv[++index])
    else if (argument === '--apply') options.apply = true
    else if (argument === '--verify') options.verify = true
    else if (argument === '--format') options.format = argv[++index]
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (!options.project) throw new Error('--project requires a path')
  if (!['json', 'markdown'].includes(options.format)) throw new Error('--format must be json or markdown')
  return options
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv)
  const plan = await planQualitySetup({ projectRoot: options.project, profiles: options.profiles.length ? options.profiles : undefined })
  const result = {}
  if (options.apply) result.apply = await applyQualitySetup(plan)
  if (options.verify) result.verification = await verifyQualitySetup({ projectRoot: options.project })
  if (options.format === 'markdown') process.stdout.write(formatSetupPlanMarkdown(plan, options.apply, result.verification ?? result.apply?.verification ?? null))
  else process.stdout.write(`${JSON.stringify({ mode: options.apply ? 'apply' : options.verify ? 'verify' : 'dry-run', plan: { ...plan, operations: undefined, integrity: undefined }, result }, null, 2)}\n`)
  if (result.verification?.passed === false) process.exitCode = 1
}

const entryModule = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null
if (import.meta.url === entryModule) main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
