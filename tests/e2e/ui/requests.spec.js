const { test, expect } = require('@playwright/test');
const { createUser, ensureUser, FIXTURES, loginWithToken } = require('../helpers');

const TITLE_INPUT = 'input[placeholder="Enter the book title you\'d like"]';
const MSG_INPUT = 'textarea[placeholder="Why would you like this book? Any details..."]';
const SUBMIT_BTN = 'button:has-text("Submit Request")';
const SUCCESS_MSG = 'text=Request submitted successfully!';

// One shared user for the whole file.
// "shows empty state" MUST stay first — it runs before any request is submitted.
test.describe('Book Requests UI', () => {
  let sharedToken, sharedUser;

  test.beforeAll(async ({ request }) => {
    const result = await ensureUser(request, FIXTURES.UI_REQ);
    sharedToken = result.token;
    sharedUser = result.user;
  });

  test.beforeEach(async ({ page }) => {
    await loginWithToken(page, sharedToken, sharedUser);
    await page.goto('/dashboard');
    await page.click('button:has-text("Book Requests")');
  });

  test('page loads with New Request form visible', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Book Requests');
    await expect(page.locator(TITLE_INPUT)).toBeVisible();
    await expect(page.locator(MSG_INPUT)).toBeVisible();
    await expect(page.locator(SUBMIT_BTN)).toBeVisible();
  });

  // Uses a fresh user so this always sees an empty list regardless of previous runs
  test('shows empty state when user has no requests', async ({ page, request }) => {
    const { token, user } = await createUser(request);
    await loginWithToken(page, token, user);
    await page.goto('/dashboard');
    await page.click('button:has-text("Book Requests")');
    await expect(page.locator('text=No requests yet')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Submit a request above to get started')).toBeVisible();
  });

  test('submits a new book request and shows success message', async ({ page }) => {
    await page.fill(TITLE_INPUT, 'The Great Gatsby');
    await page.fill(MSG_INPUT, 'A classic novel I have always wanted to read.');
    await page.click(SUBMIT_BTN);
    await expect(page.locator(SUCCESS_MSG)).toBeVisible({ timeout: 5000 });
  });

  test('submitted request appears in the list with Pending status', async ({ page }) => {
    await page.fill(TITLE_INPUT, 'Dune');
    await page.fill(MSG_INPUT, 'Science fiction masterpiece.');
    await page.click(SUBMIT_BTN);
    await expect(page.locator(SUCCESS_MSG)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Dune').first()).toBeVisible();
    await expect(page.locator('text=Pending').first()).toBeVisible();
  });

  test('clears the form after successful submission', async ({ page }) => {
    await page.fill(TITLE_INPUT, '1984');
    await page.fill(MSG_INPUT, 'A dystopian classic.');
    await page.click(SUBMIT_BTN);
    await expect(page.locator(SUCCESS_MSG)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(TITLE_INPUT)).toHaveValue('');
    await expect(page.locator(MSG_INPUT)).toHaveValue('');
  });

  test('shows error when the API returns a server error', async ({ page }) => {
    await page.route('http://localhost:5000/api/requests', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal server error' }),
        });
      } else {
        await route.continue();
      }
    });
    await page.fill(TITLE_INPUT, 'Error Test Book');
    await page.fill(MSG_INPUT, 'This request will fail.');
    await page.click(SUBMIT_BTN);
    await expect(page.locator('.error-msg')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-msg')).toContainText('Internal server error');
    await expect(page.locator(SUCCESS_MSG)).not.toBeVisible();
  });

  test('can edit a pending request', async ({ page }) => {
    await page.fill(TITLE_INPUT, 'Original Title');
    await page.fill(MSG_INPUT, 'Original message');
    await page.click(SUBMIT_BTN);
    await expect(page.locator(SUCCESS_MSG)).toBeVisible({ timeout: 5000 });

    await page.locator('button[title="Edit"]').first().click();
    const card = page.locator('.card').nth(1); // nth(0) = form card, nth(1) = newest request
    await card.locator('input').fill('Updated Title');
    await card.locator('button:has-text("Save")').click();
    await expect(page.locator('text=Updated Title').first()).toBeVisible({ timeout: 5000 });
  });

 

  test('can delete a request', async ({ page }) => {
    await page.fill(TITLE_INPUT, 'Book to Delete');
    await page.fill(MSG_INPUT, 'This will be removed.');
    await page.click(SUBMIT_BTN);
    await expect(page.locator(SUCCESS_MSG)).toBeVisible({ timeout: 5000 });

    // Wait for the refetch to finish before counting
    await page.waitForLoadState('networkidle');
    const countBefore = await page.locator('text=Book to Delete').count();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('button[title="Delete"]').first().click();
    await expect(page.locator('text=Book to Delete')).toHaveCount(countBefore - 1, { timeout: 5000 });
  });

  test('dismissing the delete confirm dialog keeps the request', async ({ page }) => {
    await page.fill(TITLE_INPUT, 'Kept Book');
    await page.fill(MSG_INPUT, 'Should stay.');
    await page.click(SUBMIT_BTN);
    await expect(page.locator(SUCCESS_MSG)).toBeVisible({ timeout: 5000 });

    await page.waitForLoadState('networkidle');
    const countBefore = await page.locator('text=Kept Book').count();
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('button[title="Delete"]').first().click();
    // Count must not decrease — dialog was dismissed
    await expect(page.locator('text=Kept Book')).toHaveCount(countBefore);
  });

  test('unauthenticated visit to /dashboard redirects to login', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
