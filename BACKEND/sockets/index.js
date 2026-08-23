const jwt = require('jsonwebtoken');
const { initEmitters } = require('./emmiter');
const { buildUserState } = require('../utils/stateBuilder');

function attachSocketServer(io) {
  initEmitters(io);

  io.on('connection', (socket) => {
    // Student joins their personal room for real-time game events
    socket.on('join_user', async ({ token } = {}) => {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.userId;

        socket.data.userId = userId;
        socket.join(`user:${userId}`);

        const state = await buildUserState(userId);
        // Unicast to this socket only — reconnect recovery path
        socket.emit('state_sync', state);
      } catch (err) {
        socket.emit('join_error', { message: 'Invalid or expired token' });
      }
    });

    // Backward-compat alias (in case old clients still send join_team)
    socket.on('join_team', async ({ token } = {}) => {
      socket.emit('join_error', {
        message: 'join_team is deprecated. Use join_user instead.',
      });
    });

    socket.on('disconnect', () => {
      // State lives server-side; no cleanup needed on disconnect
    });
  });
}

module.exports = attachSocketServer;
