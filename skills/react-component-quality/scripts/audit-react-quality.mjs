#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdtempSync, readFileSync, realpathSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, extname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { hasMaxLinesDisable } from '../assets/quality-kit/scripts/max-lines-suppressions.mjs'
import { inspectProject, validateProjectRoot } from './project-inspection.mjs'

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'])
const AUDITED_LINE_EXTENSIONS = new Set(['.ts', '.tsx', '.mjs'])
const IGNORED_DIRECTORIES = new Set([
  '.git', '.hg', '.next', '.react-quality', '.svn',
  'build', 'coverage', 'dist', 'node_modules', 'out', 'target',
])
const MAX_FILES = 50_000
const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_DEPTH = 16
const MAX_EVIDENCE_ITEMS = 40
const MAX_TOOL_FILES = 200
const MAX_TOOL_SOURCE_BYTES = 2 * 1024 * 1024
const MAX_TOOL_DIAGNOSTICS = 40
const TOOL_TIMEOUT_MS = 30_000
const RATCHET_SELF_PATHS = new Set([
  '.react-quality/scripts/check-max-lines-ratchet.mjs',
  '.react-quality/scripts/check-max-lines-ratchet.test.mjs',
  'config/scripts/check-max-lines-ratchet.mjs',
  'config/scripts/check-max-lines-ratchet.test.mjs',
])
const REQUIRED_MANAGED_SCRIPTS = [
  'create:component',
  'quality:react',
  'quality:react:changed',
  'quality:react-doctor:changed',
  'quality:max-lines',
]
const EXPECTED_MANAGED_SCRIPTS = {
  'create:component': 'node .react-quality/scripts/scaffold-component.mjs',
  'quality:react': 'oxlint --config .react-quality/config/oxlint-react-quality.json .',
  'quality:react:changed': 'node .react-quality/scripts/check-changed-code-quality.mjs',
  'quality:react-doctor:changed': 'node .react-quality/scripts/check-react-doctor-changed.mjs',
  'quality:max-lines': 'node .react-quality/scripts/check-max-lines-ratchet.mjs',
}
const EXPECTED_AGENTS_MARKERS = {
  start: '<!-- react-component-quality:start -->',
  end: '<!-- react-component-quality:end -->',
}

function isInside(root, candidate) {
  const difference = relative(root, candidate)
  return difference === '' || (!difference.startsWith(`..${sep}`) && difference !== '..' && !isAbsolute(difference))
}

function toPosix(value) {
  return value.split(sep).join('/')
}

function isTestPath(path) {
  return /\.(?:test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs)$/.test(path)
}

function lineBudget(path) {
  if (isTestPath(path)) return 800
  if (path.endsWith('.tsx')) return 400
  if (path.endsWith('.mjs')) return 600
  return 300
}

// Matches max-lines with skipBlankLines + skipComments: a line counts when it
// contains a non-whitespace token outside comments. Comment markers inside
// quoted strings/templates remain code. Mixed code/comment lines count once.
function analyzeCodeLines(source, budget = Number.POSITIVE_INFINITY) {
  let state = 'code'
  let escaped = false
  let codeOnLine = false
  let count = 0
  let physicalLine = 1
  let violationLine

  const finishLine = () => {
    if (codeOnLine) {
      count += 1
      if (violationLine === undefined && count > budget) violationLine = physicalLine
    }
    codeOnLine = false
    if (state === 'line-comment') state = 'code'
  }

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const next = source[index + 1]

    if (character === '\n') {
      finishLine()
      physicalLine += 1
      escaped = false
      continue
    }
    if (state === 'line-comment') continue
    if (state === 'block-comment') {
      if (character === '*' && next === '/') {
        state = 'code'
        index += 1
      }
      continue
    }
    if (state !== 'code') {
      if (!/\s/.test(character)) codeOnLine = true
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if ((state === 'single' && character === "'") || (state === 'double' && character === '"') || (state === 'template' && character === '`')) {
        state = 'code'
      }
      continue
    }
    if (character === '/' && next === '/') {
      state = 'line-comment'
      index += 1
      continue
    }
    if (character === '/' && next === '*') {
      state = 'block-comment'
      index += 1
      continue
    }
    if (character === "'") state = 'single'
    else if (character === '"') state = 'double'
    else if (character === '`') state = 'template'
    if (!/\s/.test(character)) codeOnLine = true
  }
  if (source.length > 0 && !source.endsWith('\n') && codeOnLine) {
    count += 1
    if (violationLine === undefined && count > budget) violationLine = physicalLine
  }
  return { count, violationLine }
}

export function countCodeLines(source) {
  return analyzeCodeLines(source).count
}

function trackedFiles(root) {
  const result = spawnSync('git', [
    'ls-files', '-z', '--', '*.js', '*.jsx', '*.ts', '*.tsx', '*.mjs', '*.cjs',
  ], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.error || result.status !== 0) return null
  return result.stdout.split('\0').filter(Boolean).sort()
}

function stripJsonComments(source) {
  let result = ''
  let state = 'code'
  let escaped = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const next = source[index + 1]
    if (state === 'line-comment') {
      if (character === '\n') { state = 'code'; result += '\n' }
      else result += ' '
      continue
    }
    if (state === 'block-comment') {
      if (character === '*' && next === '/') { state = 'code'; result += '  '; index += 1 }
      else result += character === '\n' ? '\n' : ' '
      continue
    }
    if (state === 'string') {
      result += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') state = 'code'
      continue
    }
    if (character === '"') { state = 'string'; result += character }
    else if (character === '/' && next === '/') { state = 'line-comment'; result += '  '; index += 1 }
    else if (character === '/' && next === '*') { state = 'block-comment'; result += '  '; index += 1 }
    else result += character
  }
  let withoutTrailingCommas = ''
  state = 'code'
  escaped = false
  for (let index = 0; index < result.length; index += 1) {
    const character = result[index]
    if (state === 'string') {
      withoutTrailingCommas += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') state = 'code'
      continue
    }
    if (character === '"') {
      state = 'string'
      withoutTrailingCommas += character
      continue
    }
    if (character === ',') {
      let next = index + 1
      while (next < result.length && /\s/.test(result[next])) next += 1
      if (result[next] === '}' || result[next] === ']') continue
    }
    withoutTrailingCommas += character
  }
  return withoutTrailingCommas
}

function configPaths(root) {
  const result = spawnSync('git', ['ls-files', '-z', '--', 'tsconfig.json', 'jsconfig.json', '**/tsconfig.json', '**/jsconfig.json'], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
  if (!result.error && result.status === 0) {
    const paths = result.stdout.split('\0').filter(Boolean).sort()
    return { paths: paths.slice(0, 200), truncated: paths.length > 200 }
  }
  const found = []
  let truncated = false
  function visit(directory, depth) {
    if (depth > 8 || found.length >= 200) return
    let entries
    try { entries = readdirSync(directory, { withFileTypes: true }) } catch { return }
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (found.length >= 200) { truncated = true; break }
      if (entry.isSymbolicLink()) continue
      const absolute = join(directory, entry.name)
      if (entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name)) visit(absolute, depth + 1)
      else if (entry.isFile() && ['tsconfig.json', 'jsconfig.json'].includes(entry.name)) found.push(toPosix(relative(root, absolute)))
    }
  }
  visit(root, 0)
  return { paths: found.sort(), truncated }
}

