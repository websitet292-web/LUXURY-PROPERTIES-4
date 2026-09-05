/**
 * LUXURY PROPERTIES - Hybrid Standalone Database Engine
 * Provides persistent SQLite-equivalent storage in browser storage if backend server is not currently running.
 * Automatically synchronizes with server whenever online.
 */

const DB_KEY = 'luxury_properties_hybrid_db';

function getLocalDB() {
  const existing = localStorage.getItem(DB_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {}
  }

  // Initial Seed State (Matching user screenshot)
  const initialDB = {
    settings: {
      min_tasks: 0,
      max_tasks: 10,
      default_task_reward: 150,
      negative_trigger_task: 5,
      negative_balance_amount: 100
    },
    users: [
      {
        id: 1,
        username: 'suresh',
        email: 'suresh@example.com',
        name: 'Suresh Perera',
        phone: '+94 77 123 4567',
        status: 'active',
        balance: 25750.00,
        negative_balance: 100.00,
        total_deposit: 50000.00,
        total_earnings: 7350.00,
        total_withdrawn: 0.00,
        created_at: '2025-08-20 10:00:00'
      }
    ],
    admins: [
      {
        id: 1,
        username: 'admin',
        email: 'admin@luxury.com',
        name: 'Master Admin'
      }
    ],
    user_tasks: [
      { user_id: 1, task_number: 1, status: 'completed', reward_credited: 150.00, negative_triggered: 0, completed_at: '2025-09-01 10:00:00' },
      { user_id: 1, task_number: 2, status: 'completed', reward_credited: 150.00, negative_triggered: 0, completed_at: '2025-09-01 14:00:00' },
      { user_id: 1, task_number: 3, status: 'completed', reward_credited: 150.00, negative_triggered: 0, completed_at: '2025-09-02 09:30:00' }
    ],
    deposits: [
      {
        id: 1,
        user_id: 1,
        amount: 50000.00,
        proof_image_url: 'Slip #98420',
        notes: 'Initial bank wire deposit',
        status: 'approved',
        created_at: '2025-09-01 16:45:00'
      }
    ],
    withdrawals: [],
    transactions: [
      {
        id: 'TXN-98421',
        user_id: 1,
        type: 'Task Reward',
        description: 'Task 3 Completed',
        amount: 150.00,
        balance_after: 25750.00,
        status: 'Completed',
        created_by: 'System',
        created_at: '02 Sep 2025'
      },
      {
        id: 'TXN-98420',
        user_id: 1,
        type: 'Deposit',
        description: 'Deposit LKR 50,000',
        amount: 50000.00,
        balance_after: 25600.00,
        status: 'Approved',
        created_by: 'Admin',
        created_at: '01 Sep 2025'
      },
      {
        id: 'TXN-98419',
        user_id: 1,
        type: 'Admin Adjustment',
        description: 'Negative Balance',
        amount: -100.00,
        balance_after: -100.00,
        status: 'Applied',
        created_by: 'Admin',
        created_at: '01 Sep 2025'
      }
    ],
    properties: [
      {
        id: 1,
        title: 'Ocean View Villa',
        description: 'Exclusive beachfront residence with panoramic ocean vistas and private infinity pool.',
        location: 'Colombo, Sri Lanka',
        price: 75000000.00,
        status: 'available',
        bedrooms: 5,
        bathrooms: 4,
        area_sqft: 5200,
        featured_image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 2,
        title: 'Luxury Apartment',
        description: 'High-floor penthouse featuring floor-to-ceiling glass and Italian marble flooring.',
        location: 'Rajagiriya, Sri Lanka',
        price: 45000000.00,
        status: 'available',
        bedrooms: 3,
        bathrooms: 3,
        area_sqft: 2800,
        featured_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 3,
        title: 'Royal Palm Estate',
        description: 'Colonial luxury sanctuary with private gardens and guest bungalow.',
        location: 'Kandy, Sri Lanka',
        price: 120000000.00,
        status: 'available',
        bedrooms: 6,
        bathrooms: 6,
        area_sqft: 7800,
        featured_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    audit_logs: [
      {
        id: 1,
        admin_name: 'Master Admin',
        action: 'Negative Balance Configured',
        setting_name: 'negative_trigger_task',
        previous_value: 'Task 3',
        new_value: 'Task 5',
        reason: 'Initial system deployment rule',
        created_at: '2025-09-01 10:00:00'
      }
    ]
  };

  saveLocalDB(initialDB);
  return initialDB;
}

function saveLocalDB(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// Standalone Simulated Dispatcher
function handleStandaloneApi(endpoint, options = {}) {
  const db = getLocalDB();
  const body = options.body ? JSON.parse(options.body) : {};
  const method = (options.method || 'GET').toUpperCase();

  // Auth me
  if (endpoint === '/api/auth/me') {
    const role = state.role || 'user';
    if (role === 'admin') return { success: true, role: 'admin', user: db.admins[0] };
    return { success: true, role: 'user', user: db.users[0] };
  }

  // User Login
  if (endpoint === '/api/auth/user/login') {
    const u = db.users[0];
    return {
      success: true,
      token: 'standalone_user_token_' + Date.now(),
      user: u
    };
  }

  // Admin Login
  if (endpoint === '/api/auth/admin/login') {
    return {
      success: true,
      token: 'standalone_admin_token_' + Date.now(),
      admin: db.admins[0]
    };
  }

  // User Dashboard
  if (endpoint === '/api/user/dashboard') {
    const u = db.users[0];
    const maxTasks = db.settings.max_tasks || 10;
    const triggerTask = db.settings.negative_trigger_task || 5;
    const completedTasks = db.user_tasks.filter(t => t.user_id === u.id && t.status === 'completed');
    const completedCount = completedTasks.length;
    const pendingCount = Math.max(0, maxTasks - completedCount);
    const rewardEarned = completedTasks.reduce((sum, t) => sum + (t.reward_credited || 150), 0);
    const isLocked = (u.negative_balance > 0) && (completedCount >= triggerTask);

    return {
      success: true,
      user: { ...u, isLocked },
      taskProgress: {
        totalTasks: maxTasks,
        completed: completedCount,
        pending: pendingCount,
        rewardEarned: rewardEarned,
        rewardPerTask: db.settings.default_task_reward || 150,
        triggerTask: triggerTask,
        isLocked
      },
      recentTransactions: db.transactions.slice(0, 5),
      properties: db.properties.slice(0, 2),
      quickDepositAmounts: [50000, 70000, 100000]
    };
  }

  // User Tasks List
  if (endpoint === '/api/user/tasks') {
    const u = db.users[0];
    const maxTasks = db.settings.max_tasks || 10;
    const triggerTask = db.settings.negative_trigger_task || 5;
    const defaultReward = db.settings.default_task_reward || 150;
    const negAmount = db.settings.negative_balance_amount || 100;

    const completedSet = new Set(db.user_tasks.filter(t => t.user_id === u.id && t.status === 'completed').map(t => t.task_number));
    const isLocked = (u.negative_balance > 0) && (completedSet.size >= triggerTask);

    const taskList = [];
    for (let i = 1; i <= maxTasks; i++) {
      const isDone = completedSet.has(i);
      const isTrigger = (i === triggerTask);
      let canPlay = false;

      if (!isDone) {
        if (i === 1) canPlay = true;
        else if (completedSet.has(i - 1)) {
          if (i > triggerTask && u.negative_balance > 0) canPlay = false;
          else canPlay = true;
        }
      }

      taskList.push({
        task_number: i,
        title: `Task #${i}`,
        description: '',
        reward_amount: defaultReward,
        status: isDone ? 'completed' : (canPlay ? 'available' : 'locked'),
        is_trigger_task: isTrigger,
        completed_at: db.user_tasks.find(t => t.task_number === i)?.completed_at || null
      });
    }

    return {
      success: true,
      tasks: taskList,
      maxTasks,
      triggerTask,
      triggerAmount: negAmount,
      completedCount: completedSet.size,
      isLocked,
      negativeBalance: u.negative_balance
    };
  }

  // User Complete Task
  if (endpoint.startsWith('/api/user/tasks/') && endpoint.endsWith('/complete')) {
    const parts = endpoint.split('/');
    const taskNum = parseInt(parts[4], 10);
    const u = db.users[0];
    const triggerTask = db.settings.negative_trigger_task || 5;
    const defaultReward = db.settings.default_task_reward || 150;
    const negAmount = db.settings.negative_balance_amount || 100;

    const isTrigger = (taskNum === triggerTask);
    let triggerApplied = false;

    // Check deduplication
    const existingUt = db.user_tasks.find(t => t.user_id === u.id && t.task_number === taskNum);
    if (!existingUt || existingUt.negative_triggered !== 1) {
      if (isTrigger) {
        triggerApplied = true;
        u.negative_balance = negAmount;
      }
    }

    u.balance += defaultReward;
    u.total_earnings += defaultReward;

    if (existingUt) {
      existingUt.status = 'completed';
      existingUt.reward_credited = defaultReward;
      if (triggerApplied) existingUt.negative_triggered = 1;
    } else {
      db.user_tasks.push({
        user_id: u.id,
        task_number: taskNum,
        status: 'completed',
        reward_credited: defaultReward,
        negative_triggered: triggerApplied ? 1 : 0,
        completed_at: new Date().toISOString().substring(0, 10)
      });
    }

    const txId = 'TXN-' + Math.floor(10000 + Math.random() * 90000);
    db.transactions.unshift({
      id: txId,
      user_id: u.id,
      type: 'Task Reward',
      description: `Task ${taskNum} Completed`,
      amount: defaultReward,
      balance_after: u.balance,
      status: 'Completed',
      created_by: 'System',
      created_at: new Date().toISOString().substring(0, 10)
    });

    if (triggerApplied) {
      db.transactions.unshift({
        id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
        user_id: u.id,
        type: 'Admin Adjustment',
        description: 'Negative Balance Applied',
        amount: -negAmount,
        balance_after: -negAmount,
        status: 'Applied',
        created_by: 'System Trigger',
        created_at: new Date().toISOString().substring(0, 10)
      });
    }

    saveLocalDB(db);

    return {
      success: true,
      taskNumber: taskNum,
      rewardAmount: defaultReward,
      isTriggerTask: isTrigger && triggerApplied,
      triggerAmount: negAmount,
      isLockedNow: (u.negative_balance > 0),
      balance: u.balance,
      negativeBalance: u.negative_balance
    };
  }

  // User Deposit Submit
  if (endpoint === '/api/user/deposit' && method === 'POST') {
    const u = db.users[0];
    const amount = parseFloat(body.amount);
    db.deposits.unshift({
      id: db.deposits.length + 1,
      user_id: u.id,
      amount,
      proof_image_url: body.proof_image_url || '',
      notes: body.notes || '',
      status: 'pending',
      created_at: new Date().toISOString().substring(0, 10)
    });
    saveLocalDB(db);
    return { success: true, message: 'Deposit submitted successfully' };
  }

  // User Deposits List
  if (endpoint === '/api/user/deposits') {
    return { success: true, deposits: db.deposits };
  }

  // User Withdraw Submit
  if (endpoint === '/api/user/withdraw' && method === 'POST') {
    const u = db.users[0];
    const amount = parseFloat(body.amount);

    if (u.negative_balance > 0) {
      throw new Error(`Cannot withdraw while having an outstanding negative balance of LKR ${u.negative_balance.toFixed(2)}`);
    }
    if (u.balance < amount) {
      throw new Error('Insufficient balance');
    }

    u.balance -= amount;
    db.withdrawals.unshift({
      id: db.withdrawals.length + 1,
      user_id: u.id,
      amount,
      bank_name: body.bank_name,
      account_number: body.account_number,
      account_name: body.account_name,
      branch: body.branch || '',
      notes: body.notes || '',
      status: 'pending',
      created_at: new Date().toISOString().substring(0, 10)
    });

    db.transactions.unshift({
      id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
      user_id: u.id,
      type: 'Withdrawal',
      description: `Withdrawal to ${body.bank_name} (${body.account_number})`,
      amount: -amount,
      balance_after: u.balance,
      status: 'Pending',
      created_by: 'User Request',
      created_at: new Date().toISOString().substring(0, 10)
    });

    saveLocalDB(db);
    return { success: true, message: 'Withdrawal requested successfully' };
  }

  // User Withdrawals List
  if (endpoint === '/api/user/withdrawals') {
    return { success: true, withdrawals: db.withdrawals };
  }

  // User Transactions
  if (endpoint === '/api/user/transactions') {
    return { success: true, transactions: db.transactions };
  }

  // User Properties
  if (endpoint === '/api/user/properties' || endpoint === '/api/admin/properties') {
    if (method === 'POST') {
      db.properties.unshift({
        id: db.properties.length + 1,
        title: body.title,
        location: body.location,
        price: parseFloat(body.price),
        featured_image: body.featured_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        status: 'available'
      });
      saveLocalDB(db);
      return { success: true, message: 'Property created' };
    }
    return { success: true, properties: db.properties };
  }

  // Admin Dashboard
  if (endpoint === '/api/admin/dashboard') {
    const u = db.users[0];
    return {
      success: true,
      metrics: {
        totalUsers: db.users.length,
        activeUsers: db.users.filter(usr => usr.status === 'active').length,
        totalDeposits: db.users.reduce((s, usr) => s + (usr.total_deposit || 0), 0),
        pendingDeposits: db.deposits.filter(d => d.status === 'pending').length,
        pendingWithdrawals: db.withdrawals.filter(w => w.status === 'pending').length,
        totalEarnings: db.users.reduce((s, usr) => s + (usr.total_earnings || 0), 0),
        totalNegativeBalances: db.users.reduce((s, usr) => s + (usr.negative_balance || 0), 0),
        activeTasks: db.settings.max_tasks || 10,
        completedTasks: db.user_tasks.filter(t => t.status === 'completed').length
      },
      recentTransactions: db.transactions.slice(0, 10)
    };
  }

  // Admin Users List & Update
  if (endpoint === '/api/admin/users') {
    return { success: true, users: db.users };
  }
  if (endpoint.startsWith('/api/admin/users/') && method === 'PUT') {
    const parts = endpoint.split('/');
    const uId = parseInt(parts[4], 10);
    const u = db.users.find(usr => usr.id === uId);
    if (u) {
      if (body.status) u.status = body.status;
      saveLocalDB(db);
    }
    return { success: true, message: 'User updated' };
  }

  // Admin Negative Balance Adjust
  if (endpoint === '/api/admin/negative-balance/adjust') {
    const u = db.users.find(usr => usr.id === parseInt(body.userId, 10)) || db.users[0];
    const prev = u.negative_balance;
    const newAmt = Math.max(0, parseFloat(body.newAmount) || 0);
    u.negative_balance = newAmt;

    db.audit_logs.unshift({
      id: db.audit_logs.length + 1,
      admin_name: 'Master Admin',
      action: 'Adjust Negative Balance',
      setting_name: 'negative_balance',
      previous_value: `LKR ${prev}`,
      new_value: `LKR ${newAmt}`,
      reason: body.reason || 'Manual Admin adjustment',
      created_at: new Date().toISOString().substring(0, 10)
    });

    db.transactions.unshift({
      id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
      user_id: u.id,
      type: 'Admin Adjustment',
      description: `Negative Balance Adjustment: ${body.reason || 'Admin action'}`,
      amount: -newAmt,
      balance_after: -newAmt,
      status: 'Applied',
      created_by: 'Master Admin',
      created_at: new Date().toISOString().substring(0, 10)
    });

    saveLocalDB(db);
    return { success: true, message: 'Negative balance adjusted successfully' };
  }

  // Admin Config Get/Set
  if (endpoint === '/api/admin/config') {
    if (method === 'POST') {
      if (body.max_tasks !== undefined) db.settings.max_tasks = parseInt(body.max_tasks, 10);
      if (body.negative_trigger_task !== undefined) db.settings.negative_trigger_task = parseInt(body.negative_trigger_task, 10);
      if (body.negative_balance_amount !== undefined) db.settings.negative_balance_amount = parseFloat(body.negative_balance_amount);
      if (body.default_task_reward !== undefined) db.settings.default_task_reward = parseFloat(body.default_task_reward);

      db.audit_logs.unshift({
        id: db.audit_logs.length + 1,
        admin_name: 'Master Admin',
        action: 'System Setting Updated',
        setting_name: 'Trigger & Task Config',
        previous_value: 'Previous',
        new_value: JSON.stringify(db.settings),
        reason: 'Admin Panel Update',
        created_at: new Date().toISOString().substring(0, 10)
      });

      saveLocalDB(db);
      return { success: true, message: 'Settings saved' };
    }
    return { success: true, settings: db.settings };
  }

  // Admin Deposits & Action
  if (endpoint === '/api/admin/deposits') {
    return {
      success: true,
      deposits: db.deposits.map(d => {
        const u = db.users[0];
        return { ...d, user_name: u.name, user_email: u.email, username: u.username };
      })
    };
  }
  if (endpoint.startsWith('/api/admin/deposits/') && endpoint.endsWith('/action')) {
    const parts = endpoint.split('/');
    const dId = parseInt(parts[4], 10);
    const dep = db.deposits.find(d => d.id === dId);
    if (dep) {
      dep.status = body.action === 'approve' ? 'approved' : 'rejected';
      if (body.action === 'approve') {
        const u = db.users[0];
        u.balance += dep.amount;
        u.total_deposit += dep.amount;

        db.transactions.unshift({
          id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
          user_id: u.id,
          type: 'Deposit',
          description: `Deposit Approved: LKR ${dep.amount.toLocaleString()}`,
          amount: dep.amount,
          balance_after: u.balance,
          status: 'Approved',
          created_by: 'Master Admin',
          created_at: new Date().toISOString().substring(0, 10)
        });
      }
      saveLocalDB(db);
    }
    return { success: true, message: `Deposit ${body.action}d` };
  }

  // Admin Withdrawals & Action
  if (endpoint === '/api/admin/withdrawals') {
    return {
      success: true,
      withdrawals: db.withdrawals.map(w => {
        const u = db.users[0];
        return { ...w, user_name: u.name, user_email: u.email, username: u.username };
      })
    };
  }
  if (endpoint.startsWith('/api/admin/withdrawals/') && endpoint.endsWith('/action')) {
    const parts = endpoint.split('/');
    const wId = parseInt(parts[4], 10);
    const w = db.withdrawals.find(item => item.id === wId);
    if (w) {
      w.status = body.action === 'approve' ? 'approved' : 'rejected';
      if (body.action === 'approve') {
        const u = db.users[0];
        u.total_withdrawn = (u.total_withdrawn || 0) + w.amount;
      } else {
        // Refund back to user
        const u = db.users[0];
        u.balance += w.amount;
        db.transactions.unshift({
          id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
          user_id: u.id,
          type: 'Balance Correction',
          description: `Refund for Rejected Withdrawal`,
          amount: w.amount,
          balance_after: u.balance,
          status: 'Completed',
          created_by: 'Master Admin',
          created_at: new Date().toISOString().substring(0, 10)
        });
      }
      saveLocalDB(db);
    }
    return { success: true, message: `Withdrawal ${body.action}d` };
  }

  // Admin Audit Logs
  if (endpoint === '/api/admin/audit-logs') {
    return { success: true, logs: db.audit_logs };
  }

  return { success: true };
}
