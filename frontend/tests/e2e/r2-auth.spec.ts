import { test, expect } from '@playwright/test'

test.describe('R2 — Authentication', () => {

  test.describe('Login Page UI', () => {
    test('login page renders correctly', async ({ page }) => {
      await page.goto('/login')
      await expect(page.locator('text=Welcome back').or(page.locator('text=Sign in')).first()).toBeVisible()
    })

    test('login page has email input', async ({ page }) => {
      await page.goto('/login')
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    })

    test('login page has password input', async ({ page }) => {
      await page.goto('/login')
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
    })

    test('login page has submit button', async ({ page }) => {
      await page.goto('/login')
      await expect(page.locator('button[type="submit"], button:has-text("Sign In")')).toBeVisible()
    })

    test('login page has link to signup', async ({ page }) => {
      await page.goto('/login')
      await expect(page.locator('a[href="/signup"]').or(page.locator('text=Sign up')).first()).toBeVisible()
    })

    test('login page has Demo Login button', async ({ page }) => {
      await page.goto('/login')
      await expect(page.locator('text=Demo').first()).toBeVisible()
    })
  })

  test.describe('Login Form Validation', () => {
    test('submitting empty form shows validation errors', async ({ page }) => {
      await page.goto('/login')
      await page.locator('button[type="submit"], button:has-text("Sign In")').click()
      // Should show error messages
      await expect(page.locator('text=email, text=required, text=Invalid').first()).toBeVisible({ timeout: 3000 })
        .catch(() => {
          // Alternative: check for any red/error text
          return expect(page.locator('[class*="red"], [class*="error"]').first()).toBeVisible()
        })
    })

    test('invalid email format shows error', async ({ page }) => {
      await page.goto('/login')
      await page.locator('input[type="email"], input[name="email"]').fill('notanemail')
      await page.locator('button[type="submit"], button:has-text("Sign In")').click()
      await expect(page.locator('text=Invalid email').or(page.locator('text=valid email')).first()).toBeVisible({ timeout: 3000 })
    })

    test('short password shows error', async ({ page }) => {
      await page.goto('/login')
      await page.locator('input[type="email"], input[name="email"]').fill('test@example.com')
      await page.locator('input[type="password"], input[name="password"]').fill('abc')
      await page.locator('button[type="submit"], button:has-text("Sign In")').click()
      await expect(page.locator('text=8 characters').or(page.locator('text=Password must')).first()).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Password Toggle', () => {
    test('password is hidden by default', async ({ page }) => {
      await page.goto('/login')
      const passwordInput = page.locator('input[name="password"]')
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('password show/hide toggle works', async ({ page }) => {
      await page.goto('/login')
      await page.locator('input[name="password"]').fill('testpassword')
      // Click the eye toggle button
      const toggleBtn = page.locator('button[aria-label*="password"], button:near(input[name="password"])').first()
      await toggleBtn.click()
      // Password should now be visible
      await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text')
    })
  })

  test.describe('Demo Login', () => {
    test('demo login button pre-fills email', async ({ page }) => {
      await page.goto('/login')
      await page.locator('text=Demo').first().click()
      const emailInput = page.locator('input[type="email"], input[name="email"]')
      await expect(emailInput).toHaveValue(/demo@/)
    })

    test('demo login button pre-fills password', async ({ page }) => {
      await page.goto('/login')
      await page.locator('text=Demo').first().click()
      const passwordInput = page.locator('input[name="password"]')
      const value = await passwordInput.inputValue()
      expect(value.length).toBeGreaterThan(0)
    })
  })

  test.describe('Signup Page UI', () => {
    test('signup page renders correctly', async ({ page }) => {
      await page.goto('/signup')
      await expect(
        page.locator('text=Create account').or(page.locator('text=Sign up')).or(page.locator('text=Get started')).first()
      ).toBeVisible()
    })

    test('signup page has name input', async ({ page }) => {
      await page.goto('/signup')
      await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible()
    })

    test('signup page has email input', async ({ page }) => {
      await page.goto('/signup')
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    })

    test('signup page has password input', async ({ page }) => {
      await page.goto('/signup')
      await expect(page.locator('input[name="password"]')).toBeVisible()
    })

    test('signup page has confirm password input', async ({ page }) => {
      await page.goto('/signup')
      await expect(page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]')).toBeVisible()
    })

    test('signup page has role selector', async ({ page }) => {
      await page.goto('/signup')
      await expect(page.locator('select[name="role"], [role="combobox"]').first()).toBeVisible()
    })

    test('signup page has link back to login', async ({ page }) => {
      await page.goto('/signup')
      await expect(page.locator('a[href="/login"]').or(page.locator('text=Sign in')).first()).toBeVisible()
    })
  })

  test.describe('Signup Validation', () => {
    test('password mismatch shows error', async ({ page }) => {
      await page.goto('/signup')
      await page.locator('input[name="name"]').fill('Test User')
      await page.locator('input[type="email"]').fill('test@example.com')
      await page.locator('select[name="role"]').selectOption('procurement_manager')
      await page.locator('input[name="password"]').fill('password123')
      await page.locator('input[name="confirmPassword"]').fill('differentpassword')
      await page.locator('button[type="submit"]').click()
      await expect(page.locator('text=Passwords do not match').or(page.locator('text=match')).first()).toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('Navigation Between Auth Pages', () => {
    test('login → signup navigation works', async ({ page }) => {
      await page.goto('/login')
      await page.locator('a[href="/signup"]').click()
      await expect(page).toHaveURL('/signup')
    })

    test('signup → login navigation works', async ({ page }) => {
      await page.goto('/signup')
      await page.locator('a[href="/login"]').click()
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('Protected Routes', () => {
    test('accessing /dashboard without token redirects to login', async ({ page }) => {
      // Clear any existing auth
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.removeItem('pop_token')
        document.cookie = 'pop_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      })
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/login/)
    })

    test('accessing /suppliers without token redirects to login', async ({ page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.removeItem('pop_token')
        document.cookie = 'pop_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      })
      await page.goto('/suppliers')
      await expect(page).toHaveURL(/\/login/)
    })

    test('authenticated user accessing /login redirects to /dashboard', async ({ page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pop_token', 'mock-valid-token')
        document.cookie = 'pop_token=mock-valid-token; path=/'
      })
      await page.goto('/login')
      await expect(page).toHaveURL(/\/dashboard/)
    })
  })

  test.describe('Auth State Persistence', () => {
    test('token persists in localStorage after page reload', async ({ page }) => {
      await page.goto('/login')
      await page.evaluate(() => {
        localStorage.setItem('pop_token', 'test-token-value')
      })
      await page.reload()
      const token = await page.evaluate(() => localStorage.getItem('pop_token'))
      expect(token).toBe('test-token-value')
    })
  })

})
