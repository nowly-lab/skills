#!/usr/bin/env node

import { existsSync, realpathSync, readFileSync } from 'node:fs'
import { mkdir, open, rmdir, unlink } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = realpathSync(process.cwd())
const templateRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../templates')

function inside(parent, child) {
  const rel = relative(parent, child)
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

function nearestExisting(path) {
  let candidate = path
  while (!existsSync(candidate)) candidate = dirname(candidate)
  return realpathSync(candidate)
}

function assertSafe(path) {
  if (!inside(root, path) || !inside(root, nearestExisting(path))) throw new Error(`Target escapes project root: ${path}`)
}

function parse(argv) {
  const options = { hook: false, model: false }
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--target') options.target = argv[++index]
    else if (argv[index] === '--with-hook') options.hook = true
    else if (argv[index] === '--with-model') options.model = true
    else throw new Error(`Unknown argument: ${argv[index]}`)
  }
  if (!options.target || isAbsolute(options.target) || options.target.includes('..') || options.target.includes('\\')) throw new Error('--target must be a safe project-relative path')
  const parts = options.target.split('/')
  const name = parts.at(-1)
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) throw new Error('Component name must be PascalCase')
  return { ...options, name, directory: resolve(root, ...parts) }
}

function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()
}

function render(template, values) {
  let contents = readFileSync(join(templateRoot, template), 'utf8')
  for (const [token, value] of Object.entries(values)) contents = contents.replaceAll(token, value)
  return contents
}

function plan(options) {
  assertSafe(options.directory)
  const slug = kebab(options.name)
  const values = { __COMPONENT_NAME__: options.name, __KEBAB_NAME__: slug }
  const specs = [
    [`${options.name}.tsx`, 'component.tsx.txt'],
    [`${options.name}.test.tsx`, 'component.test.tsx.txt'],
  ]
  if (options.hook) specs.push([`use-${slug}.ts`, 'hook.ts.txt'], [`use-${slug}.test.tsx`, 'hook.test.tsx.txt'])
  if (options.model) specs.push([`${slug}-model.ts`, 'model.ts.txt'], [`${slug}-model.test.ts`, 'model.test.ts.txt'])
  return specs.map(([name, template]) => ({
    path: join(options.directory, name),
    contents: render(template, { ...values, __IMPORT_PATH__: `./${name.replace(/\.(test\.)?(tsx?|jsx?)$/, '')}` }),
  }))
}

async function main() {
  const options = parse(process.argv.slice(2))
  const files = plan(options)
  for (const file of files) {
    assertSafe(file.path)
    if (existsSync(file.path)) throw new Error(`Refusing to overwrite ${relative(root, file.path)}`)
  }
  const missing = []
  let directory = options.directory
  while (directory !== root && !existsSync(directory)) {
    missing.push(directory)
    directory = dirname(directory)
  }
  const created = []
  try {
    for (const path of missing.toReversed()) {
      assertSafe(path)
      await mkdir(path)
    }
    for (const file of files) {
      assertSafe(file.path)
      const handle = await open(file.path, 'wx')
      created.push(file.path)
      try { await handle.writeFile(file.contents) } finally { await handle.close() }
    }
    console.log(JSON.stringify({ created: created.map((path) => relative(root, path)) }, null, 2))
  } catch (error) {
    for (const path of created.toReversed()) await unlink(path).catch(() => {})
    for (const path of missing) await rmdir(path).catch(() => {})
    throw error
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
