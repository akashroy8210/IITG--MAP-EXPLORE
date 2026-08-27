require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const attachSocketServer = require('./sockets');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { ensureCounter } = require('./services/userNumber.service');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const gameRoutes = require('./routes/game.routes');

const app = express();
const server = http.createServer(app);

// const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';
const corsOrigin = ['http://localhost:5173','http://localhost:5174']
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, system: 'student-based' }));

// Routes — specific paths mounted BEFORE generic /api
app.use('/api/auth', authRoutes);           // POST /api/auth/student/login, POST /api/auth/admin/login
app.use('/api/admin', adminRoutes);         // All admin panel APIs (protected by adminAuth)
app.use('/api', gameRoutes);                // GET /api/student/me, POST /api/game/* (protected by studentAuth)

app.use(notFound);
app.use(errorHandler);

const io = new Server(server, { cors: { origin: corsOrigin } });
attachSocketServer(io);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  // Ensure the student user number counter starts at 100000
  // (first student will receive 100001)
  await ensureCounter();

  server.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
    console.log(`   Auth:   POST /api/auth/student/login`);
    console.log(`   Admin:  POST /api/auth/admin/login`);
    console.log(`   Panel:  GET  /api/admin/dashboard`);
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, server, io };
