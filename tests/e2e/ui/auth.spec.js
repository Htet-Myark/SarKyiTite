const { test, expect } = require('@playwright/test');
const { uid, ensureUser, FIXTURES, loginWithToken } = require('../helpers');

// Permanent fixture user — reused across runs. The register-success test still creates one extra.
test.describe('Auth UI', () => {
  let shared;

  test.beforeAll(async ({ request }) => {
    shared = await ensureUser(request, FIXTURES.UI_AUTH);
  });

  // ─────────────────────────────────────────
  // LOGIN PAGE
  // ─────────────────────────────────────────
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('renders all form elements', async ({ page }) => {
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toHaveText('Sign In');
    });

    test('has links to register and forgot-password pages', async ({ page }) => {
      await expect(page.locator('a[href="/register"]')).toBeVisible();
      await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
    });

    test('shows error message for wrong credentials', async ({ page }) => {
      await page.fill('input[name="username"]', 'nonexistentuser');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-msg')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.error-msg')).toContainText('Invalid credentials');
    });

    test('shows error for wrong password on existing account', async ({ page }) => {
      await page.fill('input[name="username"]', shared.username);
      await page.fill('input[name="password"]', 'thisiswrong');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-msg')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.error-msg')).toContainText('Invalid credentials');
    });

    test('submit button shows loading state while signing in', async ({ page }) => {
      await page.fill('input[name="username"]', shared.username);
      await page.fill('input[name="password"]', shared.password);
      await page.route(`**/api/auth/login`, async route => {
        await new Promise(r => setTimeout(r, 500));
        await route.continue();
      });
      const submitBtn = page.locator('button[type="submit"]');
      const clickDone = submitBtn.click();
      await expect(submitBtn).toBeDisabled({ timeout: 2000 });
      await expect(submitBtn).toHaveText('Signing in...');
      await clickDone;
    });

    test('redirects to /dashboard after successful login', async ({ page }) => {
      await page.fill('input[name="username"]', shared.username);
      await page.fill('input[name="password"]', shared.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    });

    test('navigates to register page via link', async ({ page }) => {
      await page.click('a[href="/register"]');
      await expect(page).toHaveURL(/register/);
    });

    test('navigates to forgot-password page via link', async ({ page }) => {
      await page.click('a[href="/forgot-password"]');
      await expect(page).toHaveURL(/forgot-password/);
    });
  });

  // ─────────────────────────────────────────
  // REGISTER PAGE
  // ─────────────────────────────────────────
  test.describe('Register Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('renders all four form fields', async ({ page }) => {
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirm"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toHaveText('Create Account');
    });

    test('shows error when passwords do not match', async ({ page }) => {
      const id = uid();
      await page.fill('input[name="username"]', `testpw_${id}`);
      await page.fill('input[name="email"]', `testpw_${id}@test.com`);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirm"]', 'differentpass');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-msg')).toContainText('Passwords do not match');
    });

    test('shows error when password is shorter than 6 characters', async ({ page }) => {
      const id = uid();
      await page.fill('input[name="username"]', `testpw_${id}`);
      await page.fill('input[name="email"]', `testpw_${id}@test.com`);
      await page.fill('input[name="password"]', '123');
      await page.fill('input[name="confirm"]', '123');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-msg')).toContainText('at least 6 characters');
    });

    test('shows error for duplicate username (reuses shared user)', async ({ page }) => {
      const id = uid();
      await page.fill('input[name="username"]', shared.username);
      await page.fill('input[name="email"]', `testpw_new${id}@test.com`);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirm"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-msg')).toContainText('already taken', { timeout: 5000 });
    });

    test('creates account and redirects to /dashboard', async ({ page }) => {
      const id = uid();
      await page.fill('input[name="username"]', `testpw_${id}`);
      await page.fill('input[name="email"]', `testpw_${id}@test.com`);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirm"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    });

    test('has link back to login page', async ({ page }) => {
      await page.click('a[href="/login"]');
      await expect(page).toHaveURL(/login/);
    });
  });
});
