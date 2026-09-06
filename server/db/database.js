const { Pool, types } = require('pg');
const bcrypt = require('bcryptjs');

/*
 * ============================================================
 * LUXURY PROPERTIES
 * Supabase PostgreSQL Database Layer
 * ============================================================
 *
 * The rest of the application uses:
 *   db.get()
 *   db.all()
 *   db.run()
 *
 * This file keeps that same interface so the existing
 * auth/admin/user routes do not need to be rewritten.
 */

// PostgreSQL NUMERIC -> JavaScript number
types.setTypeParser(1700, value => parseFloat(value));

// PostgreSQL BIGINT -> JavaScript number
types.setTypeParser(20, value => parseInt(value, 10));

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is missing. ' +
    'Add DATABASE_URL in Render Environment Variables.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', err => {
  console.error('[Database] Unexpected PostgreSQL pool error:', err);
});

/*
 * Convert SQLite-style ? placeholders to PostgreSQL $1, $2...
 */
function convertPlaceholders(sql) {
  let index = 0;

  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

/*
 * Convert SQLite:
 *
 *   INSERT OR IGNORE INTO ...
 *
 * to PostgreSQL:
 *
 *   INSERT INTO ... ON CONFLICT DO NOTHING
 */
function convertSql(sql) {
  let converted = sql.trim();

  converted = converted.replace(
    /^INSERT\s+OR\s+IGNORE\s+INTO\s+/i,
    'INSERT INTO '
  );

  /*
   * Add ON CONFLICT DO NOTHING to INSERT OR IGNORE queries.
   */
  if (/^INSERT\s+INTO\s+/i.test(converted)) {
    if (!/ON\s+CONFLICT/i.test(converted)) {
      converted += ' ON CONFLICT DO NOTHING';
    }

    /*
     * db.run() needs an inserted ID because the existing
     * registration/admin code expects result.lastID.
     */
    if (
      !/RETURNING\s+/i.test(converted) &&
      !/^INSERT\s+INTO\s+transactions/i.test(converted) &&
      !/^INSERT\s+INTO\s+system_settings/i.test(converted)
    ) {
      converted += ' RETURNING id';
    }
  }

  return convertPlaceholders(converted);
}

/*
 * ============================================================
 * Unified Database Interface
 * ============================================================
 */

const db = {
  // Existing routes use this to decide whether to use SQL.
  isNative: true,

  /*
   * INSERT / UPDATE / DELETE
   */
  async run(sql, params = []) {
    const query = convertSql(sql);

    try {
      const result = await pool.query(query, params);

      const insertedId =
        result.rows &&
        result.rows.length > 0 &&
        result.rows[0].id !== undefined
          ? result.rows[0].id
          : undefined;

      return {
        lastID: insertedId,
        changes: result.rowCount || 0
      };
    } catch (err) {
      console.error('[Database] RUN error:', err.message);
      console.error('[Database] SQL:', query);
      throw err;
    }
  },

  /*
   * Return one row
   */
  async get(sql, params = []) {
    const query = convertPlaceholders(sql);

    try {
      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (err) {
      console.error('[Database] GET error:', err.message);
      console.error('[Database] SQL:', query);
      throw err;
    }
  },

  /*
   * Return multiple rows
   */
  async all(sql, params = []) {
    const query = convertPlaceholders(sql);

    try {
      const result = await pool.query(query, params);
      return result.rows || [];
    } catch (err) {
      console.error('[Database] ALL error:', err.message);
      console.error('[Database] SQL:', query);
      throw err;
    }
  },

  /*
   * Kept for compatibility with existing code.
   * PostgreSQL is now the real persistent database.
   */
  fileStore: null
};

/*
 * ============================================================
 * Database Initialization
 * ============================================================
 *
 * Tables were already created in Supabase SQL Editor.
 * We only verify the connection and seed default data.
 */

async function initDatabase() {
  try {
    const result = await pool.query(
      'SELECT NOW() AS server_time'
    );

    console.log(
      '[Database] Connected to Supabase PostgreSQL successfully.'
    );

    console.log(
      '[Database] PostgreSQL server time:',
      result.rows[0].server_time
    );

    await seedDefaults();

    console.log(
      '[Database] Supabase database initialized and verified successfully.'
    );
  } catch (err) {
    console.error(
      '[Database] Supabase PostgreSQL connection failed:',
      err.message
    );

    throw err;
  }
}

/*
 * ============================================================
 * Seed Initial Data
 * ============================================================
 *
 * These inserts are safe/idempotent.
 * Existing users and records are NOT overwritten.
 */

async function seedDefaults() {
  // ----------------------------------------------------------
  // 1. System Settings
  // ----------------------------------------------------------

  const defaultSettings = [
    { key: 'min_tasks', value: '0' },
    { key: 'max_tasks', value: '10' },
    { key: 'default_task_reward', value: '150' },
    { key: 'negative_trigger_task', value: '5' },
    { key: 'negative_balance_amount', value: '100' }
  ];

  for (const s of defaultSettings) {
    await db.run(
      `INSERT OR IGNORE INTO system_settings (key, value)
       VALUES (?, ?)`,
      [s.key, s.value]
    );
  }

  // ----------------------------------------------------------
  // 2. Master Admin
  // ----------------------------------------------------------

  const adminPasswordHash = bcrypt.hashSync(
    'admin123',
    10
  );

  let existingAdmin = await db.get(
    `SELECT id FROM admins WHERE email = ?`,
    ['admin@luxury.com']
  );

  if (!existingAdmin) {
    const adminResult = await db.run(
      `INSERT INTO admins
       (username, email, password_hash, name)
       VALUES (?, ?, ?, ?)`,
      [
        'admin',
        'admin@luxury.com',
        adminPasswordHash,
        'Master Admin'
      ]
    );

    console.log(
      '[Seed] Master admin account created: admin@luxury.com / admin123'
    );

    existingAdmin = {
      id: adminResult.lastID
    };
  }

  // ----------------------------------------------------------
  // 3. Demo User
  // ----------------------------------------------------------

  const userPasswordHash = bcrypt.hashSync(
    'user123',
    10
  );

  let existingUser = await db.get(
    `SELECT id FROM users WHERE email = ?`,
    ['suresh@example.com']
  );

  let userId;

  if (!existingUser) {
    const userResult = await db.run(
      `INSERT INTO users
       (
         username,
         email,
         password_hash,
         phone,
         name,
         status,
         balance,
         negative_balance,
         total_deposit,
         total_earnings,
         total_withdrawn
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'suresh',
        'suresh@example.com',
        userPasswordHash,
        '+94 77 123 4567',
        'Suresh Perera',
        'active',
        25750.00,
        100.00,
        50000.00,
        7350.00,
        0.00
      ]
    );

    userId = userResult.lastID;

    console.log(
      '[Seed] Demo user created: suresh@example.com / user123 (Suresh Perera)'
    );
  } else {
    userId = existingUser.id;
  }

  // ----------------------------------------------------------
  // 4. Tasks 1 - 50
  // ----------------------------------------------------------

  for (let i = 1; i <= 50; i++) {
    const title =
      `Task ${i}: Luxury Property Verification & Rating`;

    const desc =
      `Verify listing details, image clarity, and neighborhood review for Luxury Villa #${100 + i}.`;

    await db.run(
      `INSERT OR IGNORE INTO tasks
       (
         task_number,
         title,
         description,
         reward_amount,
         is_active,
         order_index
       )
       VALUES (?, ?, ?, ?, 1, ?)`,
      [
        i,
        title,
        desc,
        150.00,
        i
      ]
    );
  }

  // ----------------------------------------------------------
  // 5. Demo User Tasks
  // ----------------------------------------------------------

  const taskCount = await db.get(
    `SELECT COUNT(*) AS cnt
     FROM user_tasks
     WHERE user_id = ?`,
    [userId]
  );

  if (Number(taskCount?.cnt || 0) === 0) {

    await db.run(
      `INSERT INTO user_tasks
       (
         user_id,
         task_id,
         task_number,
         status,
         completed_at,
         reward_credited,
         negative_triggered
       )
       VALUES (?, ?, ?, 'completed', ?, ?, ?)`,
      [
        userId,
        1,
        1,
        '2025-09-01 10:00:00',
        150.00,
        0
      ]
    );

    await db.run(
      `INSERT INTO user_tasks
       (
         user_id,
         task_id,
         task_number,
         status,
         completed_at,
         reward_credited,
         negative_triggered
       )
       VALUES (?, ?, ?, 'completed', ?, ?, ?)`,
      [
        userId,
        2,
        2,
        '2025-09-01 14:00:00',
        150.00,
        0
      ]
    );

    await db.run(
      `INSERT INTO user_tasks
       (
         user_id,
         task_id,
         task_number,
         status,
         completed_at,
         reward_credited,
         negative_triggered
       )
       VALUES (?, ?, ?, 'completed', ?, ?, ?)`,
      [
        userId,
        3,
        3,
        '2025-09-02 09:30:00',
        150.00,
        0
      ]
    );

    for (let t = 4; t <= 10; t++) {
      await db.run(
        `INSERT INTO user_tasks
         (
           user_id,
           task_id,
           task_number,
           status,
           negative_triggered
         )
         VALUES (?, ?, ?, 'pending', 0)`,
        [
          userId,
          t,
          t
        ]
      );
    }
  }

  // ----------------------------------------------------------
  // 6. Properties
  // ----------------------------------------------------------

  const defaultProps = [
    {
      title: 'Ocean View Villa',
      description:
        'Exclusive beachfront residence with panoramic ocean vistas, private infinity pool, and premium smart home automation.',
      location: 'Colombo, Sri Lanka',
      price: 75000000.00,
      status: 'available',
      bedrooms: 5,
      bathrooms: 4,
      area_sqft: 5200,
      featured_image:
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Luxury Apartment',
      description:
        'High-floor penthouse featuring floor-to-ceiling glass, Italian marble flooring, and concierge services.',
      location: 'Rajagiriya, Sri Lanka',
      price: 45000000.00,
      status: 'available',
      bedrooms: 3,
      bathrooms: 3,
      area_sqft: 2800,
      featured_image:
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Royal Palm Estate',
      description:
        'Grand colonial sanctuary surrounded by landscaped gardens, private tennis court, and guest bungalow.',
      location: 'Kandy, Sri Lanka',
      price: 120000000.00,
      status: 'available',
      bedrooms: 6,
      bathrooms: 6,
      area_sqft: 7800,
      featured_image:
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  for (const p of defaultProps) {
    const exists = await db.get(
      `SELECT id FROM properties WHERE title = ?`,
      [p.title]
    );

    if (!exists) {
      await db.run(
        `INSERT INTO properties
         (
           title,
           description,
           location,
           price,
           status,
           bedrooms,
           bathrooms,
           area_sqft,
           featured_image
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.title,
          p.description,
          p.location,
          p.price,
          p.status,
          p.bedrooms,
          p.bathrooms,
          p.area_sqft,
          p.featured_image
        ]
      );
    }
  }

  // ----------------------------------------------------------
  // 7. Demo Transactions
  // ----------------------------------------------------------

  const defaultTx = [
    {
      id: 'TXN-98421',
      user_id: userId,
      type: 'Task Reward',
      description: 'Task 3 Completed',
      amount: 150.00,
      balance_after: 25750.00,
      status: 'Completed',
      created_by: 'System',
      created_at: '2025-09-02 09:30:00'
    },
    {
      id: 'TXN-98420',
      user_id: userId,
      type: 'Deposit',
      description: 'Deposit LKR 50,000',
      amount: 50000.00,
      balance_after: 25600.00,
      status: 'Approved',
      created_by: 'Admin',
      created_at: '2025-09-01 16:45:00'
    },
    {
      id: 'TXN-98419',
      user_id: userId,
      type: 'Admin Adjustment',
      description: 'Negative Balance',
      amount: -100.00,
      balance_after: -100.00,
      status: 'Applied',
      created_by: 'Admin',
      created_at: '2025-09-01 11:20:00'
    }
  ];

  for (const tx of defaultTx) {
    await db.run(
      `INSERT OR IGNORE INTO transactions
       (
         id,
         user_id,
         type,
         description,
         amount,
         balance_after,
         status,
         created_by,
         created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tx.id,
        tx.user_id,
        tx.type,
        tx.description,
        tx.amount,
        tx.balance_after,
        tx.status,
        tx.created_by,
        tx.created_at
      ]
    );
  }

  // ----------------------------------------------------------
  // 8. Initial Audit Log
  // ----------------------------------------------------------

  const auditCount = await db.get(
    `SELECT COUNT(*) AS cnt FROM audit_logs`
  );

  if (Number(auditCount?.cnt || 0) === 0) {
    await db.run(
      `INSERT INTO audit_logs
       (
         admin_id,
         admin_name,
         action,
         setting_name,
         previous_value,
         new_value,
         user_affected_id,
         reason,
         created_at
       )
       VALUES
       (
         1,
         'Master Admin',
         'Negative Balance Configured',
         'negative_trigger_task',
         'Task 3',
         'Task 5',
         NULL,
         'Initial system deployment rule',
         '2025-09-01 10:00:00'
       )`
    );
  }

  console.log('[Database] Default data verified.');
}

module.exports = {
  db,
  initDatabase,
  fileStore: null
};
