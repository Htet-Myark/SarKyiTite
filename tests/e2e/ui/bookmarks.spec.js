const { test, expect } = require('@playwright/test');
const { ensureUser, FIXTURES, loginWithToken } = require('../helpers');

// One shared user for the whole file.
test.describe('Bookmarks UI', () => {
  let sharedToken, sharedUser;

  test.beforeAll(async ({ request }) => {
    const result = await ensureUser(request, FIXTURES.UI_BM);
    sharedToken = result.token;
    sharedUser = result.user;
  });

  test.beforeEach(async ({ page }) => {
    await loginWithToken(page, sharedToken, sharedUser);
    await page.goto('/dashboard');
    await page.click('.nav-item:has-text("Bookmarks")');
  });

  test('page loads with correct heading and subtitle', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Bookmarks');
    await expect(page.locator('text=Books you\'ve saved for later')).toBeVisible();
  });

  test('shows empty state for a user with no bookmarks', async ({ page }) => {
    await expect(page.locator('text=No bookmarks yet')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Browse the library and bookmark books you\'re interested in')).toBeVisible();
  });

  test('empty state shows bookmark icon', async ({ page }) => {
    await expect(page.locator('.empty-icon')).toContainText('🔖');
  });

  test('sidebar navigation shows Bookmarks link', async ({ page }) => {
    await expect(page.locator('.nav-item', { hasText: 'Bookmarks' })).toBeVisible();
  });

  test('Bookmarks tab becomes active when clicked', async ({ page }) => {
    await expect(page.locator('.nav-item', { hasText: 'Bookmarks' })).toHaveClass(/active/);
    await expect(page.locator('h1')).toContainText('Bookmarks');
  });

  test('switching tabs replaces content (Browse → Bookmarks)', async ({ page }) => {
    // Navigate away first, then back to bookmarks
    await page.click('.nav-item:has-text("Browse Books")');
    await expect(page.locator('h1')).toContainText('Browse Books');

    await page.click('.nav-item:has-text("Bookmarks")');
    await expect(page.locator('h1')).toContainText('Bookmarks');
    await expect(page.locator('h1:has-text("Browse Books")')).not.toBeVisible();
  });

  test('unauthenticated visit redirects to login', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
