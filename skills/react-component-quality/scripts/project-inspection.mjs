import { existsSync, lstatSync, realpathSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

// Layout: <skills repository>/skills/react-component-quality/scripts
const skillRepositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const dependencySections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const lockfileManagers = new Map([
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
])
const ignoredDirectories = new Set(['.git', '.next', 'build', 'coverage', 'dist', 'node_modules', 'out'])
const lintConfigNames = [
  '.eslintrc', '.eslintrc.cjs', '.eslintrc.js', '.eslintrc.json', '.eslintrc.yaml', '.eslintrc.yml',
  '.oxlintrc.json', 'biome.json', 'biome.jsonc', 'eslint.config.cjs', 'eslint.config.js',
  'eslint.config.mjs', 'eslint.config.ts', 'oxlint.json',
]
const testConfigNames = [
  'cypress.config.js', 'cypress.config.ts', 'jest.config.cjs', 'jest.config.js', 'jest.config.mjs',
  'jest.config.ts', 'playwright.config.js', 'playwright.config.ts', 'vitest.config.js',
  'vitest.config.mjs', 'vitest.config.ts',
]
const e2ePackages = ['@playwright/test', '@wdio/cli', 'cypress', 'playwright', 'webdriverio']
const buildPackages = ['@rspack/core', 'electron-vite', 'esbuild', 'next', 'parcel', 'rollup', 'tsup', 'vite', 'webpack']
const buildConfigNames = [
  'electron.vite.config.js', 'electron.vite.config.ts', 'next.config.js', 'next.config.mjs',
  'next.config.ts', 'parcel.config.js', 'rollup.config.js', 'rollup.config.mjs',
  'rollup.config.ts', 'rspack.config.js', 'rspack.config.ts', 'tsup.config.ts',
  'vite.config.js', 'vite.config.mjs', 'vite.config.ts', 'webpack.config.js', 'webpack.config.ts',
]

export function validateProjectRoot(projectPath, { allowSkillRepo = false } = {}) {
  if (typeof projectPath !== 'string' || projectPath.trim() === '') {
    throw new Error('Project path must be a non-empty string')
  }

  let root
  try {
    root = realpathSync(resolve(projectPath))
  } catch {
    throw new Error(`Project path does not exist: ${resolve(projectPath)}`)
  }

  const parsed = parse(root)
  if (root === parsed.root || root === realpathSync(homedir())) {
    throw new Error(`Refusing unsafe project root: ${root}`)
  }
  if (!allowSkillRepo && root === skillRepositoryRoot) {
    throw new Error(`Refusing skill repository as target: ${root}`)
  }
  if (!statSync(root).isDirectory()) {
    throw new Error(`Project path is not a directory: ${root}`)
  }
  if (!existsSync(join(root, 'package.json'))) {
    throw new Error(`Project root must contain package.json: ${root}`)
  }

  return root
}

function readPackageJson(root) {
  const packagePath = join(root, 'package.json')
  try {
    const value = JSON.parse(readFileSync(packagePath, 'utf8'))
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('expected an object')
    return value
  } catch (error) {
    throw new Error(`Malformed package.json at ${packagePath}: ${error.message}`)
  }
}

function collectDependencies(packageJson) {
  const dependencies = {}
  for (const section of dependencySections) {
    const entries = packageJson[section]
    if (entries && typeof entries === 'object' && !Array.isArray(entries)) Object.assign(dependencies, entries)
  }
  return Object.fromEntries(Object.entries(dependencies).sort(([left], [right]) => left.localeCompare(right)))
}

function listSourceExtensions(root, maxDepth = 6) {
  const extensions = new Set()

  function visit(directory, depth) {
    if (depth > maxDepth) return
    let entries
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) visit(join(directory, entry.name), depth + 1)
        continue
      }
      const match = entry.name.match(/\.(jsx?|tsx?)$/)
      if (match) extensions.add(match[1])
    }
  }

  visit(root, 0)
  return extensions
}