function configuredGeneratedDirectories(root) {
  const directories = new Set([...IGNORED_DIRECTORIES])
  const issues = []
  const visited = new Set()
  function readConfig(relativePath, depth = 0) {
    if (depth > 8) { issues.push(`config extends depth exceeded at ${relativePath}`); return }
    const normalized = toPosix(posix.normalize(relativePath))
    if (visited.has(normalized)) return
    if (visited.size >= 200) { issues.push('config discovery exceeded 200 files'); return }
    visited.add(normalized)
    const absolute = resolve(root, normalized)
    try {
      if (!isInside(root, absolute)) { issues.push(`config path is outside project: ${normalized}`); return }
      const metadata = lstatSync(absolute)
      if (metadata.isSymbolicLink()) { issues.push(`config symlink is not followed: ${normalized}`); return }
      if (!metadata.isFile() || metadata.size > 1024 * 1024) { issues.push(`config is unsupported or too large: ${normalized}`); return }
      const real = realpathSync(absolute)
      if (!isInside(root, real)) { issues.push(`config resolves outside project: ${normalized}`); return }
      const config = JSON.parse(stripJsonComments(readFileSync(real, 'utf8')))
      const outDir = config.compilerOptions?.outDir
      if (typeof outDir === 'string' && outDir.trim()) {
        const output = resolve(dirname(real), outDir)
        if (!isInside(root, output)) issues.push(`outDir resolves outside project in ${normalized}: ${outDir}`)
        else directories.add(toPosix(relative(root, output)).replace(/\/$/, ''))
      }
      const extendedConfigs = typeof config.extends === 'string'
        ? [config.extends]
        : Array.isArray(config.extends) ? config.extends : []
      if (config.extends !== undefined && typeof config.extends !== 'string' && !Array.isArray(config.extends)) issues.push(`config extends has an unsupported shape in ${normalized}`)
      for (const extendedConfig of extendedConfigs) {
        if (typeof extendedConfig !== 'string') { issues.push(`config extends array contains a non-string entry in ${normalized}`); continue }
        if (!extendedConfig.startsWith('.')) issues.push(`package-based extends is unsupported in ${normalized}: ${extendedConfig}`)
        else {
          let extended = posix.normalize(posix.join(posix.dirname(normalized), extendedConfig))
          if (!/\.(?:json|jsonc)$/.test(extended)) extended += '.json'
          readConfig(extended, depth + 1)
        }
      }
    } catch (error) {
      issues.push(`malformed or unreadable config ${normalized}: ${error.message}`)
    }
  }
  const discovery = configPaths(root)
  if (discovery.truncated) issues.push('config discovery exceeded 200 files')
  for (const path of discovery.paths) readConfig(path)
  return { directories, issues: [...new Set(issues)].sort(), inspected: [...visited].sort() }
}

function excludedPath(path, generatedDirectories) {
  const normalized = toPosix(path).replace(/^\.\//, '')
  return [...generatedDirectories].some((directory) => normalized === directory || normalized.startsWith(`${directory}/`) || normalized.split('/').includes(directory))
}

function walkedFiles(root, generatedDirectories) {
  const files = []
  const metadata = { depthTruncated: false, fileLimitReached: false }
  function visit(directory, depth) {
    if (files.length >= MAX_FILES) return
    let entries
    try {
      entries = readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))
    } catch {
      return
    }
    for (const entry of entries) {
      if (files.length >= MAX_FILES) {
        metadata.fileLimitReached = true
        break
      }
      if (entry.isSymbolicLink()) continue
      const absolute = join(directory, entry.name)
      if (entry.isDirectory()) {
        const relativePath = toPosix(relative(root, absolute))
        if (excludedPath(relativePath, generatedDirectories)) continue
        if (depth >= MAX_DEPTH) metadata.depthTruncated = true
        else visit(absolute, depth + 1)
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
        files.push(toPosix(relative(root, absolute)))
      }
    }
  }
  visit(root, 0)
  return { candidates: files.sort(), ...metadata }
}

function safeSourceFiles(root, extraPaths = []) {
  const config = configuredGeneratedDirectories(root)
  const generatedDirectories = config.directories
  const tracked = trackedFiles(root)
  const walked = tracked === null ? walkedFiles(root, generatedDirectories) : null
  const allCandidates = [...new Set([...(tracked ?? walked.candidates), ...extraPaths])].sort()
  const excluded = allCandidates.filter((path) => excludedPath(path, generatedDirectories)).sort()
  const candidates = allCandidates.filter((path) => !excludedPath(path, generatedDirectories))
  const files = []
  const skipped = []
  for (const relativePath of candidates.slice(0, MAX_FILES)) {
    const absolute = resolve(root, relativePath)
    try {
      if (!isInside(root, absolute)) continue
      const metadata = lstatSync(absolute)
      if (!metadata.isFile() || metadata.isSymbolicLink()) continue
      const real = realpathSync(absolute)
      if (!isInside(root, real)) continue
      if (statSync(real).size > MAX_FILE_BYTES) {
        skipped.push(relativePath)
        continue
      }
      files.push({ path: toPosix(relativePath), source: readFileSync(real, 'utf8') })
    } catch {
      // Deleted, unreadable, and concurrently replaced paths are not followed.
    }
  }
  return {
    strategy: tracked === null ? 'bounded-walk' : 'git-tracked',
    files,
    skipped: skipped.sort(),
    excluded,
    candidateCount: allCandidates.length,
    fileLimitReached: (walked?.fileLimitReached ?? false) || candidates.length > MAX_FILES,
    depthTruncated: walked?.depthTruncated ?? false,
    configIssues: config.issues,
    inspectedConfigs: config.inspected,
  }
}

function finding(id, values) {
  return {
    id,
    severity: values.severity,
    confidence: values.confidence,
    kind: values.kind,
    path: values.path,
    ...(values.line === undefined ? {} : { line: values.line }),
    evidence: values.evidence,
    profile: values.profile,
    ...(values.verificationCommand ? { verificationCommand: values.verificationCommand } : {}),
  }
}

function summarizeItems(items, noun = 'item', maximum = MAX_EVIDENCE_ITEMS) {
  const shown = items.slice(0, maximum)
  const omitted = items.length - shown.length
  return `${shown.join('\n')}${omitted > 0 ? `\n... ${omitted} more ${noun}${omitted === 1 ? '' : 's'} omitted` : ''}`
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length
}

function matchingBrace(source, openingIndex) {
  let depth = 0
  let state = 'code'
  let escaped = false
  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index]
    const next = source[index + 1]
    if (state === 'line-comment') {
      if (character === '\n') state = 'code'
      continue
    }
    if (state === 'block-comment') {
      if (character === '*' && next === '/') { state = 'code'; index += 1 }
      continue
    }
    if (state !== 'code') {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if ((state === 'single' && character === "'") || (state === 'double' && character === '"') || (state === 'template' && character === '`')) state = 'code'
      continue
    }
    if (character === '/' && next === '/') { state = 'line-comment'; index += 1; continue }
    if (character === '/' && next === '*') { state = 'block-comment'; index += 1; continue }
    if (character === "'") { state = 'single'; continue }
    if (character === '"') { state = 'double'; continue }
    if (character === '`') { state = 'template'; continue }
    if (character === '{') depth += 1
    else if (character === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return null
}

