# Luxury Properties - Full-Stack Web Platform

A production-grade, responsive dark luxury web platform featuring two connected portals: **User Dashboard** and **Master Admin Control Center**, backed by a persistent database with zero data loss on restart or page refresh.

---

## 💎 Features Overview

### 1. User Dashboard (1-to-1 Recreation of Design Reference)
* **Dark Luxury Aesthetics**: Deep obsidian background (`#0a0c10`), rich gold accents, glowing metric borders.
* **Top Metric Cards**:
  * **Total Balance**: Vibrant green (`LKR 25,750.00`)
  * **Negative Balance**: Glowing orange-red (`- LKR 100.00` / Due Amount ⓘ)
  * **Total Deposit**: Electric blue (`LKR 50,000.00`)
  * **Total Earnings**: Amber gold (`LKR 7,350.00`)
* **Quick Deposit**: 3 preset option cards (LKR 50,000, 70,000, 100,000) and link to deposit history.
* **Task Progress**: Dynamic circular SVG progress ring (`3 / 10 Completed`), dual-color progress bar, reward metrics.
* **Recent Transactions Table**: Live ledger tracking Task Rewards, Deposits, and Admin Adjustments.
* **Featured Properties**: Beachfront villa and penthouse showcase.

### 2. Task Rewards & Popup Modals
* **Normal Task Completion Modal**:
  * Glowing gold checkmark medal with floating gold coins & confetti.
  * `NORMAL TASK COMPLETION` badge.
  * `+ LKR 150` on glowing metallic gold pill.
  * `Continue` button.
* **Luxury Property Reward / Negative Trigger Modal**:
  * Illuminated luxury mansion background with fireworks & gift boxes.
  * Golden trophy in laurel wreath.
  * `🏆 Congratulations! Luxury Property Reward`.
  * Configured trigger amount box and `Awesome!` button.
* **Task Lockout Mechanism ("Next Tasks Blocked")**:
  * When user completes the Admin-configured trigger task, negative balance is applied and **all subsequent tasks are locked**.
  * Shows padlock banner: `🔒 Tasks Locked: Outstanding negative balance of -LKR XXX. Please deposit to continue.`
  * Unlocks immediately when deposit is approved or admin clears negative dues.

### 3. Withdrawal Management
* **User Panel**: Bank withdrawal form (Bank Name, Account Number, Account Name, Branch, Amount).
* **Admin Panel**: Dedicated queue displaying complete bank details, with 1-click **Approve** (marks paid) or **Reject** (automatically refunds amount back to user's balance).

### 4. Admin Panel
* **Dedicated Login**: Separate secure route (`#/admin/login`).
* **KPI Dashboard**: Real-time stats across users, deposits, withdrawals, and system dues.
* **User Management**: Search, view financial stats, suspend/activate.
* **Negative Balance Control**: Set custom amount or use presets (-50, -100, -250, -500, -1000, Clear) with audit trail.
* **Trigger Task Configuration**: Select trigger task from Task 1 to 50 and set trigger amount.
* **Task Range**: Adjust max tasks (0–50) and per-task rewards.
* **Deposit Queue**: Approve/Reject deposit slips with automatic balance credit.
* **Withdrawal Queue**: Approve/Reject payouts with bank details inspection.
* **Property Management**: Add, edit, and delete property listings.
* **Immutable Audit Logs**: Tracks every admin modification, previous value, new value, date, and reason.

---

## 🚀 How to Run

### Method 1: Instant Standalone (No installation needed)
You can directly open `public/index.html` in Google Chrome, Microsoft Edge, or any modern browser! The intelligent hybrid storage engine handles all persistence, balances, tasks, and admin controls immediately.

### Method 2: Node.js + Express Backend Server
1. Open terminal in the project directory (`d:\Luxury Properties`).
2. Run:
   ```bash
   npm install
   npm start
   ```
3. Open your browser:
   * **User Portal**: `http://localhost:5000/`
   * **Admin Portal**: `http://localhost:5000/#/admin/login`

---

## 🔑 Default Credentials

### User Portal
* **Email / Username**: `suresh@example.com`
* **Password**: `user123`

### Master Admin Portal
* **Email / Username**: `admin@luxury.com`
* **Password**: `admin123`
