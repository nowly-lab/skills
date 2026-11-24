import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { verifySnapshot } from './snapshot-orca-quality.mjs'

function parseArguments(argv) {
  const sourceIndex = argv.indexOf('--source')
  return { sourceRoot: sourceIndex === -1 ? undefined : argv[sourceIndex + 1] }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const report = await verifySnapshot({ skillRoot, ...parseArguments(process.argv.slice(2)) })
  if (report.errors.length > 0) {
    console.error(report.errors.join('\n'))
    process.exitCode = 1
  } else {
    console.log(`Verified ${report.entries.length} snapshot entries; no bundled drift.`)
  }
}
