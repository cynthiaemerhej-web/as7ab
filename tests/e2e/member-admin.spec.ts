import { expect } from '@playwright/test'
import { E2E, signInAs, test } from './helpers'

test.describe('member posts, admin approves', () => {
  test.skip(!E2E.serviceKey || !E2E.memberEmail || !E2E.adminEmail, 'Needs E2E_SUPABASE_SERVICE_ROLE_KEY, E2E_MEMBER_EMAIL and E2E_ADMIN_EMAIL')
  test.describe.configure({ mode: 'serial' })
  const title = `E2E balloons ${Date.now()}`

  test('member creates a listing and sees it pending', async ({ page }) => {
    await signInAs(page, E2E.memberEmail!)
    await page.goto('/dashboard/listings/new')
    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Goods').check()
    await page.getByLabel('Category').selectOption({ index: 1 })
    await page.getByLabel('Area').selectOption('Metn')
    await page.getByLabel('Description').fill('Balloons, banners and themed tableware for kids parties. Created by the automated test.')
    await page.getByLabel('Phone').fill('03 123 456')
    await page.getByRole('button', { name: /save and add photos/i }).click()
    await expect(page.getByText(/waiting for review/i)).toBeVisible()
    await page.goto('/dashboard')
    await expect(page.getByText(title)).toBeVisible()
    await expect(page.getByText('Pending review').first()).toBeVisible()
  })

  test('admin approves it and it appears in search', async ({ page }) => {
    await signInAs(page, E2E.adminEmail!)
    await page.goto('/admin')
    const card = page.locator('article', { hasText: title })
    await expect(card).toBeVisible()
    await card.getByRole('button', { name: /^approve$/i }).click()
    await expect(card).toBeHidden()
    await page.goto(`/search?q=${encodeURIComponent('E2E balloons')}`)
    await expect(page.getByText(title)).toBeVisible()
  })

  test('member deletes the listing', async ({ page }) => {
    await signInAs(page, E2E.memberEmail!)
    await page.goto('/dashboard')
    const row = page.locator('li', { hasText: title })
    page.once('dialog', (d) => d.accept())
    await row.getByRole('button', { name: /delete/i }).click()
    await expect(page.getByText(title)).toBeHidden()
  })
})
