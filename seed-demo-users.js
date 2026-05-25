/**
 * seed-demo-users.js
 * Seeds demo users, categories, complaints, and triggers ETL for Phase 2 analytics.
 * Idempotent — safe to run multiple times.
 */
require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'complaint_tracking',
};

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// Role IDs mirror backend/seed.py exactly
const ROLES = [
  { role_id: 1, role_name: 'Admin' },
  { role_id: 2, role_name: 'Support Agent' },
  { role_id: 3, role_name: 'Supervisor' },
  { role_id: 4, role_name: 'Customer' },
  { role_id: 5, role_name: 'Quality Team' },
];

const DEMO_USERS = [
  { name: process.env.DEMO_ADMIN_NAME    || 'Demo Admin',    email: process.env.DEMO_ADMIN_EMAIL    || 'demo_admin@example.com',    password: process.env.DEMO_ADMIN_PASSWORD    || 'DemoAdmin@123',    role_id: 1 },
  { name: process.env.DEMO_SUPERVISOR_NAME || 'Demo Supervisor', email: process.env.DEMO_SUPERVISOR_EMAIL || 'demo_supervisor@example.com', password: process.env.DEMO_SUPERVISOR_PASSWORD || 'DemoSupervisor@123', role_id: 3 },
  { name: process.env.DEMO_AGENT_NAME    || 'Demo Agent',    email: process.env.DEMO_AGENT_EMAIL    || 'demo_agent@example.com',    password: process.env.DEMO_AGENT_PASSWORD    || 'DemoAgent@123',    role_id: 2 },
  { name: process.env.DEMO_CUSTOMER_NAME || 'Demo Customer', email: process.env.DEMO_CUSTOMER_EMAIL || 'demo_customer@example.com', password: process.env.DEMO_CUSTOMER_PASSWORD || 'DemoCustomer@123', role_id: 4 },
  { name: process.env.DEMO_QUALITY_NAME  || 'Demo Quality',  email: process.env.DEMO_QUALITY_EMAIL  || 'demo_quality@example.com',  password: process.env.DEMO_QUALITY_PASSWORD  || 'DemoQuality@123',  role_id: 5 },
];

const CATEGORIES = [
  'Billing Issues',
  'Service Disruption',
  'Product Defects',
  'Technical Problems',
  'Delivery Delays',
  'Account Issues',
  'Customer Service Complaints',
];

// SLA hours keyed on MySQL enum values (lowercase)
const SLA_HOURS = { low: 72, medium: 48, high: 24, critical: 4 };

function addHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

