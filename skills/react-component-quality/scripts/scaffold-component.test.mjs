import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { applyComponentScaffold, planComponentScaffold } from './scaffold-component.mjs'

async function projectFixture(t, name = 'project') {
  const parent = await mkdtemp(join(tmpdir(), 'react scaffold '))
  const root = join(parent, name)
  await mkdir(root, { recursive: true })
  await writeFile(join(root, 'package.json'), '{"dependencies":{"react":"^19"}}\n')
  t.after(() => rm(parent, { recursive: true, force: true }))
  return { parent, root }
}

function relativeFiles(plan) {
  return plan.files.map((file) => relative(plan.projectRoot, file.path))
}

test('plans the two default files without mutating the project', async (t) => {
  const { root } = await projectFixture(t)

  const plan = planComponentScaffold({
    projectRoot: root,
    target: 'src/components/plugin-catalog/PluginCard',
  })

  assert.deepEqual(relativeFiles(plan), [
    'src/components/plugin-catalog/PluginCard/PluginCard.tsx',
    'src/components/plugin-catalog/PluginCard/PluginCard.test.tsx',
  ])
  assert.equal(existsSync(join(root, 'src')), false)
  assert.match(plan.files[0].contents, /type PluginCardProps =/)
  assert.match(plan.files[0].contents, /export function PluginCard\(/)
  assert.doesNotMatch(plan.files[0].contents, /__COMPONENT_NAME__|__KEBAB_NAME__|__IMPORT_PATH__/)
})

test('plans hook and model files as six focused outputs', async (t) => {
  const { root } = await projectFixture(t)

  const plan = planComponentScaffold({
    projectRoot: root,
    target: 'src/features/plugin-catalog/PluginCard',
    withHook: true,
    withModel: true,
  })

  assert.deepEqual(relativeFiles(plan), [
    'src/features/plugin-catalog/PluginCard/PluginCard.tsx',
    'src/features/plugin-catalog/PluginCard/PluginCard.test.tsx',
    'src/features/plugin-catalog/PluginCard/use-plugin-card.ts',
    'src/features/plugin-catalog/PluginCard/use-plugin-card.test.tsx',
    'src/features/plugin-catalog/PluginCard/plugin-card-model.ts',
    'src/features/plugin-catalog/PluginCard/plugin-card-model.test.ts',
  ])
  for (const file of plan.files) {
    assert.doesNotMatch(file.contents, /__COMPONENT_NAME__|__KEBAB_NAME__|__IMPORT_PATH__/)
  }
  assert.match(plan.files[1].contents, /from '\.\/PluginCard'/)
  assert.match(plan.files[3].contents, /from '\.\/use-plugin-card'/)
  assert.match(plan.files[5].contents, /from '\.\/plugin-card-model'/)
})

test('rejects non-relative targets and non-PascalCase component names', async (t) => {
  const { root } = await projectFixture(t)

  for (const target of ['', '.', '../escape', 'src/../Escape', '/tmp/Escape', 'src/components/plugin-card', 'Plugin_Card']) {
    assert.throws(
      () => planComponentScaffold({ projectRoot: root, target }),
      /project-relative|PascalCase/,
      target,
    )
  }
})

test('rejects a target whose existing symlink ancestor escapes the real project root', async (t) => {
  const { parent, root } = await projectFixture(t)
  const outside = join(parent, 'outside')
  await mkdir(join(root, 'src'), { recursive: true })
  await mkdir(outside)
  await symlink(outside, join(root, 'src', 'linked'))

  assert.throws(
    () => planComponentScaffold({ projectRoot: root, target: 'src/linked/PluginCard' }),
    /outside the project root/,
  )
})

test('preflights every output and leaves no partial files when one already exists', async (t) => {
  const { root } = await projectFixture(t)
  const targetDirectory = join(root, 'src/components/PluginCard')
  await mkdir(targetDirectory, { recursive: true })
  await writeFile(join(targetDirectory, 'PluginCard.test.tsx'), 'keep me\n')
  const plan = planComponentScaffold({ projectRoot: root, target: 'src/components/PluginCard' })

  await assert.rejects(() => applyComponentScaffold(plan), /already exists/)

  assert.equal(existsSync(join(targetDirectory, 'PluginCard.tsx')), false)
  assert.equal(await readFile(join(targetDirectory, 'PluginCard.test.tsx'), 'utf8'), 'keep me\n')
})

test('applies exclusively and refuses to overwrite on a second run', async (t) => {
  const { root } = await projectFixture(t)
  const plan = planComponentScaffold({
    projectRoot: root,
    target: 'src/components/PluginCard',
    withHook: true,
    withModel: true,
  })

  const created = await applyComponentScaffold(plan)

  assert.deepEqual(created, plan.files.map((file) => file.path))
  assert.equal((await readFile(created[0], 'utf8')).includes('export function PluginCard('), true)
  await assert.rejects(() => applyComponentScaffold(plan), /already exists/)
  assert.equal(await readFile(created[0], 'utf8'), plan.files[0].contents)
})

test('rolls back earlier exclusive writes if a later output collides', async (t) => {
  const { root } = await projectFixture(t)
  const plan = planComponentScaffold({ projectRoot: root, target: 'src/components/PluginCard' })
  const collidingPlan = { ...plan, files: [plan.files[0], plan.files[0]] }

  await assert.rejects(() => applyComponentScaffold(collidingPlan), /EEXIST/)

  assert.equal(existsSync(plan.files[0].path), false)
})

test('rollback preserves empty target and parent directories that existed before apply', async (t) => {
  const { root } = await projectFixture(t)
  const targetDirectory = join(root, 'src/components/PluginCard')
  await mkdir(targetDirectory, { recursive: true })
  const plan = planComponentScaffold({ projectRoot: root, target: 'src/components/PluginCard' })
  const collidingPlan = { ...plan, files: [plan.files[0], plan.files[0]] }

  await assert.rejects(() => applyComponentScaffold(collidingPlan), /EEXIST/)

  assert.equal(existsSync(targetDirectory), true)
  assert.equal(existsSync(join(root, 'src/components')), true)
  assert.equal(existsSync(plan.files[0].path), false)
})

test('rejects a mutated plan whose child symlink would write outside the project', async (t) => {
  const { parent, root } = await projectFixture(t)
  const plan = planComponentScaffold({ projectRoot: root, target: 'src/components/PluginCard' })
  const outside = join(parent, 'outside')
  await mkdir(plan.targetDirectory, { recursive: true })
  await mkdir(outside)
  await symlink(outside, join(plan.targetDirectory, 'linked'))
  const escapedPath = join(plan.targetDirectory, 'linked/Escape.tsx')
  const mutatedPlan = { ...plan, files: [{ path: escapedPath, contents: 'escaped\n' }] }

  await assert.rejects(() => applyComponentScaffold(mutatedPlan), /outside the project root/)

  assert.equal(existsSync(join(outside, 'Escape.tsx')), false)
})

test('rechecks realpath containment when a symlink appears after planning', async (t) => {
  const { parent, root } = await projectFixture(t)
  const plan = planComponentScaffold({ projectRoot: root, target: 'src/linked/PluginCard' })
  const outside = join(parent, 'outside')
  await mkdir(join(root, 'src'), { recursive: true })
  await mkdir(outside)
  await symlink(outside, join(root, 'src', 'linked'))

  await assert.rejects(() => applyComponentScaffold(plan), /outside the project root/)

  assert.equal(existsSync(join(outside, 'PluginCard')), false)
})

test('CLI handles a project path containing spaces and dry-run is non-mutating', async (t) => {
  const { root } = await projectFixture(t, 'project with spaces')
  const cli = fileURLToPath(new URL('./scaffold-component.mjs', import.meta.url))
  const target = 'src/components/PluginCard'

  const dryRun = spawnSync(process.execPath, [cli, '--project', root, '--target', target, '--with-hook', '--with-model'], { encoding: 'utf8' })
  assert.equal(dryRun.status, 0, dryRun.stderr)
  assert.equal(JSON.parse(dryRun.stdout).files.length, 6)
  assert.equal(existsSync(join(root, 'src')), false)

  const applyRun = spawnSync(process.execPath, [cli, '--project', root, '--target', target, '--with-hook', '--with-model', '--apply'], { encoding: 'utf8' })
  assert.equal(applyRun.status, 0, applyRun.stderr)
  assert.equal(JSON.parse(applyRun.stdout).created.length, 6)
  assert.equal(existsSync(join(root, target, 'PluginCard.tsx')), true)
})
