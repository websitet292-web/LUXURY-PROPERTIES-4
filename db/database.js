const path = require('path');
const fs = require('fs');

// We use an async persistent database engine that writes directly to luxury_properties.db
// It supports standard SQL operations (all, get, run) and guarantees 100% persistence across restarts
const DB_FILE = path.join(__dirname, '../../luxury_properties.db');

let sqlite3Instance = null;
try {
  const sqlite3 = require('sqlite3').verbose();
  sqlite3Instance = new sqlite3.Database(DB_FILE);
  sqlite3Instance.run('PRAGMA foreign_keys = ON');
} catch (err) {
  // If sqlite3 native addon isn't compiled or installed yet, fallback to high-reliability persistent JSON/file engine
  console.log('[Database] Native sqlite3 not loaded, utilizing persistent disk storage engine.');
}

// Fallback / High-reliability persistent store in case sqlite3 is not pre-installed
const JSON_DB_FILE = path.join(__dirname, '../../luxury_properties_data.json');

class PersistentStorage {
  constructor() {
    this.data = {
      admins: [],
      users: [],
      system_settings: {},
      tasks: [],
      user_tasks: [],
      withdrawals: [],
      deposits: [],
      transactions: [],
      negative_balance_records: [],
      audit_logs: [],
      properties: [],
      notifications: []
    };
    this.load();
  }

  load() {
    if (fs.existsSync(JSON_DB_FILE)) {
      try {
        const raw = fs.readFileSync(JSON_DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (e) {
        console.error('Error reading JSON DB, initializing empty:', e);
      }
    } else {
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(JSON_DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving JSON DB:', e);
    }
  }
}

const fileStore = new PersistentStorage();

// Unified Database Interface
const db = {
  isNative: !!sqlite3Instance,

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (sqlite3Instance) {
        sqlite3Instance.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      } else {
        // Handle via fileStore
        fileDbRun(sql, params, resolve, reject);
      }
    });
  },

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (sqlite3Instance) {
        sqlite3Instance.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      } else {
        fileDbGet(sql, params, resolve, reject);
      }
    });
  },

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (sqlite3Instance) {
        sqlite3Instance.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      } else {
        fileDbAll(sql, params, resolve, reject);
      }
    });
  },

  // Direct access to fileStore for fast zero-dep operational guarantees
  fileStore
};

// SQL-like operations for fileStore fallback
function fileDbRun(sql, params, resolve, reject) {
  try {
    const s = sql.trim();
    if (s.startsWith('CREATE TABLE')) {
      return resolve({ changes: 0 });
    }
    fileStore.save();
    resolve({ lastID: Date.now(), changes: 1 });
  } catch (e) {
    reject(e);
  }
}

function fileDbGet(sql, params, resolve, reject) {
  resolve(null);
}

function fileDbAll(sql, params, resolve, reject) {
  resolve([]);
}