function detectPackageManager(root, packageJson, conflicts) {
  const found = [...lockfileManagers.keys()].filter((name) => existsSync(join(root, name))).sort()
  const declared = typeof packageJson.packageManager === 'string'
    ? packageJson.packageManager.match(/^(npm|pnpm|yarn|bun)@/)?.[1] ?? null
    : null
  const lockManagers = [...new Set(found.map((name) => lockfileManagers.get(name)))]

  if (found.length > 1) {
    conflicts.push({
      code: 'multiple-lockfiles',
      message: `Multiple package-manager lockfiles found: ${found.join(', ')}`,
      paths: found,
    })
  }
  if (declared && lockManagers.some((manager) => manager !== declared)) {
    conflicts.push({
      code: 'package-manager-mismatch',
      message: `packageManager declares ${declared}, but lockfiles also indicate ${lockManagers.filter((manager) => manager !== declared).join(', ')}`,
      paths: found,
    })
  }

  return { packageManager: declared ?? (lockManagers.length === 1 ? lockManagers[0] : 'unknown'), found }
}

function readPnpmWorkspacePatterns(root) {
  const path = join(root, 'pnpm-workspace.yaml')
  if (!existsSync(path)) return []
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  const patterns = []
  let inPackages = false
  for (const line of lines) {
    if (/^packages\s*:/.test(line)) {
      inPackages = true
      continue
    }
    if (inPackages && /^\S/.test(line)) break
    const match = inPackages ? line.match(/^\s*-\s*['"]?([^'"#]+?)['"]?\s*(?:#.*)?$/) : null
    if (match) patterns.push(match[1].trim())
  }
  return patterns
}

function detectWorkspace(root, packageJson) {
  const pnpmWorkspace = existsSync(join(root, 'pnpm-workspace.yaml'))
  const packagePatterns = Array.isArray(packageJson.workspaces)
    ? packageJson.workspaces
    : packageJson.workspaces?.packages
  const patterns = pnpmWorkspace ? readPnpmWorkspacePatterns(root) : (packagePatterns ?? [])
  const markers = [
    ['pnpm-workspace.yaml', pnpmWorkspace],
    ['turbo.json', existsSync(join(root, 'turbo.json'))],
    ['nx.json', existsSync(join(root, 'nx.json'))],
  ].filter(([, found]) => found).map(([name]) => name)
  return {
    detected: pnpmWorkspace || Array.isArray(packagePatterns) || markers.length > 0,
    patterns: [...patterns].sort(),
    markers,
  }
}

function hasDependency(dependencies, ...names) {
  return names.some((name) => Object.hasOwn(dependencies, name))
}

function directoryHasEntries(path) {
  try {
    return readdirSync(path).length > 0
  } catch {
    return false
  }
}

function detectCapabilities(root, dependencies, extensions) {
  const languages = []
  if ([...extensions].some((extension) => extension === 'js' || extension === 'jsx')) languages.push('javascript')
  if ([...extensions].some((extension) => extension === 'ts' || extension === 'tsx') || hasDependency(dependencies, 'typescript') || existsSync(join(root, 'tsconfig.json'))) languages.push('typescript')

  const frameworks = []
  if (hasDependency(dependencies, 'electron', 'electron-vite') || existsSync(join(root, 'electron.vite.config.ts')) || existsSync(join(root, 'electron.vite.config.js'))) frameworks.push('electron')
  if (hasDependency(dependencies, 'next')) frameworks.push('next')
  if (hasDependency(dependencies, 'react', 'react-dom', 'preact')) frameworks.push('react')
  if (hasDependency(dependencies, 'vite', '@vitejs/plugin-react') || ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'].some((name) => existsSync(join(root, name)))) frameworks.push('vite')

  const profiles = []
  if (frameworks.includes('electron')) profiles.push('electron')
  if (directoryHasEntries(join(root, '.github', 'workflows'))) profiles.push('github-actions')
  if (hasDependency(dependencies, 'i18next', 'react-i18next', 'react-intl', '@lingui/core')) profiles.push('localization')
  if (frameworks.includes('react')) profiles.push('react-core')
  if (hasDependency(dependencies, 'tailwindcss', '@tailwindcss/vite') || existsSync(join(root, 'components.json')) || ['tailwind.config.js', 'tailwind.config.ts'].some((name) => existsSync(join(root, name)))) profiles.push('tailwind-shadcn')
  if (languages.includes('typescript')) profiles.push('typescript')
  if (hasDependency(dependencies, 'zustand')) profiles.push('zustand')

  return { languages: languages.sort(), frameworks: frameworks.sort(), profiles: profiles.sort() }
}

function detectFiles(root, lockfiles) {
  const agentsPath = join(root, 'AGENTS.md')
  return {
    packageJson: { exists: true, path: join(root, 'package.json') },
    agents: { exists: existsSync(agentsPath), path: existsSync(agentsPath) ? agentsPath : null },
    lockfiles: { found: lockfiles, paths: lockfiles.map((name) => join(root, name)) },
    componentsJson: { exists: existsSync(join(root, 'components.json')), path: join(root, 'components.json') },
    githubActions: { exists: directoryHasEntries(join(root, '.github', 'workflows')), path: join(root, '.github', 'workflows') },
  }
}

function detectCommands(packageManager, packageJson, conflicts) {
  const commands = {}
  if (packageManager === 'unknown' || conflicts.length > 0) return commands
  for (const name of ['build', 'format', 'lint', 'test', 'typecheck']) {
    if (typeof packageJson.scripts?.[name] === 'string') commands[name] = `${packageManager} run ${name}`
  }
  return commands
}

function existingRootFiles(root, names) {
  return names.filter((name) => {
    try {
      const path = join(root, name)
      const difference = relative(root, realpathSync(path))
      return existsSync(path) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink() && difference !== '..' && !difference.startsWith(`..${sep}`) && !isAbsolute(difference)
    } catch {
      return false
    }
  }).sort()
}

function boundedConfigFiles(root, directoryNames, pattern) {
  const found = []
  for (const directoryName of directoryNames) {
    const directory = join(root, directoryName)
    try {
      const metadata = lstatSync(directory)
      const difference = relative(root, realpathSync(directory))
      if (!metadata.isDirectory() || metadata.isSymbolicLink() || difference === '..' || difference.startsWith(`..${sep}`) || isAbsolute(difference)) continue
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isFile() && !entry.isSymbolicLink() && pattern.test(entry.name)) found.push(`${directoryName}/${entry.name}`)
      }
    } catch {
      // An absent, unreadable, or unsafe optional evidence directory supplies no evidence.
    }
  }
  return found.sort()
}

function pullRequestTemplates(root) {
  const files = existingRootFiles(root, [
    '.github/PULL_REQUEST_TEMPLATE.md', '.github/pull_request_template.md',
    'docs/PULL_REQUEST_TEMPLATE.md', 'docs/pull_request_template.md',
    'PULL_REQUEST_TEMPLATE.md', 'pull_request_template.md',
  ])
  const visitedDirectories = new Set()
  for (const directoryName of ['.github/PULL_REQUEST_TEMPLATE', '.github/pull_request_template']) {
    const directory = join(root, directoryName)
    try {
      const metadata = lstatSync(directory)
      const difference = relative(root, realpathSync(directory))
      if (!metadata.isDirectory() || metadata.isSymbolicLink() || difference === '..' || difference.startsWith(`..${sep}`) || isAbsolute(difference)) continue
      const identity = `${metadata.dev}:${metadata.ino}`
      if (visitedDirectories.has(identity)) continue
      visitedDirectories.add(identity)
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isFile() && !entry.isSymbolicLink() && /\.(?:md|ya?ml)$/i.test(entry.name)) files.push(`${directoryName}/${entry.name}`)
      }
    } catch {
      // An absent or unreadable optional template directory supplies no evidence.
    }
  }
  return [...new Set(files)].sort()
}