function effectBodies(file) {
  const effects = []
  const source = withoutComments(file.source)
  const pattern = /(?:^|[;{}\n])\s*(?:React\.)?use(?:Layout)?Effect\s*\(\s*\(\s*\)\s*=>\s*\{/g
  let match
  while ((match = pattern.exec(source)) !== null) {
    const opening = match.index + match[0].lastIndexOf('{')
    const closing = matchingBrace(source, opening)
    if (closing === null) continue
    const effectOffset = match[0].search(/(?:React\.)?use(?:Layout)?Effect/)
    effects.push({ body: source.slice(opening + 1, closing), index: match.index + effectOffset })
    pattern.lastIndex = closing + 1
  }
  return effects
}

function withoutComments(source) {
  let result = ''
  let state = 'code'
  let escaped = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const next = source[index + 1]
    if (state === 'line-comment') {
      if (character === '\n') { state = 'code'; result += '\n' } else result += ' '
      continue
    }
    if (state === 'block-comment') {
      if (character === '*' && next === '/') { state = 'code'; result += '  '; index += 1 }
      else result += character === '\n' ? '\n' : ' '
      continue
    }
    if (state !== 'code') {
      result += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if ((state === 'single' && character === "'") || (state === 'double' && character === '"') || (state === 'template' && character === '`')) state = 'code'
      continue
    }
    if (character === '/' && next === '/') { state = 'line-comment'; result += '  '; index += 1 }
    else if (character === '/' && next === '*') { state = 'block-comment'; result += '  '; index += 1 }
    else {
      result += character
      if (character === "'") state = 'single'
      else if (character === '"') state = 'double'
      else if (character === '`') state = 'template'
    }
  }
  return result
}

function hasMatchingCleanup(rawBody) {
  const body = withoutComments(rawBody)
  const resources = []
  let match
  const listener = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\.addEventListener\(\s*(['"])([^'"]+)\2\s*,\s*([A-Za-z_$][\w$]*)/g
  while ((match = listener.exec(body)) !== null) {
    const [, target, , event, handler] = match
    const escaped = [target, event, handler].map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    resources.push(new RegExp(`${escaped[0]}\\.removeEventListener\\(\\s*['"]${escaped[1]}['"]\\s*,\\s*${escaped[2]}(?:\\s*[,)]|$)`).test(body))
  }
  const timer = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(setInterval|setTimeout)\s*\(/g
  const assignedTimers = new Set()
  while ((match = timer.exec(body)) !== null) {
    assignedTimers.add(match.index + match[0].lastIndexOf(match[2]))
    const clear = match[2] === 'setInterval' ? 'clearInterval' : 'clearTimeout'
    resources.push(new RegExp(`\\b${clear}\\s*\\(\\s*${match[1]}\\s*\\)`).test(body))
  }
  const anyTimer = /\b(?:setInterval|setTimeout)\s*\(/g
  while ((match = anyTimer.exec(body)) !== null) if (!assignedTimers.has(match.index)) resources.push(false)
  const observer = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+(?:Mutation|Resize|Intersection)Observer\s*\(/g
  const assignedObservers = new Set()
  while ((match = observer.exec(body)) !== null) {
    assignedObservers.add(match.index + match[0].indexOf('new'))
    resources.push(new RegExp(`\\b${match[1]}\\.disconnect\\s*\\(`).test(body))
  }
  const anyObserver = /\bnew\s+(?:Mutation|Resize|Intersection)Observer\s*\(/g
  while ((match = anyObserver.exec(body)) !== null) if (!assignedObservers.has(match.index)) resources.push(false)
  const subscription = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;\n]+\.subscribe\s*\(/g
  while ((match = subscription.exec(body)) !== null) resources.push(new RegExp(`(?:\\b${match[1]}\\s*\\(|\\b${match[1]}\\.unsubscribe\\s*\\()`).test(body))
  const bareSubscription = /(?:^|[;\n])\s*(?!const\b|let\b|var\b)[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\.subscribe\s*\(/m.test(body)
  if (bareSubscription) resources.push(false)
  return resources
}

function lifecycleFindings(files) {
  const missing = []
  const review = []
  for (const file of files) {
    for (const effect of effectBodies(file)) {
      const matches = hasMatchingCleanup(effect.body)
      const hasCleanupReturn = /\breturn\s+(?:\(\s*\)\s*=>|function\b|[A-Za-z_$][\w$]*)/.test(withoutComments(effect.body))
      if (matches.length > 0 && matches.some((value) => !value)) {
        const target = hasCleanupReturn ? review : missing
        target.push(`${file.path}:${lineNumberAt(file.source, effect.index)}`)
      }
      else if (/\b(?:addEventListener|setInterval|setTimeout|(?:Mutation|Resize|Intersection)Observer|subscribe)\s*\(/.test(withoutComments(effect.body)) && matches.length === 0) review.push(`${file.path}:${lineNumberAt(file.source, effect.index)}`)
    }
  }
  return [
    ...(missing.length > 0 ? [finding('effect-cleanup-missing', {
      severity: 'error', confidence: 'high', kind: 'deterministic', path: missing[0].split(':')[0],
      evidence: `Effects with a known listener, timer, observer, or subscription lacking matching cleanup:\n${summarizeItems(missing.sort(), 'lifecycle occurrence')}`,
      profile: 'state-effects', verificationCommand: 'add matching cleanup and a focused lifecycle test',
    })] : []),
    ...(review.length > 0 ? [finding('effect-cleanup-review', {
      severity: 'warning', confidence: 'medium', kind: 'review-candidate', path: review[0].split(':')[0],
      evidence: `Effects with dynamic or unassigned lifecycle work that needs manual cleanup review:\n${summarizeItems(review.sort(), 'candidate')}`,
      profile: 'state-effects',
    })] : []),
  ]
}

function visualLiteralFindings(files) {
  const exact = []
  const review = []
  const property = /(?:[{,]\s*)\b(?:color|backgroundColor|borderColor|outlineColor|fill|stroke)\s*:\s*(['"])(#[\da-fA-F]{3,8}|(?:rgb|hsl)a?\([^'"]+\))\1/g
  const arbitrary = /\b(?:bg|text|border|fill|stroke)-\[(?:#[\da-fA-F]{3,8}|(?:rgb|hsl)a?\([^\]]+\))\]/g
  for (const file of files) {
    const source = withoutComments(file.source)
    let match
    while ((match = property.exec(source)) !== null) exact.push(`${file.path}:${lineNumberAt(source, match.index)} ${match[2]}`)
    while ((match = arbitrary.exec(source)) !== null) review.push(`${file.path}:${lineNumberAt(source, match.index)} ${match[0]}`)
  }
  return [
    ...(exact.length > 0 ? [finding('hardcoded-color', {
      severity: 'warning', confidence: 'high', kind: 'deterministic', path: exact[0].split(':')[0],
      evidence: `Exact color literals in style properties:\n${summarizeItems(exact.sort(), 'literal')}`,
      profile: 'ui-accessibility', verificationCommand: 'replace with a target-owned semantic token or document the exception',
    })] : []),
    ...(review.length > 0 ? [finding('hardcoded-color-review', {
      severity: 'warning', confidence: 'medium', kind: 'review-candidate', path: review[0].split(':')[0],
      evidence: `Arbitrary color utility candidate(s); review target token conventions:\n${summarizeItems(review.sort(), 'candidate')}`,
      profile: 'ui-accessibility',
    })] : []),
  ]
}

function alternativeIconFindings(files) {
  const alternatives = /^(?:react-icons(?:\/[^'"]+)?|@heroicons\/react(?:\/[^'"]+)?|@mui\/icons-material(?:\/[^'"]+)?|@fortawesome\/[^'"]+)$/
  const evidence = []
  for (const file of files) {
    const source = withoutComments(file.source)
    const pattern = /^\s*(?:import|export)\s+(?!type\b)[^'"\n;]*?(?:\s+from\s+)?['"]([^'"]+)['"]/gm
    let match
    while ((match = pattern.exec(source)) !== null) if (alternatives.test(match[1])) evidence.push(`${file.path}:${lineNumberAt(source, match.index)} ${match[1]}`)
  }
  if (evidence.length === 0) return []
  return [finding('alternative-icon-import', {
    severity: 'warning', confidence: 'high', kind: 'deterministic', path: evidence[0].split(':')[0],
    evidence: `Exact imports from known alternative icon packages:\n${summarizeItems(evidence.sort(), 'import')}`,
    profile: 'ui-accessibility', verificationCommand: 'confirm the target icon primitive and consolidate only when policy requires it',
  })]
}

function sourceTestCensus(files) {
  const byExtension = {}
  let testFiles = 0
  for (const file of files) {
    if (isTestPath(file.path)) testFiles += 1
    const extension = extname(file.path)
    byExtension[extension] = (byExtension[extension] ?? 0) + 1
  }
  return {
    sourceFiles: files.length - testFiles,
    testFiles,
    byExtension: Object.fromEntries(Object.entries(byExtension).sort(([left], [right]) => left.localeCompare(right))),
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function globRegex(glob) {
  let pattern = '^'
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index]
    if (character === '*') {
      if (glob[index + 1] === '*') {
        pattern += '.*'
        index += 1
      } else pattern += '[^/]*'
    } else if (character === '?') pattern += '[^/]'
    else pattern += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
  }
  return new RegExp(`${pattern}$`)
}

function mobileConfigBumps(root) {
  const path = join(root, 'mobile/.oxlintrc.json')
  try {
    const metadata = lstatSync(path)
    if (!metadata.isFile() || metadata.isSymbolicLink()) return []
    const real = realpathSync(path)
    if (!isInside(root, real)) return []
    const config = JSON.parse(readFileSync(real, 'utf8'))
    const bumps = []
    for (const override of config.overrides ?? []) {
      const rule = override.rules?.['max-lines']
      const max = Array.isArray(rule) ? rule[1]?.max : null
      if (typeof max !== 'number') continue
      for (const glob of override.files ?? []) {
        if (typeof glob === 'string' && max > lineBudget(glob)) bumps.push({ glob, max, entry: `mobile-config ${glob}` })
      }
    }
    return bumps.sort((left, right) => left.entry.localeCompare(right.entry))
  } catch {
    return []
  }
}

function readPackage(root) {
  const source = safeReadProjectFile(root, 'package.json', 4 * 1024 * 1024)
  if (source === null) throw new Error('package.json is missing, unsafe, or exceeds the audit size limit')
  return JSON.parse(source)
}

function safeReadProjectFile(root, relativePath, maximumBytes = MAX_FILE_BYTES) {
  const absolute = resolve(root, relativePath)
  if (!isInside(root, absolute)) return null
  try {
    const metadata = lstatSync(absolute)
    if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > maximumBytes) return null
    const real = realpathSync(absolute)
    if (!isInside(root, real)) return null
    return readFileSync(real, 'utf8')
  } catch {
    return null
  }
}

function readInstallation(root) {
  const source = safeReadProjectFile(root, '.react-quality/installation.json', 1024 * 1024)
  if (source === null) return existsSync(join(root, '.react-quality/installation.json')) ? { invalid: 'manifest is missing, unsafe, or exceeds the size limit' } : null
  try {
    const manifest = JSON.parse(source)
    const errors = []
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) errors.push('manifest must be an object')
    else {
      if (manifest.schemaVersion !== 2) errors.push('schemaVersion must be 2')
      if (!/^[a-f0-9]{64}$/.test(manifest.snapshotHash ?? '')) errors.push('snapshotHash must be a SHA-256 hex string')
      if (!Array.isArray(manifest.profiles) || !manifest.profiles.every((value) => typeof value === 'string')) errors.push('profiles must be a string array')
      if (!manifest.managedFiles || typeof manifest.managedFiles !== 'object' || Array.isArray(manifest.managedFiles)) errors.push('managedFiles must be an object')
      else {
        if (Object.entries(manifest.managedFiles).some(([path, hash]) => !path || !/^[a-f0-9]{64}$/.test(hash))) errors.push('managedFiles entries must map paths to SHA-256 hashes')
        if (manifest.snapshotHash !== createHash('sha256').update(JSON.stringify(manifest.managedFiles)).digest('hex')) errors.push('snapshotHash must match the canonical JSON.stringify(managedFiles) hash')
      }
      if (!manifest.managedPackageScripts || typeof manifest.managedPackageScripts !== 'object' || Array.isArray(manifest.managedPackageScripts)) errors.push('managedPackageScripts must be an object')
      else for (const name of REQUIRED_MANAGED_SCRIPTS) if (manifest.managedPackageScripts[name] !== EXPECTED_MANAGED_SCRIPTS[name]) errors.push(`managedPackageScripts.${name} must match the installed command contract`)
      if (manifest.agentsMarkers?.start !== EXPECTED_AGENTS_MARKERS.start || manifest.agentsMarkers?.end !== EXPECTED_AGENTS_MARKERS.end) errors.push('agentsMarkers must contain the exact managed start/end markers')
      if (!Array.isArray(manifest.maxLinesBaselineEntries) || !manifest.maxLinesBaselineEntries.every((value) => typeof value === 'string')) errors.push('maxLinesBaselineEntries must be a string array')
    }
    return errors.length > 0 ? { invalid: summarizeItems(errors, 'schema error') } : manifest
  } catch (error) {
    return { invalid: error.message }
  }
}

function workflowEvidence(root) {
  const directory = join(root, '.github/workflows')
  const workflows = []
  try {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      if (!entry.isFile() || entry.isSymbolicLink() || !/\.ya?ml$/.test(entry.name)) continue
      const path = `.github/workflows/${entry.name}`
      const source = safeReadProjectFile(root, path, 1024 * 1024)
      if (source !== null) workflows.push({ path, source })
    }
  } catch {
    return []
  }
  return workflows
}

function workflowHasPrQuality(source, scriptNames) {
  if (!/(?:^|\n)\s*(?:on\s*:|['"]on['"]\s*:)[\s\S]*pull_request/m.test(source)) return false
  return scriptNames.every((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(?:^|\\n)\\s*-?\\s*run\\s*:[^\\n]*\\b(?:npm|pnpm|yarn|bun)\\b[^\\n]*${escaped}(?=\\s|$)`, 'm').test(source)
  })
}

function installationFindings(root, packageJson, installation) {
  if (!installation) return []
  if (installation.invalid) return [finding('installation-invalid', {
    severity: 'error', confidence: 'high', kind: 'deterministic', path: '.react-quality/installation.json',
    evidence: `Installation manifest failed schema validation: ${installation.invalid}`, profile: 'installation',
    verificationCommand: 'restore the installation manifest with setup before auditing or running tools',
  })]
  const drift = []
  for (const [path, expectedHash] of Object.entries(installation.managedFiles ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
    const source = safeReadProjectFile(root, path)
    if (source === null) drift.push(`managed file missing or unsafe: ${path}`)
    else if (sha256(source) !== expectedHash) drift.push(`managed file hash mismatch: ${path}`)
  }
  for (const [name, expected] of Object.entries(installation.managedPackageScripts ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
    if (packageJson.scripts?.[name] !== expected) drift.push(`package script ${name} does not match its exact command: ${expected}`)
  }
  const start = installation.agentsMarkers?.start
  const end = installation.agentsMarkers?.end
  if (typeof start === 'string' && typeof end === 'string') {
    const agents = safeReadProjectFile(root, 'AGENTS.md', 1024 * 1024) ?? ''
    const startCount = agents.split(start).length - 1
    const endCount = agents.split(end).length - 1
    if (startCount !== 1 || endCount !== 1 || agents.indexOf(start) > agents.indexOf(end)) drift.push('AGENTS managed marker pair is missing, duplicated, or out of order')
  }
  const workflowPaths = Object.keys(installation.managedFiles ?? {}).filter((path) => /^\.github\/workflows\/.*\.ya?ml$/.test(path))
  const installedCiScripts = ['quality:react:changed', 'quality:react-doctor:changed', 'quality:max-lines'].filter((name) => typeof installation.managedPackageScripts?.[name] === 'string')
  for (const path of workflowPaths) {
    const source = safeReadProjectFile(root, path, 1024 * 1024) ?? ''
    if (installedCiScripts.length !== 3 || !workflowHasPrQuality(source, installedCiScripts)) {
      drift.push(`managed PR CI workflow lacks pull_request quality wiring: ${path}`)
    }
  }
  if (drift.length === 0) return []
  return [finding('installation-drift', {
    severity: 'error', confidence: 'high', kind: 'deterministic', path: '.react-quality/installation.json',
    evidence: summarizeItems(drift.sort(), 'drift'), profile: 'installation',
    verificationCommand: 'rerun setup verification after restoring managed assets',
  })]
}

function readBaseline(root) {
  const candidates = [
    '.react-quality/config/max-lines-baseline.txt',
    'config/max-lines-baseline.txt',
  ]
  for (const path of candidates) {
    const absolute = join(root, path)
    if (!existsSync(absolute)) continue
    const metadata = lstatSync(absolute)
    if (!metadata.isFile() || metadata.isSymbolicLink()) continue
    const real = realpathSync(absolute)
    if (!isInside(root, real)) continue
    const entries = new Set(readFileSync(real, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')))
    return { path, entries }
  }
  return { path: candidates[0], entries: new Set() }
}

function baselineEntryPath(entry) {
  if (entry.startsWith('inline ')) return entry.slice('inline '.length)
  if (entry.startsWith('mobile-config ')) return 'mobile/.oxlintrc.json'
  return '.react-quality/config/max-lines-baseline.txt'
}

function maxLineFindings(files, root, currentFiles = files) {
  const findings = []
  const baseline = readBaseline(root)
  const mobileBumps = mobileConfigBumps(root)
  const current = [
    ...currentFiles.filter((file) => !RATCHET_SELF_PATHS.has(file.path) && hasMaxLinesDisable(file.source)).map((file) => `inline ${file.path}`),
    ...mobileBumps.map((bump) => bump.entry),
  ].sort()
  const currentSet = new Set(current)
  const grandfathered = []
  const unapproved = []
  for (const file of files) {
    if (!AUDITED_LINE_EXTENSIONS.has(extname(file.path))) continue
    const budget = lineBudget(file.path)
    const analysis = analyzeCodeLines(file.source, budget)
    const counted = analysis.count
    if (counted > budget) {
      const item = { path: file.path, counted, budget, line: analysis.violationLine }
      const mobilePath = file.path.startsWith('mobile/') ? file.path.slice('mobile/'.length) : null
      const bump = mobilePath ? mobileBumps.find((candidate) => globRegex(candidate.glob).test(mobilePath) && counted <= candidate.max) : null
      const activeBaselineBypass = (currentSet.has(`inline ${file.path}`) && baseline.entries.has(`inline ${file.path}`)) || (bump && currentSet.has(bump.entry) && baseline.entries.has(bump.entry))
      if (activeBaselineBypass) grandfathered.push(item)
      else unapproved.push(item)
    }
  }
  const oversized = [
    ...grandfathered.map((item) => `${item.path}: ${item.counted} counted lines; budget ${item.budget} [grandfathered baseline bypass]`),
    ...unapproved.map((item) => `${item.path}: ${item.counted} counted lines; budget ${item.budget} [no baseline bypass]`),
  ]
  if (oversized.length > 0) {
    const first = grandfathered[0] ?? unapproved[0]
    findings.push(finding('max-lines-budget', {
      severity: 'error', confidence: 'high', kind: 'deterministic',
      path: first.path, line: first.line,
      evidence: [
        summarizeItems(grandfathered.map((item) => `${item.path}: ${item.counted} counted lines; budget ${item.budget} [grandfathered baseline bypass]`), 'oversized file', 20),
        summarizeItems(unapproved.map((item) => `${item.path}: ${item.counted} counted lines; budget ${item.budget} [no baseline bypass]`), 'oversized file', 20),
      ].filter(Boolean).join('\n'), profile: 'max-lines',
      verificationCommand: 'run the project max-lines gate',
    }))
  }

  const added = current.filter((entry) => !baseline.entries.has(entry))
  const stale = [...baseline.entries].filter((entry) => !currentSet.has(entry)).sort()
  if (added.length > 0 || stale.length > 0) {
    const evidence = [
      ...(added.length > 0 ? [`Added bypasses:\n${summarizeItems(added, 'bypass')}`] : []),
      ...(stale.length > 0 ? [`Stale baseline entries:\n${summarizeItems(stale, 'entry')}`] : []),
    ].join('\n')
    findings.push(finding('max-lines-ratchet', {
      severity: 'error', confidence: 'high', kind: 'deterministic',
      path: baselineEntryPath(added[0] ?? stale[0]),
      evidence: `${baseline.path} differs from current bypasses.\n${evidence}`,
      profile: 'max-lines', verificationCommand: 'run the project max-lines ratchet',
    }))
  }
  return findings
}

function agentsPolicyFinding(root) {
  const path = join(root, 'AGENTS.md')
  let source = ''
  try {
    const metadata = lstatSync(path)
    if (metadata.isFile() && !metadata.isSymbolicLink() && isInside(root, realpathSync(path))) source = readFileSync(path, 'utf8')
  } catch {
    // A missing policy file is reported as all required mechanisms absent.
  }
  const missing = [
    ['component scaffold command', /create:component/i],
    ['changed-code quality gate', /(?:changed-code|code-quality.{0,30}changed|changed.{0,30}code-quality)/is],
    ['changed-file React Doctor gate', /react[ -]doctor/is],
    ['max-lines ratchet operation', /(?:max-lines.{0,30}ratchet|ratchet.{0,30}max-lines)/is],
  ].filter(([, pattern]) => !pattern.test(source)).map(([label]) => label)
  if (missing.length === 0) return []
  return [finding('agents-quality-policy', {
    severity: 'warning', confidence: 'high', kind: 'deterministic', path: 'AGENTS.md',
    evidence: `${existsSync(path) ? 'AGENTS.md does not document' : 'AGENTS.md is absent; it does not document'}: ${missing.join(', ')}`,
    profile: 'react-core', verificationCommand: 'document installed quality commands and exception policy in AGENTS.md',
  })]
}

function wiringFindings(root, packageJson, installation) {
  const scripts = Object.entries(packageJson.scripts ?? {})
  const expectedQuality = installation?.managedPackageScripts?.['quality:react:changed']
  const expectedDoctor = installation?.managedPackageScripts?.['quality:react-doctor:changed']
  const changedQualityEntry = expectedQuality
    ? ['quality:react:changed', packageJson.scripts?.['quality:react:changed']]
    : scripts.find(([, command]) => ['node .react-quality/scripts/check-changed-code-quality.mjs', 'node config/scripts/check-changed-code-quality.mjs'].includes(command))
  const changedDoctorEntry = expectedDoctor
    ? ['quality:react-doctor:changed', packageJson.scripts?.['quality:react-doctor:changed']]
    : scripts.find(([, command]) => ['node .react-quality/scripts/check-react-doctor-changed.mjs', 'node config/scripts/check-react-doctor-changed.mjs'].includes(command))
  const ratchetEntry = installation?.managedPackageScripts?.['quality:max-lines']
    ? ['quality:max-lines', packageJson.scripts?.['quality:max-lines']]
    : scripts.find(([, command]) => ['node .react-quality/scripts/check-max-lines-ratchet.mjs', 'node config/scripts/check-max-lines-ratchet.mjs'].includes(command))
  const hasChangedQuality = expectedQuality ? changedQualityEntry?.[1] === expectedQuality : Boolean(changedQualityEntry)
  const hasChangedDoctor = expectedDoctor ? changedDoctorEntry?.[1] === expectedDoctor : Boolean(changedDoctorEntry)
  const workflows = workflowEvidence(root)
  const needsPrWiring = workflows.length > 0 || Object.keys(installation?.managedFiles ?? {}).some((path) => path.startsWith('.github/workflows/'))
  const ciScripts = [changedQualityEntry?.[0], changedDoctorEntry?.[0], ratchetEntry?.[0]].filter(Boolean)
  const hasPrWiring = ciScripts.length === 3 && workflows.some(({ source }) => workflowHasPrQuality(source, ciScripts))
  return [
    ...(!hasChangedQuality ? [finding('changed-code-quality-wiring', {
      severity: 'error', confidence: 'high', kind: 'deterministic', path: 'package.json',
      evidence: 'No package script wires changed-code quality checks.', profile: 'react-core',
      verificationCommand: 'inspect package.json scripts and pull-request CI',
    })] : []),
    ...(!hasChangedDoctor ? [finding('react-doctor-wiring', {
      severity: 'error', confidence: 'high', kind: 'deterministic', path: 'package.json',
      evidence: 'No package script wires changed-file React Doctor checks.', profile: 'react-core',
      verificationCommand: 'inspect package.json scripts and pull-request CI',
    })] : []),
    ...(needsPrWiring && !hasPrWiring ? [finding('pr-ci-wiring', {
      severity: 'error', confidence: 'high', kind: 'deterministic', path: '.github/workflows',
      evidence: 'No safely readable pull_request workflow wires changed quality, changed React Doctor, and max-lines scripts.',
      profile: 'github-actions', verificationCommand: 'wire exact package scripts in pull-request CI',
    })] : []),
  ]
}

function componentTestFinding(files) {
  const paths = new Set(files.map((file) => file.path))
  const missing = files.filter((file) => file.path.endsWith('.tsx') && !isTestPath(file.path) && !/\.(?:stories|story)\.tsx$/.test(file.path)).filter((file) => {
    const stem = file.path.slice(0, -'.tsx'.length)
    return !paths.has(`${stem}.test.tsx`) && !paths.has(`${stem}.spec.tsx`)
  }).map((file) => file.path).sort()
  if (missing.length === 0) return []
  return [finding('component-test-coverage', {
    severity: 'warning', confidence: 'medium', kind: 'review-candidate', path: missing[0],
    evidence: `Component-like TSX files without a co-located test (review intent before acting):\n${summarizeItems(missing, 'candidate')}`,
    profile: 'react-core',
  })]
}

function runtimeImports(source) {
  const imports = []
  const pattern = /\b(?:import|export)\s+(?!type\b)([^'"\n;]*?)(?:\s+from\s+)?['"]([^'"]+)['"]/g
  let match
  while ((match = pattern.exec(source)) !== null) {
    const clause = match[1].trim()
    if (clause.startsWith('{') && clause.endsWith('}')) {
      const specifiers = clause.slice(1, -1).split(',').map((value) => value.trim()).filter(Boolean)
      if (specifiers.length > 0 && specifiers.every((value) => value.startsWith('type '))) continue
    }
    if (match[2].startsWith('.')) imports.push(match[2])
  }
  return imports
}

function featureIdentity(path) {
  const parts = path.split('/')
  const featureIndex = parts.lastIndexOf('features')
  if (featureIndex < 0 || featureIndex + 1 >= parts.length) return null
  return {
    container: parts.slice(0, featureIndex + 1).join('/'),
    domain: parts[featureIndex + 1],
    root: parts.slice(0, featureIndex + 2).join('/'),
  }
}

function targetFeature(sourcePath, specifier) {
  const normalized = posix.normalize(posix.join(posix.dirname(sourcePath), specifier)).replace(/\.(?:js|jsx|ts|tsx|mjs|cjs)$/, '')
  return { normalized, identity: featureIdentity(normalized) }
}

function cycleGroups(edges) {
  const groups = new Set()
  const nodes = [...edges.keys()].sort()
  function reaches(start, current, seen) {
    for (const next of [...(edges.get(current) ?? [])].sort()) {
      if (next === start) return true
      if (!seen.has(next)) {
        seen.add(next)
        if (reaches(start, next, seen)) return true
      }
    }
    return false
  }
  for (const from of nodes) {
    for (const to of edges.get(from) ?? []) {
      if (reaches(from, to, new Set([from, to]))) groups.add([from, to].sort().join(' <-> '))
    }
  }
  return [...groups].sort()
}

function boundaryFindings(files) {
  const edgesByContainer = new Map()
  const inward = []
  const coupled = []
  for (const file of files) {
    const sourceIdentity = featureIdentity(file.path)
    if (!sourceIdentity) continue
    const siblingDomains = new Set()
    for (const specifier of runtimeImports(file.source)) {
      const target = targetFeature(file.path, specifier)
      if (!target.identity || target.identity.container !== sourceIdentity.container) continue
      if (target.identity.domain !== sourceIdentity.domain) {
        if (!edgesByContainer.has(sourceIdentity.container)) edgesByContainer.set(sourceIdentity.container, new Map())
        const edges = edgesByContainer.get(sourceIdentity.container)
        if (!edges.has(sourceIdentity.domain)) edges.set(sourceIdentity.domain, new Set())
        edges.get(sourceIdentity.domain).add(target.identity.domain)
        siblingDomains.add(target.identity.domain)
      } else if (file.path !== `${sourceIdentity.root}/index.ts` && file.path !== `${sourceIdentity.root}/index.tsx` && (target.normalized === sourceIdentity.root || target.normalized === `${sourceIdentity.root}/index`)) {
        inward.push(`${file.path} imports its own public barrel via ${specifier}`)
      }
    }
    if (siblingDomains.size >= 4) coupled.push(`${file.path} imports sibling domains: ${[...siblingDomains].sort().join(', ')}`)
  }

  const cycles = [...edgesByContainer.entries()].flatMap(([container, edges]) => cycleGroups(edges).map((cycle) => ({ container, cycle }))).sort((left, right) => `${left.container}:${left.cycle}`.localeCompare(`${right.container}:${right.cycle}`))
  return [
    ...(cycles.length > 0 ? [finding('feature-dependency-cycle', {
      severity: 'warning', confidence: 'medium', kind: 'review-candidate', path: cycles[0].container,
      evidence: `Runtime feature dependency cycle candidate(s):\n${summarizeItems(cycles.map(({ container, cycle }) => `${container}: ${cycle}`), 'cycle')}. Heuristic excludes import type/export type and type-only named import lists.`,
      profile: 'feature-boundaries',
    })] : []),
    ...(inward.length > 0 ? [finding('inward-public-barrel-import', {
      severity: 'warning', confidence: 'medium', kind: 'review-candidate', path: inward.sort()[0].split(' imports ')[0],
      evidence: `Inward public-barrel import candidate(s):\n${summarizeItems(inward.sort(), 'candidate')}. Heuristic excludes type-only imports.`,
      profile: 'feature-boundaries',
    })] : []),
    ...(coupled.length > 0 ? [finding('sibling-domain-coupling', {
      severity: 'warning', confidence: 'medium', kind: 'review-candidate', path: coupled.sort()[0].split(' imports ')[0],
      evidence: `Four-or-more sibling domain import candidate(s):\n${summarizeItems(coupled.sort(), 'candidate')}. This is a review signal, not an automatic refactor instruction.`,
      profile: 'feature-boundaries',
    })] : []),
  ]
}

function resolveTargetPackageBin(root, packageName, binName = packageName) {
  const requireFromProject = createRequire(join(root, 'package.json'))
  const packagePath = requireFromProject.resolve(`${packageName}/package.json`)
  const realPackagePath = realpathSync(packagePath)
  if (!isInside(root, realPackagePath)) throw new Error(`Resolved ${packageName} package is outside project root: ${realPackagePath}`)
  const packageJson = JSON.parse(readFileSync(realPackagePath, 'utf8'))
  const binRelative = typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin?.[binName]
  if (!binRelative) throw new Error(`${packageName} package has no ${binName} executable: ${realPackagePath}`)
  const oxlintPath = resolve(dirname(realPackagePath), binRelative)
  const realOxlintPath = realpathSync(oxlintPath)
  if (!isInside(root, realOxlintPath)) throw new Error(`Resolved ${packageName} executable is outside project root: ${realOxlintPath}`)
  if (!lstatSync(realOxlintPath).isFile()) throw new Error(`Resolved ${packageName} executable is not a file: ${realOxlintPath}`)
  return realOxlintPath
}

function resolveVerifiedManagedFile(root, installation, relativePath) {
  const expectedHash = installation.managedFiles?.[relativePath]
  if (!expectedHash) throw new Error(`Managed file is not recorded in installation.json: ${relativePath}`)
  const source = safeReadProjectFile(root, relativePath, 4 * 1024 * 1024)
  if (source === null) throw new Error(`Managed file is missing or unsafe: ${relativePath}`)
  const actualHash = createHash('sha256').update(source).digest('hex')
  if (actualHash !== expectedHash) throw new Error(`Managed file hash mismatch: ${relativePath}`)
  const real = realpathSync(resolve(root, relativePath))
  if (!isInside(root, real)) throw new Error(`Managed file resolves outside project root: ${relativePath}`)
  return real
}

function runBundledZustandPlugin({ root, pluginPath, files }) {
  const oxlintPath = resolveTargetPackageBin(root, 'oxlint', 'oxlint')
  const directory = mkdtempSync(join(tmpdir(), 'react-quality-zustand-'))
  const configPath = join(directory, 'oxlint.json')
  try {
    const sourcePaths = files.map((file, index) => {
      const sourcePath = join(directory, `sample-${String(index).padStart(3, '0')}${file.path.endsWith('.ts') ? '.ts' : '.tsx'}`)
      writeFileSync(sourcePath, file.source)
      return sourcePath
    })
    writeFileSync(configPath, `${JSON.stringify({
      plugins: [],
      categories: {
        correctness: 'off', suspicious: 'off', pedantic: 'off', perf: 'off',
        style: 'off', restriction: 'off', nursery: 'off',
      },
      jsPlugins: [{ name: 'zustand-selectors', specifier: pluginPath }],
      rules: {
        'zustand-selectors/require-selector': 'error',
        'zustand-selectors/no-fresh-selector-result': 'error',
      },
    })}\n`)
    const result = spawnSync(process.execPath, [oxlintPath, '--config', configPath, '--format', 'json', ...sourcePaths], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout: TOOL_TIMEOUT_MS,
    })
    if (result.error) throw result.error
    if (!result.stdout.trim()) throw new Error(result.stderr.trim() || `Oxlint exited ${result.status} without JSON diagnostics`)
    const output = JSON.parse(result.stdout)
    return {
      diagnostics: Array.isArray(output.diagnostics) ? output.diagnostics : [],
      status: result.status ?? 1,
      stdout: result.stdout.slice(0, 8_000),
      stderr: result.stderr.slice(0, 8_000),
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

async function runZustandAudit(files, profiles, root) {
  if (!profiles.includes('zustand')) return { findings: [], commands: [] }
  const candidates = files.filter((file) => /\buse[A-Z][A-Za-z0-9]*Store\b/.test(file.source))
  const command = {
    tool: 'bundled-zustand-selectors',
    argv: [process.execPath, '<bundled-oxlint-runner>', '--plugin', 'zustand-selectors'],
    status: 0,
    stdout: '',
    stderr: '',
    processes: 0,
    diagnostics: 0,
  }
  try {
    const pluginPath = fileURLToPath(new URL('../assets/quality-kit/plugins/zustand-selectors.mjs', import.meta.url))
    const violations = []
    const sourceCandidates = candidates.length > 0 ? candidates : [{ path: '<probe>.tsx', source: 'export {}\n' }]
    const auditedFiles = []
    const excludedFiles = []
    let auditedBytes = 0
    for (const file of sourceCandidates) {
      const bytes = Buffer.byteLength(file.source)
      if (bytes > MAX_TOOL_SOURCE_BYTES) { excludedFiles.push(`${file.path}: ${bytes} bytes exceeds per-run source cap`); continue }
      if (auditedFiles.length >= MAX_TOOL_FILES || auditedBytes + bytes > MAX_TOOL_SOURCE_BYTES) { excludedFiles.push(`${file.path}: omitted by file/aggregate byte cap`); continue }
      auditedFiles.push(file)
      auditedBytes += bytes
    }
    const toolResult = auditedFiles.length > 0
      ? runBundledZustandPlugin({ root, pluginPath, files: auditedFiles })
      : { diagnostics: [], status: null, stdout: '', stderr: 'No candidate fit the source byte cap.' }
    if (toolResult.diagnostics.length > MAX_TOOL_DIAGNOSTICS) excludedFiles.push(`${toolResult.diagnostics.length - MAX_TOOL_DIAGNOSTICS} diagnostics omitted by diagnostic cap`)
    command.processes = auditedFiles.length > 0 ? 1 : 0
    for (const diagnostic of toolResult.diagnostics.slice(0, MAX_TOOL_DIAGNOSTICS)) {
      const sampleName = diagnostic.filename?.split('/').at(-1)
      const sampleIndex = Number(sampleName?.match(/sample-(\d+)/)?.[1])
      const file = Number.isInteger(sampleIndex) ? auditedFiles[sampleIndex] : auditedFiles[0]
      violations.push(`${file.path}: ${diagnostic.message ?? diagnostic.ruleId ?? 'selector violation'}`)
    }
    command.diagnostics = violations.length
    command.status = toolResult.status
    command.stdout = toolResult.stdout
    command.stderr = [toolResult.stderr, ...(excludedFiles.length > 0 ? [summarizeItems(excludedFiles, 'file')] : [])].filter(Boolean).join('\n').slice(0, 8_000)
    const findings = []
    if (excludedFiles.length > 0) findings.push(finding('audit-tool-limit', {
      severity: 'error', confidence: 'high', kind: 'deterministic', path: excludedFiles[0].split(': ')[0],
      evidence: `Zustand audit was truncated:\n${summarizeItems(excludedFiles, 'file')}`, profile: 'audit',
      verificationCommand: 'reduce changed scope or audit omitted files in explicit batches',
    }))
    if (toolResult.status !== 0 && violations.length === 0) findings.push(finding('zustand-tool-failure', {
      severity: 'error', confidence: 'high', kind: 'deterministic', path: 'package.json',
      evidence: `Bundled Zustand Oxlint exited ${toolResult.status ?? 'unavailable'}. stdout: ${toolResult.stdout} stderr: ${toolResult.stderr}`, profile: 'zustand',
      verificationCommand: 'run target-local Oxlint manually and inspect its diagnostics',
    }))
    if (violations.length > 0) findings.push(finding('zustand-selector-allocation', {
      severity: 'error', confidence: 'high', kind: 'deterministic', path: violations[0].split(': ')[0],
      evidence: summarizeItems(violations, 'diagnostic'), profile: 'zustand',
      verificationCommand: 'rerun this audit with --run-tools',
    }))
    return {
      commands: [command],
      findings,
    }
  } catch (error) {
    command.status = null
    command.stderr = error instanceof Error ? error.message : String(error)
    return {
      commands: [command],
      findings: [finding('zustand-tool-unavailable', {
        severity: 'error', confidence: 'high', kind: 'deterministic', path: 'package.json',
        evidence: `Bundled Zustand selector audit could not run: ${command.stderr}`,
        profile: 'zustand', verificationCommand: 'install project-declared Oxlint, then rerun with --run-tools',
      })],
    }
  }
}

function runInstalledVerification(root, inspection, packageJson, installation, scope) {
  if (!installation || installation.invalid) return { findings: [], commands: [] }
  const intended = installation.managedPackageScripts ?? {}
  const names = ['quality:react', 'quality:react:changed', 'quality:react-doctor:changed', 'quality:max-lines'].filter((name) => typeof intended[name] === 'string')
  const managedFileDrift = []
  for (const path of Object.keys(installation.managedFiles ?? {}).sort()) {
    try {
      resolveVerifiedManagedFile(root, installation, path)
    } catch (error) {
      managedFileDrift.push(`${path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  if (managedFileDrift.length > 0) {
    const evidence = `Refused every installed verification command because managed file integrity drifted:\n${summarizeItems(managedFileDrift, 'managed file')}`.slice(0, 16_000)
    return {
      commands: names.slice(0, 4).map((name) => ({ tool: `installed:${name}`, argv: [], status: null, stdout: '', stderr: evidence.slice(0, 8_000) })),
      findings: [finding('installed-tool-unavailable', {
        severity: 'error', confidence: 'high', kind: 'deterministic', path: '.react-quality/installation.json',
        evidence, profile: 'installation', verificationCommand: 'restore every managed file to its recorded hash, then rerun with --run-tools',
      })],
    }
  }
  const commands = []
  const failures = []
  const unavailable = []
  for (const name of names.slice(0, 4)) {
    if (packageJson.scripts?.[name] !== intended[name]) {
      const stderr = 'Refused: package script differs from installation manifest.'
      commands.push({ tool: `installed:${name}`, argv: [], status: null, stdout: '', stderr })
      unavailable.push(`${name}: ${stderr}`)
      continue
    }
    const manager = inspection.packageManager === 'unknown' ? 'npm' : inspection.packageManager
    let executable
    let args
    let environment
    try {
      if (name === 'quality:react') {
        executable = resolveTargetPackageBin(root, 'oxlint', 'oxlint')
        const config = resolveVerifiedManagedFile(root, installation, '.react-quality/config/oxlint-react-quality.json')
        args = ['--config', config, '.']
      } else if (name === 'quality:react:changed') {
        executable = process.execPath
        const script = resolveVerifiedManagedFile(root, installation, '.react-quality/scripts/check-changed-code-quality.mjs')
        const oxlint = resolveTargetPackageBin(root, 'oxlint', 'oxlint')
        environment = { ...process.env, REACT_QUALITY_OXLINT_BIN: oxlint }
        args = [script, ...(scope.valid && scope.base ? [scope.base] : [])]
      } else if (name === 'quality:max-lines') {
        executable = process.execPath
        const script = resolveVerifiedManagedFile(root, installation, '.react-quality/scripts/check-max-lines-ratchet.mjs')
        args = [script]
      } else if (name === 'quality:react-doctor:changed') {
        resolveVerifiedManagedFile(root, installation, '.react-quality/scripts/check-react-doctor-changed.mjs')
        executable = process.execPath
        const doctor = resolveTargetPackageBin(root, 'react-doctor', 'react-doctor')
        args = [doctor, '.', '--yes', '--scope', 'lines', ...(scope.valid && scope.base ? ['--base', scope.base] : []), '--include-untracked', '--no-dead-code', '--no-supply-chain', '--no-telemetry', '--blocking', 'error']
      }
    } catch (error) {
      const manualCommand = [manager, ...(manager === 'yarn' ? [name] : ['run', name]), ...(scope.valid && scope.base && ['quality:react:changed', 'quality:react-doctor:changed'].includes(name) ? ['--', scope.base] : [])].join(' ')
      const prefix = name === 'quality:react-doctor:changed'
        ? 'Target-local React Doctor is unavailable; installer-backed scripts are never auto-executed.'
        : 'Target-local hash-verified verification tool is unavailable; package-manager scripts are never auto-executed.'
      const stderr = `${prefix} Manual command: ${manualCommand}. ${error.message}`.slice(0, 8_000)
      commands.push({ tool: `installed:${name}`, argv: [], status: null, stdout: '', stderr })
      unavailable.push(`${name}: ${stderr}`)
      continue
    }
    const result = spawnSync(executable, args, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: TOOL_TIMEOUT_MS, shell: false, env: environment })
    const command = {
      tool: `installed:${name}`,
      argv: [executable, ...args],
      status: result.error ? null : result.status,
      stdout: (result.stdout ?? '').slice(0, 8_000),
      stderr: (result.error?.message ?? result.stderr ?? '').slice(0, 8_000),
    }
    commands.push(command)
    if (command.status !== 0) {
      let parsed = ''
      try {
        const output = JSON.parse(command.stdout)
        if (Array.isArray(output.diagnostics)) parsed = `\ndiagnostics: ${summarizeItems(output.diagnostics.map((item) => item.message ?? item.code ?? JSON.stringify(item)), 'diagnostic', 10)}`
      } catch {
        // Non-JSON output remains available as bounded stdout/stderr evidence.
      }
      failures.push(`${name}: status ${command.status ?? 'unavailable'}\nstdout: ${command.stdout}\nstderr: ${command.stderr}${parsed}`.trim())
    }
  }
  const findings = []
  if (unavailable.length > 0) findings.push(finding('installed-tool-unavailable', {
    severity: 'error', confidence: 'high', kind: 'deterministic', path: 'package.json',
    evidence: summarizeItems(unavailable, 'unavailable tool'), profile: 'installation',
    verificationCommand: 'install the tool locally or run the displayed command manually',
  }))
  if (failures.length > 0) findings.push(finding('installed-tool-failure', {
    severity: 'error', confidence: 'high', kind: 'deterministic', path: '.react-quality/installation.json',
    evidence: summarizeItems(failures, 'tool failure').slice(0, 16_000), profile: 'installation',
    verificationCommand: 'rerun audit with --run-tools after resolving tool failures',
  }))
  return {
    commands,
    findings,
  }
}

function changedScope(root, base) {
  if (!base) return { valid: true, requestedBase: null, base: null, changedFiles: null, untrackedFiles: [] }
  const verify = spawnSync('git', ['rev-parse', '--verify', '--end-of-options', `${base}^{commit}`], { cwd: root, encoding: 'utf8' })
  if (verify.error || verify.status !== 0) return { valid: false, requestedBase: base, base: null, changedFiles: [], untrackedFiles: [] }
  const resolvedBase = verify.stdout.trim()
  const merge = spawnSync('git', ['merge-base', resolvedBase, 'HEAD'], { cwd: root, encoding: 'utf8' })
  if (merge.error || merge.status !== 0 || !merge.stdout.trim()) return { valid: false, requestedBase: base, base: null, changedFiles: [], untrackedFiles: [] }
  const mergeBase = merge.stdout.trim()
  const diff = spawnSync('git', ['diff', '--name-only', '-z', '--diff-filter=ACMR', mergeBase, '--'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const others = spawnSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (diff.error || diff.status !== 0 || others.error || others.status !== 0) return { valid: false, requestedBase: base, base: null, changedFiles: [], untrackedFiles: [] }
  const relevant = (path) => SOURCE_EXTENSIONS.has(extname(path)) && !excludedPath(path, IGNORED_DIRECTORIES)
  const untrackedFiles = others.stdout.split('\0').filter(Boolean).map(toPosix).filter(relevant).sort()
  const changedFiles = [...new Set([...diff.stdout.split('\0').filter(Boolean).map(toPosix).filter(relevant), ...untrackedFiles])].sort()
  return { valid: true, requestedBase: base, base: mergeBase, changedFiles, untrackedFiles }
}

function scanLimitFindings(scan) {
  if (!scan.fileLimitReached && !scan.depthTruncated && scan.skipped.length === 0) return []
  const evidence = [
    ...(scan.fileLimitReached ? [`Audit discovered more than ${MAX_FILES} source files and stopped at the process bound.`] : []),
    ...(scan.depthTruncated ? [`Fallback walk reached maximum depth ${MAX_DEPTH}; deeper directories were not scanned.`] : []),
    ...(scan.skipped.length > 0 ? [`Files over ${MAX_FILE_BYTES} bytes were skipped:\n${summarizeItems(scan.skipped, 'file')}`] : []),
  ].join(' ')
  return [finding('audit-scan-limit', {
    severity: 'error', confidence: 'high', kind: 'deterministic', path: scan.skipped[0] ?? '.',
    evidence, profile: 'audit', verificationCommand: 'review excluded files manually',
  })]
}

function scanConfigFindings(scan) {
  if (scan.configIssues.length === 0) return []
  return [finding('scan-config', {
    severity: 'warning', confidence: 'high', kind: 'deterministic', path: scan.inspectedConfigs[0] ?? '.',
    evidence: summarizeItems(scan.configIssues, 'config issue'), profile: 'audit',
    verificationCommand: 'repair or simplify generated-directory config evidence, then rerun audit',
  })]
}

export async function auditReactQuality({ projectRoot, base = null, runTools = false }) {
  const root = validateProjectRoot(projectRoot)
  const packageJson = readPackage(root)
  const inspected = await inspectProject(root)
  const scope = changedScope(root, base)
  const scan = safeSourceFiles(root, scope.valid ? scope.untrackedFiles : [])
  const installation = readInstallation(root)
  const trustedInstallation = installation?.invalid ? null : installation
  const changedSet = scope.changedFiles === null ? null : new Set(scope.changedFiles)
  const scopedFiles = scope.valid && changedSet ? scan.files.filter((file) => changedSet.has(file.path)) : scan.files
  const census = sourceTestCensus(scan.files)
  const zustandResult = runTools ? await runZustandAudit(scopedFiles, inspected.profiles, root) : { findings: [], commands: [] }
  const installedResult = runTools ? runInstalledVerification(root, inspected, packageJson, trustedInstallation, scope) : { findings: [], commands: [] }
  const findings = [
    ...(!scope.valid ? [finding('audit-base-invalid', {
      severity: 'error', confidence: 'high', kind: 'deterministic', path: '.',
      evidence: `Git base could not be resolved safely: ${base}`, profile: 'audit',
      verificationCommand: 'provide a valid commit or ref to --base',
    })] : []),
    ...scanLimitFindings(scan),
    ...scanConfigFindings(scan),
    ...maxLineFindings(scope.valid ? scopedFiles : scan.files, root, scan.files),
    ...wiringFindings(root, packageJson, trustedInstallation),
    ...installationFindings(root, packageJson, installation),
    ...agentsPolicyFinding(root),
    ...componentTestFinding(scope.valid ? scopedFiles : scan.files),
    ...boundaryFindings(scope.valid ? scopedFiles : scan.files),
    ...lifecycleFindings(scope.valid ? scopedFiles : scan.files),
    ...visualLiteralFindings(scope.valid ? scopedFiles : scan.files),
    ...alternativeIconFindings(scope.valid ? scopedFiles : scan.files),
    ...zustandResult.findings,
    ...installedResult.findings,
  ].sort((left, right) => left.id.localeCompare(right.id))
  return {
    inspection: {
      ...inspected,
      scope,
      files: {
        ...inspected.files,
        strategy: scan.strategy,
        scanned: scan.files.length,
        candidateCount: scan.candidateCount,
        excluded: scan.excluded.slice(0, MAX_EVIDENCE_ITEMS),
        excludedCount: scan.excluded.length,
        skipped: scan.skipped.slice(0, MAX_EVIDENCE_ITEMS),
        skippedCount: scan.skipped.length,
        fileLimitReached: scan.fileLimitReached,
        depthTruncated: scan.depthTruncated,
        inspectedConfigs: scan.inspectedConfigs.slice(0, MAX_EVIDENCE_ITEMS),
      },
    },
    summary: {
      total: findings.length,
      deterministic: findings.filter((item) => item.kind === 'deterministic').length,
      reviewCandidates: findings.filter((item) => item.kind === 'review-candidate').length,
      census,
    },
    findings,
    commands: [...installedResult.commands, ...zustandResult.commands],
  }
}

export function formatAuditMarkdown(report) {
  const lines = [
    '# React quality audit',
    '',
    `- Root: ${report.inspection.root}`,
    `- File source: ${report.inspection.files.strategy} (${report.inspection.files.scanned} scanned)`,
    ...(report.inspection.scope.base ? [`- Git scope: ${report.inspection.scope.base} (${report.inspection.scope.changedFiles.length} changed paths)`] : []),
    `- Findings: ${report.summary.total} (${report.summary.deterministic} deterministic, ${report.summary.reviewCandidates} review candidates)`,
    `- Source/test census: ${report.summary.census.sourceFiles} source, ${report.summary.census.testFiles} test`,
    `- Extensions: ${Object.entries(report.summary.census.byExtension).map(([extension, count]) => `${extension}=${count}`).join(', ') || 'none'}`,
    `- External tools: ${report.commands.length === 0 ? 'not run' : `${report.commands.length} invocation(s)`}`,
    '- Boundary heuristic: runtime value imports only; type-only imports are excluded and all boundary findings require review.',
    '',
    '## Findings',
    '',
  ]
  if (report.findings.length === 0) lines.push('No findings.', '')
  for (const item of report.findings) {
    lines.push(
      `### \`${item.id}\``,
      '',
      `- Kind: ${item.kind}`,
      `- Severity: ${item.severity}`,
      `- Confidence: ${item.confidence}`,
      `- Profile: ${item.profile}`,
      `- Path: \`${item.path}${item.line ? `:${item.line}` : ''}\``,
      `- Evidence: ${item.evidence.replaceAll('\n', '<br>')}`,
      ...(item.verificationCommand ? [`- Verify: ${item.verificationCommand}`] : []),
      '',
    )
  }
  if (report.commands.length > 0) {
    lines.push('## External tool diagnostics', '')
    for (const command of report.commands) {
      lines.push(`- ${command.tool}: status ${command.status ?? 'unavailable'}${command.stderr ? ` — ${command.stderr}` : ''}`)
    }
    lines.push('')
  }
  return `${lines.join('\n')}\n`
}

function parseArguments(argv) {
  const options = { project: null, base: null, format: 'markdown', runTools: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--project' || argument === '--base' || argument === '--format') {
      if (!argv[index + 1]) throw new Error(`Missing value for ${argument}`)
      options[argument.slice(2)] = argv[index + 1]
      index += 1
    } else if (argument === '--run-tools') options.runTools = true
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (!options.project) throw new Error('Usage: audit-react-quality.mjs --project PATH [--base REF] [--run-tools] [--format json|markdown]')
  if (!['json', 'markdown'].includes(options.format)) throw new Error('--format must be json or markdown')
  return options
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2))
    const report = await auditReactQuality({ projectRoot: options.project, base: options.base, runTools: options.runTools })
    process.stdout.write(options.format === 'json' ? `${JSON.stringify(report, null, 2)}\n` : formatAuditMarkdown(report))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
