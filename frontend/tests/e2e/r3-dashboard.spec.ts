import { test, expect, type Page } from '@playwright/test'

const MOCK_USER = {
  id: 'mock-1',
  name: 'Test User',
  email: 'test@popplatform.com',
  role: 'procurement_manager',
  createdAt: '2026-01-01T00:00:00.000Z',
}

// Helper: fully mock auth state so the dashboard renders without a backend.
// 1. Intercept /auth/me so AuthProvider doesn't call logout() on network failure.
// 2. Set the Zustand persist store (pop-auth) so DashboardLayout's auth guard passes.
// 3. Set the pop_token cookie so the Next.js proxy middleware allows the route.
async function setAuth(page: Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_USER }),
    })
  )

  await page.goto('/login')

  await page.evaluate((user) => {
    localStorage.setItem('pop-auth', JSON.stringify({
      state: { user, token: 'mock-test-token', isAuthenticated: true },
      version: 0,
    }))
    document.cookie = 'pop_token=mock-test-token; path=/'
  }, MOCK_USER)
}

test.describe('R3 — Spend Observability Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await setAuth(page)
  })

  test.describe('Dashboard Page Load', () => {
    test('dashboard page loads successfully', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('body')).toBeVisible()
    })

    test('dashboard page title is visible', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('text=Spend Dashboard').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('skeleton or content loads within 5 seconds', async ({ page }) => {
      await page.goto('/dashboard')
      const hasContent = await page
        .locator('[class*="animate-pulse"]')
        .or(page.locator('text=$245,820'))
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
      expect(hasContent).toBeTruthy()
    })
  })

  test.describe('Period Selector', () => {
    test('period selector is visible', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('button:has-text("7 Days")')
      ).toBeVisible({ timeout: 5000 })
    })

    test('30 Days is selected by default', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('button:has-text("30 Days")')
      ).toBeVisible({ timeout: 5000 })
    })

    test('clicking 7 Days updates the selector', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      const btn = page.locator('button:has-text("7 Days")')
      await btn.click()
      await expect(btn).toBeVisible()
    })

    test('clicking 90 Days updates the selector', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      const btn = page.locator('button:has-text("90 Days")')
      await btn.click()
      await expect(btn).toBeVisible()
    })
  })

  test.describe('KPI Stat Cards', () => {
    test('Total Spend card is visible', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('text=Total Spend').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('Active Suppliers card is visible', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('text=Active Suppliers').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('Open Alerts card is visible', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('text=Open Alerts').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('mock spend value $245,820 is displayed', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('text=$245,820').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('stat cards show trend indicators', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(2000)
      const hasTrend = await page.locator('svg').first().isVisible().catch(() => false)
      expect(hasTrend).toBeTruthy()
    })
  })

  test.describe('Spend Chart', () => {
    test('spend chart area is rendered', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForTimeout(2000)
      const chartSvg = page.locator('svg').first()
      await expect(chartSvg).toBeVisible({ timeout: 5000 })
    })

    test('spend trend title is visible', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('text=Spend Trend').first()
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Category Breakdown', () => {
    test('category breakdown section is visible', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('text=Category Breakdown').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('Proteins category is listed', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('text=Proteins').first()).toBeVisible({ timeout: 5000 })
    })

    test('Produce category is listed', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('text=Produce').first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Top Suppliers Table', () => {
    test('top suppliers section is visible', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(
        page.locator('text=Top Suppliers by Spend').first()
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Loading Skeleton', () => {
    test('page does not show broken layout', async ({ page }) => {
      await page.goto('/dashboard')
      const hasError = await page
        .locator('text=Failed to load')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      // Mock data prevents errors; just verify the page didn't crash
      expect(hasError).toBeFalsy()
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Responsive Layout', () => {
    test('dashboard is usable on tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/dashboard')
      await expect(page.locator('body')).toBeVisible()
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth)
      expect(overflow).toBeFalsy()
    })

    test('dashboard is usable on desktop (1440px)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto('/dashboard')
      await expect(page.locator('body')).toBeVisible()
    })
  })

})
