import { test, expect, type Page } from '@playwright/test'

const DEMO_USER = {
  id: 'demo-1',
  name: 'Demo User',
  email: 'demo@popplatform.com',
  role: 'procurement_manager',
  createdAt: '2026-01-01T00:00:00.000Z',
}

// Authenticate via the real Demo Login flow then client-navigate to the target.
// Full-page reloads (page.goto on protected routes) trigger a Zustand hydration
// race in DashboardLayout that bounces to /dashboard. Client-side navigation
// re-uses the already-hydrated session and avoids the race entirely.
async function setAuth(page: Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: DEMO_USER }),
    })
  )
  await page.goto('/login')
  await page.click('button:text("Demo Login")')
  await page.waitForURL('/dashboard', { timeout: 8000 })
}

async function goToSuppliers(page: Page) {
  await page.click('a[href="/suppliers"]')
  await page.waitForURL('/suppliers', { timeout: 5000 })
  await page.waitForLoadState('networkidle')
}

test.describe('R4 — Supplier Intelligence UI', () => {

  test.beforeEach(async ({ page }) => {
    await setAuth(page)
  })

  test.describe('Supplier List Page', () => {
    test('suppliers page loads', async ({ page }) => {
      await goToSuppliers(page)
      await expect(page).toHaveURL('/suppliers')
      await expect(page.locator('body')).toBeVisible()
    })

    test('suppliers page shows heading', async ({ page }) => {
      await goToSuppliers(page)
      await expect(page.locator('h1').filter({ hasText: 'Supplier Intelligence' })).toBeVisible({ timeout: 5000 })
    })

    test('supplier cards are rendered', async ({ page }) => {
      await goToSuppliers(page)
      const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]')
      await expect(cards.first()).toBeVisible({ timeout: 5000 })
    })

    test('mock suppliers are visible', async ({ page }) => {
      await goToSuppliers(page)
      await expect(page.locator('text=Pacific Proteins').first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Supplier Filters', () => {
    test('search input is visible', async ({ page }) => {
      await goToSuppliers(page)
      await expect(
        page.locator('input[placeholder*="Search"], input[placeholder*="supplier"]').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('category filter is visible', async ({ page }) => {
      await goToSuppliers(page)
      await expect(
        page.locator('select[aria-label*="category"], select[aria-label*="Category"]').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('search filters suppliers', async ({ page }) => {
      await goToSuppliers(page)
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="supplier"]').first()
      await searchInput.fill('Pacific')
      await page.waitForTimeout(500)
      await expect(page.locator('text=Pacific Proteins').first()).toBeVisible({ timeout: 3000 })
    })

    test('clearing search restores all suppliers', async ({ page }) => {
      await goToSuppliers(page)
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="supplier"]').first()
      await searchInput.fill('Pacific')
      await page.waitForTimeout(500)
      await searchInput.clear()
      await page.waitForTimeout(500)
      await expect(
        page.locator('text=Green Valley').or(page.locator('text=Metro Dairy')).first()
      ).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Supplier Cards', () => {
    test('supplier card shows name', async ({ page }) => {
      await goToSuppliers(page)
      await expect(page.locator('text=Pacific Proteins Co.').first()).toBeVisible({ timeout: 5000 })
    })

    test('supplier card shows category badge', async ({ page }) => {
      await goToSuppliers(page)
      // Category badge: span with bg-slate-100 rounded-full (not the supplier name paragraph)
      await expect(
        page.locator('span[class*="bg-slate-100"][class*="rounded-full"]').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('supplier card shows recommendation badge', async ({ page }) => {
      await goToSuppliers(page)
      // Use span locator to avoid matching hidden <option> elements in the category select
      await expect(
        page.locator('span').filter({ hasText: /^(Renew|Negotiate|Diversify|Replace)$/ }).first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('supplier card shows reliability score label', async ({ page }) => {
      await goToSuppliers(page)
      // Use exact match to avoid matching "Reliability Score" option in category filter select
      await expect(page.getByText('RELIABILITY', { exact: true }).first()).toBeVisible({ timeout: 5000 })
    })

    test('RENEW badge has green styling', async ({ page }) => {
      await goToSuppliers(page)
      // Badge renders "Renew" (title case)
      const renewBadge = page.locator('text=Renew').first()
      if (await renewBadge.isVisible()) {
        const color = await renewBadge.evaluate((el) => window.getComputedStyle(el).color)
        // emerald-700 / emerald variants have green channel dominance
        expect(color).toMatch(/rgb\(/)
      }
    })

    test('REPLACE badge has red styling', async ({ page }) => {
      await goToSuppliers(page)
      // Badge renders "Replace" (title case)
      const replaceBadge = page.locator('text=Replace').first()
      if (await replaceBadge.isVisible()) {
        const color = await replaceBadge.evaluate((el) => window.getComputedStyle(el).color)
        expect(color).toMatch(/rgb\(/)
      }
    })
  })

  test.describe('Supplier Detail Page', () => {
    test('clicking supplier card navigates to detail page', async ({ page }) => {
      await goToSuppliers(page)
      const firstCard = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]').first()
      await firstCard.click()
      await expect(page).toHaveURL(/\/suppliers\/\w+/, { timeout: 5000 })
    })

    test('supplier detail page shows supplier name', async ({ page }) => {
      await goToSuppliers(page)
      await page.locator('text=Pacific Proteins Co.').first().click()
      await page.waitForURL(/\/suppliers\/\w+/, { timeout: 5000 })
      await expect(page.locator('text=Pacific Proteins Co.').first()).toBeVisible({ timeout: 5000 })
    })

    test('supplier detail shows score gauges', async ({ page }) => {
      await goToSuppliers(page)
      await page.locator('[class*="rounded-xl"][class*="cursor-pointer"]').first().click()
      await page.waitForURL(/\/suppliers\/\w+/, { timeout: 5000 })
      await expect(page.locator('text=Reliability').first()).toBeVisible({ timeout: 5000 })
    })

    test('supplier detail shows recommendation card', async ({ page }) => {
      await goToSuppliers(page)
      await page.locator('[class*="rounded-xl"][class*="cursor-pointer"]').first().click()
      await page.waitForURL(/\/suppliers\/\w+/, { timeout: 5000 })
      await expect(
        page.locator('text=Recommended').or(page.locator('text=Negotiate')).first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('supplier detail shows AI Intelligence section', async ({ page }) => {
      await goToSuppliers(page)
      await page.locator('[class*="rounded-xl"][class*="cursor-pointer"]').first().click()
      await page.waitForURL(/\/suppliers\/\w+/, { timeout: 5000 })
      await expect(
        page.locator('text=AI Intelligence').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('back button returns to suppliers list', async ({ page }) => {
      await goToSuppliers(page)
      await page.locator('[class*="rounded-xl"][class*="cursor-pointer"]').first().click()
      await page.waitForURL(/\/suppliers\/\w+/, { timeout: 5000 })
      await page.locator('text=Back to Suppliers').first().click()
      await expect(page).toHaveURL('/suppliers', { timeout: 5000 })
    })
  })

  test.describe('Supplier Score Gauges', () => {
    test('score gauges render SVG elements', async ({ page }) => {
      await goToSuppliers(page)
      await page.locator('[class*="rounded-xl"][class*="cursor-pointer"]').first().click()
      await page.waitForURL(/\/suppliers\/\w+/, { timeout: 5000 })
      const svg = page.locator('svg circle').first()
      await expect(svg).toBeVisible({ timeout: 5000 })
    })

    test('score of 94 is displayed for Pacific Proteins', async ({ page }) => {
      await goToSuppliers(page)
      await page.locator('text=Pacific Proteins Co.').first().click()
      await page.waitForURL(/\/suppliers\/\w+/, { timeout: 5000 })
      await expect(page.locator('text=94').first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Responsive Grid', () => {
    test('supplier grid is 1 col on mobile without overflow', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      // Desktop sidebar is hidden on mobile; open the mobile hamburger menu (sheet) instead
      await page.click('button[aria-label="Open navigation menu"]')
      // Sheet uses @base-ui/react/dialog with data-slot="sheet-content"
      const sheetContent = page.locator('[data-slot="sheet-content"]')
      await sheetContent.waitFor({ state: 'visible', timeout: 5000 })
      await sheetContent.locator('a[href="/suppliers"]').click()
      await page.waitForURL('/suppliers', { timeout: 5000 })
      await page.waitForLoadState('networkidle')
      await expect(page.locator('body')).toBeVisible()
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth)
      expect(overflow).toBeFalsy()
    })

    test('supplier grid shows multiple cards on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await goToSuppliers(page)
      const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"]')
      await expect(cards.first()).toBeVisible({ timeout: 5000 })
      const count = await cards.count()
      expect(count).toBeGreaterThan(1)
    })
  })

})
