# Claude Code Project Automation Context

This file is read automatically by Claude Code on startup.
It defines the full automation strategy for screenshots, test credentials, demo data seeding, API documentation, and final README generation across all projects.

---

## 1. Screenshot Automation (Frontend)

### What we are doing
At the start or end of any dev session — or whenever the UI changes significantly — we capture full-page screenshots of all key pages in the running local dev server. These are saved to `./screenshots/` and serve as visual documentation that gets embedded into `README.md` at the end of the project.

### Tool used
- **Puppeteer** (`puppeteer` npm package) — headless Chrome automation
- Runs entirely on the local machine, no external services needed
- Handles login, navigation, idle-wait, and full-page capture

### How it works
1. Dev server assumed at `http://localhost:5173` — check `vite.config.js` if different
2. `capture.js` launches headless Chromium via Puppeteer
3. Logs in using demo admin credentials (see Section 2)
4. Navigates to every route found in the router config, waits for full load, captures full-page screenshot at 1440x900 @2x
5. Saves all screenshots to `./screenshots/`
6. Captures Swagger UI screenshots to `./screenshots/swagger/`
7. Runnable anytime with `npm run capture`

### File structure
```
<project-root>/
├── capture.js                  # Puppeteer screenshot script
├── seed-demo-users.js          # DB seeding script
├── generate-readme.js          # README generator script
├── package.json                # Scripts + dependencies
├── CLAUDE.md                   # This file
├── .env                        # Credentials and config (never commit)
├── .env.example                # Template of required env vars (commit this)
├── README.md                   # Final generated project documentation
└── screenshots/
    ├── 01-<page>.png
    ├── 02-<page>.png
    ├── ...
    └── swagger/
        ├── swagger-01-overview.png
        ├── swagger-02-<tag>.png        # one per endpoint group (numbered)
        ├── swagger-03-<tag>.png
        ├── ...
        ├── swagger-NN-<tag>.png
        ├── swagger-auth-dialog.png     # fixed name — auth dialog with token
        └── swagger-authorized.png      # fixed name — after clicking Authorize
```

### How to run
```bash
npm install          # first time only
npm run capture      # takes all screenshots
```

### How Claude Code must discover routes
Claude Code must never assume routes. Before writing `capture.js`, it must:
1. Find the router config file (e.g. `src/router/index.js`, `src/App.jsx`, `src/routes.js`)
2. Extract every route path and its page component name
3. Map each route to a meaningful screenshot filename (e.g. `/admin` → `01-admin-overview.png`)
4. Include all routes — public, authenticated, admin-only, and nested
5. For routes with dynamic segments (e.g. `/article/:id`), find a real ID from the DB or seed data and use that

### Screenshot settings
- Resolution: 1440x900, `deviceScaleFactor: 2` (retina quality)
- Wait strategy: `networkidle2` + per-page `waitFor` ms for animations/lazy content
- Session cookies from login are reused automatically across all page captures

---

## 2. Demo Credentials & Test User Seeding

### Strategy
Claude Code seeds demo admin and user accounts into the database for testing. Credentials are stored in `.env` and read by both `seed-demo-users.js` and `capture.js`.

### .env format
```env
# Demo Admin
DEMO_ADMIN_NAME=Demo Admin
DEMO_ADMIN_EMAIL=demo_admin@example.com
DEMO_ADMIN_PASSWORD=DemoAdmin@123

# Demo Author
DEMO_AUTHOR_NAME=Demo Author
DEMO_AUTHOR_EMAIL=demo_author@example.com
DEMO_AUTHOR_PASSWORD=DemoAuthor@123

# Demo Reviewer (if the app has a reviewer role)
DEMO_REVIEWER_NAME=Demo Reviewer
DEMO_REVIEWER_EMAIL=demo_reviewer@example.com
DEMO_REVIEWER_PASSWORD=DemoReviewer@123

# Demo User
DEMO_USER_NAME=Demo User
DEMO_USER_EMAIL=demo_user@example.com
DEMO_USER_PASSWORD=DemoUser@123

# MySQL connection
DB_HOST=localhost
DB_PORT=3306
DB_NAME=
DB_USER=root
DB_PASSWORD=

# App
VITE_PORT=5173
BACKEND_URL=http://localhost:8000
SWAGGER_URL=http://localhost:8000/api/docs
```

