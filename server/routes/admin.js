const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, fileStore } = require('../db/database');
const { authenticateAdmin } = require('../middleware/auth');

// Apply admin auth to all routes in this file
router.use(authenticateAdmin);

// Helper to log audit event
async function logAudit(adminId, adminName, action, settingName, prevVal, newVal, userAffectedId, reason) {
  const nowSql = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const nowIso = new Date().toISOString();
  if (db.isNative) {
    await db.run(
      `INSERT INTO audit_logs (admin_id, admin_name, action, setting_name, previous_value, new_value, user_affected_id, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [adminId, adminName, action, settingName, String(prevVal), String(newVal), userAffectedId || null, reason || '', nowSql]
    );
  } else {
    fileStore.data.audit_logs.push({
      id: fileStore.data.audit_logs.length + 1,
      admin_id: adminId,
      admin_name: adminName,
      action,
      setting_name: settingName,
      previous_value: String(prevVal),
      new_value: String(newVal),
      user_affected_id: userAffectedId || null,
      reason: reason || '',
      created_at: nowIso
    });
    fileStore.save();
  }
}

// 1. GET: /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    let totalUsers = 0, activeUsers = 0, totalDeposits = 0, pendingDeposits = 0;
    let totalEarnings = 0, totalNegativeBalances = 0, activeTasks = 0, completedTasks = 0;
    let pendingWithdrawals = 0;

    if (db.isNative) {
      const uStats = await db.get(`SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active, SUM(balance) as totalBal, SUM(negative_balance) as totalNeg, SUM(total_deposit) as totalDep, SUM(total_earnings) as totalEarn FROM users`);
      totalUsers = uStats.total || 0;
      activeUsers = uStats.active || 0;
      totalDeposits = uStats.totalDep || 0;
      totalEarnings = uStats.totalEarn || 0;
      totalNegativeBalances = uStats.totalNeg || 0;

      const depStats = await db.get(`SELECT COUNT(*) as pending FROM deposits WHERE status = 'pending'`);
      pendingDeposits = depStats.pending || 0;

      const withStats = await db.get(`SELECT COUNT(*) as pending FROM withdrawals WHERE status = 'pending'`);
      pendingWithdrawals = withStats.pending || 0;

      const tStats = await db.get(`SELECT COUNT(*) as completed FROM user_tasks WHERE status = 'completed'`);
      completedTasks = tStats.completed || 0;

      const taskDef = await db.get(`SELECT COUNT(*) as active FROM tasks WHERE is_active = 1`);
      activeTasks = taskDef.active || 50;
    } else {
      totalUsers = fileStore.data.users.length;
      activeUsers = fileStore.data.users.filter(u => u.status === 'active').length;
      totalDeposits = fileStore.data.users.reduce((s, u) => s + (u.total_deposit || 0), 0);
      totalEarnings = fileStore.data.users.reduce((s, u) => s + (u.total_earnings || 0), 0);
      totalNegativeBalances = fileStore.data.users.reduce((s, u) => s + (u.negative_balance || 0), 0);
      pendingDeposits = fileStore.data.deposits.filter(d => d.status === 'pending').length;
      pendingWithdrawals = fileStore.data.withdrawals.filter(w => w.status === 'pending').length;
      completedTasks = fileStore.data.user_tasks.filter(t => t.status === 'completed').length;
      activeTasks = fileStore.data.tasks.filter(t => t.is_active === 1).length || 50;
    }

    // Recent 10 transactions
    let recentTx = [];
    if (db.isNative) {
      recentTx = await db.all(`
        SELECT t.*, u.username, u.name as user_name 
        FROM transactions t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC LIMIT 10
      `);
    } else {
      recentTx = fileStore.data.transactions.slice(-10).reverse().map(tx => {
        const u = fileStore.data.users.find(usr => usr.id === tx.user_id);
        return { ...tx, username: u ? u.username : 'Unknown', user_name: u ? u.name : 'Unknown' };
      });
    }

    res.json({
      success: true,
      metrics: {
        totalUsers,
        activeUsers,
        totalDeposits,
        pendingDeposits,
        pendingWithdrawals,
        totalEarnings,
        totalNegativeBalances,
        activeTasks,
        completedTasks
      },
      recentTransactions: recentTx
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin dashboard metrics' });
  }
});

// 2. GET: /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, status } = req.query;
    let users = [];

    if (db.isNative) {
      let query = `SELECT id, username, email, phone, name, status, balance, negative_balance, total_deposit, total_earnings, total_withdrawn, custom_trigger_task, custom_negative_amount, created_at, updated_at FROM users WHERE 1=1`;
      const params = [];

      if (search) {
        query += ` AND (username LIKE ? OR email LIKE ? OR name LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term, term);
      }
      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }
      query += ` ORDER BY id DESC`;
     users = await db.all(query, params);
console.log('[ADMIN USERS] PostgreSQL users count:', users.length);
    } else {
      users = fileStore.data.users.map(u => {
        const { password_hash, ...safe } = u;
        return safe;
      });
      if (search) {
        const term = search.toLowerCase();
        users = users.filter(u => 
          u.username.toLowerCase().includes(term) || 
          u.email.toLowerCase().includes(term) || 
          (u.name && u.name.toLowerCase().includes(term))
        );
      }
      if (status) {
        users = users.filter(u => u.status === status);
      }
    }

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// 3. POST: /api/admin/users (Add user)
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, name, phone, balance, negative_balance } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const initialBal = parseFloat(balance) || 0.00;
    const initialNeg = parseFloat(negative_balance) || 0.00;

    let newId;
    if (db.isNative) {
      const resDb = await db.run(
        `INSERT INTO users (username, email, password_hash, phone, name, status, balance, negative_balance, total_deposit, total_earnings, total_withdrawn)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, 0.00, 0.00)`,
        [username.trim(), email.toLowerCase().trim(), passwordHash, phone || '', name || username, initialBal, initialNeg, initialBal]
      );
      newId = resDb.lastID;
    } else {
      newId = fileStore.data.users.length + 1;
      fileStore.data.users.push({
        id: newId,
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        phone: phone || '',
        name: name || username,
        status: 'active',
        balance: initialBal,
        negative_balance: initialNeg,
        total_deposit: initialBal,
        total_earnings: 0.00,
        total_withdrawn: 0.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      fileStore.save();
    }

    await logAudit(req.admin.id, req.admin.name, 'Create User', 'User Record', 'None', username, newId, 'Created by Admin');
    res.json({ success: true, message: 'User created successfully', userId: newId });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// 4. PUT: /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { name, phone, status, balance, negative_balance, custom_trigger_task, custom_negative_amount } = req.body;

    let user;
    if (db.isNative) {
      user = await db.get(`SELECT * FROM users WHERE id = ?`, [userId]);
    } else {
      user = fileStore.data.users.find(u => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newStatus = status || user.status;
    const newBal = balance !== undefined ? parseFloat(balance) : user.balance;
    const newNeg = negative_balance !== undefined ? parseFloat(negative_balance) : user.negative_balance;
    const newTrig = custom_trigger_task !== undefined ? (custom_trigger_task ? parseInt(custom_trigger_task, 10) : null) : user.custom_trigger_task;
    const newNegAmt = custom_negative_amount !== undefined ? (custom_negative_amount ? parseFloat(custom_negative_amount) : null) : user.custom_negative_amount;

    if (db.isNative) {
      await db.run(
        `UPDATE users SET name = ?, phone = ?, status = ?, balance = ?, negative_balance = ?, custom_trigger_task = ?, custom_negative_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name || user.name, phone !== undefined ? phone : user.phone, newStatus, newBal, newNeg, newTrig, newNegAmt, userId]
      );
    } else {
      user.name = name || user.name;
      user.phone = phone !== undefined ? phone : user.phone;
      user.status = newStatus;
      user.balance = newBal;
      user.negative_balance = newNeg;
      user.custom_trigger_task = newTrig;
      user.custom_negative_amount = newNegAmt;
      user.updated_at = new Date().toISOString();
      fileStore.save();
    }

    await logAudit(req.admin.id, req.admin.name, 'Update User Info', 'User Profile', JSON.stringify({ status: user.status, balance: user.balance }), JSON.stringify({ status: newStatus, balance: newBal }), userId, 'Admin edit user');

    res.json({ success: true, message: 'User details updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// 5. POST: /api/admin/negative-balance/adjust
router.post('/negative-balance/adjust', async (req, res) => {
  try {
    const { userId, newAmount, delta, mode, reason } = req.body;
    // mode can be: 'set', 'increase', 'decrease', 'clear'
    const targetUserId = parseInt(userId, 10);

    let user;
    if (db.isNative) {
      user = await db.get(`SELECT * FROM users WHERE id = ?`, [targetUserId]);
    } else {
      user = fileStore.data.users.find(u => u.id === targetUserId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const prevNeg = user.negative_balance;
    let targetNeg = prevNeg;

    if (mode === 'clear') {
      targetNeg = 0.00;
    } else if (mode === 'set') {
      targetNeg = Math.max(0, parseFloat(newAmount) || 0);
    } else if (mode === 'increase') {
      targetNeg = prevNeg + (parseFloat(delta) || 0);
    } else if (mode === 'decrease') {
      targetNeg = Math.max(0, prevNeg - (parseFloat(delta) || 0));
    } else if (newAmount !== undefined) {
      targetNeg = Math.max(0, parseFloat(newAmount) || 0);
    }

    const calculatedDelta = targetNeg - prevNeg;
    const nowIso = new Date().toISOString();
    const nowSql = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const txId = 'TXN-' + Math.floor(10000 + Math.random() * 90000);

    if (db.isNative) {
      await db.run(`UPDATE users SET negative_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [targetNeg, targetUserId]);

      await db.run(
        `INSERT INTO negative_balance_records (user_id, previous_amount, new_amount, delta, reason, admin_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [targetUserId, prevNeg, targetNeg, calculatedDelta, reason || 'Manual Admin Adjustment', req.admin.id]
      );

      await db.run(
        `INSERT INTO transactions (id, user_id, type, description, amount, balance_after, status, created_by, created_at)
         VALUES (?, ?, 'Admin Adjustment', ?, ?, ?, 'Applied', ?, ?)`,
        [txId, targetUserId, `Negative Balance Adjustment: ${reason || 'Admin action'}`, -targetNeg, -targetNeg, req.admin.name, nowSql]
      );
    } else {
      user.negative_balance = targetNeg;
      user.updated_at = nowIso;

      fileStore.data.negative_balance_records.push({
        id: fileStore.data.negative_balance_records.length + 1,
        user_id: targetUserId,
        previous_amount: prevNeg,
        new_amount: targetNeg,
        delta: calculatedDelta,
        reason: reason || 'Manual Admin Adjustment',
        admin_id: req.admin.id,
        created_at: nowIso
      });

      fileStore.data.transactions.push({
        id: txId,
        user_id: targetUserId,
        type: 'Admin Adjustment',
        description: `Negative Balance Adjustment: ${reason || 'Admin action'}`,
        amount: -targetNeg,
        balance_after: -targetNeg,
        status: 'Applied',
        created_by: req.admin.name,
        created_at: nowIso
      });

      fileStore.save();
    }

    await logAudit(
      req.admin.id,
      req.admin.name,
      'Adjust Negative Balance',
      'negative_balance',
      `LKR ${prevNeg.toFixed(2)}`,
      `LKR ${targetNeg.toFixed(2)}`,
      targetUserId,
      reason || 'Admin panel adjustment'
    );

    res.json({
      success: true,
      message: `Negative balance updated from LKR ${prevNeg.toFixed(2)} to LKR ${targetNeg.toFixed(2)}`,
      previousAmount: prevNeg,
      newAmount: targetNeg
    });
  } catch (err) {
    console.error('Negative balance adjust error:', err);
    res.status(500).json({ success: false, message: 'Server error adjusting negative balance' });
  }
});

// 6. GET: /api/admin/config
router.get('/config', async (req, res) => {
  try {
    let settings = {};
    if (db.isNative) {
      const rows = await db.all(`SELECT key, value FROM system_settings`);
      rows.forEach(r => { settings[r.key] = r.value; });
    } else {
      settings = { ...fileStore.data.system_settings };
    }

    res.json({
      success: true,
      settings: {
        min_tasks: parseInt(settings.min_tasks || '0', 10),
        max_tasks: parseInt(settings.max_tasks || '10', 10),
        default_task_reward: parseFloat(settings.default_task_reward || '150'),
        negative_trigger_task: parseInt(settings.negative_trigger_task || '5', 10),
        negative_balance_amount: parseFloat(settings.negative_balance_amount || '100')
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch system configurations' });
  }
});

// 7. POST: /api/admin/config
router.post('/config', async (req, res) => {
  try {
    const { min_tasks, max_tasks, default_task_reward, negative_trigger_task, negative_balance_amount } = req.body;

    const updates = [];

    if (min_tasks !== undefined) {
      const v = Math.max(0, parseInt(min_tasks, 10));
      updates.push({ key: 'min_tasks', val: String(v) });
    }
    if (max_tasks !== undefined) {
      const v = Math.min(50, Math.max(1, parseInt(max_tasks, 10)));
      updates.push({ key: 'max_tasks', val: String(v) });
    }
    if (default_task_reward !== undefined) {
      const v = Math.max(0, parseFloat(default_task_reward));
      updates.push({ key: 'default_task_reward', val: String(v) });
    }
    if (negative_trigger_task !== undefined) {
      const v = Math.min(50, Math.max(1, parseInt(negative_trigger_task, 10)));
      updates.push({ key: 'negative_trigger_task', val: String(v) });
    }
    if (negative_balance_amount !== undefined) {
      const v = Math.abs(parseFloat(negative_balance_amount));
      updates.push({ key: 'negative_balance_amount', val: String(v) });
    }

    for (const item of updates) {
      let prevVal = '';
      if (db.isNative) {
        const row = await db.get(`SELECT value FROM system_settings WHERE key = ?`, [item.key]);
        prevVal = row ? row.value : 'Default';
        await db.run(`INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`, [item.key, item.val]);
      } else {
        prevVal = fileStore.data.system_settings[item.key] || 'Default';
        fileStore.data.system_settings[item.key] = item.val;
      }

      await logAudit(
        req.admin.id,
        req.admin.name,
        `Update System Setting: ${item.key}`,
        item.key,
        prevVal,
        item.val,
        null,
        'Admin configuration save'
      );
    }

    if (!db.isNative) fileStore.save();

    res.json({
      success: true,
      message: 'System configuration saved permanently to database.'
    });
  } catch (err) {
    console.error('Config save error:', err);
    res.status(500).json({ success: false, message: 'Failed to update system configurations' });
  }
});

// 8. GET: /api/admin/deposits
router.get('/deposits', async (req, res) => {
  try {
    const { status } = req.query;
    let deposits = [];

    if (db.isNative) {
      let query = `
        SELECT d.*, u.username, u.name as user_name, u.email as user_email, u.balance as user_balance, u.negative_balance as user_neg_balance
        FROM deposits d
        JOIN users u ON d.user_id = u.id
      `;
      const params = [];
      if (status) {
        query += ` WHERE d.status = ?`;
        params.push(status);
      }
      query += ` ORDER BY d.created_at DESC`;
      deposits = await db.all(query, params);
    } else {
      deposits = fileStore.data.deposits.map(d => {
        const u = fileStore.data.users.find(usr => usr.id === d.user_id);
        return {
          ...d,
          username: u ? u.username : 'Unknown',
          user_name: u ? u.name : 'Unknown',
          user_email: u ? u.email : 'Unknown',
          user_balance: u ? u.balance : 0,
          user_neg_balance: u ? u.negative_balance : 0
        };
      }).reverse();
      if (status) {
        deposits = deposits.filter(d => d.status === status);
      }
    }

    res.json({ success: true, deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch deposits' });
  }
});

// 9. POST: /api/admin/deposits/:id/action (Approve / Reject)
router.post('/deposits/:id/action', async (req, res) => {
  try {
    const depositId = parseInt(req.params.id, 10);
    const { action, notes } = req.body; // 'approve' or 'reject'

    let deposit;
    if (db.isNative) {
      deposit = await db.get(`SELECT * FROM deposits WHERE id = ?`, [depositId]);
    } else {
      deposit = fileStore.data.deposits.find(d => d.id === depositId);
    }

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit record not found' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Deposit is already ${deposit.status}` });
    }

    const nowSql = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const nowIso = new Date().toISOString();
    const txId = 'TXN-' + Math.floor(10000 + Math.random() * 90000);

    if (action === 'approve') {
      let user;
      if (db.isNative) {
        user = await db.get(`SELECT * FROM users WHERE id = ?`, [deposit.user_id]);
        const newBal = user.balance + deposit.amount;
        const newDep = user.total_deposit + deposit.amount;
        
        // If deposit covers negative balance, we can optionally offset or leave clear
        // Admin approval adds to balance
        await db.run(
          `UPDATE users SET balance = ?, total_deposit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [newBal, newDep, deposit.user_id]
        );

        await db.run(
          `UPDATE deposits SET status = 'approved', admin_id = ?, reviewed_at = ? WHERE id = ?`,
          [req.admin.id, nowSql, depositId]
        );

        await db.run(
          `INSERT INTO transactions (id, user_id, type, description, amount, balance_after, status, created_by, created_at)
           VALUES (?, ?, 'Deposit', ?, ?, ?, 'Approved', ?, ?)`,
          [txId, deposit.user_id, `Deposit Approved: LKR ${deposit.amount.toLocaleString()}`, deposit.amount, newBal, req.admin.name, nowSql]
        );
      } else {
        user = fileStore.data.users.find(u => u.id === deposit.user_id);
        user.balance += deposit.amount;
        user.total_deposit += deposit.amount;
        user.updated_at = nowIso;

        deposit.status = 'approved';
        deposit.admin_id = req.admin.id;
        deposit.reviewed_at = nowIso;

        fileStore.data.transactions.push({
          id: txId,
          user_id: deposit.user_id,
          type: 'Deposit',
          description: `Deposit Approved: LKR ${deposit.amount.toLocaleString()}`,
          amount: deposit.amount,
          balance_after: user.balance,
          status: 'Approved',
          created_by: req.admin.name,
          created_at: nowIso
        });

        fileStore.save();
      }

      await logAudit(
        req.admin.id,
        req.admin.name,
        'Approve Deposit',
        'Deposit Verification',
        'pending',
        'approved',
        deposit.user_id,
        `Approved deposit of LKR ${deposit.amount.toLocaleString()}`
      );

      res.json({ success: true, message: `Deposit of LKR ${deposit.amount.toLocaleString()} approved. User balance credited.` });
    } else {
      // Reject
      if (db.isNative) {
        await db.run(
          `UPDATE deposits SET status = 'rejected', admin_id = ?, reviewed_at = ?, notes = ? WHERE id = ?`,
          [req.admin.id, nowSql, notes || 'Rejected by Administrator', depositId]
        );
      } else {
        deposit.status = 'rejected';
        deposit.admin_id = req.admin.id;
        deposit.reviewed_at = nowIso;
        deposit.notes = notes || 'Rejected by Administrator';
        fileStore.save();
      }

      await logAudit(
        req.admin.id,
        req.admin.name,
        'Reject Deposit',
        'Deposit Verification',
        'pending',
        'rejected',
        deposit.user_id,
        notes || 'Rejected by Admin'
      );

      res.json({ success: true, message: 'Deposit request has been rejected.' });
    }
  } catch (err) {
    console.error('Deposit action error:', err);
    res.status(500).json({ success: false, message: 'Server error updating deposit' });
  }
});

// 10. GET: /api/admin/withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const { status } = req.query;
    let withdrawals = [];

    if (db.isNative) {
      let query = `
        SELECT w.*, u.username, u.name as user_name, u.email as user_email, u.balance as user_balance, u.negative_balance as user_neg_balance
        FROM withdrawals w
        JOIN users u ON w.user_id = u.id
      `;
      const params = [];
      if (status) {
        query += ` WHERE w.status = ?`;
        params.push(status);
      }
      query += ` ORDER BY w.created_at DESC`;
      withdrawals = await db.all(query, params);
    } else {
      withdrawals = fileStore.data.withdrawals.map(w => {
        const u = fileStore.data.users.find(usr => usr.id === w.user_id);
        return {
          ...w,
          username: u ? u.username : 'Unknown',
          user_name: u ? u.name : 'Unknown',
          user_email: u ? u.email : 'Unknown',
          user_balance: u ? u.balance : 0,
          user_neg_balance: u ? u.negative_balance : 0
        };
      }).reverse();
      if (status) {
        withdrawals = withdrawals.filter(w => w.status === status);
      }
    }

    res.json({ success: true, withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
});

// 11. POST: /api/admin/withdrawals/:id/action (Approve / Reject)
router.post('/withdrawals/:id/action', async (req, res) => {
  try {
    const withId = parseInt(req.params.id, 10);
    const { action, reason } = req.body; // 'approve' or 'reject'

    let w;
    if (db.isNative) {
      w = await db.get(`SELECT * FROM withdrawals WHERE id = ?`, [withId]);
    } else {
      w = fileStore.data.withdrawals.find(item => item.id === withId);
    }

    if (!w) {
      return res.status(404).json({ success: false, message: 'Withdrawal record not found' });
    }

    if (w.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Withdrawal is already ${w.status}` });
    }

    const nowSql = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const nowIso = new Date().toISOString();
    const txId = 'TXN-' + Math.floor(10000 + Math.random() * 90000);

    if (action === 'approve') {
      // Approve withdrawal
      if (db.isNative) {
        await db.run(
          `UPDATE users SET total_withdrawn = total_withdrawn + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [w.amount, w.user_id]
        );

        await db.run(
          `UPDATE withdrawals SET status = 'approved', admin_id = ?, reviewed_at = ? WHERE id = ?`,
          [req.admin.id, nowSql, withId]
        );

        await db.run(
          `INSERT INTO transactions (id, user_id, type, description, amount, balance_after, status, created_by, created_at)
           VALUES (?, ?, 'Withdrawal', ?, ?, 0, 'Approved', ?, ?)`,
          [txId, w.user_id, `Withdrawal to ${w.bank_name} (${w.account_number}) Approved`, -w.amount, req.admin.name, nowSql]
        );
      } else {
        const u = fileStore.data.users.find(usr => usr.id === w.user_id);
        u.total_withdrawn = (u.total_withdrawn || 0) + w.amount;
        u.updated_at = nowIso;

        w.status = 'approved';
        w.admin_id = req.admin.id;
        w.reviewed_at = nowIso;

        fileStore.data.transactions.push({
          id: txId,
          user_id: w.user_id,
          type: 'Withdrawal',
          description: `Withdrawal to ${w.bank_name} (${w.account_number}) Approved`,
          amount: -w.amount,
          balance_after: u.balance,
          status: 'Approved',
          created_by: req.admin.name,
          created_at: nowIso
        });

        fileStore.save();
      }

      await logAudit(
        req.admin.id,
        req.admin.name,
        'Approve Withdrawal',
        'Withdrawal Payment',
        'pending',
        'approved',
        w.user_id,
        `Approved payout of LKR ${w.amount.toLocaleString()} to ${w.bank_name} (${w.account_number})`
      );

      res.json({ success: true, message: `Withdrawal of LKR ${w.amount.toLocaleString()} approved successfully.` });
    } else {
      // Reject withdrawal -> Refund balance to user
      if (db.isNative) {
        const user = await db.get(`SELECT balance FROM users WHERE id = ?`, [w.user_id]);
        const refundedBal = user.balance + w.amount;

        await db.run(`UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [refundedBal, w.user_id]);

        await db.run(
          `UPDATE withdrawals SET status = 'rejected', rejection_reason = ?, admin_id = ?, reviewed_at = ? WHERE id = ?`,
          [reason || 'Rejected by Admin', req.admin.id, nowSql, withId]
        );

        await db.run(
          `INSERT INTO transactions (id, user_id, type, description, amount, balance_after, status, created_by, created_at)
           VALUES (?, ?, 'Balance Correction', ?, ?, ?, 'Completed', ?, ?)`,
          [txId, w.user_id, `Refund for Rejected Withdrawal: ${reason || 'Admin Rejection'}`, w.amount, refundedBal, req.admin.name, nowSql]
        );
      } else {
        const u = fileStore.data.users.find(usr => usr.id === w.user_id);
        u.balance += w.amount;
        u.updated_at = nowIso;

        w.status = 'rejected';
        w.rejection_reason = reason || 'Rejected by Admin';
        w.admin_id = req.admin.id;
        w.reviewed_at = nowIso;

        fileStore.data.transactions.push({
          id: txId,
          user_id: w.user_id,
          type: 'Balance Correction',
          description: `Refund for Rejected Withdrawal: ${reason || 'Admin Rejection'}`,
          amount: w.amount,
          balance_after: u.balance,
          status: 'Completed',
          created_by: req.admin.name,
          created_at: nowIso
        });

        fileStore.save();
      }

      await logAudit(
        req.admin.id,
        req.admin.name,
        'Reject Withdrawal',
        'Withdrawal Payment',
        'pending',
        'rejected',
        w.user_id,
        reason || 'Rejected by Admin, funds refunded'
      );

      res.json({ success: true, message: 'Withdrawal rejected. Amount has been refunded back to the user balance.' });
    }
  } catch (err) {
    console.error('Withdrawal action error:', err);
    res.status(500).json({ success: false, message: 'Server error processing withdrawal action' });
  }
});

