#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { resolveDiffBase } from './git-pull-request-diff-base.mjs'

const root = process.cwd()
const base = resolveDiffBase(root, process.argv.slice(2).find((argument) => argument !== '--'))
const manager = '__PACKAGE_MANAGER__'
const invocations = {
  pnpm: ['pnpm', ['dlx', 'react-doctor@0.9.1']],
  npm: ['npx', ['--yes', 'react-doctor@0.9.1']],
  yarn: ['yarn', ['dlx', 'react-doctor@0.9.1']],
  bun: ['bunx', ['react-doctor@0.9.1']],
}
const [command, prefix] = invocations[manager] ?? invocations.npm
const result = spawnSync(command, [...prefix, '.', '--yes', '--scope', 'lines', '--base', base, '--include-untracked', '--no-dead-code', '--no-supply-chain', '--no-telemetry', '--blocking', 'error'], { cwd: root, stdio: 'inherit' })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