> ⚠️ **CRITICAL — Email domain must be `@example.com`**
> Never use `.local`, `.test`, `.internal`, or other reserved/special-use TLDs for demo emails.
> Libraries like `pydantic[email]`, `email-validator`, and many others reject them as invalid.
> `project.local` caused login failures on this project because pydantic's email-validator
> treats `.local` as a reserved mDNS domain and rejects it with a 422 Validation Error.
> **Always use `@example.com`** — it is explicitly reserved for documentation/testing (RFC 2606)
> and is universally accepted by all email validators.

### .env.example (commit this, not .env)
Same as above but all values empty.

### Seeding behavior
`seed-demo-users.js` must:
1. Connect to MySQL using `DB_*` vars from `.env`
2. Check if demo admin/user already exist by email — skip if they do (idempotent)
3. Create demo admin with role `admin` and demo user with role `user`
4. Hash passwords using the same method the app uses (bcrypt by default)
5. Also seed enough sample content (articles, bookmarks, or whatever the app's core data is) so every page renders with realistic data in screenshots — not empty states
6. Log clearly: created / already exists / error

### Reading credentials in capture.js
```js
require('dotenv').config();
const CREDENTIALS = {
  username: process.env.DEMO_ADMIN_EMAIL,
  password: process.env.DEMO_ADMIN_PASSWORD,
};
```

---

## 3. Swagger UI Documentation (Backend)

### What we are doing
We capture screenshots of every endpoint group in the Swagger UI and embed them into `README.md` as API documentation. This is done after the backend is complete.

### Swagger URL
Loaded from `.env`: `SWAGGER_URL`
Claude Code must find the actual URL by checking the backend config — common paths: `/docs`, `/api/docs`, `/swagger`, `/api/swagger-ui`

### What to capture
| File | What to capture |
|------|----------------|
| `swagger-01-overview.png` | Full Swagger UI landing page, all groups collapsed |
| `swagger-02-<tag>.png` through `swagger-NN-<tag>.png` | One screenshot per endpoint group, fully expanded |
| `swagger-auth-dialog.png` | Authorize dialog open with Bearer token filled in |
| `swagger-authorized.png` | UI after successful authorization |

> ⚠️ **CRITICAL — Auth dialog screenshots must use non-numbered names**
> Do NOT name them `swagger-03-auth.png` and `swagger-04-authorized.png`.
> If your app has more than 2 endpoint groups, group screenshots will be numbered 03, 04, ...
> and will collide with those filenames. Always use the fixed names `swagger-auth-dialog.png`
> and `swagger-authorized.png` for the authorization screenshots.

### Important
- Swagger UI is JS-heavy — always wait at least **3500ms** after `networkidle2` before screenshotting
- Claude Code must discover all endpoint tags by **reading the backend router files** — look for the `tags=[...]` parameter in each `APIRouter(...)` definition — never assume tag names or casing
- FastAPI tag names use the exact casing from `tags=["My Tag Name"]` — always read the source
- Get the Bearer token automatically by calling the login API using demo admin credentials from `.env`
- Save all Swagger screenshots to `./screenshots/swagger/`
- Use text-content matching (not DOM IDs) to expand Swagger tag sections — see Section 7 for the correct implementation

---

## 4. README Generation

### When
README is regenerated at the end of every phase — not just once at project completion. Each phase adds new pages and endpoints; the README is always kept up to date and always reflects the full current state of the app. Never document only the new additions — always regenerate the complete README.

### Canonical README structure — fixed across all phases

The README must always contain exactly these sections in this order. Do not add, remove, or reorder sections between phases.

#### 4.1 Project Overview
- Project name, one-paragraph description of what the system does
- Phase breakdown: what each phase introduced

#### 4.2 Tech Stack
A table with columns: Layer | Technology. Cover frontend, styling, backend, ORM, database, DB driver, ETL (if applicable), HTTP client.

#### 4.3 Key Features
Bullet lists grouped by phase:
```markdown
### Phase 1 — Core CRUD
- ...

### Phase 2 — ETL Pipeline & Analytics
- ...
```

#### 4.4 Prerequisites
A table: Requirement | Version. List Python, Node.js, database, pip, npm.

#### 4.5 Installation & Setup
Numbered steps covering the full setup from clone to running:
1. Clone the repository
2. Create the database (SQL command)
3. Configure the backend — create `backend/.env` with all fields shown
4. Install backend dependencies (`pip install -r requirements.txt`)
5. Configure the frontend (note the API base URL and where it is set)
6. Install frontend dependencies (`npm install` in frontend/)
7. Install automation scripts (`npm install` in project root, copy `.env.example`)

#### 4.6 Running the Application
Exact commands to start backend and frontend, including the port each runs on. Include the Swagger UI URL. Include the seed command.

#### 4.7 Frontend Pages & UI Screenshots
For every route in the app, one subsection:
```markdown
### Page Name — `/route`
One sentence describing what the page does and its key interactions.

![Page Name](./screenshots/NN-page-name.png)

---
```
Use `---` dividers between pages. Mark Phase 2+ pages with `*(Phase 2)*` in the heading.
Screenshots come from `./screenshots/` (auto-generated by `capture.js`).

#### 4.8 API Documentation
Opening line: base URL, auth method (or "No authentication required"), Swagger UI URL.
Embed the Swagger overview screenshot.

Then one subsection per endpoint group (tag), in this exact format:
```markdown
### Group Name API *(Phase N if new)*

One sentence describing what this group does.

![Group Name API](./screenshots/swagger/swagger-NN-groupname.png)

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|-------------|
| GET | /api/v1/... | ... | `param1`, `param2` |
| POST | /api/v1/... | ... | — |

**Request body** (for POST/PUT endpoints):
\`\`\`json
{ ... }
\`\`\`

**Response:**
\`\`\`json
{ ... }
\`\`\`
```

If the app has authentication, add auth dialog screenshots with explanation after the endpoint groups.

#### 4.9 API Testing Screenshots
One subsection per manual API test screenshot found in `docs/screenshots/api/`. Format:
```markdown
### METHOD /api/v1/endpoint — Short description
![alt](./docs/screenshots/api/NN_filename.png)

---
```
If no manual testing screenshots exist, omit this section.

#### 4.10 ETL File Format *(include only if the app has an ETL/import feature)*
A table of required and optional columns: Column | Type | Constraints.
List supported file formats. Reference the sample file path.

#### 4.11 Project Structure
A full directory tree of the project root using code block formatting. Include all significant files and directories; omit `node_modules/`, `__pycache__/`, `dist/`, `.git/`.

#### 4.12 Scripts Reference
A table of all `npm run` commands available from the project root:
```markdown
| Command | Description |
|---------|-------------|
| `npm run seed` | ... |
| `npm run capture` | ... |
| `npm run generate-readme` | ... |
| `npm run setup` | ... |
```

### How generate-readme.js works
Claude Code must write `generate-readme.js` that:
1. Checks which screenshot files exist in `./screenshots/`, `./screenshots/swagger/`, `docs/screenshots/ui/`, and `docs/screenshots/api/` — embeds them if present, shows a placeholder note if missing
2. Assembles the full `README.md` following the canonical structure above exactly
3. Writes it to the project root as `README.md`
4. Logs a summary: frontend pages documented, Swagger groups documented, API testing screenshots embedded, total endpoints documented

The script is updated each phase to add new pages and endpoints. All previously documented content is kept — only new sections are added.

> **Rule:** Never manually edit `README.md`. Always update `generate-readme.js` and re-run `npm run generate-readme`.

---

## 5. Full Automation Pipeline

### package.json scripts
```json
"scripts": {
  "seed": "node seed-demo-users.js",
  "capture": "node capture.js",
  "generate-readme": "node generate-readme.js",
  "setup": "npm run seed && npm run capture && npm run generate-readme"
}
```

### Single command to run everything
```bash
npm run setup
```

This seeds the database, captures all screenshots (frontend + Swagger), and generates the complete `README.md` in one go.

---

## 6. General Rules for Claude Code

- Always read this entire `CLAUDE.md` before doing anything on a project
- Always discover routes, ports, and selectors from config/source files — never assume or hardcode
- Always use `.env` for credentials — never hardcode passwords in any script
- Always check if demo users already exist before seeding — all seeds must be idempotent
- Always seed enough sample data so pages render with realistic content, not empty states
- Always verify the dev server and backend are running before capturing
- Extract all API endpoints from source or OpenAPI JSON — never document endpoints you haven't verified exist
- Commit `CLAUDE.md`, `capture.js`, `seed-demo-users.js`, `generate-readme.js`, `package.json`, `.env.example`, `README.md` — never commit `.env`
- `README.md` is generated — do not manually edit it; edit `generate-readme.js` instead
- Run `npm run setup` as the single command to fully document any project from scratch

---

## 7. Lessons Learned from EKBMS — Automation Fixes for Future Projects

This section records every problem encountered running the automation pipeline on this project and the exact fix applied. Apply these lessons before writing `capture.js` and `seed-demo-users.js` on any future project.

---

### Problem 1 — Demo email domain `.local` rejected by email validators

**What happened:**
Demo credentials were written as `demo_admin@project.local`. The backend uses `pydantic[email]` / `email-validator`, which rejected `.local` as a reserved mDNS domain:
```
422 Unprocessable Entity
{"detail": "value is not a valid email address: The part after the @-sign is a
special-use or reserved name that cannot be used with email."}
```
The seed script bypassed the API and wrote directly to the database, so the users were created fine. But when Puppeteer tried to log in *through the frontend* (which calls the API), the login POST returned 422 and the form never submitted — causing a navigation timeout.

**Fix:**
Always use `@example.com` for all demo credentials. `example.com` is explicitly reserved for documentation and testing (RFC 2606) and is accepted by every email validator.

**Rule:**
> Never use `.local`, `.test`, `.internal`, `.dev`, `.corp`, or any other non-public TLD in demo email addresses. Always use `@example.com`.

---

### Problem 2 — Puppeteer `waitForNavigation` timed out after login

**What happened:**
```js
await page.click('button[type="submit"]');
await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
// ✗  Navigation timeout of 15000 ms exceeded
```
React SPAs use client-side routing (`react-router-dom`, `vue-router`, etc.). Clicking submit fires an API call, then the router's `navigate()` changes the URL — but this does **not** trigger a full browser navigation event. `waitForNavigation` waits for a real HTTP navigation which never comes, so it always times out.

**Fix:**
Replace `waitForNavigation` with `waitForFunction` that watches the URL:
```js
await Promise.all([
  page.waitForFunction(
    () => !window.location.pathname.includes('/login'),
    { timeout: 30000 }
  ),
  page.click('button[type="submit"]'),
]);
await new Promise(r => setTimeout(r, 1000)); // let animations settle
```
Also use `domcontentloaded` (not `networkidle2`) for the initial `page.goto` to the login page — it's faster and SPA shells rarely need to wait for network idle just to render the form.

**Rule:**
> For React/Vue/Angular SPAs, never use `waitForNavigation` after clicking buttons that trigger client-side routing. Use `waitForFunction` watching `window.location.pathname` or `window.location.href` instead.

---

### Problem 3 — Swagger UI tag section selectors used wrong casing and DOM IDs

**What happened:**
The capture script used lowercase tag names and DOM ID selectors:
```js
const SWAGGER_GROUPS = ['auth', 'users', 'articles', ...];
// tried: [id="operations-tag-auth"]
// tried: button[aria-controls="auth"]
// Result: ⚠ Tag section not found: auth — skipping (×12)
```
FastAPI defines tag names with exact casing in each router:
```python
router = APIRouter(prefix="/auth", tags=["Authentication"])
router = APIRouter(prefix="/approvals", tags=["Approval Workflow"])
```
The Swagger UI renders these with the exact casing. The DOM ID for "Authentication" is `operations-tag-Authentication`, not `operations-tag-auth`. Multi-word tags like "Approval Workflow" have spaces which do not reliably map to a simple ID.

**Fix — Step 1:** Always read the router source files to get exact tag names:
```bash
grep -rn "^router = APIRouter" backend/app/routers/
# → tags=["Authentication"], tags=["Approval Workflow"], etc.
```

**Fix — Step 2:** Use text-content matching via `page.evaluate()` instead of fragile DOM IDs:
```js
const expanded = await page.evaluate((tagName) => {
  const buttons = document.querySelectorAll(
    '.opblock-tag-section h3 button, .opblock-tag'
  );
  for (const btn of buttons) {
    const txt = btn.textContent.trim().replace(/\s+/g, ' ');
    if (txt.startsWith(tagName)) {
      btn.click();
      return true;
    }
  }
  return false;
}, tag);
```

**Rule:**
> Never hardcode Swagger tag names or rely on DOM IDs to expand sections. Always read the backend router files for exact tag strings, and always use text-content matching to click section headers.

---

### Problem 4 — Swagger auth screenshot names conflicted with group screenshot numbers

**What happened:**
The CLAUDE.md spec said to name the auth dialog screenshots `swagger-03-auth.png` and `swagger-04-authorized.png`. With 12 endpoint groups, the group screenshots were numbered `swagger-02-authentication.png`, `swagger-03-users.png`, `swagger-04-articles.png`, etc. This caused:
- `swagger-03-auth.png` (auth dialog) coexisting with `swagger-03-users.png` (Users group) — same number, confusing
- `swagger-04-authorized.png` coexisting with `swagger-04-articles.png` — same number

**Fix:**
Use fixed non-numbered names for the auth dialog screenshots:
- `swagger-auth-dialog.png` — the Authorize dialog with token filled in
- `swagger-authorized.png` — the UI state after clicking Authorize

Reserve sequential numbers (`swagger-02-`, `swagger-03-`, ...) exclusively for endpoint group screenshots.

**Rule:**
> Auth dialog screenshots always use fixed names: `swagger-auth-dialog.png` and `swagger-authorized.png`. Never use numbers for these — numbers are only for group screenshots.

---

### Problem 5 — Puppeteer version deprecation warning

**What happened:**
`package.json` specified `"puppeteer": "^22.0.0"`, which triggered:
```
npm warn deprecated puppeteer@22.15.0: < 24.15.0 is no longer supported
```

**Fix:**
Always install `puppeteer@latest` or specify a recent version. Run `npm install puppeteer@latest` immediately after the initial `npm install` to upgrade to the supported version.

**Rule:**
> In `package.json`, use `"puppeteer": "latest"` or check the current version at npmjs.com before pinning. Puppeteer releases frequently and older versions lose Chromium support.

---

### Problem 6 — Swagger UI needs longer wait time than expected

**What happened:**
Using `await new Promise(r => setTimeout(r, 1500))` after `networkidle2` was not enough — Swagger UI's JavaScript continued rendering endpoint blocks after the network went idle. Screenshots captured too early showed incomplete renders.

**Fix:**
Use **3500ms** minimum wait after `networkidle2` for the initial Swagger load. Per-section expansions need at least 1000ms wait after clicking.

```js
await page.goto(SWAGGER, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 3500)); // Swagger JS finishes rendering
```

**Rule:**
> Swagger UI minimum wait: **3500ms** after `networkidle2`. Per-section expansion wait: **1000ms**. Never use less.

---

### Problem 7 — Seed script created users with roles that don't cover all page scenarios

**What happened:**
The original spec only required an admin and a generic "user". But this project has 4 roles: admin, author, reviewer, employee. Only seeding admin + employee meant:
- The Review Queue page (reviewer-only) only showed the admin's perspective
- The "New Article" and "Tags" pages (author-only) were only accessible because the admin also has those rights

**Fix:**
Seed **one user per distinct role** defined in the application. Check the role model/enum in the backend source before writing the seed script — never assume roles.

```bash
# Read the actual roles from the model before seeding
grep -n "class RoleEnum\|admin\|author\|reviewer\|employee" backend/app/models/user.py
```

**Rule:**
> Always seed one demo user per role defined in the application. Read the role enum/model from source — never assume. This ensures every role-gated page is accessible during capture.

---

### Summary — Pre-flight Checklist for Future Projects

Before running `npm run setup` on any new project, verify:

- [ ] Demo emails use `@example.com` — not `.local`, `.test`, or any reserved TLD
- [ ] All roles defined in the app's role model have a corresponding demo user seeded
- [ ] Puppeteer login uses `waitForFunction(() => !location.pathname.includes('/login'))` — not `waitForNavigation`
- [ ] Swagger tag names were read from the router source files — not guessed
- [ ] Swagger section expansion uses text-content matching — not DOM ID selectors
- [ ] Auth dialog screenshots are named `swagger-auth-dialog.png` and `swagger-authorized.png`
- [ ] Swagger initial wait is ≥ 3500ms
- [ ] `puppeteer` is installed at a recent version (`npm install puppeteer@latest`)