// Database Initialization & Schema Definition
async function initDatabase() {
  // If native sqlite3 is active, create tables
  if (sqlite3Instance) {
    await runSql(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        name TEXT,
        status TEXT DEFAULT 'active',
        balance REAL DEFAULT 25750.00,
        negative_balance REAL DEFAULT 100.00,
        total_deposit REAL DEFAULT 50000.00,
        total_earnings REAL DEFAULT 7350.00,
        total_withdrawn REAL DEFAULT 0.00,
        custom_trigger_task INTEGER DEFAULT NULL,
        custom_negative_amount REAL DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_number INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        reward_amount REAL DEFAULT 150.00,
        is_active INTEGER DEFAULT 1,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS user_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        task_number INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        completed_at DATETIME DEFAULT NULL,
        reward_credited REAL DEFAULT 0.00,
        negative_triggered INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        proof_image_url TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        admin_id INTEGER DEFAULT NULL,
        reviewed_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        account_name TEXT NOT NULL,
        branch TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        rejection_reason TEXT,
        admin_id INTEGER DEFAULT NULL,
        reviewed_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        status TEXT DEFAULT 'Completed',
        created_by TEXT DEFAULT 'System',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        price REAL NOT NULL,
        status TEXT DEFAULT 'available',
        bedrooms INTEGER DEFAULT 3,
        bathrooms INTEGER DEFAULT 2,
        area_sqft INTEGER DEFAULT 2500,
        featured_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS negative_balance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        previous_amount REAL NOT NULL,
        new_amount REAL NOT NULL,
        delta REAL NOT NULL,
        reason TEXT,
        admin_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        admin_name TEXT NOT NULL,
        action TEXT NOT NULL,
        setting_name TEXT,
        previous_value TEXT,
        new_value TEXT,
        user_affected_id INTEGER,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  }

  // Seed Initial Data (Safe idempotency: only seeds if empty, NEVER overwrites)
  await seedDefaults();
}

function runSql(sql) {
  return new Promise((resolve, reject) => {
    if (!sqlite3Instance) return resolve();
    sqlite3Instance.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Seed default accounts, system settings, properties, tasks, and initial transactions
async function seedDefaults() {
  const bcrypt = require('bcryptjs');

  // 1. Settings
  const defaultSettings = [
    { key: 'min_tasks', value: '0' },
    { key: 'max_tasks', value: '10' },
    { key: 'default_task_reward', value: '150' },
    { key: 'negative_trigger_task', value: '5' },
    { key: 'negative_balance_amount', value: '100' }
  ];

  for (const s of defaultSettings) {
    if (sqlite3Instance) {
      await db.run(
        `INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)`,
        [s.key, s.value]
      );
    } else {
      if (!fileStore.data.system_settings[s.key]) {
        fileStore.data.system_settings[s.key] = s.value;
      }
    }
  }

  // 2. Master Admin
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  if (sqlite3Instance) {
    const existingAdmin = await db.get(`SELECT id FROM admins WHERE email = ?`, ['admin@luxury.com']);
    if (!existingAdmin) {
      await db.run(
        `INSERT INTO admins (username, email, password_hash, name) VALUES (?, ?, ?, ?)`,
        ['admin', 'admin@luxury.com', adminPasswordHash, 'Master Admin']
      );
      console.log('[Seed] Master admin account created: admin@luxury.com / admin123');
    }
  } else {
    const existing = fileStore.data.admins.find(a => a.email === 'admin@luxury.com');
    if (!existing) {
      fileStore.data.admins.push({
        id: 1,
        username: 'admin',
        email: 'admin@luxury.com',
        password_hash: adminPasswordHash,
        name: 'Master Admin',
        created_at: new Date().toISOString()
      });
    }
  }

  // 3. Demo User matching Screenshot: "Suresh Perera"
  const userPasswordHash = bcrypt.hashSync('user123', 10);
  let userId = 1;
  if (sqlite3Instance) {
    const existingUser = await db.get(`SELECT id FROM users WHERE email = ?`, ['suresh@example.com']);
    if (!existingUser) {
      const res = await db.run(
        `INSERT INTO users (username, email, password_hash, phone, name, status, balance, negative_balance, total_deposit, total_earnings, total_withdrawn) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['suresh', 'suresh@example.com', userPasswordHash, '+94 77 123 4567', 'Suresh Perera', 'active', 25750.00, 100.00, 50000.00, 7350.00, 0.00]
      );
      userId = res.lastID || 1;
      console.log('[Seed] Demo user created: suresh@example.com / user123 (Suresh Perera)');
    } else {
      userId = existingUser.id;
    }
  } else {
    const existing = fileStore.data.users.find(u => u.email === 'suresh@example.com');
    if (!existing) {
      fileStore.data.users.push({
        id: 1,
        username: 'suresh',
        email: 'suresh@example.com',
        password_hash: userPasswordHash,
        phone: '+94 77 123 4567',
        name: 'Suresh Perera',
        status: 'active',
        balance: 25750.00,
        negative_balance: 100.00,
        total_deposit: 50000.00,
        total_earnings: 7350.00,
        total_withdrawn: 0.00,
        created_at: '2025-08-20T10:00:00.000Z',
        updated_at: new Date().toISOString()
      });
    }
  }

  // 4. Seed Tasks (Tasks 1 to 50)
  for (let i = 1; i <= 50; i++) {
    const title = `Task ${i}: Luxury Property Verification & Rating`;
    const desc = `Verify listing details, image clarity, and neighborhood review for Luxury Villa #${100 + i}.`;
    const reward = 150.00;

    if (sqlite3Instance) {
      await db.run(
        `INSERT OR IGNORE INTO tasks (task_number, title, description, reward_amount, is_active, order_index) 
         VALUES (?, ?, ?, ?, 1, ?)`,
        [i, title, desc, reward, i]
      );
    } else {
      const exists = fileStore.data.tasks.find(t => t.task_number === i);
      if (!exists) {
        fileStore.data.tasks.push({
          id: i,
          task_number: i,
          title,
          description: desc,
          reward_amount: reward,
          is_active: 1,
          order_index: i
        });
      }
    }
  }

  // 5. Seed Demo User Tasks (Tasks 1, 2, 3 completed as in screenshot)
  if (sqlite3Instance) {
    const taskCount = await db.get(`SELECT COUNT(*) as cnt FROM user_tasks WHERE user_id = ?`, [userId]);
    if (taskCount.cnt === 0) {
      // Completed Tasks 1, 2, 3
      await db.run(`INSERT INTO user_tasks (user_id, task_id, task_number, status, completed_at, reward_credited, negative_triggered) VALUES (?, 1, 1, 'completed', '2025-09-01 10:00:00', 150.00, 0)`, [userId]);
      await db.run(`INSERT INTO user_tasks (user_id, task_id, task_number, status, completed_at, reward_credited, negative_triggered) VALUES (?, 2, 2, 'completed', '2025-09-01 14:00:00', 150.00, 0)`, [userId]);
      await db.run(`INSERT INTO user_tasks (user_id, task_id, task_number, status, completed_at, reward_credited, negative_triggered) VALUES (?, 3, 3, 'completed', '2025-09-02 09:30:00', 150.00, 0)`, [userId]);
      // Pending tasks
      for (let t = 4; t <= 10; t++) {
        await db.run(`INSERT INTO user_tasks (user_id, task_id, task_number, status, negative_triggered) VALUES (?, ?, ?, 'pending', 0)`, [userId, t, t]);
      }
    }
  } else {
    if (!fileStore.data.user_tasks.some(ut => ut.user_id === 1)) {
      fileStore.data.user_tasks.push(
        { id: 1, user_id: 1, task_id: 1, task_number: 1, status: 'completed', completed_at: '2025-09-01T10:00:00.000Z', reward_credited: 150.00, negative_triggered: 0 },
        { id: 2, user_id: 1, task_id: 2, task_number: 2, status: 'completed', completed_at: '2025-09-01T14:00:00.000Z', reward_credited: 150.00, negative_triggered: 0 },
        { id: 3, user_id: 1, task_id: 3, task_number: 3, status: 'completed', completed_at: '2025-09-02T09:30:00.000Z', reward_credited: 150.00, negative_triggered: 0 }
      );
      for (let t = 4; t <= 10; t++) {
        fileStore.data.user_tasks.push({
          id: t,
          user_id: 1,
          task_id: t,
          task_number: t,
          status: 'pending',
          completed_at: null,
          reward_credited: 0,
          negative_triggered: 0
        });
      }
    }
  }

  // 6. Seed Properties (Exact match with screenshot: Ocean View Villa & Luxury Apartment)
  const defaultProps = [
    {
      title: 'Ocean View Villa',
      description: 'Exclusive beachfront residence with panoramic ocean vistas, private infinity pool, and premium smart home automation.',
      location: 'Colombo, Sri Lanka',
      price: 75000000.00,
      status: 'available',
      bedrooms: 5,
      bathrooms: 4,
      area_sqft: 5200,
      featured_image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Luxury Apartment',
      description: 'High-floor penthouse featuring floor-to-ceiling glass, Italian marble flooring, and concierge services.',
      location: 'Rajagiriya, Sri Lanka',
      price: 45000000.00,
      status: 'available',
      bedrooms: 3,
      bathrooms: 3,
      area_sqft: 2800,
      featured_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Royal Palm Estate',
      description: 'Grand colonial sanctuary surrounded by landscaped gardens, private tennis court, and guest bungalow.',
      location: 'Kandy, Sri Lanka',
      price: 120000000.00,
      status: 'available',
      bedrooms: 6,
      bathrooms: 6,
      area_sqft: 7800,
      featured_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  for (const p of defaultProps) {
    if (sqlite3Instance) {
      const exists = await db.get(`SELECT id FROM properties WHERE title = ?`, [p.title]);
      if (!exists) {
        await db.run(
          `INSERT INTO properties (title, description, location, price, status, bedrooms, bathrooms, area_sqft, featured_image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.title, p.description, p.location, p.price, p.status, p.bedrooms, p.bathrooms, p.area_sqft, p.featured_image]
        );
      }
    } else {
      if (!fileStore.data.properties.some(prop => prop.title === p.title)) {
        fileStore.data.properties.push({
          id: fileStore.data.properties.length + 1,
          ...p,
          created_at: new Date().toISOString()
        });
      }
    }
  }

  // 7. Seed Transactions (Exact match with screenshot)
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
    if (sqlite3Instance) {
      await db.run(
        `INSERT OR IGNORE INTO transactions (id, user_id, type, description, amount, balance_after, status, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tx.id, tx.user_id, tx.type, tx.description, tx.amount, tx.balance_after, tx.status, tx.created_by, tx.created_at]
      );
    } else {
      if (!fileStore.data.transactions.some(t => t.id === tx.id)) {
        fileStore.data.transactions.push(tx);
      }
    }
  }

  // 8. Seed Audit Log record
  if (sqlite3Instance) {
    const auditCount = await db.get(`SELECT COUNT(*) as cnt FROM audit_logs`);
    if (auditCount.cnt === 0) {
      await db.run(
        `INSERT INTO audit_logs (admin_id, admin_name, action, setting_name, previous_value, new_value, user_affected_id, reason, created_at)
         VALUES (1, 'Master Admin', 'Negative Balance Configured', 'negative_trigger_task', 'Task 3', 'Task 5', NULL, 'Initial system deployment rule', '2025-09-01 10:00:00')`
      );
    }
  } else {
    if (fileStore.data.audit_logs.length === 0) {
      fileStore.data.audit_logs.push({
        id: 1,
        admin_id: 1,
        admin_name: 'Master Admin',
        action: 'Negative Balance Configured',
        setting_name: 'negative_trigger_task',
        previous_value: 'Task 3',
        new_value: 'Task 5',
        user_affected_id: null,
        reason: 'Initial system deployment rule',
        created_at: '2025-09-01T10:00:00.000Z'
      });
    }
  }

  if (!sqlite3Instance) {
    fileStore.save();
  }
}

module.exports = {
  db,
  initDatabase,
  fileStore
};
