const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./server/db/database');

const authRoutes = require('./server/routes/auth');
const userRoutes = require('./server/routes/user');
const adminRoutes = require('./server/routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'Luxury Properties Supreme' });
});

// Single Page Application Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server & Initialize Database
async function startServer() {
  try {
    await initDatabase();
    console.log('[Database] Initialized and verified successfully.');

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`💎 LUXURY PROPERTIES PLATFORM ONLINE`);
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`👤 User Portal:      http://localhost:${PORT}/`);
      console.log(`👑 Admin Portal:     http://localhost:${PORT}/admin/login`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
  }
}

startServer();
