const { test, expect } = require('@playwright/test');
const { API_BASE, uid, createUser, ensureUser, FIXTURES } = require('../helpers');

// Uses a permanent fixture user — only the register-success test creates an extra one.
test.describe('Auth API', () => {
  let shared;

  test.beforeAll(async ({ request }) => {
    shared = await ensureUser(request, FIXTURES.AUTH);
  });

  // ─────────────────────────────────────────
  // REGISTRATION
  // ─────────────────────────────────────────
  test.describe('POST /api/auth/register', () => {
    test('201 — creates account and returns token + user', async ({ request }) => {
      const id = uid();
      const res = await request.post(`${API_BASE}/auth/register`, {
        data: { username: `testpw_${id}`, email: `testpw_${id}@test.com`, password: 'password123' },
      });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.token).toBeDefined();
      expect(body.user.role).toBe('user');
      expect(body.user.password).toBeUndefined();
    });

    test('400 — missing required fields', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/register`, {
        data: { username: 'onlyusername' },
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).message).toBe('All fields required');
    });

    test('400 — empty body', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/register`, { data: {} });
      expect(res.status()).toBe(400);
    });

    test('409 — duplicate username (reuses shared user)', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/register`, {
        data: { username: shared.username, email: `other_${uid()}@test.com`, password: 'password123' },
      });
      expect(res.status()).toBe(409);
      expect((await res.json()).message).toBe('Username or email already taken');
    });

    test('409 — duplicate email (reuses shared user)', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/register`, {
        data: { username: `other_${uid()}`, email: shared.email, password: 'password123' },
      });
      expect(res.status()).toBe(409);
    });

    test('400+ — password shorter than 6 characters rejected', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/register`, {
        data: { username: `testpw_${uid()}`, email: `testpw_${uid()}@test.com`, password: '123' },
      });
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });
  });

  // ─────────────────────────────────────────
  // LOGIN  (all 6 tests reuse shared user — no beforeEach)
  // ─────────────────────────────────────────
  test.describe('POST /api/auth/login', () => {
    test('200 — valid credentials return token', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/login`, {
        data: { username: shared.username, password: shared.password },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.token).toBeDefined();
      expect(body.user.username).toBe(shared.username);
    });

    test('401 — wrong password', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/login`, {
        data: { username: shared.username, password: 'wrongpassword' },
      });
      expect(res.status()).toBe(401);
      expect((await res.json()).message).toBe('Invalid credentials');
    });

    test('401 — non-existent username', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/login`, {
        data: { username: 'ghost_user_xyz', password: shared.password },
      });
      expect(res.status()).toBe(401);
      expect((await res.json()).message).toBe('Invalid credentials');
    });

    test('400 — missing password', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/login`, {
        data: { username: shared.username },
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).message).toBe('Username and password required');
    });

    test('400 — missing username', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/login`, {
        data: { password: shared.password },
      });
      expect(res.status()).toBe(400);
    });

    test('400 — empty body', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/login`, { data: {} });
      expect(res.status()).toBe(400);
    });
  });

  // ─────────────────────────────────────────
  // GET /me  (reuses shared user token)
  // ─────────────────────────────────────────
  test.describe('GET /api/auth/me', () => {
    test('200 — returns user data without password', async ({ request }) => {
      const res = await request.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${shared.token}` },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.username).toBe(shared.username);
      expect(body.password).toBeUndefined();
      expect(typeof body.unreadWarnings).toBe('number');
    });

    test('401 — no Authorization header', async ({ request }) => {
      const res = await request.get(`${API_BASE}/auth/me`);
      expect(res.status()).toBe(401);
      expect((await res.json()).message).toBe('Not authorized');
    });

    test('401 — malformed Authorization header', async ({ request }) => {
      const res = await request.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: 'token_without_bearer_prefix' },
      });
      expect(res.status()).toBe(401);
    });

    test('401 — invalid JWT token', async ({ request }) => {
      const res = await request.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: 'Bearer this.is.not.valid' },
      });
      expect(res.status()).toBe(401);
      expect((await res.json()).message).toBe('Invalid token');
    });
  });

  // ─────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────
  test.describe('POST /api/auth/forgot-password', () => {
    test('200 — registered email returns generic success', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/forgot-password`, {
        data: { email: shared.email },
      });
      expect(res.status()).toBe(200);
      expect((await res.json()).message).toMatch(/If that email exists/);
    });

    test('200 — unregistered email returns same message (prevents enumeration)', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/forgot-password`, {
        data: { email: 'definitely_not_registered_xyz@nowhere.com' },
      });
      expect(res.status()).toBe(200);
      expect((await res.json()).message).toMatch(/If that email exists/);
    });

    test('400 — missing email field', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/forgot-password`, { data: {} });
      expect(res.status()).toBe(400);
      expect((await res.json()).message).toBe('Email is required');
    });
  });

  // ─────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────
  test.describe('POST /api/auth/reset-password', () => {
    test('400 — invalid reset token', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/reset-password`, {
        data: { token: 'completely-fake-token-abc123', password: 'newpassword123' },
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).message).toMatch(/invalid or has expired/i);
    });

    test('400 — new password shorter than 6 characters', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/reset-password`, {
        data: { token: 'sometoken', password: '123' },
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).message).toMatch(/at least 6/i);
    });

    test('400 — missing token', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/reset-password`, {
        data: { password: 'newpassword123' },
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).message).toBe('Token and new password are required');
    });

    test('400 — missing password', async ({ request }) => {
      const res = await request.post(`${API_BASE}/auth/reset-password`, {
        data: { token: 'sometoken' },
      });
      expect(res.status()).toBe(400);
    });
  });
});
