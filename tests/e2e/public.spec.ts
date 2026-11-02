import { expect } from '@playwright/test'
import { test } from './helpers'

test.describe('public pages', () => {
  test('home loads with search, categories and an ad slot', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('search').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /browse by category/i })).toBeVisible()
    const placeholder = page.getByRole('link', { name: /advertise here/i })
    const ad = page.getByText('Ad', { exact: true })
    await expect(placeholder.first().or(ad.first())).toBeVisible()
  })

  test('search shows results or a friendly empty state', async ({ page }) => {
    await page.goto('/search?q=cake')
    await expect(page.getByRole('heading', { name: /results for/i })).toBeVisible()
    const empty = page.getByText(/nothing here yet/i)
    const card = page.locator('a[href^="/l/"]').first()
    await expect(empty.or(card)).toBeVisible()
  })

  test('a listing page shows contact buttons and the report link', async ({ page }) => {
    await page.goto('/search')
    const first = page.locator('a[href^="/l/"]').first()
    test.skip((await first.count()) === 0, 'No approved listings in this project yet')
    await first.click()
    await expect(page).toHaveURL(/\/l\//)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/get in touch/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /report this listing/i })).toBeVisible()
  })

  test('unknown listing gives the 404 page with a search box', async ({ page }) => {
    const res = await page.goto('/l/does-not-exist-000000')
    expect(res?.status()).toBe(404)
    await expect(page.getByRole('search').last()).toBeVisible()
  })

  test('dashboard redirects to login when signed out', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/)
    await expect(page.getByRole('button', { name: /send me a sign-in link/i })).toBeVisible()
  })
})
