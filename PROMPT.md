# Claude Code — Project Documentation Prompt

## Use this prompt at the end of any phase to document what was added or changed.

The same steps and README structure apply at every phase. The README always reflects the full current state of the app — screenshots cover all pages, API docs cover all endpoints. What changes phase to phase is which pages and endpoints are NEW and need to be highlighted.

Read `CLAUDE.md` fully before doing anything. Then work through these steps in order without skipping any.

---

**Step 1 — Environment check**

Check that `capture.js`, `seed-demo-users.js`, `generate-readme.js`, and `package.json` exist in the project root.
- If any are missing, create them following the exact spec in `CLAUDE.md`
- Check if `.env` exists — if not, create it from `.env.example` and ask for any missing values (e.g. DB password) before continuing
- Check if `screenshots/` and `screenshots/swagger/` directories exist — create them if not

---

**Step 2 — Discover everything from source, do not assume**

Identify what is NEW in this phase compared to what was previously documented:
- Read the router config file (`src/App.jsx`, `src/router/index.js`, etc.) and extract every route path and its page component name — note which routes are new since the last phase
- Read all backend router files and extract every API endpoint (method, path, description, auth required) — note which endpoint groups are new since the last phase
- Confirm the correct frontend dev server port from `vite.config.js` and the `.env` `VITE_PORT` value
- Confirm the backend port from the backend config and the `.env` `BACKEND_URL` value
- Confirm the Swagger UI URL from the backend config and the `.env` `SWAGGER_URL` value
- If the app has authentication: find the login route and the exact form field selectors (name or id attributes) from the login component

Summarise what is new: list each new route and each new API endpoint group before proceeding.

---

**Step 3 — Update the automation scripts**

Update `capture.js`:
- Add any new routes to the pages list
- Confirm the frontend port matches `.env` `VITE_PORT`
- Add any new Swagger tags to the tags list (read exact tag names from the router source — never guess casing)
- For any route with a dynamic segment (e.g. `/feedback/:id`), confirm it resolves to a real record ID from the DB

Update `seed-demo-users.js`:
- Add seed data for any new tables or content types introduced in this phase
- Ensure all new pages will render with realistic data — no empty states
- All seeds must remain idempotent (check before inserting)

Update `generate-readme.js`:
- Add the new pages to the Frontend Pages section
- Add the new API groups to the API Documentation section with full endpoint tables and request/response examples
- If a new file format is introduced (CSV, Excel, etc.), add an ETL File Format section
- Keep all previously documented pages and endpoints — the README always covers the full app
- Follow the canonical README structure from `CLAUDE.md` Section 4 exactly

---

**Step 4 — Seed the database**

Run `npm run seed`.

Ensure enough sample data exists so every page renders with realistic content — no empty states, no zero counts, no placeholder text. Report what was created and what already existed.

---

**Step 5 — Take all screenshots**

Confirm the dev server and backend are both running before proceeding.

Run `npm run capture`.

This captures every frontend page (not just new ones — all pages are always re-captured to reflect the current UI state) and every Swagger UI endpoint group. Report exactly which screenshots were saved and flag anything that failed or was skipped.

---

**Step 6 — Generate the README**

Run `npm run generate-readme`.

This regenerates `README.md` in full following the canonical structure from `CLAUDE.md` Section 4. The README always represents the complete current state of the app — all phases, all pages, all endpoints. Report how many pages and endpoints were documented.

---

**Step 7 — Commit and push**

Stage and commit in logical groups — one commit per concern:
1. New/changed backend files for this phase
2. New/changed frontend files for this phase
3. Updated screenshots, README, and automation scripts

Commit messages must follow conventional commit format (`feat:`, `fix:`, `docs:`). No references to Claude or AI tools in any commit message.

---

**Step 8 — Final report**

Tell me:
- Which routes are new in this phase and which screenshots were captured for them
- Which API endpoint groups are new in this phase and how many endpoints were documented
- Total frontend pages documented, total API endpoints documented across all groups
- Any pages, endpoints, or screenshots that failed or were skipped and why
- The full path to the generated `README.md`