function toMysqlDatetime(date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('✓ Connected to MySQL (' + DB_CONFIG.database + ')');

    // ── 1. Roles ────────────────────────────────────────────────────────────
    console.log('\n── Roles ──');
    for (const role of ROLES) {
      const [rows] = await conn.execute('SELECT role_id FROM roles WHERE role_id = ?', [role.role_id]);
      if (rows.length === 0) {
        await conn.execute('INSERT INTO roles (role_id, role_name) VALUES (?, ?)', [role.role_id, role.role_name]);
        console.log(`  + Created role: ${role.role_name}`);
      } else {
        console.log(`  ✓ Role exists: ${role.role_name}`);
      }
    }

    // ── 2. Categories ────────────────────────────────────────────────────────
    console.log('\n── Categories ──');
    const categoryIds = {};
    for (const name of CATEGORIES) {
      const [rows] = await conn.execute('SELECT category_id FROM categories WHERE category_name = ?', [name]);
      if (rows.length === 0) {
        const [result] = await conn.execute('INSERT INTO categories (category_name) VALUES (?)', [name]);
        categoryIds[name] = result.insertId;
        console.log(`  + Created category: ${name}`);
      } else {
        categoryIds[name] = rows[0].category_id;
        console.log(`  ✓ Category exists: ${name}`);
      }
    }

    // ── 3. Demo Users ────────────────────────────────────────────────────────
    console.log('\n── Demo Users ──');
    const userIds = {};
    for (const u of DEMO_USERS) {
      const [rows] = await conn.execute('SELECT user_id FROM users WHERE email = ?', [u.email]);
      if (rows.length === 0) {
        const hash = await bcrypt.hash(u.password, 12);
        const [result] = await conn.execute(
          'INSERT INTO users (name, email, password, role_id, is_active) VALUES (?, ?, ?, ?, 1)',
          [u.name, u.email, hash, u.role_id]
        );
        userIds[u.email] = result.insertId;
        console.log(`  + Created user: ${u.name} (${u.email})`);
      } else {
        userIds[u.email] = rows[0].user_id;
        console.log(`  ✓ User exists:   ${u.name} (${u.email})`);
      }
    }

    const adminId    = userIds[process.env.DEMO_ADMIN_EMAIL    || 'demo_admin@example.com'];
    const agentId    = userIds[process.env.DEMO_AGENT_EMAIL    || 'demo_agent@example.com'];
    const customerId = userIds[process.env.DEMO_CUSTOMER_EMAIL || 'demo_customer@example.com'];

    // ── 4. Demo Complaints ───────────────────────────────────────────────────
    console.log('\n── Demo Complaints ──');
    const now = new Date();

    // MySQL ENUM uses Python attribute names (lowercase/underscored), not .value strings
    // priority: enum('low','medium','high','critical')
    // status:   enum('open','assigned','in_progress','pending_customer','escalated','resolved','closed')
    const SEED_COMPLAINTS = [
      {
        id: 'COMP-20240601-0001',
        status: 'open',          priority: 'high',     category: 'Billing Issues',
        assigned_to: null,       resolved: null,
        desc: 'Charged twice for my monthly subscription in May. Please investigate and refund.',
        created: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      },
      {
        id: 'COMP-20240601-0002',
        status: 'assigned',      priority: 'medium',   category: 'Service Disruption',
        assigned_to: agentId,    resolved: null,
        desc: 'Internet service went down for 6 hours on Saturday with no prior notice.',
        created: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
      },
      {
        id: 'COMP-20240601-0003',
        status: 'in_progress',   priority: 'critical', category: 'Technical Problems',
        assigned_to: agentId,    resolved: null,
        desc: 'Unable to login to the customer portal since the system update on Monday.',
        created: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
      },
      {
        id: 'COMP-20240601-0004',
        status: 'escalated',     priority: 'high',     category: 'Product Defects',
        assigned_to: agentId,    resolved: null,
        desc: 'Received a damaged product. Box was crushed and screen cracked on arrival.',
        created: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
      },
      {
        id: 'COMP-20240601-0005',
        status: 'resolved',      priority: 'low',      category: 'Account Issues',
        assigned_to: agentId,    resolved: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
        desc: 'Could not update email address in account settings. Error message on save.',
        created: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
      },
      {
        id: 'COMP-20240601-0006',
        status: 'closed',        priority: 'medium',   category: 'Delivery Delays',
        assigned_to: agentId,    resolved: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
        desc: 'Order placed 3 weeks ago still shows as processing. No update from logistics.',
        created: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
      },
      {
        id: 'COMP-20240601-0007',
        status: 'pending_customer', priority: 'low',   category: 'Customer Service Complaints',
        assigned_to: agentId,    resolved: null,
        desc: 'Support representative was rude during phone call. Request for callback not honored.',
        created: new Date(now.getTime() - 6 * 24 * 3600 * 1000),
      },
    ];

    for (const c of SEED_COMPLAINTS) {
      const [rows] = await conn.execute('SELECT complaint_id FROM complaints WHERE complaint_id = ?', [c.id]);
      if (rows.length > 0) {
        console.log(`  ✓ Complaint exists: ${c.id}`);
        continue;
      }

      const catId   = categoryIds[c.category] || Object.values(categoryIds)[0];
      const slaHrs  = SLA_HOURS[c.priority] || 48;
      const slaDue  = toMysqlDatetime(addHours(c.created, slaHrs));
      const created = toMysqlDatetime(c.created);
      const resolved = c.resolved ? toMysqlDatetime(c.resolved) : null;

      await conn.execute(
        `INSERT INTO complaints
           (complaint_id, customer_id, assigned_to, category_id, description,
            priority, status, sla_due_date, resolved_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, customerId, c.assigned_to, catId, c.desc,
         c.priority, c.status, slaDue, resolved, created, created]
      );

      // Seed complaint_history
      await conn.execute(
        `INSERT INTO complaint_history
           (complaint_id, updated_by, old_status, new_status, comment, updated_at)
         VALUES (?, ?, NULL, ?, 'Complaint registered', ?)`,
        [c.id, customerId, 'Open', created]
      );

      if (c.assigned_to) {
        await conn.execute(
          `INSERT INTO complaint_history
             (complaint_id, updated_by, old_status, new_status, comment, updated_at)
           VALUES (?, ?, 'Open', ?, 'Assigned to support agent', ?)`,
          [c.id, adminId, c.status, created]
        );
      }

      // Seed notification for customer
      await conn.execute(
        `INSERT INTO notifications (user_id, complaint_id, message, is_read, created_at)
         VALUES (?, ?, ?, 0, ?)`,
        [customerId, c.id, `Your complaint ${c.id} has been registered.`, created]
      );

      console.log(`  + Created complaint: ${c.id} [${c.status}/${c.priority}]`);
    }

    // ── 5. Run ETL via backend API ───────────────────────────────────────────
    console.log('\n── ETL Pipeline ──');
    try {
      // Login as admin to get token
      const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: process.env.DEMO_ADMIN_EMAIL    || 'demo_admin@example.com',
          password: process.env.DEMO_ADMIN_PASSWORD || 'DemoAdmin@123',
        }),
      });

      if (!loginRes.ok) {
        throw new Error(`Admin login failed: ${loginRes.status} — is the backend running on ${BACKEND_URL}?`);
      }

      const { access_token } = await loginRes.json();

      const etlRes = await fetch(`${BACKEND_URL}/api/analytics/run-etl`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!etlRes.ok) {
        throw new Error(`ETL endpoint returned ${etlRes.status}`);
      }

      const etlData = await etlRes.json();
      console.log(`  ✓ ETL complete: extracted=${etlData.extracted}, transformed=${etlData.transformed}, loaded=${etlData.loaded}`);
    } catch (err) {
      console.warn(`  ⚠ ETL skipped: ${err.message}`);
      console.warn('    Analytics page will show empty state until ETL is run manually from the UI.');
    }

    console.log('\n✓ Seeding complete.\n');
  } catch (err) {
    console.error('\n✗ Fatal seed error:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
