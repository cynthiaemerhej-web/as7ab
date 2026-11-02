// Renders docs/design/mockup.html frames to PNG (design screenshots + OG image).
// Usage: node scripts/screenshots.mjs
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'docs/design/screens')
mkdirSync(outDir, { recursive: true })

// In the dev sandbox a shared Chromium lives at /opt/pw-browsers/chromium; elsewhere use Playwright's own.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
await page.goto('file://' + path.join(root, 'docs/design/mockup.html'))
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(500)

const frames = await page.$$('[data-screen]')
for (const frame of frames) {
  const name = await frame.getAttribute('data-screen')
  const file = name === 'og' ? path.join(root, 'public/og.png') : path.join(outDir, `${name}.png`)
  await frame.screenshot({ path: file, scale: name === 'og' ? 'css' : 'device' })
  console.log('wrote', path.relative(root, file))
}
await browser.close()
