/**
 * LUXURY PROPERTIES - Full-Stack Client Application
 * Pixel-Perfect Responsive Dark Luxury Dashboard & Admin Portal
 */

// Application State
const state = {
  token: localStorage.getItem('lp_token') || null,
  role: localStorage.getItem('lp_role') || null, // 'user' or 'admin'
  user: JSON.parse(localStorage.getItem('lp_user') || 'null'),
  route: window.location.hash || '#/dashboard',
  sidebarOpen: false,
  dashboardData: null,
  tasksData: null,
  adminData: null,
  notificationCount: 3,
};

// API Helper with Hybrid Fallback
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const res = await fetch(endpoint, { credentials: 'omit', ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        logout(false);
      }
      throw new Error(data.message || 'Request failed');
    }
    return data;
  } catch (err) {
    // If server is not running or network fails, fallback to standalone persistent DB engine seamlessly
    if (typeof handleStandaloneApi === 'function' && (err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('Network') || window.location.protocol === 'file:')) {
      try {
        const fallbackRes = handleStandaloneApi(endpoint, options);
        return fallbackRes;
      } catch (innerErr) {
        showToast(innerErr.message || 'Operation error', 'error');
        throw innerErr;
      }
    }
    showToast(err.message || 'Network error', 'error');
    throw err;
  }
}

// Global Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const isError = type === 'error';
  const isSuccess = type === 'success';

  toast.className = `px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto border flex items-center gap-3 ${
    isError 
      ? 'bg-red-950/90 text-red-200 border-red-500/50' 
      : isSuccess 
      ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50' 
      : 'bg-slate-900/90 text-amber-300 border-amber-500/40'
  }`;

  toast.innerHTML = `
    <span>${isError ? '⚠️' : isSuccess ? '✅' : '🔔'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 20);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Router
function navigate(newRoute) {
  window.location.hash = newRoute;
  state.sidebarOpen = false;
}

window.addEventListener('hashchange', () => {
  state.route = window.location.hash || '#/dashboard';
  render();
});

// Authentication Handling
function loginUser(token, user, role = 'user') {
  state.token = token;
  state.user = user;
  state.role = role;
  localStorage.setItem('lp_token', token);
  localStorage.setItem('lp_role', role);
  localStorage.setItem('lp_user', JSON.stringify(user));
  navigate(role === 'admin' ? '#/admin/dashboard' : '#/dashboard');
}

function logout(redirect = true) {
  state.token = null;
  state.user = null;
  state.role = null;
  localStorage.removeItem('lp_token');
  localStorage.removeItem('lp_role');
  localStorage.removeItem('lp_user');
  if (redirect) {
    navigate('#/login');
  } else {
    render();
  }
}

// Format Currency in LKR
function formatLKR(amount) {
  const num = parseFloat(amount) || 0;
  return 'LKR ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Close Modal
function closeModal() {
  const modalContainer = document.getElementById('modal-container');
  if (modalContainer) modalContainer.innerHTML = '';
}

/* =========================================================================
   POPUP MODALS (Pixel-Perfect recreations of uploaded images)
   ========================================================================= */

// Modal 1: Normal Task Completion (Image 1)
function showNormalTaskModal(rewardAmount = 150) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-overlay">
      <div class="luxury-card border border-amber-500/30 w-full max-w-sm p-6 text-center relative overflow-hidden bg-[#11141c] shadow-2xl rounded-2xl animate-pop-in">
        
        <!-- Floating Gold Coins and Confetti Particles -->
        <div class="coin-particle" style="top: 15%; left: 8%;">🪙</div>
        <div class="coin-particle" style="top: 25%; right: 10%; animation-delay: 1s;">✨</div>
        <div class="coin-particle" style="top: 45%; left: 12%; animation-delay: 2s;">🪙</div>
        <div class="coin-particle" style="top: 60%; right: 8%; animation-delay: 1.5s;">🪙</div>
        <div class="coin-particle" style="bottom: 20%; left: 15%; animation-delay: 2.5s;">✨</div>

        <!-- Top Badge: NORMAL TASK COMPLETION -->
        <div class="inline-block bg-[#0e3a24] border border-[#166534] text-[#4ade80] text-[11px] font-bold tracking-wider px-3.5 py-1 rounded-md uppercase mb-6">
          NORMAL TASK COMPLETION
        </div>

        <!-- 3D Gold Medal / Checkmark Icon -->
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-b from-[#f3e5ab] via-[#d4af37] to-[#8c6214] p-1 shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center">
          <div class="w-full h-full rounded-full bg-gradient-to-tr from-[#996515] to-[#f5d77f] flex items-center justify-center border-2 border-[#ffecb3]">
            <svg class="w-10 h-10 text-[#241704]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h3 class="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-1.5">
          <span>🎉</span> Task Completed!
        </h3>
        <p class="text-xs text-slate-300 mb-6">Great Job! You have completed the task.</p>

        <!-- Glowing Gold Pill with + LKR 150 -->
        <div class="glow-pill-gold py-3 px-6 mx-auto mb-4 inline-block w-full rounded-xl">
          <span class="text-xl font-extrabold text-[#065f46] tracking-wide">+ LKR ${rewardAmount}</span>
        </div>

        <!-- Notification Subtext -->
        <p class="text-xs text-slate-400 mb-6">The amount has been added to your balance.</p>

        <!-- Continue Button -->
        <button onclick="closeModal(); render();" class="btn-gold w-full py-3 text-sm font-bold tracking-wide">
          Continue
        </button>
      </div>
    </div>
  `;
}

