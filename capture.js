/**
 * capture.js
 * Captures full-page screenshots of all frontend pages and Swagger UI endpoint groups.
 * Apply all CLAUDE.md lessons: waitForFunction (not waitForNavigation),
 * text-content Swagger expansion, 3500ms Swagger wait, fixed auth screenshot names.
 */
require('dotenv').config();
const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

const FRONTEND   = `http://localhost:${process.env.VITE_PORT || 5173}`;
const BACKEND    = process.env.BACKEND_URL  || 'http://localhost:8001';
const SWAGGER    = process.env.SWAGGER_URL  || 'http://localhost:8001/docs';
const ADMIN_EMAIL    = process.env.DEMO_ADMIN_EMAIL    || 'demo_admin@example.com';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'DemoAdmin@123';

const SS_DIR         = path.join(__dirname, 'screenshots');
const SWAGGER_SS_DIR = path.join(__dirname, 'screenshots', 'swagger');

// Exact tag names read from backend router files (tags=[...] parameter)
const SWAGGER_TAGS = [
  'Auth',
  'Users',
  'Complaints',
  'Categories',
  'Feedback',
  'Notifications',
  'Dashboard',
  'Analytics',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureDirs() {
  [SS_DIR, SWAGGER_SS_DIR].forEach(d => {
    if (!fs.existsSync(d)) { fs.mkdirSync(d, { recursive: true }); console.log(`  + Created ${d}`); }
  });
}

async function waitMs(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshot(page, file, label) {
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  ✓ ${label} → ${path.relative(__dirname, file)}`);
}

// Get admin Bearer token via API (Node.js fetch, not Puppeteer)
async function getAdminToken() {
  const res = await fetch(`${BACKEND}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Admin login failed: ${res.status} — is the backend running on ${BACKEND}?`);
  const { access_token } = await res.json();
  return access_token;
}

// Get first complaint ID from API
async function getFirstComplaintId(token) {
  const res = await fetch(`${BACKEND}/api/complaints/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0].complaint_id : null;
}

// Login via Puppeteer form (SPA-safe: uses waitForFunction, not waitForNavigation)
async function puppeteerLogin(page, email, password) {
  await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitMs(600);

  await page.type('input[type="email"]',    email,    { delay: 30 });
  await page.type('input[type="password"]', password, { delay: 30 });

  await Promise.all([
    page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 30000 }
    ),
    page.click('button.btn-primary'),
  ]);
  await waitMs(1500); // let charts/data load after navigation
}

// ── Frontend Page Screenshots ─────────────────────────────────────────────────

