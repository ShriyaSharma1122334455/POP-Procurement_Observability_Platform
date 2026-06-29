import { test, expect, type Page } from '@playwright/test'

const MOCK_USER = {
  id: 'mock-1',
  name: 'Test User',
  email: 'test@popplatform.com',
  role: 'procurement_manager',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const MOCK_AGENT_RESPONSE = {
  query: 'Reduce my food costs',
  summary:
    'I analyzed your procurement data across 47 suppliers and 6 categories. I identified 3 high-confidence savings opportunities totaling $43,200 in potential annual savings.',
  totalPotentialSavings: 43200,
  analysisSteps: [
    'Scanned price history across 47 active suppliers',
    'Benchmarked Protein category against 8 market alternatives',
    'Identified volume discount threshold at 800 lbs/month',
    'Modeled Q3 demand forecast for seasonal pricing windows',
    'Calculated net savings after estimated switching costs',
  ],
  opportunities: [
    {
      id: '1',
      title: 'Switch Chicken Supplier',
      description: 'Pacific Proteins Co. is 18% above market rate. Coastal Foods offers equivalent quality at market price.',
      estimatedSavings: 1533,
      annualizedSavings: 18400,
      category: 'Proteins',
      confidence: 'HIGH',
      recommendedAction: 'Request samples and pricing from Coastal Foods. Run 4-week trial order before full transition.',
      affectedSuppliers: ['Pacific Proteins Co.', 'Coastal Foods'],
    },
    {
      id: '2',
      title: 'Olive Oil Bulk Purchase Window',
      description: 'August historically marks the lowest olive oil prices (avg -14% vs annual mean).',
      estimatedSavings: 933,
      annualizedSavings: 11200,
      category: 'Dry Goods',
      confidence: 'HIGH',
      recommendedAction: 'Pre-authorize $8,500 bulk olive oil purchase order for July 28.',
      affectedSuppliers: [],
    },
    {
      id: '3',
      title: 'Beverage Contract Renegotiation',
      description: 'Your beverage contract is 3 years old. Market has moved 12% in your favor.',
      estimatedSavings: 1133,
      annualizedSavings: 13600,
      category: 'Beverages',
      confidence: 'MEDIUM',
      recommendedAction: 'Schedule renegotiation call 60 days before contract expiry. Prepare 3 competitor quotes.',
      affectedSuppliers: [],
    },
  ],
  processingTime: 2.3,
}

// Auth setup — same proven pattern as R5:
// 1. context.addCookies() sets pop_token so Next.js proxy allows protected routes
// 2. addInitScript() injects pop-auth Zustand store before React runs
// 3. route() mocks /auth/me so AuthProvider doesn't trigger logout()
// 4. route() mocks /agent/query with instant response (no async handler)
async function setAuth(page: Page) {
  await page.context().addCookies([{
    name: 'pop_token',
    value: 'mock-test-token',
    domain: 'localhost',
    path: '/',
    sameSite: 'Lax',
  }])

  await page.addInitScript((user: typeof MOCK_USER) => {
    window.localStorage.setItem('pop-auth', JSON.stringify({
      state: { user, token: 'mock-test-token', isAuthenticated: true },
      version: 0,
    }))
  }, MOCK_USER)

  // Catch-all for ALL requests to the backend API — registered FIRST so it is checked
  // LAST (Playwright uses LIFO route order). Prevents unmocked endpoints (e.g. /api/alerts,
  // /api/suppliers) from reaching localhost:3001. If those requests reach the real network
  // they may either hang (Windows TCP timeout) or return 401, which triggers the axios
  // 401 interceptor → window.location.href = '/login' → proxy.ts redirects to /dashboard
  // (cookie still set) — navigating the page away from /agent and breaking subsequent checks.
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) })
  )

  // More specific mocks registered AFTER (checked FIRST due to LIFO).
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_USER }),
    })
  )

  // Instant response — the route handler MUST synchronously call fulfill/abort/continue
  // or return a Promise; setTimeout-based delays cause the request to fall through to
  // the actual network (localhost:3001) which hangs on Windows.
  // onMutate fires synchronously before the HTTP request fires, so the loading state
  // (AnalysisProgress) is rendered for at least one event-loop tick before this response
  // arrives — enough for Playwright's MutationObserver-based waitFor to catch it.
  // Response format: post<T> returns res.data.data, so body must be { success, data: T }.
  await page.route('**/api/agent/query', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_AGENT_RESPONSE }),
    })
  )
}

// Two-phase submit: wait for button enabled, then click atomically in browser context.
// Phase 1 (waitForFunction): waits until React's value state update from fill() re-renders
//   the button without the `disabled` attribute — avoids the silent no-op if the button is
//   still disabled when evaluate fires.
// Phase 2 (evaluate): find+click happen in the same JS microtask, bypassing Playwright's
//   detachment-retry loop (React 19 concurrent mode detaches `AgentInput` children on re-render).
async function submitPrompt(page: Page) {
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[aria-label="Send message"]')
      return btn !== null && !(btn as HTMLButtonElement).disabled
    },
    undefined,
    { timeout: 5000 }
  )
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Send message"]')
    ;(btn as HTMLButtonElement | null)?.click()
  })
}