// Modal 2: Luxury Property Reward / Negative Trigger Modal (Image 2)
function showLuxuryRewardModal(triggerAmount = 150) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-overlay">
      <div class="relative w-full max-w-md p-6 text-center overflow-hidden bg-[#180e0e] border border-red-950/70 shadow-[0_0_40px_rgba(180,83,9,0.3)] rounded-2xl animate-pop-in">
        
        <!-- Mansion & Fireworks Background Illustration -->
        <div class="absolute inset-0 bg-cover bg-center opacity-25" style="background-image: url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80');"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-[#140a0a] via-[#1c0f0f]/90 to-transparent"></div>

        <!-- Close 'X' Button -->
        <button onclick="closeModal(); render();" class="absolute top-3 right-3 text-slate-400 hover:text-white text-xl z-20 font-bold p-1">
          ✕
        </button>

        <div class="relative z-10">
          <!-- Laurel Wreath & Golden Trophy -->
          <div class="w-20 h-20 mx-auto mb-2 flex items-center justify-center text-4xl">
            🏆
          </div>

          <!-- Small Trophy Header & Congratulations -->
          <div class="flex items-center justify-center gap-1.5 text-amber-400 text-sm font-semibold mb-1">
            <span>🏆</span> Congratulations!
          </div>

          <!-- Title: Luxury Property Reward -->
          <h2 class="text-2xl font-serif font-bold text-amber-200 tracking-wide mb-1">
            Luxury Property Reward
          </h2>
          <p class="text-xs text-slate-300 mb-4">You have completed the task successfully.</p>

          <!-- Label: Admin Reward Added -->
          <div class="text-xs text-amber-300/90 font-medium mb-2">
            Admin Reward Added
          </div>

          <!-- Glowing Reward Pill Box -->
          <div class="bg-[#24120e] border border-amber-600/50 rounded-xl py-3 px-6 mx-auto mb-6 shadow-[0_0_20px_rgba(217,119,6,0.3)]">
            <span class="text-2xl font-extrabold text-amber-400 tracking-wider">+ LKR ${parseFloat(triggerAmount).toFixed(2)}</span>
          </div>

          <!-- Awesome Button -->
          <button onclick="closeModal(); render();" class="btn-gold w-full py-3 text-sm font-bold tracking-wide">
            Awesome!
          </button>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================================
   USER PANEL LAYOUT & VIEWS
   ========================================================================= */

// User Navigation Sidebar
function renderUserSidebar(activeRoute) {
  const user = state.user || { name: 'Suresh Perera', email: 'suresh@example.com' };

  return `
    <aside class="w-64 bg-[#0d1017] border-r border-[#1f2636] flex flex-col justify-between p-5 min-h-screen">
      <div>
        <!-- Golden Luxury Properties Logo -->
        <div class="flex flex-col items-center justify-center pb-6 border-b border-[#1f2636]">
          <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-lg flex items-center justify-center mb-2">
            <div class="w-full h-full bg-[#0d1017] rounded-full flex items-center justify-center text-amber-400 font-serif font-bold text-lg">
              LP
            </div>
          </div>
          <h1 class="text-sm font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 uppercase font-serif">
            LUXURY
          </h1>
          <span class="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">PROPERTIES</span>
        </div>

        <!-- User Profile Avatar & Name (Matching Screenshot) -->
        <div class="flex flex-col items-center py-5 border-b border-[#1f2636]">
          <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-md mb-2">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" alt="Avatar" class="w-full h-full object-cover" />
          </div>
          <h2 class="text-sm font-bold text-white">${user.name || 'Suresh Perera'}</h2>
          <p class="text-[11px] text-slate-400 truncate max-w-[180px]">${user.email || 'suresh@example.com'}</p>
        </div>

        <!-- Navigation Menu -->
        <nav class="mt-4 space-y-1">
          <a href="#/dashboard" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeRoute === '#/dashboard' || activeRoute === '#/' 
              ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' 
              : 'text-slate-300 hover:text-amber-300 hover:bg-[#151923]'
          }">
            <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
            <span>Dashboard</span>
          </a>

          <a href="#/deposit" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeRoute === '#/deposit' 
              ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' 
              : 'text-slate-300 hover:text-amber-300 hover:bg-[#151923]'
          }">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Deposit</span>
          </a>

          <a href="#/withdrawal" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeRoute === '#/withdrawal' 
              ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' 
              : 'text-slate-300 hover:text-amber-300 hover:bg-[#151923]'
          }">
            <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
            <span>Withdrawal</span>
          </a>

          <a href="#/tasks" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeRoute === '#/tasks' 
              ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' 
              : 'text-slate-300 hover:text-amber-300 hover:bg-[#151923]'
          }">
            <i data-lucide="check-square" class="w-4 h-4"></i>
            <span>Tasks</span>
          </a>

          <a href="#/properties" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeRoute === '#/properties' 
              ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' 
              : 'text-slate-300 hover:text-amber-300 hover:bg-[#151923]'
          }">
            <i data-lucide="home" class="w-4 h-4"></i>
            <span>Properties</span>
          </a>

          <a href="#/transactions" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeRoute === '#/transactions' 
              ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' 
              : 'text-slate-300 hover:text-amber-300 hover:bg-[#151923]'
          }">
            <i data-lucide="receipt" class="w-4 h-4"></i>
            <span>Transactions</span>
          </a>

          <a href="#/profile" class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeRoute === '#/profile' 
              ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' 
              : 'text-slate-300 hover:text-amber-300 hover:bg-[#151923]'
          }">
            <i data-lucide="user" class="w-4 h-4"></i>
            <span>Profile</span>
          </a>
        </nav>
      </div>

      <!-- Logout -->
      <div class="pt-4 border-t border-[#1f2636]">
        <button onclick="logout()" class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-all">
          <i data-lucide="log-out" class="w-4 h-4"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  `;
}

// User Header
function renderUserHeader(user) {
  return `
    <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
      <div class="flex items-center gap-3">
        <!-- Mobile Drawer Hamburger -->
        <button onclick="toggleMobileSidebar()" class="lg:hidden p-2 rounded-lg bg-[#141822] text-slate-300">
          <i data-lucide="menu" class="w-5 h-5"></i>
        </button>
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            Welcome Back, <span class="font-extrabold text-amber-300">${user.name || 'Suresh Perera'}</span> 👋
          </h2>
          <p class="text-xs text-slate-400">Here's what's happening with your account today.</p>
        </div>
      </div>

      <!-- Top Right Notification Bell & Date -->
      <div class="flex items-center gap-3">
        <button class="w-10 h-10 rounded-xl bg-[#141822] border border-[#1f2636] flex items-center justify-center text-amber-400 hover:bg-[#1a2030] transition-colors relative">
          <i data-lucide="bell" class="w-4 h-4"></i>
          <span class="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 ring-2 ring-[#141822]"></span>
        </button>

        <div class="px-3.5 py-2 rounded-xl bg-[#141822] border border-[#1f2636] text-xs font-semibold text-slate-300">
          02 Sep 2025
        </div>
      </div>
    </header>
  `;
}

// View: User Dashboard (1-to-1 match with media_1788497453451.png)
async function renderUserDashboard() {
  const res = await api('/api/user/dashboard');
  const { user, taskProgress, recentTransactions, properties } = res;

  // Calculate circular progress SVG
  const total = taskProgress.totalTasks || 10;
  const done = taskProgress.completed || 3;
  const pct = Math.min(100, Math.round((done / total) * 100));
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return `
    <div class="min-h-screen bg-[#0a0c10] flex">
      <!-- Desktop Sidebar -->
      <div class="hidden lg:block">
        ${renderUserSidebar('#/dashboard')}
      </div>

      <!-- Mobile Drawer -->
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">
        ${renderUserSidebar('#/dashboard')}
      </div>

      <!-- Main Content Area -->
      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        ${renderUserHeader(user)}

        <!-- 4 Top Balance Cards (Pixel-Perfect Match) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          <!-- Card 1: Total Balance -->
          <div class="luxury-card p-5 relative overflow-hidden flex flex-col justify-between">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-600/30 flex items-center justify-center text-emerald-400">
                <i data-lucide="briefcase" class="w-4 h-4"></i>
              </div>
              <span class="text-xs font-medium text-slate-300">Total Balance</span>
            </div>
            <div>
              <div class="text-2xl font-extrabold metric-green tracking-tight mb-0.5">
                ${formatLKR(user.balance)}
              </div>
              <span class="text-[11px] text-slate-400 font-medium">Available to use</span>
            </div>
          </div>

          <!-- Card 2: Negative Balance -->
          <div class="luxury-card p-5 relative overflow-hidden flex flex-col justify-between border-red-900/30">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-xl bg-red-950/80 border border-red-600/30 flex items-center justify-center text-red-400">
                <i data-lucide="alert-circle" class="w-4 h-4"></i>
              </div>
              <span class="text-xs font-medium text-slate-300">Negative Balance</span>
            </div>
            <div>
              <div class="text-2xl font-extrabold metric-red tracking-tight mb-0.5">
                - ${formatLKR(user.negative_balance)}
              </div>
              <span class="text-[11px] text-red-400/90 font-medium flex items-center gap-1">
                Due Amount <i data-lucide="info" class="w-3 h-3 text-red-400"></i>
              </span>
            </div>
          </div>

          <!-- Card 3: Total Deposit -->
          <div class="luxury-card p-5 relative overflow-hidden flex flex-col justify-between">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-600/30 flex items-center justify-center text-blue-400">
                <i data-lucide="wallet" class="w-4 h-4"></i>
              </div>
              <span class="text-xs font-medium text-slate-300">Total Deposit</span>
            </div>
            <div>
              <div class="text-2xl font-extrabold metric-blue tracking-tight mb-0.5">
                ${formatLKR(user.total_deposit)}
              </div>
              <span class="text-[11px] text-slate-400 font-medium">All Time</span>
            </div>
          </div>

          <!-- Card 4: Total Earnings -->
          <div class="luxury-card p-5 relative overflow-hidden flex flex-col justify-between">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-600/30 flex items-center justify-center text-amber-400">
                <i data-lucide="trending-up" class="w-4 h-4"></i>
              </div>
              <span class="text-xs font-medium text-slate-300">Total Earnings</span>
            </div>
            <div>
              <div class="text-2xl font-extrabold metric-gold tracking-tight mb-0.5">
                ${formatLKR(user.total_earnings)}
              </div>
              <span class="text-[11px] text-slate-400 font-medium">From Tasks</span>
            </div>
          </div>

        </div>

        <!-- Middle Section: Quick Deposit & Task Progress Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          <!-- Quick Deposit Card -->
          <div class="luxury-card p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <div class="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <i data-lucide="credit-card" class="w-4 h-4"></i>
                </div>
                <h3 class="text-sm font-bold text-white">Quick Deposit</h3>
              </div>
              <p class="text-xs text-slate-400 mb-5">Choose an amount and make a deposit</p>

              <!-- 3 Deposit Option Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                
                <!-- Option 1: 50,000 -->
                <div class="bg-[#0e1118] border border-[#1f2636] hover:border-amber-500/40 rounded-xl p-4 text-center transition-all flex flex-col items-center justify-between">
                  <i data-lucide="wallet" class="w-6 h-6 text-amber-400 mb-2"></i>
                  <div class="text-xs text-slate-400 font-medium">LKR</div>
                  <div class="text-base font-extrabold text-white mb-3">50,000</div>
                  <button onclick="handleQuickDeposit(50000)" class="btn-gold w-full py-1.5 text-xs font-bold">Deposit Now</button>
                </div>

                <!-- Option 2: 70,000 -->
                <div class="bg-[#0e1118] border border-[#1f2636] hover:border-amber-500/40 rounded-xl p-4 text-center transition-all flex flex-col items-center justify-between">
                  <i data-lucide="wallet" class="w-6 h-6 text-amber-400 mb-2"></i>
                  <div class="text-xs text-slate-400 font-medium">LKR</div>
                  <div class="text-base font-extrabold text-white mb-3">70,000</div>
                  <button onclick="handleQuickDeposit(70000)" class="btn-gold w-full py-1.5 text-xs font-bold">Deposit Now</button>
                </div>

                <!-- Option 3: 100,000 -->
                <div class="bg-[#0e1118] border border-[#1f2636] hover:border-amber-500/40 rounded-xl p-4 text-center transition-all flex flex-col items-center justify-between">
                  <i data-lucide="wallet" class="w-6 h-6 text-amber-400 mb-2"></i>
                  <div class="text-xs text-slate-400 font-medium">LKR</div>
                  <div class="text-base font-extrabold text-white mb-3">100,000</div>
                  <button onclick="handleQuickDeposit(100000)" class="btn-gold w-full py-1.5 text-xs font-bold">Deposit Now</button>
                </div>

              </div>
            </div>

            <!-- View Deposit History Button -->
            <button onclick="navigate('#/deposit')" class="btn-gold-outline w-full py-2.5 text-xs flex items-center justify-center gap-2">
              <span>💳</span> View Deposit History
            </button>
          </div>

          <!-- Task Progress Card (Exact Circular Ring + Stats Match) -->
          <div class="luxury-card p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                  </div>
                  <h3 class="text-sm font-bold text-white">Task Progress</h3>
                </div>
                <button onclick="navigate('#/tasks')" class="text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors">
                  View All Tasks
                </button>
              </div>

              <!-- Ring and Details Flex -->
              <div class="flex items-center gap-6 mb-5">
                <!-- Circular SVG Progress Ring -->
                <div class="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                  <svg class="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
                    <!-- Background Circle -->
                    <circle cx="50" cy="50" r="${radius}" stroke-width="9" class="circle-progress-bg" fill="none" />
                    <!-- Green Progress Arc -->
                    <circle cx="50" cy="50" r="${radius}" stroke-width="9" class="circle-progress-bar" fill="none" 
                      stroke-dasharray="${circ}" stroke-dashoffset="${offset}" />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span class="text-base font-extrabold text-white">${done} / ${total}</span>
                    <span class="text-[10px] text-slate-400 font-medium">Completed</span>
                  </div>
                </div>

                <!-- Stats Rows -->
                <div class="flex-1 space-y-2 text-xs">
                  <div class="flex justify-between py-1 border-b border-[#1f2636]/60">
                    <span class="text-slate-400">Total Tasks</span>
                    <span class="font-bold text-white">${total}</span>
                  </div>
                  <div class="flex justify-between py-1 border-b border-[#1f2636]/60">
                    <span class="text-slate-400">Completed</span>
                    <span class="font-bold text-emerald-400">${done}</span>
                  </div>
                  <div class="flex justify-between py-1 border-b border-[#1f2636]/60">
                    <span class="text-slate-400">Pending</span>
                    <span class="font-bold text-slate-300">${taskProgress.pending}</span>
                  </div>
                  <div class="flex justify-between py-1">
                    <span class="text-slate-400">Reward Earned</span>
                    <span class="font-bold text-emerald-400">${formatLKR(taskProgress.rewardEarned)}</span>
                  </div>
                </div>
              </div>

              <!-- Dual-tone Linear Progress Bar (Green + Purple) -->
              <div class="w-full h-2 rounded-full bg-[#1b2230] overflow-hidden flex mb-2">
                <div class="bg-emerald-500 h-full transition-all" style="width: ${pct}%"></div>
                <div class="bg-purple-600 h-full transition-all" style="width: ${Math.min(25, 100 - pct)}%"></div>
              </div>
            </div>

            <p class="text-[11px] text-slate-400">
              Complete tasks and earn <span class="text-blue-400 font-semibold">LKR ${taskProgress.rewardPerTask}</span> for each task.
            </p>
          </div>

        </div>

        <!-- Bottom Section: Recent Transactions & Properties Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Recent Transactions Card -->
          <div class="luxury-card p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <i data-lucide="receipt" class="w-4 h-4 text-amber-400"></i>
                  <h3 class="text-sm font-bold text-white">Recent Transactions</h3>
                </div>
              </div>

              <!-- Transactions Table -->
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="text-slate-400 border-b border-[#1f2636]">
                      <th class="pb-2 font-medium">Type</th>
                      <th class="pb-2 font-medium">Description</th>
                      <th class="pb-2 font-medium">Amount</th>
                      <th class="pb-2 font-medium">Status</th>
                      <th class="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#1f2636]/60">
                    ${recentTransactions.map(tx => `
                      <tr class="hover:bg-[#161b26] transition-colors">
                        <td class="py-2.5 font-medium text-slate-300">${tx.type}</td>
                        <td class="py-2.5 text-slate-400">${tx.description}</td>
                        <td class="py-2.5 font-bold ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}">
                          ${tx.amount < 0 ? '- ' + formatLKR(Math.abs(tx.amount)) : '+ ' + formatLKR(tx.amount)}
                        </td>
                        <td class="py-2.5">
                          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
                            tx.status === 'Completed' || tx.status === 'Approved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : tx.status === 'Applied'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                              : 'bg-slate-800 text-slate-300'
                          }">
                            ${tx.status}
                          </span>
                        </td>
                        <td class="py-2.5 text-slate-400 text-[11px]">${tx.created_at ? tx.created_at.substring(0, 10) : '02 Sep 2025'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- View All Transactions Button -->
            <button onclick="navigate('#/transactions')" class="btn-gold-outline w-full py-2.5 text-xs mt-4">
              View All Transactions
            </button>
          </div>

          <!-- Properties Card (Exact 2 Villa Layout Match) -->
          <div class="luxury-card p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <i data-lucide="building" class="w-4 h-4 text-amber-400"></i>
                  <h3 class="text-sm font-bold text-white">Properties</h3>
                </div>
                <button onclick="navigate('#/properties')" class="text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors">
                  View All
                </button>
              </div>

              <!-- 2 Property Cards Side-by-Side -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${properties.map(p => `
                  <div class="bg-[#0e1118] border border-[#1f2636] rounded-xl overflow-hidden group hover:border-amber-500/30 transition-all flex flex-col justify-between">
                    <div class="h-28 overflow-hidden relative">
                      <img src="${p.featured_image || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80'}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div class="p-3.5">
                      <h4 class="text-xs font-bold text-white truncate mb-0.5">${p.title}</h4>
                      <p class="text-[11px] text-slate-400 mb-2 truncate">${p.location}</p>
                      <div class="text-xs font-extrabold text-amber-400 mb-3">${formatLKR(p.price)}</div>
                      <button onclick="navigate('#/properties')" class="btn-gold-outline w-full py-1 text-[11px]">
                        View Details
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  `;
}

// Handler for Quick Deposit button on Dashboard
async function handleQuickDeposit(amount) {
  try {
    await api('/api/user/deposit', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        notes: `Quick deposit of LKR ${amount.toLocaleString()}`
      })
    });
    showToast(`Quick deposit request for LKR ${amount.toLocaleString()} submitted! Admin will verify soon.`, 'success');
    render();
  } catch (err) {
    // Handled in api()
  }
}

