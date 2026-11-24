#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { resolveDiffBase } from './git-pull-request-diff-base.mjs'

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'])

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function nullList(value) {
  return value.split('\0').filter(Boolean)
}

function changedFiles(root, requestedBase) {
  const base = resolveDiffBase(root, requestedBase)
  const mergeBase = git(root, ['merge-base', base, 'HEAD']).trim()
  const paths = new Set([
    ...nullList(git(root, ['diff', '--name-only', '-z', '--diff-filter=ACMRTUB', mergeBase, '--'])),
    ...nullList(git(root, ['ls-files', '--others', '--exclude-standard', '-z'])),
  ])
  return [...paths].filter((path) => SOURCE_EXTENSIONS.has(extname(path)) && existsSync(join(root, path))).sort()
}

const root = process.cwd()
const files = changedFiles(root, process.argv.slice(2).find((argument) => argument !== '--'))
if (files.length === 0) {
  console.log('Changed-code quality gate: no changed JavaScript or TypeScript files.')
} else {
  const result = spawnSync(process.env.REACT_QUALITY_OXLINT_BIN || 'oxlint', ['--config', '.react-quality/config/oxlint-react-quality.json', ...files], { cwd: root, stdio: 'inherit' })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}