function categorizedTooling(root, packageJson, dependencies) {
  const packageEvidence = (names) => names.filter((name) => Object.hasOwn(dependencies, name)).sort()
  const scriptEvidence = (pattern) => Object.keys(packageJson.scripts ?? {}).filter((name) => pattern.test(name)).sort()
  return {
    e2e: {
      packages: packageEvidence(e2ePackages),
      configs: [...new Set([
        ...existingRootFiles(root, testConfigNames.filter((name) => /(?:playwright|cypress)/.test(name))),
        ...boundedConfigFiles(root, ['config', 'tests'], /(?:playwright|cypress|wdio).*\.(?:[cm]?[jt]s|json)$/i),
      ])].sort(),
      scripts: scriptEvidence(/(?:^|:)(?:e2e|integration)(?::|$)/i),
    },
    build: {
      packages: packageEvidence(buildPackages),
      configs: [...new Set([
        ...existingRootFiles(root, buildConfigNames),
        ...boundedConfigFiles(root, ['config'], /^(?:vite|webpack|rollup|rspack|esbuild|electron-builder)(?:[.-].*)?\.(?:[cm]?[jt]s|json)$/i),
      ])].sort(),
      scripts: scriptEvidence(/(?:^|:)(?:build|bundle|package)(?::|$)/i),
    },
  }
}