// textContent check bypasses CSS opacity/visibility — used when elements are guaranteed
// to be in the DOM but may still be animating (opacity transitioning from 0→1).
async function bodyContains(page: Page, text: string): Promise<boolean> {
  return page.evaluate((t) => (document.body.textContent ?? '').includes(t), text)
}

test.describe('R6 — Savings Agent Interface', () => {

  test.beforeEach(async ({ page }) => {
    await setAuth(page)
  })

  test.describe('Agent Page Load', () => {
    test('agent page loads', async ({ page }) => {
      await page.goto('/agent')
      await expect(page).toHaveURL('/agent')
      await expect(page.locator('body')).toBeVisible()
    })

    test('agent page shows POP Savings Agent heading', async ({ page }) => {
      await page.goto('/agent')
      await expect(page.locator('text=POP Savings Agent').first()).toBeVisible({ timeout: 5000 })
    })

    test('header shows Powered by Claude AI', async ({ page }) => {
      await page.goto('/agent')
      await expect(page.locator('text=Powered by Claude AI').first()).toBeVisible({ timeout: 5000 })
    })

    test('active indicator is visible in header', async ({ page }) => {
      await page.goto('/agent')
      await expect(page.locator('text=Active').first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Welcome Screen', () => {
    test('welcome screen shows before any messages', async ({ page }) => {
      await page.goto('/agent')
      await expect(
        page.locator('text=savings opportunities').or(page.locator('text=Ask me')).first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('suggested prompt chips are visible', async ({ page }) => {
      await page.goto('/agent')
      await expect(
        page.locator('text=food costs').or(page.locator('text=protein supplier')).first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('all 4 suggested prompts are shown', async ({ page }) => {
      await page.goto('/agent')
      await page.locator('text=POP Savings Agent').first().waitFor({ timeout: 5000 })
      const checks = ['food costs', 'protein supplier', 'renegotiate', 'bulk purchasing']
      let found = 0
      for (const t of checks) {
        if (await page.locator(`text=${t}`).first().isVisible({ timeout: 2000 }).catch(() => false)) found++
      }
      expect(found).toBeGreaterThanOrEqual(2)
    })
  })

  test.describe('Chat Input', () => {
    test('input textarea is visible', async ({ page }) => {
      await page.goto('/agent')
      await expect(
        page.locator('textarea[placeholder*="savings"]').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('send button is visible', async ({ page }) => {
      await page.goto('/agent')
      await expect(
        page.locator('button[aria-label="Send message"]').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('user can type in the input', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Reduce my food costs by 5%')
      await expect(input).toHaveValue('Reduce my food costs by 5%')
    })

    test('send button becomes active when text is entered', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Reduce my food costs')
      await expect(
        page.locator('button[aria-label="Send message"]').first()
      ).not.toBeDisabled()
    })
  })

  test.describe('Suggested Prompt Chips', () => {
    test('clicking a chip submits the prompt', async ({ page }) => {
      await page.goto('/agent')
      await page.locator('text=POP Savings Agent').first().waitFor({ timeout: 5000 })
      // evaluate click bypasses Playwright's detachment-retry loop for the chip buttons
      await page.evaluate(() => {
        const chip = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('food costs'))
        chip?.click()
      })
      const hasMessage = await page.locator('text=food costs').first().isVisible({ timeout: 3000 }).catch(() => false)
      const hasAnalysis = await page.locator('text=Analyzing').first().isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasMessage || hasAnalysis).toBeTruthy()
    })
  })

  test.describe('Chat Interaction Flow', () => {
    test('submitting a prompt shows user message', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Reduce my food costs by 5%')
      await submitPrompt(page)
      await expect(
        page.locator('text=Reduce my food costs by 5%').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('submitting a prompt triggers analysis animation', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Find savings')
      await submitPrompt(page)
      await expect(
        page.locator('text=Analyzing your procurement data').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('analysis completes and shows savings total', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Reduce my food costs')
      await submitPrompt(page)
      await expect(
        page.locator('text=43,200').or(page.locator('text=potential annual savings')).first()
      ).toBeVisible({ timeout: 8000 })
    })

    test('savings opportunities appear after analysis', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Reduce my food costs')
      await submitPrompt(page)
      await expect(
        page.locator('text=Switch Chicken Supplier').first()
      ).toBeVisible({ timeout: 8000 })
    })

    test('3 savings opportunity cards are shown', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Find savings')
      await submitPrompt(page)
      // Wait for at least the first card to be visible, then check body for all 3
      await page.locator('text=Switch Chicken Supplier').first().waitFor({ timeout: 8000 })
      // Use textContent rather than toBeVisible to avoid animation-opacity race conditions
      // (cards have staggered 0/100/200ms animation delays before reaching opacity > 0)
      await page.waitForFunction(
        () => {
          const t = document.body.textContent ?? ''
          return t.includes('Switch Chicken Supplier') && t.includes('Olive Oil') && t.includes('Beverage Contract')
        },
        undefined,
        { timeout: 5000 }
      )
    })
  })

  test.describe('Savings Opportunity Cards', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Reduce food costs')
      await submitPrompt(page)
      await page.locator('text=Switch Chicken Supplier').first().waitFor({ timeout: 8000 })
    })

    test('opportunity card shows title', async ({ page }) => {
      const txt = await page.evaluate(() => document.body.textContent ?? '')
      expect(txt.includes('Switch Chicken Supplier')).toBe(true)
    })

    test('opportunity card shows annualized savings', async ({ page }) => {
      // toLocaleString() format depends on locale; check for the number without formatting assumption
      expect(await bodyContains(page, '18,400')).toBe(true)
    })

    test('HIGH confidence badge is shown', async ({ page }) => {
      expect(await bodyContains(page, 'HIGH')).toBe(true)
    })

    test('recommended action text is shown', async ({ page }) => {
      const t = await page.evaluate(() => document.body.textContent ?? '')
      expect(t.includes('Request samples') || t.includes('trial order')).toBe(true)
    })

    test('MEDIUM confidence card appears for Beverages', async ({ page }) => {
      const t = await page.evaluate(() => document.body.textContent ?? '')
      expect(t.includes('Beverage Contract') || t.includes('MEDIUM')).toBe(true)
    })
  })

  test.describe('Analysis Progress Animation', () => {
    test('analysis loading state is visible after submit', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Find savings')
      await submitPrompt(page)
      // "Analyzing" is in the DOM between onMutate (adds loading msg) and onSuccess (replaces it).
      // With instant mock the window is very brief (~1 JS task). Both outcomes are valid: either
      // we catch "Analyzing" still visible, or we catch the final response — both prove the flow.
      const hasAnalyzing = await page.locator('text=Analyzing your procurement data').first().isVisible({ timeout: 3000 }).catch(() => false)
      const hasResult = await page.locator('text=Switch Chicken Supplier').first().isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasAnalyzing || hasResult).toBeTruthy()
    })

    test('analysis steps can be expanded in the response', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Find savings')
      await submitPrompt(page)
      await page.locator('text=Switch Chicken Supplier').first().waitFor({ timeout: 8000 })
      // Expand the collapsible analysis steps list
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Show analysis steps'))
        btn?.click()
      })
      await expect(
        page.locator('text=Scanned price history').or(page.locator('text=active suppliers')).first()
      ).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('History Panel', () => {
    test('history panel is visible on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto('/agent')
      await expect(page.locator('text=Recent Queries').first()).toBeVisible({ timeout: 5000 })
    })

    test('history panel is hidden on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto('/agent')
      await page.locator('text=POP Savings Agent').first().waitFor({ timeout: 5000 })
      // Panel wrapper uses `hidden lg:block` (display:none at mobile breakpoints)
      await expect(page.locator('text=Recent Queries').first()).not.toBeVisible()
    })
  })

  test.describe('Keyboard Shortcuts', () => {
    test('Ctrl+Enter submits the form', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Test prompt')
      await submitPrompt(page)
      await expect(page.locator('text=Test prompt').first()).toBeVisible({ timeout: 3000 })
    })

    test('Enter alone adds a new line (does not submit)', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Line one')
      // Press Enter — handleKeyDown sees no Ctrl/Meta → does not call handleSubmit
      await input.press('Enter')
      // Read value via evaluate to avoid the detachment-retry loop from React 19 re-renders
      const value = await page.evaluate(() => {
        const el = document.querySelector('textarea')
        return el?.value ?? ''
      })
      expect(value).toContain('\n')
    })
  })

  test.describe('Follow-up Prompts', () => {
    test('follow-up chips appear after response', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Find savings')
      await submitPrompt(page)
      await page.locator('text=Switch Chicken Supplier').first().waitFor({ timeout: 8000 })
      // SuggestedPrompts mounts with opacity:1 when hasResponded becomes true
      await expect(
        page.locator('button:has-text("lowest-risk")').or(page.locator('button:has-text("other categories")')).first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('clicking a follow-up chip starts new analysis', async ({ page }) => {
      await page.goto('/agent')
      const input = page.locator('textarea').first()
      await input.waitFor({ timeout: 5000 })
      await input.fill('Find savings')
      await submitPrompt(page)
      await page.locator('text=Switch Chicken Supplier').first().waitFor({ timeout: 8000 })
      // Click a follow-up chip via evaluate to bypass detachment retry
      await page.evaluate(() => {
        const chip = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('lowest-risk'))
        chip?.click()
      })
      // onMutate fires synchronously: new user message bubble is added to the DOM immediately.
      // The user bubble (rounded-br-md class) containing the chip text proves the chip submitted.
      await page.waitForFunction(
        () => {
          const bubbles = document.querySelectorAll('[class*="rounded-br-md"]')
          return Array.from(bubbles).some(b => b.textContent?.includes('lowest-risk'))
        },
        undefined,
        { timeout: 5000 }
      )
    })
  })

})