// View: User Tasks Page (With Single Focused Active Task & Lockout)
async function renderUserTasks() {
  const res = await api('/api/user/tasks');
  const { tasks, isLocked, triggerTask, triggerAmount, completedCount, negativeBalance } = res;
  const maxTasks = res.maxTasks || tasks.length;
  const activeTask = tasks.find(t => t.status === 'available') || tasks.find(t => t.status !== 'completed');
  const allDone = completedCount >= maxTasks;

  return `
    <div class="min-h-screen bg-[#0a0c10] flex">
      <div class="hidden lg:block">
        ${renderUserSidebar('#/tasks')}
      </div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">
        ${renderUserSidebar('#/tasks')}
      </div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
          <div class="flex items-center gap-3">
            <button onclick="toggleMobileSidebar()" class="lg:hidden p-2 rounded-lg bg-[#141822] text-slate-300">
              <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <div>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                Luxury Tasks & Wealth Rewards 📋
              </h2>
              <p class="text-xs text-slate-400">Complete tasks to earn verified rewards. Task rewards are credited instantly.</p>
            </div>
          </div>
          <button onclick="navigate('#/dashboard')" class="btn-gold-outline text-xs py-2 px-4 flex items-center gap-2">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Back to Dashboard
          </button>
        </header>

        <!-- Task Lockout Alert Banner if Negative Balance Active -->
        ${isLocked ? `
          <div class="bg-red-950/80 border border-red-500/60 rounded-2xl p-5 mb-6 shadow-xl flex items-start gap-4">
            <div class="text-3xl text-red-400">🔒</div>
            <div class="flex-1">
              <h3 class="text-sm font-bold text-red-200 uppercase tracking-wide">Tasks Temporarily Locked</h3>
              <p class="text-xs text-red-300/90 mt-1">
                You have reached Milestone Task #${triggerTask} and have an outstanding negative balance of 
                <span class="font-bold text-red-100">${formatLKR(negativeBalance)}</span>. 
                All subsequent tasks are blocked. Please make a deposit or clear your balance to unlock remaining tasks.
              </p>
              <div class="mt-3 flex gap-3">
                <button onclick="navigate('#/deposit')" class="btn-gold text-xs py-1.5 px-4 font-bold">
                  Make a Deposit Now
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Single Focused Current Task Console (Hides all future tasks) -->
        ${isLocked ? `
          <div class="luxury-card border border-red-500/50 p-8 max-w-xl mx-auto text-center bg-gradient-to-b from-[#1c0e10] to-[#120a0b] shadow-2xl rounded-2xl animate-pop-in">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-3xl text-red-400">
              🔒
            </div>
            <div class="inline-block px-3 py-1 rounded bg-red-950 text-red-300 border border-red-800 text-[11px] font-bold uppercase tracking-wider mb-2">
              Next Task Blocked
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Milestone Reached - Task Locked</h3>
            <p class="text-xs text-red-200/80 mb-6 max-w-md mx-auto">
              You have completed Milestone Task #${triggerTask} and have an outstanding negative balance of 
              <span class="font-bold text-red-100">${formatLKR(negativeBalance)}</span>. 
              The next task is strictly locked. Please deposit or settle your dues to unlock further tasks.
            </p>
            <div class="flex justify-center gap-3">
              <button onclick="navigate('#/deposit')" class="btn-gold py-3 px-8 text-xs font-bold shadow-lg">
                Make a Deposit to Unlock
              </button>
            </div>
          </div>
        ` : allDone ? `
          <div class="luxury-card border border-emerald-500/40 p-8 max-w-xl mx-auto text-center bg-[#0e1613] shadow-2xl rounded-2xl">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-3xl">
              🏆
            </div>
            <h3 class="text-xl font-bold text-white mb-2">All Tasks Completed!</h3>
            <p class="text-xs text-slate-300 mb-6">
              You have completed all ${maxTasks} allocated tasks for this period. Total earnings credited to your balance.
            </p>
            <button onclick="navigate('#/dashboard')" class="btn-gold py-2.5 px-6 text-xs font-bold">
              Back to Dashboard
            </button>
          </div>
        ` : activeTask ? `
          <div class="max-w-xl mx-auto">
            <!-- Main Active Task Execution Console -->
            <div class="luxury-card-gold p-8 text-center relative overflow-hidden bg-gradient-to-b from-[#181d2a] via-[#121622] to-[#0c0f17] shadow-2xl rounded-2xl border border-amber-500/40">
              
              <!-- Subtle Background Glow -->
              <div class="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <!-- Top Status Header -->
              <div class="flex items-center justify-between mb-6 pb-4 border-b border-[#1f2636]">
                <span class="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Current Active Task
                </span>

                <span class="text-xs font-semibold text-slate-400">
                  Task ${completedCount + 1} of ${maxTasks}
                </span>
              </div>

              <!-- Big Bold Task Number -->
              <div class="my-6">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ALLOCATED TASK</div>
                <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-serif tracking-tight mb-2">
                  Task #${activeTask.task_number}
                </h1>
                <p class="text-xs text-slate-400">Ready for instant verification & automated reward credit.</p>
              </div>

              <!-- Reward Display -->
              <div class="bg-[#0b0e14] border border-amber-500/30 rounded-xl py-3.5 px-6 mx-auto mb-8 inline-block w-full shadow-inner">
                <div class="text-[11px] text-slate-400 font-medium mb-0.5">Verified Task Reward</div>
                <div class="text-2xl font-black text-emerald-400 tracking-wide">
                  + LKR ${activeTask.reward_amount}
                </div>
              </div>

              <!-- Action Execution Button -->
              <button id="task-btn-${activeTask.task_number}" onclick="handleCompleteTask(${activeTask.task_number})" class="btn-gold w-full py-4 text-sm font-extrabold tracking-wider uppercase shadow-xl hover:scale-[1.02] transition-transform">
                Complete Task #${activeTask.task_number}
              </button>

              <div class="mt-4 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>Next task unlocks automatically upon task completion</span>
              </div>

            </div>

            <!-- Task Progression Bar Below Card -->
            <div class="mt-6 luxury-card p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  ${completedCount}
                </div>
                <div>
                  <div class="text-xs font-bold text-white">Tasks Completed</div>
                  <div class="text-[11px] text-slate-400">${completedCount} of ${maxTasks} finished</div>
                </div>
              </div>

              <div class="text-right">
                <div class="text-xs font-bold text-emerald-400">+ ${formatLKR(completedCount * (triggerAmount || 150))}</div>
                <div class="text-[10px] text-slate-400">Total Earned</div>
              </div>
            </div>

          </div>
        ` : ''}
      </main>
    </div>
  `;
}

// Complete Task Handler (Calls API, Triggers Appropriate Modal)
async function handleCompleteTask(taskNumber) {
  const btn = document.getElementById(`task-btn-${taskNumber}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> Processing...`;
  }

  try {
    const res = await api(`/api/user/tasks/${taskNumber}/complete`, { method: 'POST' });
    
    setTimeout(() => {
      if (res.isTriggerTask) {
        // Show Luxury Property Reward Modal (Image 2)
        showLuxuryRewardModal(res.triggerAmount);
      } else {
        // Show Normal Task Completion Modal (Image 1)
        showNormalTaskModal(res.rewardAmount || 150);
      }
    }, 400);
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Complete Task`;
    }
  }
}

