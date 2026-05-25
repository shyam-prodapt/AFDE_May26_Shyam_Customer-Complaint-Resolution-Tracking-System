/**
 * generate-readme.js
 * Generates the full README.md following the canonical structure from CLAUDE.md Section 4.
 * Covers Phase 1 + Phase 2. Never manually edit README.md — edit this file and re-run.
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const ROOT        = __dirname;
const SS_DIR      = path.join(ROOT, 'screenshots');
const SWAGGER_DIR = path.join(ROOT, 'screenshots', 'swagger');

function ssExists(file) { return fs.existsSync(path.join(SS_DIR, file)); }
function swExists(file) { return fs.existsSync(path.join(SWAGGER_DIR, file)); }

function pageImg(file, alt) {
  return ssExists(file)
    ? `![${alt}](./screenshots/${file})`
    : `*(screenshot not yet captured — run \`npm run capture\`)*`;
}

function swImg(file, alt) {
  return swExists(file)
    ? `![${alt}](./screenshots/swagger/${file})`
    : `*(screenshot not yet captured — run \`npm run capture\`)*`;
}

const README = `# Customer Complaint & Resolution Tracking System

**CRT System** — A centralized web-based platform for end-to-end customer complaint management, SLA tracking, and ETL-powered analytics reporting.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Key Features](#3-key-features)
4. [Prerequisites](#4-prerequisites)
5. [Installation & Setup](#5-installation--setup)
6. [Running the Application](#6-running-the-application)
7. [Frontend Pages & UI Screenshots](#7-frontend-pages--ui-screenshots)
8. [API Documentation](#8-api-documentation)
9. [ETL File Format](#9-etl-file-format)
10. [Project Structure](#10-project-structure)
11. [Scripts Reference](#11-scripts-reference)

---

## 1. Project Overview

The **Customer Complaint & Resolution Tracking System (CRT System)** is a full-stack enterprise web application that enables organizations to efficiently manage, monitor, and resolve customer complaints end-to-end.

### Phase Breakdown

| Phase | Focus | What Was Delivered |
|---|---|---|
| Phase 1 | Core CRUD & Workflow | Complaint registration, role-based access, SLA tracking, agent assignment, status audit trail, file attachments, in-app notifications, customer feedback |
| Phase 2 | ETL Pipeline & Analytics | CSV-based ETL pipeline, analytics data warehouse table, one-click ETL trigger from UI, 4-chart analytics dashboard, 6 new API endpoints |

### Industries Applicable
Telecom · Banking · Retail · E-Commerce · Healthcare · Logistics · Education · Utility Services · IT Support

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Plain CSS (no Tailwind) |
| Backend | Python 3.14 + FastAPI |
| ORM | SQLAlchemy 2.0 |
| Database | MySQL 8 |
| DB Driver | PyMySQL |
| ETL | Custom Python pipeline (CSV → Transform → MySQL) |
| Authentication | JWT (python-jose) + bcrypt |
| Charts | Recharts |
| HTTP Client | Axios (with request/response interceptors) |
| Routing | React Router v6 |

---

## 3. Key Features

### Phase 1 — Core Complaint Management
- Complaint registration with auto-generated IDs (\`COMP-YYYYMMDD-XXXX\`)
- Five user roles: Admin, Supervisor, Support Agent, Customer, Quality Team
- SLA due-date calculation (4 / 24 / 48 / 72 hours by priority)
- Agent assignment workflow with history trail
- Seven complaint statuses: Open → Assigned → In Progress → Pending Customer Response → Escalated → Resolved → Closed
- File attachments per complaint
- In-app notification system (created on assignment, status changes)
- Customer satisfaction ratings (1–5 stars) after resolution
- Live operations dashboard with charts (Admin / Supervisor / Quality Team)
- JWT authentication with role-based route protection

### Phase 2 — ETL Pipeline & Analytics *(Phase 2)*
- CSV-based ETL pipeline: Extract (250-record dataset) → Transform (SLA breach detection, resolution time calculation) → Load (upsert to analytics warehouse)
- One-click **Run ETL** button in the Analytics UI
- Dedicated Analytics page (Admin / Supervisor / Quality Team)
- SLA breach analysis chart (compliant vs breached by priority)
- Category volume horizontal bar chart
- Monthly resolution trends line chart
- Agent performance ranking table with resolution-rate progress bars
- Six new REST API endpoints under \`/api/analytics/\`

---

## 4. Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| pip | Latest |
| npm | 9+ |

---

## 5. Installation & Setup

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd "Customer complaint and resolution tracking System"
   \`\`\`

2. **Create the MySQL database**
   \`\`\`sql
   CREATE DATABASE IF NOT EXISTS complaint_tracking
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   \`\`\`

3. **Configure the backend** — create \`backend/.env\`
   \`\`\`env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=complaint_tracking
   SECRET_KEY=your-secret-key-min-32-chars
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE_MB=10
   \`\`\`

4. **Install backend dependencies**
   \`\`\`bash
   cd backend
   pip install -r requirements.txt
   python seed.py   # seeds roles + default categories
   \`\`\`

5. **Configure the frontend** — the API base URL is proxied via \`frontend/vite.config.js\` to \`http://localhost:8001\`. No additional config needed.

6. **Install frontend dependencies**
   \`\`\`bash
   cd frontend
   npm install
   \`\`\`

7. **Install automation scripts** (project root)
   \`\`\`bash
   cd ..   # back to project root
   cp .env.example .env   # then fill in DB_PASSWORD
   npm install
   npm run seed   # seeds demo users, complaints, and runs the Phase 2 ETL
   \`\`\`

---

## 6. Running the Application

\`\`\`bash
# Terminal 1 — Backend (port 8001)
cd backend
python -m uvicorn app.main:app --reload --port 8001
# → API: http://localhost:8001
# → Swagger: http://localhost:8001/docs

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
# → App: http://localhost:5173
\`\`\`

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | demo_admin@example.com | DemoAdmin@123 |
| Supervisor | demo_supervisor@example.com | DemoSupervisor@123 |
| Support Agent | demo_agent@example.com | DemoAgent@123 |
| Customer | demo_customer@example.com | DemoCustomer@123 |
| Quality Team | demo_quality@example.com | DemoQuality@123 |

Run \`npm run seed\` from the project root to create all demo users and populate the database.

---

## 7. Frontend Pages & UI Screenshots

### Login — \`/login\`
Public entry point. JWT-based authentication. On success, admins/supervisors/quality team land on Dashboard; agents and customers land on Complaints.

${pageImg('01-login.png', 'Login Page')}

---

### Register — \`/register\`
Self-registration form. Newly registered users default to the Customer role.

${pageImg('02-register.png', 'Register Page')}

---

### Dashboard — \`/dashboard\`
Aggregate KPI cards and charts for Admins, Supervisors, and Quality Team. Shows total complaints, SLA breaches, status distribution pie chart, and category bar chart.

${pageImg('03-dashboard.png', 'Dashboard')}

---

### Complaint List — \`/complaints\`
Role-filtered complaint table. Admins and Supervisors see all complaints; Support Agents see their assigned queue; Customers see their own submissions. Filterable by status, priority, and category.

${pageImg('04-complaint-list.png', 'Complaint List')}

---

### New Complaint — \`/complaints/new\`
Customer complaint submission form with category selection, priority, and description. On submit, an auto-ID (\`COMP-YYYYMMDD-XXXX\`) is generated and SLA due date is calculated.

${pageImg('05-new-complaint.png', 'New Complaint')}

---

### Complaint Detail — \`/complaints/:id\`
Full complaint view: metadata grid, status update panel, history/audit trail, attachments, and feedback section. Available actions vary by role.

${pageImg('06-complaint-detail.png', 'Complaint Detail')}

---

### User Management — \`/users\`
Admin-only view. Lists all registered users with their roles. Supports role change and account deactivation.

${pageImg('07-user-management.png', 'User Management')}

---

### Categories — \`/categories\`
Admin-only view. Create, edit, and delete complaint categories.

${pageImg('08-categories.png', 'Categories')}

---

### Analytics *(Phase 2)* — \`/analytics\`
Admin / Supervisor / Quality Team only. Displays a **Run ETL** button to load the 250-record CSV dataset into the analytics warehouse, followed by four live visualizations: SLA breach by priority, complaint volume by category, monthly resolution trends, and agent performance table.

${pageImg('09-analytics.png', 'Analytics')}

---

## 8. API Documentation

**Base URL:** \`http://localhost:8001\`
**Authentication:** Bearer JWT — include \`Authorization: Bearer <token>\` header on all protected endpoints.
**Interactive docs:** \`http://localhost:8001/docs\`

${swImg('swagger-01-overview.png', 'Swagger UI Overview')}

---

### Auth API

Login, registration, and password reset.

${swImg('swagger-02-auth.png', 'Auth API')}

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | \`/api/auth/register\` | Register a new user account | No |
| POST | \`/api/auth/login\` | Login — returns JWT access token | No |
| POST | \`/api/auth/forgot-password\` | Send password reset link (stub) | No |

**Login request body** (form-urlencoded):
\`\`\`
username=user@example.com&password=YourPassword
\`\`\`

**Login response:**
\`\`\`json
{ "access_token": "eyJ...", "token_type": "bearer" }
\`\`\`

---

### Users API

User profile and administration.

${swImg('swagger-03-users.png', 'Users API')}

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | \`/api/users/me\` | Get current user profile | Any |
| GET | \`/api/users/\` | List all users | Admin, Supervisor |
| PATCH | \`/api/users/{id}\` | Update user role or status | Admin |
| DELETE | \`/api/users/{id}\` | Deactivate user account | Admin |

---

### Complaints API

Core complaint lifecycle management.

${swImg('swagger-04-complaints.png', 'Complaints API')}

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | \`/api/complaints/\` | List complaints (role-filtered) | Any |
| POST | \`/api/complaints/\` | Register a new complaint | Customer |
| GET | \`/api/complaints/{id}\` | Get complaint detail | Any |
| POST | \`/api/complaints/{id}/assign\` | Assign complaint to agent | Admin, Supervisor |
| PATCH | \`/api/complaints/{id}/status\` | Update status with comment | Any |
| GET | \`/api/complaints/{id}/history\` | Full audit trail | Any |
| POST | \`/api/complaints/{id}/attachments\` | Upload file attachment | Any |

**Create complaint request:**
\`\`\`json
{ "category_id": 1, "description": "Issue details...", "priority": "High" }
\`\`\`

**Status update request:**
\`\`\`json
{ "status": "In Progress", "comment": "Started investigation" }
\`\`\`

---

### Categories API

Complaint category management.

${swImg('swagger-05-categories.png', 'Categories API')}

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | \`/api/categories/\` | List all categories | Any |
| POST | \`/api/categories/\` | Create new category | Admin |
| PATCH | \`/api/categories/{id}\` | Update category | Admin |
| DELETE | \`/api/categories/{id}\` | Delete category | Admin |

---

### Feedback API

Customer satisfaction ratings after resolution.

${swImg('swagger-06-feedback.png', 'Feedback API')}

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | \`/api/feedback/{complaint_id}\` | Submit rating (1–5 stars) | Customer |
| GET | \`/api/feedback/{complaint_id}\` | Get feedback for complaint | Any |

**Submit feedback request:**
\`\`\`json
{ "rating": 4, "comments": "Issue was resolved quickly." }
\`\`\`

---

### Notifications API

In-app notification management.

${swImg('swagger-07-notifications.png', 'Notifications API')}

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | \`/api/notifications/\` | List current user's notifications | Any |
| PATCH | \`/api/notifications/{id}/read\` | Mark one notification as read | Any |
| PATCH | \`/api/notifications/read-all\` | Mark all notifications as read | Any |

---

### Dashboard API

Aggregate statistics for operational reporting.

${swImg('swagger-08-dashboard.png', 'Dashboard API')}

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | \`/api/dashboard/stats\` | Overall KPIs (total, open, escalated, SLA breaches, avg rating) | Admin, Supervisor, Quality Team |
| GET | \`/api/dashboard/agent-stats/{id}\` | Per-agent metrics | Admin, Supervisor |
| GET | \`/api/dashboard/category-breakdown\` | Complaint count per category | Admin, Supervisor, Quality Team |

---

### Analytics API *(Phase 2)*

ETL pipeline control and analytics data endpoints.

${swImg('swagger-09-analytics.png', 'Analytics API')}

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | \`/api/analytics/run-etl\` | Trigger ETL pipeline (CSV → transform → load) | Admin, Supervisor, Quality Team |
| GET | \`/api/analytics/summary\` | Overall analytics totals | Admin, Supervisor, Quality Team |
| GET | \`/api/analytics/sla-report\` | SLA breach counts by priority | Admin, Supervisor, Quality Team |
| GET | \`/api/analytics/category-analysis\` | Volume + avg resolution by category | Admin, Supervisor, Quality Team |
| GET | \`/api/analytics/resolution-trends\` | Monthly totals and resolved counts | Admin, Supervisor, Quality Team |
| GET | \`/api/analytics/agent-performance\` | Per-agent resolution rate and SLA stats | Admin, Supervisor, Quality Team |

**ETL response:**
\`\`\`json
{ "status": "success", "extracted": 250, "transformed": 250, "loaded": 250 }
\`\`\`

**Summary response:**
\`\`\`json
{
  "total_records": 250,
  "sla_breached": 47,
  "sla_compliant": 203,
  "resolved": 198,
  "breach_rate": 18.8,
  "avg_resolution_hours": 31.4
}
\`\`\`

---

### Swagger Authorization

To test protected endpoints in the Swagger UI:

1. Call \`POST /api/auth/login\` with your credentials and copy the \`access_token\` value.
2. Click the **Authorize** button at the top of the Swagger page.
3. Enter the token value (without "Bearer " prefix) and click **Authorize**.

${swImg('swagger-auth-dialog.png', 'Swagger Auth Dialog')}

${swImg('swagger-authorized.png', 'Swagger Authorized')}

---

## 9. ETL File Format

The Phase 2 ETL reads from \`backend/etl/dataset/complaints_dataset.csv\` — a 250-record synthetic dataset.

| Column | Type | Notes |
|---|---|---|
| complaint_id | String | Unique identifier |
| customer_name | String | Full name |
| category | String | Must match a known category |
| priority | String | Low / Medium / High / Critical |
| status | String | Open / Assigned / In Progress / Pending Customer Response / Escalated / Resolved / Closed |
| assigned_agent | String | Agent full name (nullable) |
| created_date | ISO DateTime | \`YYYY-MM-DD HH:MM:SS\` |
| resolved_date | ISO DateTime | Nullable — set when resolved |
| resolution_time_hours | Float | Calculated from date diff |
| sla_threshold_hours | Float | 4 / 24 / 48 / 72 by priority |
| description | Text | Complaint description |

The transform step:
- Normalizes priority and status casing
- Recalculates \`resolution_time_hours\` from date columns
- Sets \`sla_breached = True\` if \`resolution_time_hours > sla_threshold_hours\`

The load step uses upsert logic — existing \`complaint_id\` rows are updated, new ones are inserted.

---

## 10. Project Structure

\`\`\`
Customer complaint and resolution tracking System/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point, CORS, table creation
│   │   ├── config.py                # pydantic-settings environment config
│   │   ├── database.py              # SQLAlchemy engine, session, Base
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── role.py
│   │   │   ├── complaint.py
│   │   │   ├── category.py
│   │   │   ├── complaint_history.py
│   │   │   ├── attachment.py
│   │   │   ├── feedback.py
│   │   │   ├── notification.py
│   │   │   └── analytics.py         # Phase 2 — analytics_complaints table
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── complaint.py
│   │   │   ├── category.py
│   │   │   ├── feedback.py
│   │   │   ├── notification.py
│   │   │   └── auth.py
│   │   ├── routers/
│   │   │   ├── auth.py              # /api/auth/*
│   │   │   ├── users.py             # /api/users/*
│   │   │   ├── complaints.py        # /api/complaints/*
│   │   │   ├── categories.py        # /api/categories/*
│   │   │   ├── feedback.py          # /api/feedback/*
│   │   │   ├── notifications.py     # /api/notifications/*
│   │   │   ├── dashboard.py         # /api/dashboard/*
│   │   │   └── analytics.py         # Phase 2 — /api/analytics/*
│   │   ├── services/
│   │   │   ├── complaint_service.py
│   │   │   ├── sla_service.py
│   │   │   └── notification_service.py
│   │   └── core/
│   │       ├── security.py          # bcrypt + JWT
│   │       └── dependencies.py      # get_current_user, require_roles
│   ├── etl/                         # Phase 2 — ETL pipeline
│   │   ├── etl_pipeline.py          # Orchestrator
│   │   ├── extract.py               # Reads CSV
│   │   ├── transform.py             # Normalises, calculates SLA breach
│   │   ├── load.py                  # Upserts to analytics_complaints
│   │   └── dataset/
│   │       └── complaints_dataset.csv  # 250-record synthetic dataset
│   ├── seed.py                      # Seeds roles + categories
│   ├── uploads/                     # Complaint file attachments
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── api/                     # Axios wrappers
│       │   ├── axios.js             # Base instance + interceptors
│       │   ├── auth.js
│       │   ├── complaints.js
│       │   ├── categories.js
│       │   ├── users.js
│       │   ├── feedback.js
│       │   ├── notifications.js
│       │   ├── dashboard.js
│       │   └── analytics.js         # Phase 2 — analytics API calls
│       ├── components/
│       │   ├── Layout.jsx           # Sidebar + topbar shell
│       │   ├── ProtectedRoute.jsx
│       │   ├── PriorityBadge.jsx
│       │   └── StatusBadge.jsx
│       ├── context/
│       │   └── AuthContext.jsx      # JWT + user state
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Categories.jsx
│       │   ├── Analytics.jsx        # Phase 2 — ETL trigger + 4 charts
│       │   ├── complaints/
│       │   │   ├── ComplaintList.jsx
│       │   │   ├── ComplaintDetail.jsx
│       │   │   └── NewComplaint.jsx
│       │   └── users/
│       │       └── UserManagement.jsx
│       └── styles/
│           ├── layout.css
│           ├── auth.css
│           ├── complaints.css
│           ├── dashboard.css
│           └── analytics.css        # Phase 2 styles
│
├── screenshots/                     # Auto-generated by capture.js
│   ├── 01-login.png
│   ├── 02-register.png
│   ├── 03-dashboard.png
│   ├── 04-complaint-list.png
│   ├── 05-new-complaint.png
│   ├── 06-complaint-detail.png
│   ├── 07-user-management.png
│   ├── 08-categories.png
│   ├── 09-analytics.png
│   └── swagger/
│       ├── swagger-01-overview.png
│       ├── swagger-02-auth.png
│       ├── swagger-03-users.png
│       ├── swagger-04-complaints.png
│       ├── swagger-05-categories.png
│       ├── swagger-06-feedback.png
│       ├── swagger-07-notifications.png
│       ├── swagger-08-dashboard.png
│       ├── swagger-09-analytics.png
│       ├── swagger-auth-dialog.png
│       └── swagger-authorized.png
│
├── capture.js                       # Screenshot automation (Puppeteer)
├── seed-demo-users.js               # DB seeder
├── generate-readme.js               # README generator
├── package.json                     # Automation scripts + deps
├── .env                             # Local config (never commit)
├── .env.example                     # Config template (commit this)
├── CLAUDE.md                        # Project automation context
└── README.md                        # This file (auto-generated)
\`\`\`

---

## 11. Scripts Reference

Run these from the **project root** directory.

| Command | Description |
|---|---|
| \`npm run seed\` | Seed demo users (5 roles), categories, complaints, and trigger Phase 2 ETL |
| \`npm run capture\` | Capture all frontend page screenshots and Swagger UI screenshots |
| \`npm run generate-readme\` | Regenerate this README from screenshots + source |
| \`npm run setup\` | Run seed → capture → generate-readme in sequence |

> Never manually edit \`README.md\`. Edit \`generate-readme.js\` and re-run \`npm run generate-readme\`.
`;

const outPath = path.join(ROOT, 'README.md');
fs.writeFileSync(outPath, README, 'utf8');

// Count documented pages and endpoints
const pages     = 9;
const endpoints = 3 + 4 + 7 + 4 + 2 + 3 + 3 + 6; // 32 total

const existingScreenshots  = fs.existsSync(SS_DIR)      ? fs.readdirSync(SS_DIR).filter(f => f.endsWith('.png')).length : 0;
const existingSwagger      = fs.existsSync(SWAGGER_DIR)  ? fs.readdirSync(SWAGGER_DIR).filter(f => f.endsWith('.png')).length : 0;

console.log('=== README Generation Complete ===');
console.log(`  Frontend pages documented  : ${pages}`);
console.log(`  API endpoints documented   : ${endpoints} across 8 groups`);
console.log(`  Frontend screenshots found : ${existingScreenshots}`);
console.log(`  Swagger screenshots found  : ${existingSwagger}`);
console.log(`  Output: ${outPath}\n`);
