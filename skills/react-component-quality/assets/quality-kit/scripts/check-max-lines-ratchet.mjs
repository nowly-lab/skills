#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { hasMaxLinesDisable } from './max-lines-suppressions.mjs'

export { hasMaxLinesDisable } from './max-lines-suppressions.mjs'

const BASELINE = '.react-quality/config/max-lines-baseline.txt'
const SELF = new Set(['.react-quality/scripts/check-max-lines-ratchet.mjs'])

export function parseBaseline(source) {
  return new Set(source.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')))
}

export function trackedSuppressions(root = process.cwd()) {
  let paths
  try {
    paths = execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.ts', '*.tsx', '*.mjs', '*.cjs'], { cwd: root, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean)
  } catch {
    throw new Error('max-lines ratchet requires a Git repository so its baseline contains tracked files only')
  }
  return paths.filter((path) => !SELF.has(path)).filter((path) => {
    try { return hasMaxLinesDisable(readFileSync(join(root, path), 'utf8')) } catch { return false }
  }).map((path) => `inline ${path}`).sort()
}

function baselineContents(entries) {
  return [
    '# Existing tracked max-lines suppressions. This ratchet may only shrink.',
    '# New entries are not accepted by --prune; split the file instead.',
    '',
    ...entries,
    '',
  ].join('\n')
}

function main(root = process.cwd(), argument = process.argv[2]) {
  const baselinePath = join(root, BASELINE)
  if (!existsSync(baselinePath)) {
    console.error(`Missing ${BASELINE}`)
    return 1
  }
  const baseline = parseBaseline(readFileSync(baselinePath, 'utf8'))
  const current = new Set(trackedSuppressions(root))
  const added = [...current].filter((entry) => !baseline.has(entry)).sort()
  const stale = [...baseline].filter((entry) => !current.has(entry)).sort()
  if (argument === '--prune') {
    const kept = [...baseline].filter((entry) => current.has(entry)).sort()
    writeFileSync(baselinePath, baselineContents(kept))
    if (added.length > 0) {
      console.error(`--prune does not add ${added.length} new bypass(es); split those files.`)
      return 1
    }
    console.log(`Pruned ${stale.length} stale baseline entry/entries.`)
    return 0
  }
  for (const entry of added) console.error(`New max-lines bypass not allowed: ${entry}`)
  for (const entry of stale) console.error(`Stale max-lines baseline entry; run --prune: ${entry}`)
  if (added.length || stale.length) return 1
  console.log(`max-lines ratchet OK — ${current.size} grandfathered suppression(s).`)
  return 0
}

process.exitCode = main()
