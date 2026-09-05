const express = require('express');
const router = express.Router();
const { db, fileStore } = require('../db/database');
const { authenticateUser } = require('../middleware/auth');

// Helper to get system settings
async function getSetting(key, defaultValue) {
  if (db.isNative) {
    const row = await db.get(`SELECT value FROM system_settings WHERE key = ?`, [key]);
    return row ? row.value : defaultValue;
  } else {
    return fileStore.data.system_settings[key] !== undefined ? fileStore.data.system_settings[key] : defaultValue;
  }
}

// Helper to generate transaction ID
function generateTxId() {
  return 'TXN-' + Math.floor(10000 + Math.random() * 90000);
}

// 1. GET: /api/user/dashboard
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let user;
    if (db.isNative) {
      user = await db.get(`SELECT * FROM users WHERE id = ?`, [userId]);
    } else {
      user = fileStore.data.users.find(u => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Task config & counts
    const maxTasks = parseInt(user.custom_task_limit || await getSetting('max_tasks', '10'), 10);
    const triggerTask = parseInt(user.custom_trigger_task || await getSetting('negative_trigger_task', '5'), 10);
    const defaultReward = parseFloat(await getSetting('default_task_reward', '150'));

    let userTasks = [];
    if (db.isNative) {
      userTasks = await db.all(`SELECT * FROM user_tasks WHERE user_id = ? AND task_number <= ? ORDER BY task_number ASC`, [userId, maxTasks]);
    } else {
      userTasks = fileStore.data.user_tasks.filter(ut => ut.user_id === userId && ut.task_number <= maxTasks);
    }

    const completedCount = userTasks.filter(t => t.status === 'completed').length;
    const pendingCount = Math.max(0, maxTasks - completedCount);
    const rewardEarned = userTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.reward_credited || defaultReward), 0);

    // Lock status: if user has an active negative balance > 0 and has reached/passed trigger task
    const isLocked = (user.negative_balance > 0) && (completedCount >= triggerTask);

    // Recent Transactions (top 5)
    let recentTx = [];
    if (db.isNative) {
      recentTx = await db.all(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`, [userId]);
    } else {
      recentTx = fileStore.data.transactions.filter(t => t.user_id === userId).slice(-5).reverse();
    }

    // Featured Properties (top 2 for dashboard match)
    let properties = [];
    if (db.isNative) {
      properties = await db.all(`SELECT * FROM properties WHERE status = 'available' ORDER BY id ASC LIMIT 2`);
    } else {
      properties = fileStore.data.properties.filter(p => p.status === 'available').slice(0, 2);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || user.username,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        negative_balance: user.negative_balance,
        total_deposit: user.total_deposit,
        total_earnings: user.total_earnings,
        total_withdrawn: user.total_withdrawn || 0,
        isLocked
      },
      taskProgress: {
        totalTasks: maxTasks,
        completed: completedCount,
        pending: pendingCount,
        rewardEarned: rewardEarned,
        rewardPerTask: defaultReward,
        triggerTask: triggerTask,
        isLocked
      },
      recentTransactions: recentTx,
      properties: properties,
      quickDepositAmounts: [50000, 70000, 100000]
    });
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to load user dashboard' });
  }
});

// 2. GET: /api/user/tasks
router.get('/tasks', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let user;
    if (db.isNative) {
      user = await db.get(`SELECT * FROM users WHERE id = ?`, [userId]);
    } else {
      user = fileStore.data.users.find(u => u.id === userId);
    }

    const maxTasks = parseInt(user.custom_task_limit || await getSetting('max_tasks', '10'), 10);
    const triggerTask = parseInt(user.custom_trigger_task || await getSetting('negative_trigger_task', '5'), 10);
    const defaultReward = parseFloat(await getSetting('default_task_reward', '150'));
    const negAmount = parseFloat(user.custom_negative_amount || await getSetting('negative_balance_amount', '100'));

    let userTaskRecords = [];
    if (db.isNative) {
      userTaskRecords = await db.all(`SELECT * FROM user_tasks WHERE user_id = ? AND task_number <= ?`, [userId, maxTasks]);
    } else {
      userTaskRecords = fileStore.data.user_tasks.filter(ut => ut.user_id === userId && ut.task_number <= maxTasks);
    }

    const completedNumbers = new Set(userTaskRecords.filter(t => t.status === 'completed').map(t => t.task_number));
    const completedCount = completedNumbers.size;

    // Check if user is locked out due to negative balance
    const isLocked = (user.negative_balance > 0) && (completedCount >= triggerTask);

    // Build task list 1 to maxTasks
    const taskList = [];
    for (let i = 1; i <= maxTasks; i++) {
      const isDone = completedNumbers.has(i);
      const isTrigger = (i === triggerTask);
      
      // Determine playable state
      // Task 1 is available if not completed. Subsequent task i is available if task i-1 is done AND not locked.
      let canPlay = false;
      if (!isDone) {
        if (i === 1) {
          canPlay = true;
        } else if (completedNumbers.has(i - 1)) {
          // If previous task is completed, can we play?
          // If we passed triggerTask and negative balance > 0, we are locked!
          if (i > triggerTask && user.negative_balance > 0) {
            canPlay = false; // BLOCKED!
          } else {
            canPlay = true;
          }
        }
      }

      taskList.push({
        task_number: i,
        title: `Task #${i}`,
        description: '',
        reward_amount: defaultReward,
        status: isDone ? 'completed' : (canPlay ? 'available' : 'locked'),
        is_trigger_task: isTrigger,
        completed_at: userTaskRecords.find(t => t.task_number === i)?.completed_at || null
      });
    }

    res.json({
      success: true,
      tasks: taskList,
      maxTasks,
      triggerTask,
      triggerAmount: negAmount,
      completedCount,
      isLocked,
      negativeBalance: user.negative_balance
    });
  } catch (err) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