function detectEvidence(root, packageJson, dependencies) {
  return {
    lintConfigs: [...new Set([
      ...existingRootFiles(root, lintConfigNames),
      ...boundedConfigFiles(root, ['config'], /(?:eslint|oxlint|biome).*\.(?:[cm]?[jt]s|jsonc?|ya?ml)$/i),
    ])].sort(),
    testConfigs: [...new Set([
      ...existingRootFiles(root, testConfigNames),
      ...boundedConfigFiles(root, ['config', 'tests'], /(?:vitest|jest|playwright|cypress|wdio).*\.(?:[cm]?[jt]s|json)$/i),
    ])].sort(),
    prTemplates: pullRequestTemplates(root),
    tooling: categorizedTooling(root, packageJson, dependencies),
  }
}

export async function inspectProject(projectPath) {
  const root = validateProjectRoot(projectPath)
  const packageJson = readPackageJson(root)
  const conflicts = []
  const dependencies = collectDependencies(packageJson)
  const packageDetection = detectPackageManager(root, packageJson, conflicts)
  const capabilities = detectCapabilities(root, dependencies, listSourceExtensions(root))

  return {
    root,
    packageManager: packageDetection.packageManager,
    workspace: detectWorkspace(root, packageJson),
    languages: capabilities.languages,
    frameworks: capabilities.frameworks,
    dependencies,
    files: detectFiles(root, packageDetection.found),
    commands: detectCommands(packageDetection.packageManager, packageJson, conflicts),
    evidence: detectEvidence(root, packageJson, dependencies),
    profiles: capabilities.profiles,
    conflicts,
  }
}

export function formatInspectionMarkdown(inspection) {
  const list = (values) => values.length > 0 ? values.join(', ') : 'none'
  const tooling = (value) => `packages=${list(value.packages)}; configs=${list(value.configs)}; scripts=${list(value.scripts)}`
  const lines = [
    '# React project inspection',
    '',
    `- Root: ${inspection.root}`,
    `- Package manager: ${inspection.packageManager}`,
    `- Workspace: ${inspection.workspace.detected ? 'yes' : 'no'}`,
    `- Languages: ${list(inspection.languages)}`,
    `- Frameworks: ${list(inspection.frameworks)}`,
    `- Profiles: ${list(inspection.profiles)}`,
    `- AGENTS.md: ${inspection.files.agents.exists ? 'found' : 'not found'}`,
    `- Lint configs: ${list(inspection.evidence.lintConfigs)}`,
    `- Test configs: ${list(inspection.evidence.testConfigs)}`,
    `- PR templates: ${list(inspection.evidence.prTemplates)}`,
    `- E2E tooling: ${tooling(inspection.evidence.tooling.e2e)}`,
    `- Build tooling: ${tooling(inspection.evidence.tooling.build)}`,
    '',
    '## Commands',
    '',
    ...Object.entries(inspection.commands).map(([name, command]) => `- ${name}: \`${command}\``),
    '',
    '## Conflicts',
    '',
    ...(inspection.conflicts.length > 0 ? inspection.conflicts.map((conflict) => `- ${conflict.message}`) : ['- none']),
    '',
  ]
  return `${lines.join('\n')}\n`
}
