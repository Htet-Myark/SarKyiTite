const API_BASE = 'http://localhost:5000/api';
const TEST_PREFIX = 'testpw_';

// ─────────────────────────────────────────────────────
// PERMANENT FIXTURE USERS
// Created once on the first run, then just logged-in on every subsequent run.
// Each spec file gets its own fixture so state doesn't bleed across files.
// ─────────────────────────────────────────────────────
const FIXTURES = {
  AUTH:    { username: 'testpw_f_auth',   email: 'testpw_f_auth@test.com',   password: 'Fixture123' },
  REQ_A:   { username: 'testpw_f_reqa',   email: 'testpw_f_reqa@test.com',   password: 'Fixture123' },
  REQ_B:   { username: 'testpw_f_reqb',   email: 'testpw_f_reqb@test.com',   password: 'Fixture123' },
  BM:      { username: 'testpw_f_bm',     email: 'testpw_f_bm@test.com',     password: 'Fixture123' },
  UI_AUTH: { username: 'testpw_f_uiauth', email: 'testpw_f_uiauth@test.com', password: 'Fixture123' },
  UI_REQ:  { username: 'testpw_f_uireq',  email: 'testpw_f_uireq@test.com',  password: 'Fixture123' },
  UI_BM:   { username: 'testpw_f_uibm',   email: 'testpw_f_uibm@test.com',   password: 'Fixture123' },
};

// Login if user already exists, register only on first run.
async function ensureUser(request, creds) {
  const { username, email, password } = creds;
  const loginRes = await request.post(`${API_BASE}/auth/login`, { data: { username, password } });
  if (loginRes.ok()) {
    const body = await loginRes.json();
    return { token: body.token, user: body.user, ...creds };
  }
  const registerRes = await request.post(`${API_BASE}/auth/register`, { data: { username, email, password } });
  const body = await registerRes.json();
  return { token: body.token, user: body.user, ...creds };
}

// One-off random user — only use this when the test genuinely needs a brand-new account
// (e.g. testing registration itself, or testing an empty-list state).
const uid = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function createUser(request) {
  const id = uid();
  const userData = {
    username: `${TEST_PREFIX}${id}`,
    email: `${TEST_PREFIX}${id}@test.com`,
    password: 'password123',
  };
  const res = await request.post(`${API_BASE}/auth/register`, { data: userData });
  const body = await res.json();
  return { ...userData, token: body.token, user: body.user };
}

// Sets localStorage so the React app treats the page as authenticated
async function loginToApp(page, request) {
  const { token, user, ...rest } = await createUser(request);
  await page.goto('/login');
  await page.evaluate(
    ({ t, u }) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); },
    { t: token, u: user }
  );
  return { token, user, ...rest };
}

async function loginWithToken(page, token, user) {
  await page.goto('/login');
  await page.evaluate(
    ({ t, u }) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); },
    { t: token, u: user }
  );
}

module.exports = { API_BASE, TEST_PREFIX, FIXTURES, uid, ensureUser, createUser, loginToApp, loginWithToken };