// 3. POST: /api/user/tasks/:taskNumber/complete
router.post('/tasks/:taskNumber/complete', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const taskNum = parseInt(req.params.taskNumber, 10);

    let user;
    if (db.isNative) {
      user = await db.get(`SELECT * FROM users WHERE id = ?`, [userId]);
    } else {
      user = fileStore.data.users.find(u => u.id === userId);
    }

    const maxTasks = parseInt(user.custom_task_limit || await getSetting('max_tasks', '10'), 10);
    const triggerTask = parseInt(user.custom_trigger_task || await getSetting('negative_trigger_task', '5'), 10);
    const defaultReward = parseFloat(await getSetting('default_task_reward', '150'));
    const negAmount = parseFloat(user.custom_negative_amount || await getSetting('negative_balance_amount', '100'));

    if (taskNum < 1 || taskNum > maxTasks) {
      return res.status(400).json({ success: false, message: `Invalid task number. Must be between 1 and ${maxTasks}.` });
    }

    // Check Lockout: If user has negative balance and trying to do task > triggerTask
    if (user.negative_balance > 0 && taskNum > triggerTask) {
      return res.status(403).json({
        success: false,
        isLocked: true,
        message: `Task ${taskNum} is locked! You have an outstanding negative balance of LKR ${user.negative_balance.toFixed(2)}. Please deposit or clear your balance to continue.`
      });
    }

    // Check if task already completed
    let existingRecord;
    if (db.isNative) {
      existingRecord = await db.get(`SELECT * FROM user_tasks WHERE user_id = ? AND task_number = ? AND status = 'completed'`, [userId, taskNum]);
    } else {
      existingRecord = fileStore.data.user_tasks.find(ut => ut.user_id === userId && ut.task_number === taskNum && ut.status === 'completed');
    }

    if (existingRecord) {
      return res.status(400).json({ success: false, message: `Task ${taskNum} has already been completed.` });
    }

    // Apply Task Reward
    const newBalance = user.balance + defaultReward;
    const newEarnings = user.total_earnings + defaultReward;
    const nowIso = new Date().toISOString();
    const nowSql = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Check Trigger Task Condition
    const isTrigger = (taskNum === triggerTask);
    let triggerApplied = false;
    let finalNegativeBalance = user.negative_balance;

    if (isTrigger) {
      // Check deduplication
      let alreadyTriggered = false;
      if (db.isNative) {
        const trigCheck = await db.get(`SELECT negative_triggered FROM user_tasks WHERE user_id = ? AND task_number = ?`, [userId, taskNum]);
        if (trigCheck && trigCheck.negative_triggered === 1) alreadyTriggered = true;
      } else {
        const trigCheck = fileStore.data.user_tasks.find(ut => ut.user_id === userId && ut.task_number === taskNum);
        if (trigCheck && trigCheck.negative_triggered === 1) alreadyTriggered = true;
      }

      if (!alreadyTriggered) {
        triggerApplied = true;
        finalNegativeBalance = Math.abs(negAmount); // Set negative balance owed
      }
    }

    // Update User Record & UserTasks in DB
    const txIdReward = generateTxId();
    const txIdNeg = generateTxId();

    if (db.isNative) {
      // Update User
      await db.run(
        `UPDATE users SET balance = ?, total_earnings = ?, negative_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newBalance, newEarnings, finalNegativeBalance, userId]
      );

      // Record or update user_tasks
      const utRow = await db.get(`SELECT id FROM user_tasks WHERE user_id = ? AND task_number = ?`, [userId, taskNum]);
      if (utRow) {
        await db.run(
          `UPDATE user_tasks SET status = 'completed', completed_at = ?, reward_credited = ?, negative_triggered = ? WHERE id = ?`,
          [nowSql, defaultReward, triggerApplied ? 1 : 0, utRow.id]
        );
      } else {
        await db.run(
          `INSERT INTO user_tasks (user_id, task_id, task_number, status, completed_at, reward_credited, negative_triggered)
           VALUES (?, ?, ?, 'completed', ?, ?, ?)`,
          [userId, taskNum, taskNum, nowSql, defaultReward, triggerApplied ? 1 : 0]
        );
      }

      // Add Reward Transaction
      await db.run(
        `INSERT INTO transactions (id, user_id, type, description, amount, balance_after, status, created_by, created_at)
         VALUES (?, ?, 'Task Reward', ?, ?, ?, 'Completed', 'System', ?)`,
        [txIdReward, userId, `Task ${taskNum} Completed`, defaultReward, newBalance, nowSql]
      );

      // If Triggered, Add Negative Balance Transaction
      if (triggerApplied) {
        await db.run(
          `INSERT INTO transactions (id, user_id, type, description, amount, balance_after, status, created_by, created_at)
           VALUES (?, ?, 'Admin Adjustment', 'Negative Balance Applied', ?, ?, 'Applied', 'System Trigger', ?)`,
          [txIdNeg, userId, -finalNegativeBalance, -finalNegativeBalance, nowSql]
        );

        // Record in negative_balance_records
        await db.run(
          `INSERT INTO negative_balance_records (user_id, previous_amount, new_amount, delta, reason, admin_id)
           VALUES (?, ?, ?, ?, 'Automated Milestone Task Trigger', 1)`,
          [userId, user.negative_balance, finalNegativeBalance, finalNegativeBalance - user.negative_balance]
        );
      }
    } else {
      user.balance = newBalance;
      user.total_earnings = newEarnings;
      user.negative_balance = finalNegativeBalance;
      user.updated_at = nowIso;

      let ut = fileStore.data.user_tasks.find(u => u.user_id === userId && u.task_number === taskNum);
      if (ut) {
        ut.status = 'completed';
        ut.completed_at = nowIso;
        ut.reward_credited = defaultReward;
        if (triggerApplied) ut.negative_triggered = 1;
      } else {
        fileStore.data.user_tasks.push({
          id: fileStore.data.user_tasks.length + 1,
          user_id: userId,
          task_id: taskNum,
          task_number: taskNum,
          status: 'completed',
          completed_at: nowIso,
          reward_credited: defaultReward,
          negative_triggered: triggerApplied ? 1 : 0
        });
      }

      fileStore.data.transactions.push({
        id: txIdReward,
        user_id: userId,
        type: 'Task Reward',
        description: `Task ${taskNum} Completed`,
        amount: defaultReward,
        balance_after: newBalance,
        status: 'Completed',
        created_by: 'System',
        created_at: nowIso
      });

      if (triggerApplied) {
        fileStore.data.transactions.push({
          id: txIdNeg,
          user_id: userId,
          type: 'Admin Adjustment',
          description: 'Negative Balance Applied',
          amount: -finalNegativeBalance,
          balance_after: -finalNegativeBalance,
          status: 'Applied',
          created_by: 'System Trigger',
          created_at: nowIso
        });

        fileStore.data.negative_balance_records.push({
          id: fileStore.data.negative_balance_records.length + 1,
          user_id: userId,
          previous_amount: 0,
          new_amount: finalNegativeBalance,
          delta: finalNegativeBalance,
          reason: 'Automated Milestone Task Trigger',
          admin_id: 1,
          created_at: nowIso
        });
      }

      fileStore.save();
    }

    res.json({
      success: true,
      taskNumber: taskNum,
      rewardAmount: defaultReward,
      isTriggerTask: isTrigger && triggerApplied,
      triggerAmount: finalNegativeBalance,
      isLockedNow: (finalNegativeBalance > 0),
      balance: newBalance,
      negativeBalance: finalNegativeBalance,
      message: isTrigger && triggerApplied 
        ? 'Special Luxury Property Reward Task Completed! Milestone negative balance applied.'
        : `Task ${taskNum} completed successfully! + LKR ${defaultReward} added to balance.`
    });
  } catch (err) {
    console.error('Task complete error:', err);
    res.status(500).json({ success: false, message: 'Server error completing task' });
  }
});

// 4. POST: /api/user/deposit
router.post('/deposit', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, notes, proof_image_url } = req.body;
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid deposit amount.' });
    }

    let depositId;
    const nowIso = new Date().toISOString();
    const nowSql = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (db.isNative) {
      const result = await db.run(
        `INSERT INTO deposits (user_id, amount, proof_image_url, notes, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        [userId, numAmount, proof_image_url || '', notes || '', nowSql]
      );
      depositId = result.lastID;
    } else {
      depositId = fileStore.data.deposits.length + 1;
      fileStore.data.deposits.push({
        id: depositId,
        user_id: userId,
        amount: numAmount,
        proof_image_url: proof_image_url || '',
        notes: notes || '',
        status: 'pending',
        admin_id: null,
        reviewed_at: null,
        created_at: nowIso
      });
      fileStore.save();
    }

    res.json({
      success: true,
      message: `Deposit request for LKR ${numAmount.toLocaleString()} submitted successfully. Awaiting Admin verification.`,
      depositId
    });
  } catch (err) {
    console.error('Deposit submit error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit deposit request' });
  }
});