async function capturePages(browser, token) {
  const complaintId = await getFirstComplaintId(token);
  if (!complaintId) console.warn('  ⚠ No complaint found — detail page will show error state');

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // ── Pre-login pages ──
  console.log('\n── Pre-login pages ──');

  await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' });
  await waitMs(600);
  await screenshot(page, path.join(SS_DIR, '01-login.png'), 'Login');

  await page.goto(`${FRONTEND}/register`, { waitUntil: 'domcontentloaded' });
  await waitMs(600);
  await screenshot(page, path.join(SS_DIR, '02-register.png'), 'Register');

  // ── Login as Admin ──
  console.log('\n── Logging in as Admin ──');
  await puppeteerLogin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log('  ✓ Logged in');

  // ── Authenticated pages ──
  console.log('\n── Authenticated pages (Admin) ──');

  const PAGES = [
    { url: '/dashboard',    file: '03-dashboard.png',     label: 'Dashboard',          wait: 1800 },
    { url: '/complaints',   file: '04-complaint-list.png', label: 'Complaint List',     wait: 1500 },
    { url: '/complaints/new', file: '05-new-complaint.png', label: 'New Complaint',    wait: 800  },
    { url: '/users',        file: '07-user-management.png', label: 'User Management',  wait: 1200 },
    { url: '/categories',   file: '08-categories.png',    label: 'Categories',         wait: 800  },
    { url: '/analytics',    file: '09-analytics.png',     label: 'Analytics (Phase 2)', wait: 2500 },
  ];

  for (const p of PAGES) {
    await page.goto(`${FRONTEND}${p.url}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitMs(p.wait);
    await screenshot(page, path.join(SS_DIR, p.file), p.label);
  }

  // ── Complaint Detail (dynamic ID) ──
  if (complaintId) {
    await page.goto(`${FRONTEND}/complaints/${complaintId}`, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitMs(1500);
    await screenshot(page, path.join(SS_DIR, '06-complaint-detail.png'), `Complaint Detail (${complaintId})`);
  } else {
    console.warn('  ⚠ Skipped 06-complaint-detail.png — no complaint ID available');
  }

  await page.close();
}

// ── Swagger Screenshots ───────────────────────────────────────────────────────

async function captureSwagger(browser, token) {
  // ── Overview (all groups collapsed) ──
  console.log('\n── Swagger UI ──');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(SWAGGER, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitMs(3500);
    await screenshot(page, path.join(SWAGGER_SS_DIR, 'swagger-01-overview.png'), 'Swagger Overview');
    await page.close();
  }

  // ── Auth dialog (fresh page) ──
  console.log('\n── Swagger Authorization ──');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(SWAGGER, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitMs(3500);

    const authClicked = await page.evaluate(() => {
      const btn = document.querySelector('.btn.authorize');
      if (btn) { btn.click(); return true; }
      return false;
    });

    if (authClicked) {
      await waitMs(800);
      await page.evaluate(() => {
        const input = document.querySelector('.auth-container input[type="text"]');
        if (input) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); }
      });
      await page.type('.auth-container input[type="text"]', token, { delay: 20 });
      await waitMs(400);
      await screenshot(page, path.join(SWAGGER_SS_DIR, 'swagger-auth-dialog.png'), 'Swagger Auth Dialog');

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.auth-btn-wrapper button'));
        const authBtn = btns.find(b => b.textContent.trim() === 'Authorize');
        if (authBtn) authBtn.click();
      });
      await waitMs(800);
      await screenshot(page, path.join(SWAGGER_SS_DIR, 'swagger-authorized.png'), 'Swagger Authorized');
    } else {
      console.warn('  ⚠ Could not find Authorize button in Swagger UI');
    }
    await page.close();
  }

  // ── Per-group screenshots — one fresh page per group ──
  // Fresh page per group guarantees a clean state: no previously expanded
  // endpoints, no cached execution results, no 422 response panels visible.
  console.log('\n── Swagger Tag Groups ──');
  for (let i = 0; i < SWAGGER_TAGS.length; i++) {
    const tag      = SWAGGER_TAGS[i];
    const num      = String(i + 2).padStart(2, '0');
    const filename = `swagger-${num}-${tag.toLowerCase()}.png`;

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    await page.goto(SWAGGER, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitMs(3500); // Swagger JS must fully render before any interaction

    // Expand only the target group — text-content matching, never DOM IDs
    const expanded = await page.evaluate((tagName) => {
      // Try .opblock-tag first (the clickable tag header element)
      const tagEls = document.querySelectorAll('.opblock-tag');
      for (const el of tagEls) {
        const txt = el.textContent.trim().replace(/\s+/g, ' ');
        if (txt.startsWith(tagName)) { el.click(); return true; }
      }
      // Fallback: h3 button inside .opblock-tag-section
      const h3s = document.querySelectorAll('.opblock-tag-section h3');
      for (const h3 of h3s) {
        const txt = h3.textContent.trim().replace(/\s+/g, ' ');
        if (txt.startsWith(tagName)) {
          (h3.querySelector('button') || h3).click();
          return true;
        }
      }
      return false;
    }, tag);

    if (!expanded) {
      console.warn(`  ⚠ Tag not found: "${tag}" — skipping`);
      await page.close();
      continue;
    }

    await waitMs(1200); // wait for expand animation + endpoint list render
    await page.evaluate(() => window.scrollTo(0, 0));
    await waitMs(300);
    await screenshot(page, path.join(SWAGGER_SS_DIR, filename), `Swagger ${tag}`);
    await page.close();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== CRT System Screenshot Capture ===\n');

  ensureDirs();

  // Verify backend is reachable
  console.log('── Preflight checks ──');
  let token;
  try {
    token = await getAdminToken();
    console.log(`  ✓ Backend reachable at ${BACKEND}`);
    console.log(`  ✓ Admin login successful`);
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    console.error('  Fix: make sure the backend is running: cd backend && python -m uvicorn app.main:app --reload --port 8001');
    process.exit(1);
  }

  console.log(`  ✓ Frontend expected at ${FRONTEND}`);
  console.log(`  ✓ Swagger expected at ${SWAGGER}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    await capturePages(browser, token);
    await captureSwagger(browser, token);
  } finally {
    await browser.close();
  }

  // Summary
  const pngFiles    = fs.readdirSync(SS_DIR).filter(f => f.endsWith('.png'));
  const swaggerFiles = fs.readdirSync(SWAGGER_SS_DIR).filter(f => f.endsWith('.png'));
  console.log(`\n=== Capture complete ===`);
  console.log(`  Frontend pages : ${pngFiles.length} screenshots in screenshots/`);
  console.log(`  Swagger groups : ${swaggerFiles.length} screenshots in screenshots/swagger/`);
  console.log(`  Total          : ${pngFiles.length + swaggerFiles.length} screenshots\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