// View: User Deposit Page
async function renderUserDeposit() {
  const res = await api('/api/user/deposits');
  const deposits = res.deposits || [];

  return `
    <div class="min-h-screen bg-[#0a0c10] flex">
      <div class="hidden lg:block">${renderUserSidebar('#/deposit')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderUserSidebar('#/deposit')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
          <div class="flex items-center gap-3">
            <button onclick="toggleMobileSidebar()" class="lg:hidden p-2 rounded-lg bg-[#141822] text-slate-300">
              <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <div>
              <h2 class="text-xl font-bold text-white">Deposit Funds 💳</h2>
              <p class="text-xs text-slate-400">Add funds to clear negative dues or increase available balance.</p>
            </div>
          </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Deposit Form -->
          <div class="luxury-card p-6 lg:col-span-1">
            <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <i data-lucide="plus-circle" class="w-4 h-4 text-amber-400"></i> New Deposit Request
            </h3>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block text-slate-400 mb-1 font-medium">Select / Enter Amount (LKR)</label>
                <div class="grid grid-cols-3 gap-2 mb-2">
                  <button type="button" onclick="document.getElementById('dep-amt').value=50000" class="py-1 bg-[#161a24] border border-[#1f2636] rounded-lg text-amber-300 font-bold hover:border-amber-500">50K</button>
                  <button type="button" onclick="document.getElementById('dep-amt').value=70000" class="py-1 bg-[#161a24] border border-[#1f2636] rounded-lg text-amber-300 font-bold hover:border-amber-500">70K</button>
                  <button type="button" onclick="document.getElementById('dep-amt').value=100000" class="py-1 bg-[#161a24] border border-[#1f2636] rounded-lg text-amber-300 font-bold hover:border-amber-500">100K</button>
                </div>
                <input id="dep-amt" type="number" placeholder="e.g. 50000" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none" />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Deposit Slip Reference / Proof</label>
                <input id="dep-slip" type="text" placeholder="e.g. Slip #98421 or Image URL" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none" />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Notes (Optional)</label>
                <textarea id="dep-notes" rows="2" placeholder="Additional remarks..." class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none"></textarea>
              </div>

              <button onclick="submitDeposit()" class="btn-gold w-full py-2.5 text-xs font-bold mt-2">
                Submit Deposit
              </button>
            </div>
          </div>

          <!-- Bank Details & History -->
          <div class="luxury-card p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div class="bg-[#181d2a] border border-[#232d42] rounded-xl p-4 mb-5 text-xs">
                <h4 class="font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-4 h-4"></i> Official Luxury Properties Bank Accounts
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span class="text-slate-500">Bank:</span> Commercial Bank PLC<br />
                    <span class="text-slate-500">Account:</span> 8940023412<br />
                    <span class="text-slate-500">Name:</span> Luxury Properties Holdings
                  </div>
                  <div>
                    <span class="text-slate-500">Bank:</span> Bank of Ceylon (BOC)<br />
                    <span class="text-slate-500">Account:</span> 0019283746<br />
                    <span class="text-slate-500">Branch:</span> Corporate City
                  </div>
                </div>
              </div>

              <h4 class="text-sm font-bold text-white mb-3">Deposit History</h4>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="text-slate-400 border-b border-[#1f2636]">
                      <th class="pb-2">Amount</th>
                      <th class="pb-2">Reference</th>
                      <th class="pb-2">Status</th>
                      <th class="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#1f2636]/60">
                    ${deposits.map(d => `
                      <tr>
                        <td class="py-2.5 font-bold text-emerald-400">${formatLKR(d.amount)}</td>
                        <td class="py-2.5 text-slate-300">${d.proof_image_url || d.notes || 'Direct Deposit'}</td>
                        <td class="py-2.5">
                          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
                            d.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            d.status === 'rejected' ? 'bg-red-950 text-red-400 border border-red-800' :
                            'bg-amber-950 text-amber-400 border border-amber-800'
                          }">
                            ${d.status.toUpperCase()}
                          </span>
                        </td>
                        <td class="py-2.5 text-slate-400 text-[11px]">${d.created_at.substring(0, 10)}</td>
                      </tr>
                    `).join('')}
                    ${deposits.length === 0 ? `<tr><td colspan="4" class="py-4 text-center text-slate-500">No deposits recorded yet.</td></tr>` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

async function submitDeposit() {
  const amtInput = document.getElementById('dep-amt');
  const slipInput = document.getElementById('dep-slip');
  const notesInput = document.getElementById('dep-notes');

  const amount = parseFloat(amtInput?.value);
  if (!amount || amount <= 0) {
    showToast('Please enter a valid deposit amount', 'error');
    return;
  }

  try {
    await api('/api/user/deposit', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        proof_image_url: slipInput?.value || '',
        notes: notesInput?.value || ''
      })
    });
    showToast('Deposit request submitted! Admin will verify.', 'success');
    render();
  } catch (err) {}
}

// View: User Withdrawal Page
async function renderUserWithdrawal() {
  const [withRes, userRes] = await Promise.all([
    api('/api/user/withdrawals'),
    api('/api/user/dashboard')
  ]);
  const withdrawals = withRes.withdrawals || [];
  const user = userRes.user;

  return `
    <div class="min-h-screen bg-[#0a0c10] flex">
      <div class="hidden lg:block">${renderUserSidebar('#/withdrawal')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderUserSidebar('#/withdrawal')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
          <div class="flex items-center gap-3">
            <button onclick="toggleMobileSidebar()" class="lg:hidden p-2 rounded-lg bg-[#141822] text-slate-300">
              <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <div>
              <h2 class="text-xl font-bold text-white">Withdrawal Portal 🏦</h2>
              <p class="text-xs text-slate-400">Withdraw your earned task rewards and balance directly to your bank account.</p>
            </div>
          </div>
        </header>

        <!-- Balance overview pills -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div class="luxury-card p-4 flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-400">Available Balance to Withdraw</span>
              <div class="text-xl font-extrabold text-emerald-400">${formatLKR(user.balance)}</div>
            </div>
            <i data-lucide="wallet" class="w-8 h-8 text-emerald-400 opacity-80"></i>
          </div>

          <div class="luxury-card p-4 flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-400">Negative Due Amount</span>
              <div class="text-xl font-extrabold ${user.negative_balance > 0 ? 'text-red-400' : 'text-slate-400'}">
                ${formatLKR(user.negative_balance)}
              </div>
            </div>
            <i data-lucide="alert-triangle" class="w-8 h-8 ${user.negative_balance > 0 ? 'text-red-400' : 'text-slate-600'}"></i>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Withdrawal Form -->
          <div class="luxury-card p-6 lg:col-span-1">
            <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <i data-lucide="arrow-up-right" class="w-4 h-4 text-amber-400"></i> Request Bank Payout
            </h3>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-400 mb-1 font-medium">Bank Name</label>
                <input id="w-bank" type="text" placeholder="e.g. Commercial Bank / BOC" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none" />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Account Number</label>
                <input id="w-acc" type="text" placeholder="e.g. 1234567890" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none" />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Account Holder Full Name</label>
                <input id="w-name" type="text" value="${user.name || ''}" placeholder="Account holder name" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none" />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Branch Name</label>
                <input id="w-branch" type="text" placeholder="e.g. Colombo City" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none" />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Withdrawal Amount (LKR)</label>
                <input id="w-amt" type="number" placeholder="Enter amount" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none" />
              </div>

              <button onclick="submitWithdrawal()" class="btn-gold w-full py-2.5 text-xs font-bold mt-2">
                Submit Withdrawal Request
              </button>
            </div>
          </div>

          <!-- Withdrawal History -->
          <div class="luxury-card p-6 lg:col-span-2">
            <h4 class="text-sm font-bold text-white mb-4">Payout History</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-400 border-b border-[#1f2636]">
                    <th class="pb-2">Amount</th>
                    <th class="pb-2">Bank & Account</th>
                    <th class="pb-2">Status</th>
                    <th class="pb-2">Notes</th>
                    <th class="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#1f2636]/60">
                  ${withdrawals.map(w => `
                    <tr>
                      <td class="py-2.5 font-bold text-amber-400">${formatLKR(w.amount)}</td>
                      <td class="py-2.5 text-slate-300">${w.bank_name} (${w.account_number})</td>
                      <td class="py-2.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
                          w.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          w.status === 'rejected' ? 'bg-red-950 text-red-400 border border-red-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }">
                          ${w.status.toUpperCase()}
                        </span>
                      </td>
                      <td class="py-2.5 text-slate-400 text-[11px]">${w.rejection_reason || 'Standard Processing'}</td>
                      <td class="py-2.5 text-slate-400 text-[11px]">${w.created_at.substring(0, 10)}</td>
                    </tr>
                  `).join('')}
                  ${withdrawals.length === 0 ? `<tr><td colspan="5" class="py-4 text-center text-slate-500">No withdrawal requests yet.</td></tr>` : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

async function submitWithdrawal() {
  const bank = document.getElementById('w-bank')?.value;
  const acc = document.getElementById('w-acc')?.value;
  const name = document.getElementById('w-name')?.value;
  const branch = document.getElementById('w-branch')?.value;
  const amount = parseFloat(document.getElementById('w-amt')?.value);

  if (!bank || !acc || !name || !amount || amount <= 0) {
    showToast('Please fill all bank details and a valid amount', 'error');
    return;
  }

  try {
    await api('/api/user/withdraw', {
      method: 'POST',
      body: JSON.stringify({
        bank_name: bank,
        account_number: acc,
        account_name: name,
        branch: branch,
        amount: amount
      })
    });
    showToast('Withdrawal request submitted! Admin will verify and process payout.', 'success');
    render();
  } catch (err) {}
}

// View: User Properties Page
async function renderUserProperties() {
  const res = await api('/api/user/properties');
  const properties = res.properties || [];

  return `
    <div class="min-h-screen bg-[#0a0c10] flex">
      <div class="hidden lg:block">${renderUserSidebar('#/properties')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderUserSidebar('#/properties')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
          <div class="flex items-center gap-3">
            <button onclick="toggleMobileSidebar()" class="lg:hidden p-2 rounded-lg bg-[#141822] text-slate-300">
              <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <div>
              <h2 class="text-xl font-bold text-white">Exclusive Luxury Real Estate 🏰</h2>
              <p class="text-xs text-slate-400">Discover handpicked high-yield villas, penthouses, and estates across Sri Lanka.</p>
            </div>
          </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${properties.map(p => `
            <div class="luxury-card overflow-hidden group hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div class="h-48 overflow-hidden relative">
                <img src="${p.featured_image}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30">
                  ${p.status.toUpperCase()}
                </span>
              </div>
              <div class="p-5">
                <h3 class="text-base font-bold text-white mb-1">${p.title}</h3>
                <p class="text-xs text-slate-400 mb-3">${p.location}</p>
                <div class="text-lg font-extrabold text-amber-400 mb-4">${formatLKR(p.price)}</div>
                
                <div class="flex items-center justify-between text-xs text-slate-400 py-3 border-t border-[#1f2636] mb-4">
                  <span>🛏️ ${p.bedrooms || 4} Beds</span>
                  <span>🛁 ${p.bathrooms || 3} Baths</span>
                  <span>📐 ${p.area_sqft || 3500} Sq Ft</span>
                </div>

                <button onclick="showToast('Inquiry sent to Luxury Concierge! We will contact you.', 'success')" class="btn-gold w-full py-2 text-xs font-bold">
                  Request Private Viewing
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </main>
    </div>
  `;
}

// View: User Transactions Page
async function renderUserTransactions() {
  const res = await api('/api/user/transactions');
  const transactions = res.transactions || [];

  return `
    <div class="min-h-screen bg-[#0a0c10] flex">
      <div class="hidden lg:block">${renderUserSidebar('#/transactions')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderUserSidebar('#/transactions')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
          <div class="flex items-center gap-3">
            <button onclick="toggleMobileSidebar()" class="lg:hidden p-2 rounded-lg bg-[#141822] text-slate-300">
              <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <div>
              <h2 class="text-xl font-bold text-white">Complete Transaction Ledger 🧾</h2>
              <p class="text-xs text-slate-400">Audited financial records of deposits, task rewards, adjustments, and withdrawals.</p>
            </div>
          </div>
        </header>

        <div class="luxury-card p-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-[#1f2636]">
                  <th class="pb-3">Tx ID</th>
                  <th class="pb-3">Type</th>
                  <th class="pb-3">Description</th>
                  <th class="pb-3">Amount</th>
                  <th class="pb-3">Status</th>
                  <th class="pb-3">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1f2636]/60">
                ${transactions.map(tx => `
                  <tr class="hover:bg-[#161b26] transition-colors">
                    <td class="py-3 font-mono text-slate-400 text-[11px]">${tx.id}</td>
                    <td class="py-3 font-semibold text-slate-200">${tx.type}</td>
                    <td class="py-3 text-slate-400">${tx.description}</td>
                    <td class="py-3 font-bold ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}">
                      ${tx.amount < 0 ? '- ' + formatLKR(Math.abs(tx.amount)) : '+ ' + formatLKR(tx.amount)}
                    </td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                        tx.status === 'Completed' || tx.status === 'Approved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : tx.status === 'Applied'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }">
                        ${tx.status}
                      </span>
                    </td>
                    <td class="py-3 text-slate-400 text-[11px]">${tx.created_at}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;
}

// View: User Profile
function renderUserProfile() {
  const user = state.user || {};
  return `
    <div class="min-h-screen bg-[#0a0c10] flex">
      <div class="hidden lg:block">${renderUserSidebar('#/profile')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderUserSidebar('#/profile')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
          <div class="flex items-center gap-3">
            <button onclick="toggleMobileSidebar()" class="lg:hidden p-2 rounded-lg bg-[#141822] text-slate-300">
              <i data-lucide="menu" class="w-5 h-5"></i>
            </button>
            <div>
              <h2 class="text-xl font-bold text-white">User Account Settings ⚙️</h2>
              <p class="text-xs text-slate-400">Manage security, credentials, and notification preferences.</p>
            </div>
          </div>
        </header>

        <div class="max-w-2xl luxury-card p-6">
          <div class="space-y-4 text-xs">
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Full Name</label>
              <input type="text" value="${user.name || ''}" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white" disabled />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Email Address</label>
              <input type="text" value="${user.email || ''}" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white" disabled />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Username</label>
              <input type="text" value="${user.username || ''}" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white" disabled />
            </div>
            <div>
              <label class="block text-slate-400 mb-1 font-medium">Account Status</label>
              <span class="inline-block px-3 py-1 rounded bg-emerald-950 text-emerald-400 font-bold uppercase">
                ${user.status || 'Active'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}


<div class="min-h-screen bg-[#07090d] flex items-center justify-center p-4">
  <div class="luxury-card border border-amber-500/30 w-full max-w-md p-8 bg-[#0e1118] shadow-2xl">

    <div class="text-center mb-6">

      <div class="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center mb-3">
        <div class="w-12 h-12 bg-[#0d1017] rounded-full flex items-center justify-center text-amber-400 text-xl">
          💎
        </div>
      </div>

      <div class="luxury-brand-animation">

        <div class="luxury-properties-bg">
          PROPERTIES
        </div>

        <div class="luxury-main-title">
          LUXURY
        </div>

      </div>

      <p class="text-xs text-slate-400 mt-1">
        Sign in to your account
      </p>

    </div>

    <form onsubmit="handleUserLoginSubmit(event)" class="space-y-4">

      <div>
        <label class="block text-xs text-slate-300 mb-1">
          Email / Username
        </label>

        <input
          id="u-login-email"
          type="text"
          placeholder="Enter email or username"
          required
          class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div>
        <label class="block text-xs text-slate-300 mb-1">
          Password
        </label>

        <input
          id="u-login-pass"
          type="password"
          placeholder="Enter password"
          required
          class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        class="btn-gold w-full py-3 text-xs font-bold"
      >
        Sign In to Dashboard
      </button>

    </form>

    <div class="text-center mt-5">

      <p class="text-xs text-slate-400">
        Don't have an account?
      </p>

      <a
        href="#/signup"
        class="inline-block mt-2 text-sm text-amber-400 hover:text-amber-300 font-bold"
      >
        Create New Account →
      </a>

    </div>

    <div class="pt-5 mt-5 border-t border-[#1f2636] text-center">
    </div>

  </div>
</div>
```

`;
}


          <p class="text-xs text-slate-400 mt-1">
            Sign in to your account
          </p>
        </div>

        <form onsubmit="handleUserLoginSubmit(event)" class="space-y-4">

          <div>
            <label class="block text-xs text-slate-300 mb-1">
              Email / Username
            </label>

            <input
              id="u-login-email"
              type="text"
              placeholder="Enter email or username"
              required
              class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">
              Password
            </label>

            <input
              id="u-login-pass"
              type="password"
              placeholder="Enter password"
              required
              class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            class="btn-gold w-full py-3 text-xs font-bold"
          >
            Sign In to Dashboard
          </button>

        </form>

        <div class="text-center mt-5">
          <p class="text-xs text-slate-400">
            Don't have an account?
          </p>

          <a
            href="#/signup"
            class="inline-block mt-2 text-sm text-amber-400 hover:text-amber-300 font-bold"
          >
            Create New Account →
          </a>
        </div>

        <div class="pt-5 mt-5 border-t border-[#1f2636] text-center">
         
        </div>

      </div>
    </div>
  `;
}

function renderUserSignup() {
  return `
    <div class="min-h-screen bg-[#07090d] flex items-center justify-center p-4">
      <div class="luxury-card border border-amber-500/30 w-full max-w-md p-8 bg-[#0e1118] shadow-2xl">

        <div class="text-center mb-6">
          <div class="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 flex items-center justify-center mb-3">
            <div class="w-12 h-12 bg-[#0d1017] rounded-full flex items-center justify-center text-amber-400 text-xl">
              💎
            </div>
          </div>

          <h1 class="text-xl font-extrabold text-amber-300 font-serif">
            CREATE ACCOUNT
          </h1>

          <p class="text-xs text-slate-400 mt-1">
            Join Luxury Properties
          </p>
        </div>

        <form onsubmit="handleUserSignupSubmit(event)" class="space-y-4">

          <div>
            <label class="block text-xs text-slate-300 mb-1">
              Full Name
            </label>

            <input
              id="signup-name"
              type="text"
              placeholder="Enter your full name"
              required
              class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">
              Username
            </label>

            <input
              id="signup-username"
              type="text"
              placeholder="Choose a username"
              required
              minlength="3"
              class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">
              Email
            </label>

            <input
              id="signup-email"
              type="email"
              placeholder="Enter your email"
              required
              class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">
              Phone
            </label>

            <input
              id="signup-phone"
              type="tel"
              placeholder="Enter phone number"
              class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">
              Password
            </label>

            <input
              id="signup-password"
              type="password"
              placeholder="Create a password"
              required
              minlength="6"
              class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-300 mb-1">
              Confirm Password
            </label>

            <input
              id="signup-confirm-password"
              type="password"
              placeholder="Confirm your password"
              required
              minlength="6"
              class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <p
            id="signup-message"
            class="text-xs text-center min-h-[18px]"
          ></p>

          <button
            type="submit"
            class="btn-gold w-full py-3 text-xs font-bold"
          >
            Create Account
          </button>

        </form>

        <div class="text-center mt-5">
          <a
            href="#/login"
            class="text-xs text-slate-400 hover:text-amber-300 font-semibold"
          >
            ← Already have an account? Sign In
          </a>
        </div>

      </div>
    </div>
  `;
}


async function handleUserSignupSubmit(e) {
  e.preventDefault();

  const name =
    document.getElementById('signup-name')?.value.trim();

  const username =
    document.getElementById('signup-username')?.value.trim();

  const email =
    document.getElementById('signup-email')?.value.trim();

  const phone =
    document.getElementById('signup-phone')?.value.trim();

  const password =
    document.getElementById('signup-password')?.value;

  const confirmPassword =
    document.getElementById('signup-confirm-password')?.value;

  const message =
    document.getElementById('signup-message');

  if (!name || !username || !email || !password) {
    if (message) {
      message.textContent = 'Please fill all required fields.';
      message.className = 'text-xs text-center min-h-[18px] text-red-400';
    }
    return;
  }

  if (password.length < 6) {
    if (message) {
      message.textContent = 'Password must be at least 6 characters.';
      message.className = 'text-xs text-center min-h-[18px] text-red-400';
    }
    return;
  }

  if (password !== confirmPassword) {
    if (message) {
      message.textContent = 'Passwords do not match.';
      message.className = 'text-xs text-center min-h-[18px] text-red-400';
    }
    return;
  }

  const button = e.submitter;

  if (button) {
    button.disabled = true;
    button.textContent = 'Creating Account...';
  }

  try {
    const res = await api('/api/auth/user/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        name,
        phone
      })
    });

    if (res.token && res.user) {
      showToast('Account created successfully!', 'success');

      loginUser(
        res.token,
        res.user,
        'user'
      );

      return;
    }

    throw new Error(
      res.message || 'Registration failed.'
    );

  } catch (err) {

    if (message) {
      message.textContent =
        err.message || 'Registration failed.';

      message.className =
        'text-xs text-center min-h-[18px] text-red-400';
    }

    if (button) {
      button.disabled = false;
      button.textContent = 'Create Account';
    }
  }
}
async function handleUserLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('u-login-email').value;
  const password = document.getElementById('u-login-pass').value;

  try {
    const res = await api('/api/auth/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    showToast('Login successful! Welcome to Luxury Properties.', 'success');
    loginUser(res.token, res.user, 'user');
  } catch (err) {}
}

/* =========================================================================
   ADMIN PANEL LAYOUT & VIEWS
   ========================================================================= */

function renderAdminSidebar(activeRoute) {
  return `
    <aside class="w-64 bg-[#090b0f] border-r border-[#1e2330] flex flex-col justify-between p-5 min-h-screen">
      <div>
        <div class="flex flex-col items-center pb-6 border-b border-[#1e2330]">
          <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-200 p-0.5 mb-2">
            <div class="w-full h-full bg-[#090b0f] rounded-full flex items-center justify-center text-amber-400 font-serif font-bold">
              👑
            </div>
          </div>
          <h1 class="text-xs font-extrabold text-amber-400 tracking-wider font-serif uppercase">
            MASTER ADMIN
          </h1>
          <span class="text-[10px] text-slate-500 font-mono">ROOT PRIVILEGES</span>
        </div>

        <nav class="mt-4 space-y-1 text-xs">
          <a href="#/admin/dashboard" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/dashboard' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Dashboard
          </a>

          <a href="#/admin/users" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/users' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="users" class="w-4 h-4"></i> User Management
          </a>

          <a href="#/admin/negative-balance" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/negative-balance' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="minus-circle" class="w-4 h-4"></i> Negative Balance
          </a>

          <a href="#/admin/trigger-config" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/trigger-config' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="zap" class="w-4 h-4"></i> Trigger Task Config
          </a>

          <a href="#/admin/task-range" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/task-range' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="sliders" class="w-4 h-4"></i> Task Range & Rewards
          </a>

          <a href="#/admin/deposits" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/deposits' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="arrow-down-circle" class="w-4 h-4"></i> Deposit Queue
          </a>

          <a href="#/admin/withdrawals" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/withdrawals' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="arrow-up-circle" class="w-4 h-4"></i> Withdrawal Payouts
          </a>

          <a href="#/admin/properties" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/properties' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="home" class="w-4 h-4"></i> Properties CRUD
          </a>

          <a href="#/admin/transactions" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/transactions' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="book-open" class="w-4 h-4"></i> Master Ledger
          </a>

          <a href="#/admin/audit-logs" class="flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all ${
            activeRoute === '#/admin/audit-logs' ? 'bg-[#221c13] text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }">
            <i data-lucide="shield" class="w-4 h-4"></i> Audit Logs
          </a>
        </nav>
      </div>

      <div class="pt-4 border-t border-[#1e2330]">
        <button onclick="logout()" class="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400">
          <i data-lucide="log-out" class="w-4 h-4"></i> Logout Admin
        </button>
      </div>
    </aside>
  `;
}

// View: Admin Dashboard
async function renderAdminDashboard() {
  const res = await api('/api/admin/dashboard');
  const { metrics, recentTransactions } = res;

  return `
    <div class="min-h-screen bg-[#07090d] flex">
      <div class="hidden lg:block">${renderAdminSidebar('#/admin/dashboard')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderAdminSidebar('#/admin/dashboard')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span>👑</span> Master Control Center
            </h2>
            <p class="text-xs text-slate-400">Real-time system health, financial monitoring, and configuration.</p>
          </div>
          <a href="#/dashboard" class="btn-gold-outline text-xs py-2 px-4 flex items-center gap-1.5">
            <span>👤</span> Preview User View
          </a>
        </header>

        <!-- KPI Metric Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="luxury-card p-4">
            <span class="text-xs text-slate-400">Total Registered Users</span>
            <div class="text-2xl font-extrabold text-white mt-1">${metrics.totalUsers}</div>
            <span class="text-[10px] text-emerald-400 font-semibold">${metrics.activeUsers} Active</span>
          </div>

          <div class="luxury-card p-4">
            <span class="text-xs text-slate-400">Total Deposits</span>
            <div class="text-2xl font-extrabold text-blue-400 mt-1">${formatLKR(metrics.totalDeposits)}</div>
            <span class="text-[10px] text-amber-400 font-semibold">${metrics.pendingDeposits} Pending Verification</span>
          </div>

          <div class="luxury-card p-4">
            <span class="text-xs text-slate-400">Pending Withdrawals</span>
            <div class="text-2xl font-extrabold text-amber-400 mt-1">${metrics.pendingWithdrawals}</div>
            <span class="text-[10px] text-slate-400">Awaiting Payout Approval</span>
          </div>

          <div class="luxury-card p-4 border-red-900/30">
            <span class="text-xs text-slate-400">Total Negative Balances</span>
            <div class="text-2xl font-extrabold text-red-400 mt-1">${formatLKR(metrics.totalNegativeBalances)}</div>
            <span class="text-[10px] text-red-300">Total User Dues</span>
          </div>
        </div>

        <!-- Global Recent Transactions -->
        <div class="luxury-card p-6">
          <h3 class="text-sm font-bold text-white mb-4">Recent Global Transactions</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-[#1f2636]">
                  <th class="pb-2">Tx ID</th>
                  <th class="pb-2">User</th>
                  <th class="pb-2">Type</th>
                  <th class="pb-2">Amount</th>
                  <th class="pb-2">Status</th>
                  <th class="pb-2">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1f2636]/60">
                ${recentTransactions.map(tx => `
                  <tr>
                    <td class="py-2.5 font-mono text-slate-400">${tx.id}</td>
                    <td class="py-2.5 font-semibold text-slate-200">${tx.user_name || tx.username || 'User #' + tx.user_id}</td>
                    <td class="py-2.5 text-slate-300">${tx.type}</td>
                    <td class="py-2.5 font-bold ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}">
                      ${tx.amount < 0 ? '- ' + formatLKR(Math.abs(tx.amount)) : '+ ' + formatLKR(tx.amount)}
                    </td>
                    <td class="py-2.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tx.status === 'Completed' || tx.status === 'Approved' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }">${tx.status}</span>
                    </td>
                    <td class="py-2.5 text-slate-400 text-[11px]">${tx.created_at}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;
}

// View: Admin Negative Balance Management
async function renderAdminNegativeBalance() {
  const [usersRes, configRes] = await Promise.all([
    api('/api/admin/users'),
    api('/api/admin/config')
  ]);
  const users = usersRes.users || [];

  return `
    <div class="min-h-screen bg-[#07090d] flex">
      <div class="hidden lg:block">${renderAdminSidebar('#/admin/negative-balance')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderAdminSidebar('#/admin/negative-balance')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="pb-6 border-b border-[#1f2636]/60 mb-6">
          <h2 class="text-xl font-bold text-white">Negative Balance Management ⚖️</h2>
          <p class="text-xs text-slate-400">Apply custom negative balance amounts, increase, decrease, or clear user dues.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Adjust Box -->
          <div class="luxury-card p-6 lg:col-span-1">
            <h3 class="text-sm font-bold text-white mb-4">Adjust User Negative Balance</h3>

            <div class="space-y-4 text-xs">
              <div>
                <label class="block text-slate-400 mb-1 font-medium">Select Target User</label>
                <select id="nb-user-id" onchange="updateSelectedUserPreview()" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white font-medium focus:border-amber-500 focus:outline-none">
                  ${users.map(u => `
                    <option value="${u.id}" data-balance="${u.balance}" data-neg="${u.negative_balance}">
                      ${u.name || u.username} (${u.email}) - Current Neg: ${formatLKR(u.negative_balance)}
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- Quick Presets -->
              <div>
                <label class="block text-slate-400 mb-1 font-medium">Quick Amount Presets</label>
                <div class="grid grid-cols-3 gap-2">
                  <button type="button" onclick="setPresetNeg(50)" class="py-1.5 bg-[#141822] border border-[#1f2636] rounded-lg text-red-400 font-bold hover:border-red-500">-50 LKR</button>
                  <button type="button" onclick="setPresetNeg(100)" class="py-1.5 bg-[#141822] border border-[#1f2636] rounded-lg text-red-400 font-bold hover:border-red-500">-100 LKR</button>
                  <button type="button" onclick="setPresetNeg(250)" class="py-1.5 bg-[#141822] border border-[#1f2636] rounded-lg text-red-400 font-bold hover:border-red-500">-250 LKR</button>
                  <button type="button" onclick="setPresetNeg(500)" class="py-1.5 bg-[#141822] border border-[#1f2636] rounded-lg text-red-400 font-bold hover:border-red-500">-500 LKR</button>
                  <button type="button" onclick="setPresetNeg(1000)" class="py-1.5 bg-[#141822] border border-[#1f2636] rounded-lg text-red-400 font-bold hover:border-red-500">-1,000 LKR</button>
                  <button type="button" onclick="setPresetNeg(0)" class="py-1.5 bg-[#141822] border border-emerald-800 rounded-lg text-emerald-400 font-bold hover:border-emerald-500">Clear to 0</button>
                </div>
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Custom Negative Balance Amount (LKR)</label>
                <input id="nb-amount" type="number" placeholder="Enter custom amount" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none" />
              </div>

              <div>
                <label class="block text-slate-400 mb-1 font-medium">Reason for Adjustment</label>
                <input id="nb-reason" type="text" placeholder="e.g. Milestone task due or penalty adjustment" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none" />
              </div>

              <button onclick="submitNegativeBalanceAdjust()" class="btn-gold w-full py-2.5 text-xs font-bold mt-2">
                Apply Negative Balance
              </button>
            </div>
          </div>

          <!-- User Ledger Table -->
          <div class="luxury-card p-6 lg:col-span-2">
            <h3 class="text-sm font-bold text-white mb-4">All Users Financial Ledger</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-400 border-b border-[#1f2636]">
                    <th class="pb-2">User</th>
                    <th class="pb-2">Active Balance</th>
                    <th class="pb-2">Negative Balance</th>
                    <th class="pb-2">Total Deposits</th>
                    <th class="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#1f2636]/60">
                  ${users.map(u => `
                    <tr>
                      <td class="py-2.5 font-semibold text-slate-200">${u.name || u.username} (${u.email})</td>
                      <td class="py-2.5 font-bold text-emerald-400">${formatLKR(u.balance)}</td>
                      <td class="py-2.5 font-bold ${u.negative_balance > 0 ? 'text-red-400' : 'text-slate-400'}">
                        ${u.negative_balance > 0 ? '- ' + formatLKR(u.negative_balance) : 'LKR 0.00'}
                      </td>
                      <td class="py-2.5 text-blue-400">${formatLKR(u.total_deposit)}</td>
                      <td class="py-2.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${u.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}">
                          ${u.status}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

function setPresetNeg(amount) {
  const inp = document.getElementById('nb-amount');
  if (inp) inp.value = amount;
}

async function submitNegativeBalanceAdjust() {
  const userId = document.getElementById('nb-user-id')?.value;
  const amount = document.getElementById('nb-amount')?.value;
  const reason = document.getElementById('nb-reason')?.value;

  if (!userId || amount === '') {
    showToast('Please select user and specify amount', 'error');
    return;
  }

  try {
    await api('/api/admin/negative-balance/adjust', {
      method: 'POST',
      body: JSON.stringify({
        userId: parseInt(userId, 10),
        newAmount: parseFloat(amount),
        mode: 'set',
        reason: reason || 'Manual Admin adjustment'
      })
    });
    showToast('Negative balance adjusted and recorded in audit logs!', 'success');
    render();
  } catch (err) {}
}

// View: Admin Negative Task Configuration
async function renderAdminTriggerConfig() {
  const res = await api('/api/admin/config');
  const s = res.settings;

  return `
    <div class="min-h-screen bg-[#07090d] flex">
      <div class="hidden lg:block">${renderAdminSidebar('#/admin/trigger-config')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderAdminSidebar('#/admin/trigger-config')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-4xl mx-auto overflow-y-auto">
        <header class="pb-6 border-b border-[#1f2636]/60 mb-6">
          <h2 class="text-xl font-bold text-white">Negative Task Configuration ⚡</h2>
          <p class="text-xs text-slate-400">Select which task triggers the negative balance and how much amount is applied.</p>
        </header>

        <div class="luxury-card p-6">
          <div class="space-y-5 text-xs max-w-lg">
            
            <div>
              <label class="block text-slate-300 font-bold mb-1">
                Negative Balance Trigger Task (Task 1 to 50)
              </label>
              <p class="text-slate-400 text-[11px] mb-2">When user completes this task number, the negative balance is automatically applied.</p>
              <select id="cfg-trigger-task" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-4 py-2.5 text-amber-400 font-bold focus:border-amber-500 focus:outline-none">
                ${Array.from({ length: 50 }, (_, i) => i + 1).map(n => `
                  <option value="${n}" ${s.negative_trigger_task === n ? 'selected' : ''}>
                    Task ${n} ${s.negative_trigger_task === n ? '(Current Active Trigger)' : ''}
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-slate-300 font-bold mb-1">
                Trigger Negative Balance Amount (LKR)
              </label>
              <p class="text-slate-400 text-[11px] mb-2">The negative balance amount added when the trigger task is reached.</p>
              <input id="cfg-trigger-amount" type="number" value="${s.negative_balance_amount}" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-4 py-2.5 text-white font-bold focus:border-amber-500 focus:outline-none" />
            </div>

            <div class="pt-4 border-t border-[#1f2636]">
              <button onclick="saveTriggerConfig()" class="btn-gold py-3 px-8 text-xs font-bold">
                Save Trigger Configuration to Database
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  `;
}

async function saveTriggerConfig() {
  const triggerTask = document.getElementById('cfg-trigger-task')?.value;
  const triggerAmt = document.getElementById('cfg-trigger-amount')?.value;

  try {
    await api('/api/admin/config', {
      method: 'POST',
      body: JSON.stringify({
        negative_trigger_task: parseInt(triggerTask, 10),
        negative_balance_amount: parseFloat(triggerAmt)
      })
    });
    showToast('Negative Trigger configuration saved permanently!', 'success');
    render();
  } catch (err) {}
}

// View: Admin Task Range Configuration
async function renderAdminTaskRange() {
  const res = await api('/api/admin/config');
  const s = res.settings;

  return `
    <div class="min-h-screen bg-[#07090d] flex">
      <div class="hidden lg:block">${renderAdminSidebar('#/admin/task-range')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderAdminSidebar('#/admin/task-range')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-4xl mx-auto overflow-y-auto">
        <header class="pb-6 border-b border-[#1f2636]/60 mb-6">
          <h2 class="text-xl font-bold text-white">Task Range & Reward Settings 🎛️</h2>
          <p class="text-xs text-slate-400">Configure total active tasks (0–50) and per-task completion rewards.</p>
        </header>

        <div class="luxury-card p-6 max-w-lg">
          <div class="space-y-5 text-xs">
            <div>
              <label class="block text-slate-300 font-bold mb-1">Maximum Tasks (0–50)</label>
              <select id="cfg-max-tasks" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-4 py-2.5 text-white font-bold focus:border-amber-500 focus:outline-none">
                <option value="10" ${s.max_tasks === 10 ? 'selected' : ''}>10 Tasks</option>
                <option value="20" ${s.max_tasks === 20 ? 'selected' : ''}>20 Tasks</option>
                <option value="30" ${s.max_tasks === 30 ? 'selected' : ''}>30 Tasks</option>
                <option value="40" ${s.max_tasks === 40 ? 'selected' : ''}>40 Tasks</option>
                <option value="50" ${s.max_tasks === 50 ? 'selected' : ''}>50 Tasks (Maximum)</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-300 font-bold mb-1">Default Task Reward (LKR)</label>
              <input id="cfg-task-reward" type="number" value="${s.default_task_reward}" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-4 py-2.5 text-white font-bold focus:border-amber-500 focus:outline-none" />
              <p class="text-[11px] text-slate-400 mt-1">Default: RS 150 per completed task.</p>
            </div>

            <div class="pt-4 border-t border-[#1f2636]">
              <button onclick="saveTaskRangeConfig()" class="btn-gold py-3 px-8 text-xs font-bold">
                Save Task Settings to Database
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

async function saveTaskRangeConfig() {
  const maxTasks = document.getElementById('cfg-max-tasks')?.value;
  const reward = document.getElementById('cfg-task-reward')?.value;

  try {
    await api('/api/admin/config', {
      method: 'POST',
      body: JSON.stringify({
        max_tasks: parseInt(maxTasks, 10),
        default_task_reward: parseFloat(reward)
      })
    });
    showToast('Task settings saved permanently!', 'success');
    render();
  } catch (err) {}
}

// View: Admin Deposit Management
async function renderAdminDeposits() {
  const res = await api('/api/admin/deposits');
  const deposits = res.deposits || [];

  return `
    <div class="min-h-screen bg-[#07090d] flex">
      <div class="hidden lg:block">${renderAdminSidebar('#/admin/deposits')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderAdminSidebar('#/admin/deposits')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="pb-6 border-b border-[#1f2636]/60 mb-6">
          <h2 class="text-xl font-bold text-white">Deposit Verification Queue 📥</h2>
          <p class="text-xs text-slate-400">Review user payment slips and approve deposits to credit user accounts immediately.</p>
        </header>

        <div class="luxury-card p-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-[#1f2636]">
                  <th class="pb-2">User</th>
                  <th class="pb-2">Amount</th>
                  <th class="pb-2">Proof / Notes</th>
                  <th class="pb-2">Status</th>
                  <th class="pb-2">Date</th>
                  <th class="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1f2636]/60">
                ${deposits.map(d => `
                  <tr>
                    <td class="py-3 font-semibold text-slate-200">
                      ${d.user_name || d.username}<br />
                      <span class="text-[10px] text-slate-400 font-normal">${d.user_email}</span>
                    </td>
                    <td class="py-3 font-bold text-emerald-400">${formatLKR(d.amount)}</td>
                    <td class="py-3 text-slate-300 max-w-xs truncate">${d.proof_image_url || d.notes || 'Direct'}</td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.status === 'approved' ? 'bg-emerald-950 text-emerald-400' :
                        d.status === 'rejected' ? 'bg-red-950 text-red-400' :
                        'bg-amber-950 text-amber-400'
                      }">${d.status.toUpperCase()}</span>
                    </td>
                    <td class="py-3 text-slate-400 text-[11px]">${d.created_at}</td>
                    <td class="py-3 text-right">
                      ${d.status === 'pending' ? `
                        <div class="flex items-center justify-end gap-2">
                          <button onclick="handleDepositAction(${d.id}, 'approve')" class="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px]">
                            Approve
                          </button>
                          <button onclick="handleDepositAction(${d.id}, 'reject')" class="px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-bold text-[11px]">
                            Reject
                          </button>
                        </div>
                      ` : `
                        <span class="text-slate-500 font-medium">Processed</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;
}

async function handleDepositAction(id, action) {
  try {
    await api(`/api/admin/deposits/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    showToast(`Deposit has been ${action}d!`, 'success');
    render();
  } catch (err) {}
}

// View: Admin Withdrawal Management
async function renderAdminWithdrawals() {
  const res = await api('/api/admin/withdrawals');
  const withdrawals = res.withdrawals || [];

  return `
    <div class="min-h-screen bg-[#07090d] flex">
      <div class="hidden lg:block">${renderAdminSidebar('#/admin/withdrawals')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderAdminSidebar('#/admin/withdrawals')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="pb-6 border-b border-[#1f2636]/60 mb-6">
          <h2 class="text-xl font-bold text-white">Withdrawal Payout Requests 📤</h2>
          <p class="text-xs text-slate-400">Inspect user bank details and approve or reject withdrawal payouts.</p>
        </header>

        <div class="luxury-card p-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-[#1f2636]">
                  <th class="pb-2">User</th>
                  <th class="pb-2">Amount</th>
                  <th class="pb-2">Bank Details</th>
                  <th class="pb-2">Status</th>
                  <th class="pb-2">Date</th>
                  <th class="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1f2636]/60">
                ${withdrawals.map(w => `
                  <tr>
                    <td class="py-3 font-semibold text-slate-200">
                      ${w.user_name || w.username}<br />
                      <span class="text-[10px] text-slate-400">${w.user_email}</span>
                    </td>
                    <td class="py-3 font-bold text-amber-400 text-sm">${formatLKR(w.amount)}</td>
                    <td class="py-3 text-slate-300">
                      <span class="font-bold text-white">${w.bank_name}</span> - Acc: <span class="font-mono text-amber-300">${w.account_number}</span><br />
                      <span class="text-[10px] text-slate-400">Holder: ${w.account_name} | Branch: ${w.branch || 'N/A'}</span>
                    </td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
                        w.status === 'approved' ? 'bg-emerald-950 text-emerald-400' :
                        w.status === 'rejected' ? 'bg-red-950 text-red-400' :
                        'bg-amber-950 text-amber-400'
                      }">${w.status.toUpperCase()}</span>
                    </td>
                    <td class="py-3 text-slate-400 text-[11px]">${w.created_at}</td>
                    <td class="py-3 text-right">
                      ${w.status === 'pending' ? `
                        <div class="flex items-center justify-end gap-2">
                          <button onclick="handleWithdrawalAction(${w.id}, 'approve')" class="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px]">
                            Approve
                          </button>
                          <button onclick="handleWithdrawalAction(${w.id}, 'reject')" class="px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-bold text-[11px]">
                            Reject (Refund)
                          </button>
                        </div>
                      ` : `
                        <span class="text-slate-500 font-medium">Processed</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
                ${withdrawals.length === 0 ? `<tr><td colspan="6" class="py-4 text-center text-slate-500">No withdrawal requests found.</td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;
}

async function handleWithdrawalAction(id, action) {
  try {
    await api(`/api/admin/withdrawals/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    showToast(`Withdrawal has been ${action}d!`, 'success');
    render();
  } catch (err) {}
}

// View: Admin Audit Logs
async function renderAdminAuditLogs() {
  const res = await api('/api/admin/audit-logs');
  const logs = res.logs || [];

  return `
    <div class="min-h-screen bg-[#07090d] flex">
      <div class="hidden lg:block">${renderAdminSidebar('#/admin/audit-logs')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderAdminSidebar('#/admin/audit-logs')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="pb-6 border-b border-[#1f2636]/60 mb-6">
          <h2 class="text-xl font-bold text-white">Immutable Audit Trail 📜</h2>
          <p class="text-xs text-slate-400">Complete historical record of all admin actions, configuration modifications, and reasons.</p>
        </header>

        <div class="luxury-card p-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-[#1f2636]">
                  <th class="pb-2">Admin</th>
                  <th class="pb-2">Action</th>
                  <th class="pb-2">Setting / Target</th>
                  <th class="pb-2">Previous Value</th>
                  <th class="pb-2">New Value</th>
                  <th class="pb-2">Reason</th>
                  <th class="pb-2">Date & Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1f2636]/60">
                ${logs.map(log => `
                  <tr>
                    <td class="py-2.5 font-bold text-amber-400">${log.admin_name}</td>
                    <td class="py-2.5 font-semibold text-white">${log.action}</td>
                    <td class="py-2.5 text-slate-300">${log.setting_name || 'General'}</td>
                    <td class="py-2.5 text-slate-400">${log.previous_value}</td>
                    <td class="py-2.5 text-emerald-400 font-bold">${log.new_value}</td>
                    <td class="py-2.5 text-slate-300">${log.reason || 'N/A'}</td>
                    <td class="py-2.5 text-slate-400 text-[11px]">${log.created_at}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;
}

// View: Admin User Management
async function renderAdminUsers() {
  const res = await api('/api/admin/users');
  const users = res.users || [];

  return `
    <div class="min-h-screen bg-[#07090d] flex">
      <div class="hidden lg:block">${renderAdminSidebar('#/admin/users')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderAdminSidebar('#/admin/users')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
          <div>
            <h2 class="text-xl font-bold text-white">User Management 👥</h2>
            <p class="text-xs text-slate-400">Search, view balances, suspend/activate, and configure individual user limits.</p>
          </div>
        </header>

        <div class="luxury-card p-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 border-b border-[#1f2636]">
                  <th class="pb-2">User Details</th>
                  <th class="pb-2">Balance</th>
                  <th class="pb-2">Negative Balance</th>
                  <th class="pb-2">Total Deposits</th>
                  <th class="pb-2">Total Withdrawn</th>
                  <th class="pb-2">Status</th>
                  <th class="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1f2636]/60">
                ${users.map(u => `
                  <tr>
                    <td class="py-3">
                      <div class="font-bold text-white">${u.name || u.username}</div>
                      <div class="text-[11px] text-slate-400">${u.email} | ${u.phone || 'No phone'}</div>
                    </td>
                    <td class="py-3 font-bold text-emerald-400">${formatLKR(u.balance)}</td>
                    <td class="py-3 font-bold ${u.negative_balance > 0 ? 'text-red-400' : 'text-slate-400'}">
                      ${u.negative_balance > 0 ? '- ' + formatLKR(u.negative_balance) : 'LKR 0.00'}
                    </td>
                    <td class="py-3 text-blue-400">${formatLKR(u.total_deposit)}</td>
                    <td class="py-3 text-amber-400">${formatLKR(u.total_withdrawn || 0)}</td>
                    <td class="py-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${u.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}">
                        ${u.status.toUpperCase()}
                      </span>
                    </td>
                    <td class="py-3 text-right">
                      <button onclick="toggleUserStatus(${u.id}, '${u.status === 'active' ? 'suspended' : 'active'}')" class="px-3 py-1 rounded text-[11px] font-bold ${
                        u.status === 'active' ? 'bg-red-950 text-red-300 hover:bg-red-900' : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900'
                      }">
                        ${u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;
}

async function toggleUserStatus(userId, newStatus) {
  try {
    await api(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`User status updated to ${newStatus}`, 'success');
    render();
  } catch (err) {}
}

// View: Admin Properties CRUD
async function renderAdminProperties() {
  const res = await api('/api/admin/properties');
  const properties = res.properties || [];

  return `
    <div class="min-h-screen bg-[#07090d] flex">
      <div class="hidden lg:block">${renderAdminSidebar('#/admin/properties')}</div>
      <div id="mobile-sidebar" class="sidebar-drawer lg:hidden ${state.sidebarOpen ? 'open' : ''}">${renderAdminSidebar('#/admin/properties')}</div>

      <main class="flex-1 p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto">
        <header class="flex items-center justify-between pb-6 border-b border-[#1f2636]/60 mb-6">
          <div>
            <h2 class="text-xl font-bold text-white">Property Listings Management 🏡</h2>
            <p class="text-xs text-slate-400">Add, edit, or delete listings displayed on the user dashboard.</p>
          </div>
          <button onclick="openAddPropertyModal()" class="btn-gold text-xs py-2 px-4 flex items-center gap-1.5">
            <span>+</span> Add New Property
          </button>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${properties.map(p => `
            <div class="luxury-card overflow-hidden flex flex-col justify-between">
              <div class="h-40 overflow-hidden relative">
                <img src="${p.featured_image}" class="w-full h-full object-cover" />
                <span class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-amber-300">
                  ${p.status.toUpperCase()}
                </span>
              </div>
              <div class="p-4">
                <h3 class="text-sm font-bold text-white">${p.title}</h3>
                <p class="text-xs text-slate-400 mb-2">${p.location}</p>
                <div class="text-sm font-extrabold text-amber-400 mb-4">${formatLKR(p.price)}</div>
                
                <div class="flex gap-2">
                  <button onclick="deleteProperty(${p.id})" class="w-full py-1.5 rounded bg-red-950 text-red-300 border border-red-800 text-xs font-bold hover:bg-red-900">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </main>
    </div>
  `;
}

function openAddPropertyModal() {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="modal-overlay">
      <div class="luxury-card border border-amber-500/30 w-full max-w-md p-6 bg-[#11141c] shadow-2xl rounded-2xl animate-pop-in">
        <h3 class="text-base font-bold text-white mb-4">Add New Luxury Property</h3>
        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1">Property Title</label>
            <input id="prop-title" type="text" placeholder="e.g. Royal Sea Residence" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Location</label>
            <input id="prop-loc" type="text" placeholder="e.g. Galle, Sri Lanka" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Price (LKR)</label>
            <input id="prop-price" type="number" placeholder="85000000" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Image URL</label>
            <input id="prop-img" type="text" value="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" class="w-full bg-[#0d1017] border border-[#1f2636] rounded-xl px-3 py-2 text-white" />
          </div>
          
          <div class="flex gap-3 pt-3">
            <button onclick="closeModal()" class="btn-gold-outline w-1/2 py-2">Cancel</button>
            <button onclick="submitNewProperty()" class="btn-gold w-1/2 py-2">Create Listing</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function submitNewProperty() {
  const title = document.getElementById('prop-title')?.value;
  const location = document.getElementById('prop-loc')?.value;
  const price = document.getElementById('prop-price')?.value;
  const featured_image = document.getElementById('prop-img')?.value;

  if (!title || !location || !price) {
    showToast('Please fill title, location, and price', 'error');
    return;
  }

  try {
    await api('/api/admin/properties', {
      method: 'POST',
      body: JSON.stringify({ title, location, price, featured_image })
    });
    closeModal();
    showToast('Property listing added successfully!', 'success');
    render();
  } catch (err) {}
}

async function deleteProperty(id) {
  if (!confirm('Are you sure you want to delete this property?')) return;
  try {
    await api(`/api/admin/properties/${id}`, { method: 'DELETE' });
    showToast('Property deleted', 'success');
    render();
  } catch (err) {}
}

// View: Admin Login Screen
function renderAdminLogin() {
  return `
    <div class="min-h-screen bg-[#07090d] flex items-center justify-center p-4 relative overflow-hidden">
      <div class="luxury-card border border-amber-500/40 w-full max-w-md p-8 relative z-10 shadow-2xl bg-[#0e1118]">
        
        <div class="text-center mb-6">
          <div class="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-lg flex items-center justify-center mb-2">
            <div class="w-full h-full bg-[#0d1017] rounded-full flex items-center justify-center text-amber-400 text-xl font-bold">
              👑
            </div>
          </div>
          <h1 class="text-xl font-extrabold text-amber-300 font-serif tracking-wide">
            MASTER ADMIN ACCESS
          </h1>
          <p class="text-xs text-slate-400 mt-1">Authorized Personnel Only</p>
        </div>

        <form onsubmit="handleAdminLoginSubmit(event)" class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-300 font-medium mb-1">Admin Email / Username</label>
            <input id="a-login-email" type="text" value="admin@luxury.com" required class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none" />
          </div>

          <div>
            <label class="block text-slate-300 font-medium mb-1">Master Password</label>
            <input id="a-login-pass" type="password" value="admin123" required class="w-full bg-[#090b0f] border border-[#1f2636] rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none" />
          </div>

          <button type="submit" class="btn-gold w-full py-3 text-xs font-bold tracking-wide mt-2">
            Authenticate Master Admin
          </button>
        </form>

        <div class="pt-6 mt-6 border-t border-[#1f2636] text-center">
          <a href="#/login" class="text-xs text-slate-400 hover:text-amber-300 font-semibold transition-colors">
            ← Switch to User Dashboard
          </a>
        </div>
      </div>
    </div>
  `;
}

async function handleAdminLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('a-login-email').value;
  const password = document.getElementById('a-login-pass').value;

  try {
    const res = await api('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    showToast('Admin authenticated successfully!', 'success');
    loginUser(res.token, res.admin, 'admin');
  } catch (err) {}
}

// Toggle mobile sidebar drawer
function toggleMobileSidebar() {
  state.sidebarOpen = !state.sidebarOpen;
  const drawer = document.getElementById('mobile-sidebar');
  if (drawer) {
    if (state.sidebarOpen) drawer.classList.add('open');
    else drawer.classList.remove('open');
  }
}

/* =========================================================================
   MAIN RENDER DISPATCHER
   ========================================================================= */

async function render() {
  const app = document.getElementById('app');
  if (!app) return;

  const currentRoute = state.route;

  // Public/Auth routes
  if (currentRoute === '#/login') {
    app.innerHTML = ();
    if (window.lucide) lucide.createIcons();
    return;
  }
  
if (currentRoute === '#/signup') {
  app.innerHTML = renderUserSignup();
  if (window.lucide) lucide.createIcons();
  return;
}
  
  if (currentRoute === '#/admin/login') {
    app.innerHTML = renderAdminLogin();
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Admin Routes Protection
  if (currentRoute.startsWith('#/admin')) {
    if (!state.token || state.role !== 'admin') {
      navigate('#/admin/login');
      return;
    }

    let html = '';
    if (currentRoute === '#/admin/dashboard') html = await renderAdminDashboard();
    else if (currentRoute === '#/admin/users') html = await renderAdminUsers();
    else if (currentRoute === '#/admin/negative-balance') html = await renderAdminNegativeBalance();
    else if (currentRoute === '#/admin/trigger-config') html = await renderAdminTriggerConfig();
    else if (currentRoute === '#/admin/task-range') html = await renderAdminTaskRange();
    else if (currentRoute === '#/admin/deposits') html = await renderAdminDeposits();
    else if (currentRoute === '#/admin/withdrawals') html = await renderAdminWithdrawals();
    else if (currentRoute === '#/admin/properties') html = await renderAdminProperties();
    else if (currentRoute === '#/admin/audit-logs') html = await renderAdminAuditLogs();
    else if (currentRoute === '#/admin/transactions') html = await renderAdminDashboard();
    else html = await renderAdminDashboard();

    app.innerHTML = html;
    if (window.lucide) lucide.createIcons();
    return;
  }

// User Routes Protection
if (!state.token || state.role !== 'user') {
  navigate('#/login');
  return;
}

let html = '';
  
  if (currentRoute === '#/dashboard' || currentRoute === '#/' || currentRoute === '') {
    html = await renderUserDashboard();
  } else if (currentRoute === '#/tasks') {
    html = await renderUserTasks();
  } else if (currentRoute === '#/deposit') {
    html = await renderUserDeposit();
  } else if (currentRoute === '#/withdrawal') {
    html = await renderUserWithdrawal();
  } else if (currentRoute === '#/properties') {
    html = await renderUserProperties();
  } else if (currentRoute === '#/transactions') {
    html = await renderUserTransactions();
  } else if (currentRoute === '#/profile') {
    html = renderUserProfile();
  } else {
    html = await renderUserDashboard();
  }

  app.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

// Initial Launch
document.addEventListener('DOMContentLoaded', () => {
  render();
});
