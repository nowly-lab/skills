#!/usr/bin/env node

import { mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

function parseArgs(args) {
  const parsed = {
    url: '',
    output: '',
    width: 1440,
    height: 0,
    scale: 2,
    selector: '',
    fullPage: false
  }
  const positional = []

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]

    if (argument === '--width') parsed.width = Number.parseInt(args[++index], 10)
    else if (argument === '--height') parsed.height = Number.parseInt(args[++index], 10)
    else if (argument === '--scale') parsed.scale = Number.parseFloat(args[++index])
    else if (argument === '--selector') parsed.selector = args[++index]
    else if (argument === '--full-page') parsed.fullPage = true
    else positional.push(argument)
  }

  parsed.url = positional[0] ?? ''
  parsed.output = positional[1] ?? ''
  return parsed
}

function globalNpmRoot() {
  try {
    // `npm root -g` prints .../node_modules; requiring from its parent resolves packages inside it.
    return dirname(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim())
  } catch {
    return ''
  }
}

function requirePlaywright() {
  const localRequire = createRequire(import.meta.url)

  try {
    return localRequire('playwright')
  } catch (localError) {
    const moduleRoots = [process.env.PLAYWRIGHT_MODULE_ROOT, globalNpmRoot()].filter(Boolean)

    for (const moduleRoot of moduleRoots) {
      try {
        return createRequire(join(moduleRoot, 'package.json'))('playwright')
      } catch {
        // Continue to the next configured module root.
      }
    }

    throw new Error(
      'Playwright is unavailable. Use a Codex browser capability or set PLAYWRIGHT_MODULE_ROOT to a directory containing node_modules/playwright.',
      { cause: localError }
    )
  }
}

function assertCaptureArgs(args) {
  if (!args.url || !args.output) {
    throw new Error(
      'Usage: node capture-impl.mjs <url> <output_path> [--width 560] [--height 900] [--scale 2] [--selector "main"] [--full-page]'
    )
  }

  if (!Number.isInteger(args.width) || args.width <= 0) {
    throw new Error('--width must be a positive integer')
  }

  if (!Number.isInteger(args.height) || args.height < 0) {
    throw new Error('--height must be a non-negative integer')
  }

  if (!Number.isFinite(args.scale) || args.scale <= 0) {
    throw new Error('--scale must be a positive number')
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  assertCaptureArgs(args)

  const { chromium } = requirePlaywright()
  await mkdir(dirname(args.output), { recursive: true })

  const browser = await chromium.launch()

  try {
    const context = await browser.newContext({
      viewport: {
        width: args.width,
        height: args.height || 900
      },
      deviceScaleFactor: args.scale
    })
    const page = await context.newPage()

    await page.goto(args.url, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)

    const screenshotOptions = {
      path: args.output,
      type: 'png'
    }

    if (args.selector) {
      const element = page.locator(args.selector).first()

      if ((await element.count()) === 0) {
        throw new Error(`Selector not found: ${args.selector}`)
      }

      await element.screenshot(screenshotOptions)
    } else if (args.fullPage) {
      await page.screenshot({ ...screenshotOptions, fullPage: true })
    } else {
      const contentHeight = await page.evaluate(() => document.documentElement.scrollHeight)
      await page.setViewportSize({ width: args.width, height: args.height || contentHeight })
      await page.waitForTimeout(200)
      await page.screenshot(screenshotOptions)
    }

    console.log(
      JSON.stringify({
        path: args.output,
        url: args.url,
        viewport: { width: args.width, height: args.height || 'auto' },
        scale: args.scale,
        selector: args.selector || null,
        fullPage: args.fullPage
      })
    )
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
