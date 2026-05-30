const { test, expect } = require('@playwright/test');
const { API_BASE, createUser, ensureUser, FIXTURES } = require('../helpers');

// Permanent fixture users — reused across runs. Only the inline empty-list test creates a fresh one.
test.describe('Book Requests API', () => {
  let userA, userB;

  test.beforeAll(async ({ request }) => {
    [userA, userB] = await Promise.all([
      ensureUser(request, FIXTURES.REQ_A),
      ensureUser(request, FIXTURES.REQ_B),
    ]);
  });

  // ─────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────
  test.describe('POST /api/requests', () => {
    test('201 — creates request with valid data', async ({ request }) => {
      const res = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'The Great Gatsby', message: 'A classic I would love to read.' },
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.bookTitle).toBe('The Great Gatsby');
      expect(body.status).toBe('pending');
    });

    test('400 — missing bookTitle', async ({ request }) => {
      const res = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { message: 'No title provided' },
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).message).toBe('Book title and message are required');
    });

    test('400 — missing message', async ({ request }) => {
      const res = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'Some Book' },
      });
      expect(res.status()).toBe(400);
    });

    test('400 — whitespace-only bookTitle rejected', async ({ request }) => {
      const res = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: '   ', message: 'Valid message' },
      });
      expect(res.status()).toBe(400);
    });

    test('400 — whitespace-only message rejected', async ({ request }) => {
      const res = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'Valid Book', message: '   ' },
      });
      expect(res.status()).toBe(400);
    });

    test('401 — no authentication', async ({ request }) => {
      const res = await request.post(`${API_BASE}/requests`, {
        data: { bookTitle: 'Some Book', message: 'Some message' },
      });
      expect(res.status()).toBe(401);
    });
  });

  // ─────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────
  test.describe('GET /api/requests/my', () => {
    test('200 — returns empty array for a brand-new user', async ({ request }) => {
      // Fresh user created inline — only test that truly needs a clean slate
      const { token } = await createUser(request);
      const res = await request.get(`${API_BASE}/requests/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    test('200 — returns only the authenticated user\'s own requests', async ({ request }) => {
      // Create one request each so both users have data
      await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'UserA Book', message: 'UserA message' },
      });
      await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userB.token}` },
        data: { bookTitle: 'UserB Book', message: 'UserB message' },
      });

      const resA = await request.get(`${API_BASE}/requests/my`, {
        headers: { Authorization: `Bearer ${userA.token}` },
      });
      const bodyA = await resA.json();
      expect(bodyA.every(r => r.userSnapshot.username === userA.username)).toBe(true);

      const resB = await request.get(`${API_BASE}/requests/my`, {
        headers: { Authorization: `Bearer ${userB.token}` },
      });
      const bodyB = await resB.json();
      expect(bodyB.every(r => r.userSnapshot.username === userB.username)).toBe(true);
    });

    test('401 — no authentication', async ({ request }) => {
      const res = await request.get(`${API_BASE}/requests/my`);
      expect(res.status()).toBe(401);
    });
  });

  // ─────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────
  test.describe('PUT /api/requests/:id', () => {
    test('200 — edits a pending request', async ({ request }) => {
      const createRes = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'Original Title', message: 'Original message' },
      });
      const { _id } = await createRes.json();

      const res = await request.put(`${API_BASE}/requests/${_id}`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'Updated Title', message: 'Updated message' },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.bookTitle).toBe('Updated Title');
      expect(body.message).toBe('Updated message');
    });

    test('200 — partial update (only bookTitle)', async ({ request }) => {
      const createRes = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'Original', message: 'Keep this message' },
      });
      const { _id } = await createRes.json();

      const res = await request.put(`${API_BASE}/requests/${_id}`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'New Title' },
      });
      expect(res.status()).toBe(200);
      expect((await res.json()).bookTitle).toBe('New Title');
    });

    test('404 — cannot edit another user\'s request', async ({ request }) => {
      const createRes = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'UserA Book', message: 'UserA message' },
      });
      const { _id } = await createRes.json();

      const res = await request.put(`${API_BASE}/requests/${_id}`, {
        headers: { Authorization: `Bearer ${userB.token}` },
        data: { bookTitle: 'Hijacked Title' },
      });
      expect(res.status()).toBe(404);
    });

    test('401 — no authentication', async ({ request }) => {
      const res = await request.put(`${API_BASE}/requests/000000000000000000000001`, {
        data: { bookTitle: 'Ignored' },
      });
      expect(res.status()).toBe(401);
    });
  });

  // ─────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────
  test.describe('DELETE /api/requests/:id', () => {
    test('200 — deletes own request', async ({ request }) => {
      const createRes = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'To Delete', message: 'Will be removed' },
      });
      const { _id } = await createRes.json();

      const res = await request.delete(`${API_BASE}/requests/${_id}`, {
        headers: { Authorization: `Bearer ${userA.token}` },
      });
      expect(res.status()).toBe(200);
      expect((await res.json()).message).toBe('Request deleted');
    });

    test('404 — cannot delete another user\'s request', async ({ request }) => {
      const createRes = await request.post(`${API_BASE}/requests`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { bookTitle: 'Protected', message: 'Protected message' },
      });
      const { _id } = await createRes.json();

      const res = await request.delete(`${API_BASE}/requests/${_id}`, {
        headers: { Authorization: `Bearer ${userB.token}` },
      });
      expect(res.status()).toBe(404);
    });

    test('401 — no authentication', async ({ request }) => {
      const res = await request.delete(`${API_BASE}/requests/000000000000000000000001`);
      expect(res.status()).toBe(401);
    });
  });

  // ─────────────────────────────────────────
  // ADMIN ACCESS CONTROL
  // ─────────────────────────────────────────
  test.describe('Admin routes — access control', () => {
    test('403 — regular user cannot GET /admin/all', async ({ request }) => {
      const res = await request.get(`${API_BASE}/requests/admin/all`, {
        headers: { Authorization: `Bearer ${userA.token}` },
      });
      expect(res.status()).toBe(403);
      expect((await res.json()).message).toBe('Admin access required');
    });

    test('401 — unauthenticated GET /admin/all', async ({ request }) => {
      const res = await request.get(`${API_BASE}/requests/admin/all`);
      expect(res.status()).toBe(401);
    });

    test('403 — regular user cannot POST /admin/:id/reply', async ({ request }) => {
      const res = await request.post(`${API_BASE}/requests/admin/000000000000000000000001/reply`, {
        headers: { Authorization: `Bearer ${userA.token}` },
        data: { reply: 'Some reply' },
      });
      expect(res.status()).toBe(403);
    });

    test('401 — unauthenticated POST /admin/:id/reply', async ({ request }) => {
      const res = await request.post(`${API_BASE}/requests/admin/000000000000000000000001/reply`, {
        data: { reply: 'Some reply' },
      });
      expect(res.status()).toBe(401);
    });
  });
});