// 5. GET: /api/user/deposits
router.get('/deposits', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let deposits = [];
    if (db.isNative) {
      deposits = await db.all(`SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    } else {
      deposits = fileStore.data.deposits.filter(d => d.user_id === userId).reverse();
    }
    res.json({ success: true, deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve deposit history' });
  }
});

// 6. POST: /api/user/withdraw
router.post('/withdraw', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bank_name, account_number, account_name, branch, notes } = req.body;
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid withdrawal amount.' });
    }

    if (!bank_name || !account_number || !account_name) {
      return res.status(400).json({ success: false, message: 'Bank Name, Account Number, and Account Name are required.' });
    }

    let user;
    if (db.isNative) {
      user = await db.get(`SELECT * FROM users WHERE id = ?`, [userId]);
    } else {
      user = fileStore.data.users.find(u => u.id === userId);
    }

    // Check negative balance
    if (user.negative_balance > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot request withdrawal while having an outstanding negative balance of LKR ${user.negative_balance.toFixed(2)}. Please settle dues first.`
      });
    }

    // Check sufficient balance
    if (user.balance < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: LKR ${user.balance.toLocaleString()}, Requested: LKR ${numAmount.toLocaleString()}`
      });
    }

    // Deduct from balance pending approval
    const newBalance = user.balance - numAmount;
    const txId = generateTxId();
    const nowIso = new Date().toISOString();
    const nowSql = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (db.isNative) {
      await db.run(`UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [newBalance, userId]);

      const result = await db.run(
        `INSERT INTO withdrawals (user_id, amount, bank_name, account_number, account_name, branch, notes, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [userId, numAmount, bank_name.trim(), account_number.trim(), account_name.trim(), branch || '', notes || '', nowSql]
      );

      await db.run(
        `INSERT INTO transactions (id, user_id, type, description, amount, balance_after, status, created_by, created_at)
         VALUES (?, ?, 'Withdrawal', ?, ?, ?, 'Pending', 'User Request', ?)`,
        [txId, userId, `Withdrawal to ${bank_name} (${account_number})`, -numAmount, newBalance, nowSql]
      );
    } else {
      user.balance = newBalance;
      fileStore.data.withdrawals.push({
        id: fileStore.data.withdrawals.length + 1,
        user_id: userId,
        amount: numAmount,
        bank_name: bank_name.trim(),
        account_number: account_number.trim(),
        account_name: account_name.trim(),
        branch: branch || '',
        notes: notes || '',
        status: 'pending',
        rejection_reason: null,
        admin_id: null,
        reviewed_at: null,
        created_at: nowIso
      });

      fileStore.data.transactions.push({
        id: txId,
        user_id: userId,
        type: 'Withdrawal',
        description: `Withdrawal to ${bank_name} (${account_number})`,
        amount: -numAmount,
        balance_after: newBalance,
        status: 'Pending',
        created_by: 'User Request',
        created_at: nowIso
      });

      fileStore.save();
    }

    res.json({
      success: true,
      message: `Withdrawal request for LKR ${numAmount.toLocaleString()} submitted successfully.`,
      newBalance
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ success: false, message: 'Server error processing withdrawal request' });
  }
});

// 7. GET: /api/user/withdrawals
router.get('/withdrawals', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let withdrawals = [];
    if (db.isNative) {
      withdrawals = await db.all(`SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    } else {
      withdrawals = fileStore.data.withdrawals.filter(w => w.user_id === userId).reverse();
    }
    res.json({ success: true, withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve withdrawal history' });
  }
});

// 8. GET: /api/user/transactions
router.get('/transactions', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let transactions = [];
    if (db.isNative) {
      transactions = await db.all(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
    } else {
      transactions = fileStore.data.transactions.filter(t => t.user_id === userId).reverse();
    }
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve transactions' });
  }
});

// 9. GET: /api/user/properties
router.get('/properties', async (req, res) => {
  try {
    let properties = [];
    if (db.isNative) {
      properties = await db.all(`SELECT * FROM properties WHERE status = 'available' ORDER BY created_at DESC`);
    } else {
      properties = fileStore.data.properties.filter(p => p.status === 'available');
    }
    res.json({ success: true, properties });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve properties' });
  }
});

module.exports = router;
