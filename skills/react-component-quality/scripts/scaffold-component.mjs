#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { lstat, mkdir, open, rmdir, unlink } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { validateProjectRoot } from './project-inspection.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const templateDirectory = resolve(scriptDirectory, '../assets/quality-kit/templates')
const pascalCase = /^[A-Z][A-Za-z0-9]*$/

function pathIsInside(root, candidate) {
  const difference = relative(root, candidate)
  return difference === '' || (!difference.startsWith(`..${sep}`) && difference !== '..' && !isAbsolute(difference))
}

function nearestExistingAncestor(path) {
  let candidate = path
  while (!existsSync(candidate)) {
    const parent = dirname(candidate)
    if (parent === candidate) return candidate
    candidate = parent
  }
  return realpathSync(candidate)
}

function assertContained(root, targetDirectory) {
  if (!pathIsInside(root, targetDirectory)) {
    throw new Error('Scaffold target must stay inside the project root')
  }
  const ancestor = nearestExistingAncestor(targetDirectory)
  if (!pathIsInside(root, ancestor)) {
    throw new Error(`Scaffold target resolves outside the project root: ${targetDirectory}`)
  }
}

function componentNameToKebabCase(componentName) {
  return componentName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function validateTarget(target) {
  if (typeof target !== 'string' || target.trim() === '' || target !== target.trim()) {
    throw new Error('Target must be a project-relative directory plus PascalCase component name')
  }
  if (isAbsolute(target) || target.includes('\\')) {
    throw new Error('Target must be project-relative')
  }
  const segments = target.split('/')
  if (segments.length < 2 || segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error('Target must be a project-relative directory plus PascalCase component name')
  }
  const componentName = segments.at(-1)
  if (!pascalCase.test(componentName)) {
    throw new Error(`Component name must be PascalCase: ${componentName}`)
  }
  return { componentName, segments }
}

function renderTemplate(templateName, replacements) {
  const source = realpathSync(join(templateDirectory, templateName))
  let contents = readFileSync(source, 'utf8')
  for (const [token, replacement] of Object.entries(replacements)) {
    contents = contents.replaceAll(token, replacement)
  }
  return contents
}

function plannedFile(targetDirectory, filename, template, replacements) {
  return {
    path: join(targetDirectory, filename),
    contents: renderTemplate(template, replacements),
  }
}

export function planComponentScaffold({ projectRoot, target, withHook = false, withModel = false }) {
  const root = validateProjectRoot(projectRoot)
  const { componentName, segments } = validateTarget(target)
  const targetDirectory = resolve(root, ...segments)
  assertContained(root, targetDirectory)

  const kebabName = componentNameToKebabCase(componentName)
  const replacements = {
    __COMPONENT_NAME__: componentName,
    __KEBAB_NAME__: kebabName,
  }
  const files = [
    plannedFile(targetDirectory, `${componentName}.tsx`, 'component.tsx.txt', {
      ...replacements,
      __IMPORT_PATH__: `./${componentName}`,
    }),
    plannedFile(targetDirectory, `${componentName}.test.tsx`, 'component.test.tsx.txt', {
      ...replacements,
      __IMPORT_PATH__: `./${componentName}`,
    }),
  ]
  if (withHook) {
    files.push(
      plannedFile(targetDirectory, `use-${kebabName}.ts`, 'hook.ts.txt', {
        ...replacements,
        __IMPORT_PATH__: `./use-${kebabName}`,
      }),
      plannedFile(targetDirectory, `use-${kebabName}.test.tsx`, 'hook.test.tsx.txt', {
        ...replacements,
        __IMPORT_PATH__: `./use-${kebabName}`,
      }),
    )
  }
  if (withModel) {
    files.push(
      plannedFile(targetDirectory, `${kebabName}-model.ts`, 'model.ts.txt', {
        ...replacements,
        __IMPORT_PATH__: `./${kebabName}-model`,
      }),
      plannedFile(targetDirectory, `${kebabName}-model.test.ts`, 'model.test.ts.txt', {
        ...replacements,
        __IMPORT_PATH__: `./${kebabName}-model`,
      }),
    )
  }

  return { projectRoot: root, target, targetDirectory, componentName, kebabName, files }
}

async function pathExists(path) {
  try {
    await lstat(path)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

async function createTargetDirectories(targetDirectory, root, createdDirectories) {
  const missingDirectories = []
  let directory = targetDirectory
  while (directory !== root && !(await pathExists(directory))) {
    missingDirectories.push(directory)
    directory = dirname(directory)
  }
  assertContained(root, directory)

  for (const missingDirectory of missingDirectories.reverse()) {
    try {
      await mkdir(missingDirectory)
      createdDirectories.push(missingDirectory)
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
    }
    assertContained(root, missingDirectory)
  }
}

async function removeCreatedDirectories(createdDirectories) {
  for (const directory of createdDirectories.toReversed()) {
    try {
      await rmdir(directory)
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY') throw error
    }
  }
}

function validatePlan(plan) {
  if (!plan || typeof plan !== 'object' || !Array.isArray(plan.files) || plan.files.length === 0) {
    throw new Error('Invalid component scaffold plan')
  }
  const root = validateProjectRoot(plan.projectRoot)
  assertContained(root, plan.targetDirectory)
  for (const file of plan.files) {
    if (!file || typeof file.path !== 'string' || typeof file.contents !== 'string' || !pathIsInside(plan.targetDirectory, file.path)) {
      throw new Error('Invalid component scaffold output path')
    }
    assertContained(root, file.path)
  }
  return root
}

export async function applyComponentScaffold(plan) {
  const root = validatePlan(plan)
  const existing = []
  for (const file of plan.files) {
    if (await pathExists(file.path)) existing.push(relative(root, file.path))
  }
  if (existing.length > 0) throw new Error(`Refusing to overwrite because a planned file already exists: ${existing.join(', ')}`)

  const created = []
  const createdDirectories = []
  try {
    await createTargetDirectories(plan.targetDirectory, root, createdDirectories)
    assertContained(root, plan.targetDirectory)
    for (const file of plan.files) {
      assertContained(root, file.path)
      const handle = await open(file.path, 'wx')
      created.push(file.path)
      try {
        await handle.writeFile(file.contents, 'utf8')
      } finally {
        await handle.close()
      }
    }
    return created
  } catch (error) {
    await Promise.all(created.map(async (path) => {
      try {
        await unlink(path)
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') throw cleanupError
      }
    }))
    await removeCreatedDirectories(createdDirectories)
    throw error
  }
}

function parseArguments(argv) {
  const options = { project: process.cwd(), apply: false, withHook: false, withModel: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--project') options.project = argv[++index]
    else if (argument === '--target') options.target = argv[++index]
    else if (argument === '--with-hook') options.withHook = true
    else if (argument === '--with-model') options.withModel = true
    else if (argument === '--apply') options.apply = true
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (!options.project) throw new Error('--project requires a path')
  if (!options.target) throw new Error('--target requires a project-relative component path')
  return options
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv)
  const plan = planComponentScaffold({
    projectRoot: options.project,
    target: options.target,
    withHook: options.withHook,
    withModel: options.withModel,
  })
  if (options.apply) {
    const created = await applyComponentScaffold(plan)
    process.stdout.write(`${JSON.stringify({ mode: 'apply', created }, null, 2)}\n`)
    return
  }
  process.stdout.write(`${JSON.stringify({
    mode: 'dry-run',
    projectRoot: plan.projectRoot,
    files: plan.files.map((file) => relative(plan.projectRoot, file.path)),
  }, null, 2)}\n`)
}

const entryModule = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null
if (import.meta.url === entryModule) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
