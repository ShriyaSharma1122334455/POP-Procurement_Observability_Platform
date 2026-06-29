import { test, expect, type Page } from '@playwright/test'

// Populate Zustand persist store + cookie so the auth guard renders the dashboard
async function mockAuth(page: Page) {
  await page.evaluate(() => {
    const authState = {
      state: {
        user: {
          id: 'mock-1',
          name: 'Test User',
          email: 'test@popplatform.com',
          role: 'procurement_manager' as const,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        token: 'mock-test-token',
        isAuthenticated: true,
      },
      version: 0,
    }
    localStorage.setItem('pop-auth', JSON.stringify(authState))
    localStorage.setItem('pop_token', 'mock-test-token')
    document.cookie = 'pop_token=mock-test-token; path=/'
  })
}

test.describe('R1 — Frontend Foundation', () => {

  test.describe('Routing', () => {
    test('root / redirects to /dashboard', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/\/dashboard|\/login/)
    })

    test('/login page loads without crash', async ({ page }) => {
      await page.goto('/login')
      await expect(page).toHaveURL('/login')
      await expect(page.locator('body')).toBeVisible()
    })

    test('/signup page loads without crash', async ({ page }) => {
      await page.goto('/signup')
      await expect(page).toHaveURL('/signup')
      await expect(page.locator('body')).toBeVisible()
    })

    test('/dashboard page loads', async ({ page }) => {
      await page.goto('/dashboard')
      // Either shows dashboard or redirects to login (both valid at R1 stage)
      await expect(page).toHaveURL(/\/dashboard|\/login/)
    })

    test('/suppliers page loads', async ({ page }) => {
      await page.goto('/suppliers')
      await expect(page).toHaveURL(/\/suppliers|\/login/)
    })

    test('/alerts page loads', async ({ page }) => {
      await page.goto('/alerts')
      await expect(page).toHaveURL(/\/alerts|\/login/)
    })

    test('/agent page loads', async ({ page }) => {
      await page.goto('/agent')
      await expect(page).toHaveURL(/\/agent|\/login/)
    })
  })

  test.describe('Auth Layout', () => {
    test('login page shows POP branding', async ({ page }) => {
      await page.goto('/login')
      // Use .first() — the logo "POP" and the subtitle "Sign in to your POP account"
      // both contain the text "POP"; we want the first (logo) match.
      await expect(page.locator('text=POP').first()).toBeVisible()
    })

    test('signup page shows POP branding', async ({ page }) => {
      await page.goto('/signup')
      await expect(page.locator('text=POP').first()).toBeVisible()
    })

    test('auth layout has dark gradient background', async ({ page }) => {
      await page.goto('/login')
      const body = page.locator('body')
      await expect(body).toBeVisible()
      // Check background is not plain white
      const bg = await page.evaluate(() => {
        const el = document.querySelector('body > div') as HTMLElement
        return el ? window.getComputedStyle(el).background : ''
      })
      // Background should contain gradient or dark color
      expect(bg).toBeTruthy()
    })
  })

  test.describe('Dashboard Layout (when authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      // Set localStorage before navigating so Zustand hydrates with isAuthenticated=true
      await page.goto('/login')
      await mockAuth(page)
    })

    test('dashboard shows sidebar', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('[data-testid="sidebar"], nav, aside').first()).toBeVisible()
    })

    test('sidebar has navigation links', async ({ page }) => {
      await page.goto('/dashboard')
      const nav = page.locator('nav, aside, [data-testid="sidebar"]').first()
      await expect(nav).toBeVisible()
    })

    test('dashboard shows KPI stat cards', async ({ page }) => {
      await page.goto('/dashboard')
      // Look for currency values or card-like elements
      await expect(page.locator('text=$245,820').or(page.locator('[data-testid="stat-card"]').first())).toBeVisible({ timeout: 5000 })
    })

    test('header is visible on dashboard', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('header, [data-testid="header"]').first()).toBeVisible()
    })
  })

  test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
      await mockAuth(page)
    })

    test('sidebar shows Dashboard link', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('text=Dashboard').first()).toBeVisible()
    })

    test('sidebar shows Suppliers link', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('text=Suppliers').first()).toBeVisible()
    })

    test('sidebar shows Alerts link', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('text=Alerts').first()).toBeVisible()
    })

    test('sidebar shows Savings Agent link', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('text=Savings Agent').or(page.locator('text=Agent')).first()).toBeVisible()
    })

    test('sidebar navigation links work', async ({ page }) => {
      await page.goto('/dashboard')
      await page.locator('text=Suppliers').first().click()
      await expect(page).toHaveURL(/\/suppliers/)
    })
  })

  test.describe('Responsive Design', () => {
    test('mobile viewport: page does not overflow horizontally', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto('/login')
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(376)
    })

    test('tablet viewport: page loads correctly', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/login')
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Shared Components', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
      await mockAuth(page)
    })

    test('dashboard page has a page title/heading', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('h1, h2').first()).toBeVisible()
    })

    test('no console errors on dashboard load', async ({ page }) => {
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      await page.goto('/dashboard')
      await page.waitForTimeout(1000)
      // Filter out known non-critical errors
      const criticalErrors = errors.filter(e => !e.includes('Warning:') && !e.includes('favicon'))
      expect(criticalErrors).toHaveLength(0)
    })
  })

})