// 12. GET & POST: /api/admin/tasks
router.get('/tasks', async (req, res) => {
  try {
    let tasks = [];
    if (db.isNative) {
      tasks = await db.all(`SELECT * FROM tasks ORDER BY task_number ASC`);
    } else {
      tasks = [...fileStore.data.tasks].sort((a, b) => a.task_number - b.task_number);
    }
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

router.post('/tasks/:taskNumber', async (req, res) => {
  try {
    const taskNum = parseInt(req.params.taskNumber, 10);
    const { title, description, reward_amount, is_active } = req.body;

    if (db.isNative) {
      await db.run(
        `UPDATE tasks SET title = ?, description = ?, reward_amount = ?, is_active = ? WHERE task_number = ?`,
        [title, description, parseFloat(reward_amount), is_active ? 1 : 0, taskNum]
      );
    } else {
      const t = fileStore.data.tasks.find(task => task.task_number === taskNum);
      if (t) {
        if (title) t.title = title;
        if (description) t.description = description;
        if (reward_amount !== undefined) t.reward_amount = parseFloat(reward_amount);
        if (is_active !== undefined) t.is_active = is_active ? 1 : 0;
        fileStore.save();
      }
    }

    res.json({ success: true, message: `Task ${taskNum} updated successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
});

// 13. PROPERTIES: CRUD
router.get('/properties', async (req, res) => {
  try {
    let properties = [];
    if (db.isNative) {
      properties = await db.all(`SELECT * FROM properties ORDER BY id DESC`);
    } else {
      properties = [...fileStore.data.properties].reverse();
    }
    res.json({ success: true, properties });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch properties' });
  }
});

router.post('/properties', async (req, res) => {
  try {
    const { title, description, location, price, status, bedrooms, bathrooms, area_sqft, featured_image } = req.body;
    if (!title || !price || !location) {
      return res.status(400).json({ success: false, message: 'Title, price, and location are required' });
    }

    let newId;
    if (db.isNative) {
      const result = await db.run(
        `INSERT INTO properties (title, description, location, price, status, bedrooms, bathrooms, area_sqft, featured_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description || '', location, parseFloat(price), status || 'available', bedrooms || 3, bathrooms || 2, area_sqft || 2000, featured_image || '']
      );
      newId = result.lastID;
    } else {
      newId = fileStore.data.properties.length + 1;
      fileStore.data.properties.push({
        id: newId,
        title,
        description: description || '',
        location,
        price: parseFloat(price),
        status: status || 'available',
        bedrooms: bedrooms || 3,
        bathrooms: bathrooms || 2,
        area_sqft: area_sqft || 2000,
        featured_image: featured_image || '',
        created_at: new Date().toISOString()
      });
      fileStore.save();
    }

    await logAudit(req.admin.id, req.admin.name, 'Create Property', 'Properties', 'None', title, null, 'Added listing');
    res.json({ success: true, message: 'Property created successfully', propertyId: newId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create property' });
  }
});

router.put('/properties/:id', async (req, res) => {
  try {
    const propId = parseInt(req.params.id, 10);
    const { title, description, location, price, status, bedrooms, bathrooms, area_sqft, featured_image } = req.body;

    if (db.isNative) {
      await db.run(
        `UPDATE properties SET title = ?, description = ?, location = ?, price = ?, status = ?, bedrooms = ?, bathrooms = ?, area_sqft = ?, featured_image = ? WHERE id = ?`,
        [title, description, location, parseFloat(price), status, bedrooms, bathrooms, area_sqft, featured_image, propId]
      );
    } else {
      const p = fileStore.data.properties.find(prop => prop.id === propId);
      if (p) {
        Object.assign(p, { title, description, location, price: parseFloat(price), status, bedrooms, bathrooms, area_sqft, featured_image });
        fileStore.save();
      }
    }

    res.json({ success: true, message: 'Property updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update property' });
  }
});

router.delete('/properties/:id', async (req, res) => {
  try {
    const propId = parseInt(req.params.id, 10);
    if (db.isNative) {
      await db.run(`DELETE FROM properties WHERE id = ?`, [propId]);
    } else {
      fileStore.data.properties = fileStore.data.properties.filter(p => p.id !== propId);
      fileStore.save();
    }
    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete property' });
  }
});

// 14. GET: /api/admin/transactions (Master Ledger)
router.get('/transactions', async (req, res) => {
  try {
    const { user_id, type } = req.query;
    let transactions = [];

    if (db.isNative) {
      let query = `
        SELECT t.*, u.username, u.name as user_name, u.email as user_email
        FROM transactions t
        JOIN users u ON t.user_id = u.id
      `;
      const params = [];
      const conds = [];
      if (user_id) {
        conds.push(`t.user_id = ?`);
        params.push(user_id);
      }
      if (type) {
        conds.push(`t.type = ?`);
        params.push(type);
      }
      if (conds.length > 0) {
        query += ` WHERE ` + conds.join(' AND ');
      }
      query += ` ORDER BY t.created_at DESC LIMIT 100`;
      transactions = await db.all(query, params);
    } else {
      transactions = fileStore.data.transactions.map(t => {
        const u = fileStore.data.users.find(usr => usr.id === t.user_id);
        return {
          ...t,
          username: u ? u.username : 'Unknown',
          user_name: u ? u.name : 'Unknown',
          user_email: u ? u.email : 'Unknown'
        };
      }).reverse();
      if (user_id) transactions = transactions.filter(t => String(t.user_id) === String(user_id));
      if (type) transactions = transactions.filter(t => t.type === type);
    }

    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transaction ledger' });
  }
});

// 15. GET: /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    let logs = [];
    if (db.isNative) {
      logs = await db.all(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200`);
    } else {
      logs = [...fileStore.data.audit_logs].reverse();
    }
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

// 16. POST: /api/admin/system/reset (Explicit two-step protected reset)
router.post('/system/reset', async (req, res) => {
  try {
    const { confirmation_passphrase } = req.body;
    if (confirmation_passphrase !== 'RESET-CONFIRM-2025') {
      return res.status(403).json({
        success: false,
        message: 'Invalid passphrase. Destructive reset aborted to protect data integrity.'
      });
    }

    // Reset user balances and tasks to clean state (leaves admin account intact)
    if (db.isNative) {
      await db.run(`DELETE FROM user_tasks`);
      await db.run(`DELETE FROM deposits`);
      await db.run(`DELETE FROM withdrawals`);
      await db.run(`DELETE FROM negative_balance_records`);
      await db.run(`UPDATE users SET balance = 0, negative_balance = 0, total_deposit = 0, total_earnings = 0, total_withdrawn = 0`);
    } else {
      fileStore.data.user_tasks = [];
      fileStore.data.deposits = [];
      fileStore.data.withdrawals = [];
      fileStore.data.negative_balance_records = [];
      fileStore.data.users.forEach(u => {
        u.balance = 0;
        u.negative_balance = 0;
        u.total_deposit = 0;
        u.total_earnings = 0;
        u.total_withdrawn = 0;
      });
      fileStore.save();
    }

    await logAudit(req.admin.id, req.admin.name, 'DESTRUCTIVE_SYSTEM_RESET', 'Entire Database State', 'Active Data', 'Cleared Data', null, 'Authorized destructive reset');

    res.json({ success: true, message: 'System state reset completed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to execute system reset' });
  }
});

module.exports = router;
