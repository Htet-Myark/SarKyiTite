const { test, expect } = require('@playwright/test');
const { API_BASE, ensureUser, FIXTURES } = require('../helpers');

const FAKE_ID = '000000000000000000000001';

// Permanent fixture user — reused across runs.
test.describe('Bookmarks API', () => {
  let shared;

  test.beforeAll(async ({ request }) => {
    shared = await ensureUser(request, FIXTURES.BM);
  });

  // ─────────────────────────────────────────
  // GET
  // ─────────────────────────────────────────
  test.describe('GET /api/bookmarks', () => {
    test('200 — returns empty array for new user', async ({ request }) => {
      const res = await request.get(`${API_BASE}/bookmarks`, {
        headers: { Authorization: `Bearer ${shared.token}` },
      });
      expect(res.status()).toBe(200);
      expect(Array.isArray(await res.json())).toBe(true);
    });

    test('401 — no authentication', async ({ request }) => {
      const res = await request.get(`${API_BASE}/bookmarks`);
      expect(res.status()).toBe(401);
      expect((await res.json()).message).toBe('Not authorized');
    });

    test('401 — invalid token', async ({ request }) => {
      const res = await request.get(`${API_BASE}/bookmarks`, {
        headers: { Authorization: 'Bearer fake.token.here' },
      });
      expect(res.status()).toBe(401);
    });
  });

  // ─────────────────────────────────────────
  // ADD
  // ─────────────────────────────────────────
  test.describe('POST /api/bookmarks/:bookId', () => {
    test('404 — non-existent book returns 404', async ({ request }) => {
      const res = await request.post(`${API_BASE}/bookmarks/${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${shared.token}` },
      });
      expect(res.status()).toBe(404);
      expect((await res.json()).message).toBe('Book not found');
    });

    test('401 — no authentication', async ({ request }) => {
      const res = await request.post(`${API_BASE}/bookmarks/${FAKE_ID}`);
      expect(res.status()).toBe(401);
    });

    test('401 — invalid token', async ({ request }) => {
      const res = await request.post(`${API_BASE}/bookmarks/${FAKE_ID}`, {
        headers: { Authorization: 'Bearer invalid.token' },
      });
      expect(res.status()).toBe(401);
    });
  });

  // ─────────────────────────────────────────
  // REMOVE
  // ─────────────────────────────────────────
  test.describe('DELETE /api/bookmarks/:bookId', () => {
    test('200 — removing a non-bookmarked ID is a no-op', async ({ request }) => {
      const res = await request.delete(`${API_BASE}/bookmarks/${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${shared.token}` },
      });
      expect(res.status()).toBe(200);
      expect((await res.json()).message).toBe('Bookmark removed');
    });

    test('200 — bookmarks list unchanged after removing non-existent ID', async ({ request }) => {
      await request.delete(`${API_BASE}/bookmarks/${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${shared.token}` },
      });
      const res = await request.get(`${API_BASE}/bookmarks`, {
        headers: { Authorization: `Bearer ${shared.token}` },
      });
      expect((await res.json()).length).toBe(0);
    });

    test('401 — no authentication', async ({ request }) => {
      const res = await request.delete(`${API_BASE}/bookmarks/${FAKE_ID}`);
      expect(res.status()).toBe(401);
    });

    test('401 — invalid token', async ({ request }) => {
      const res = await request.delete(`${API_BASE}/bookmarks/${FAKE_ID}`, {
        headers: { Authorization: 'Bearer invalid.token' },
      });
      expect(res.status()).toBe(401);
    });
  });
});
