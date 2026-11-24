#!/usr/bin/env node

import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { formatInspectionMarkdown, inspectProject } from './project-inspection.mjs'

function parseArguments(argv) {
  const options = { project: process.cwd(), format: 'json' }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--project') options.project = argv[++index]
    else if (argument === '--format') options.format = argv[++index]
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (!options.project) throw new Error('--project requires a path')
  if (!['json', 'markdown'].includes(options.format)) throw new Error('--format must be json or markdown')
  return options
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv)
  const inspection = await inspectProject(options.project)
  process.stdout.write(options.format === 'markdown'
    ? formatInspectionMarkdown(inspection)
    : `${JSON.stringify(inspection, null, 2)}\n`)
}

const currentModule = pathToFileURL(resolve(fileURLToPath(import.meta.url))).href
if (import.meta.url === currentModule) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
