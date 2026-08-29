import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:4000';

/**
 * useAdminSocket
 *
 * Opens a Socket.IO connection and calls the provided callbacks
 * whenever the backend broadcasts game events globally.
 *
 * The backend already emits leaderboard_updated to ALL sockets on game_completed.
 * For other events (game_started, answer_solved, code_verified, hint_used,
 * final_solved) the backend emits only to the student's personal room.
 *
 * To receive those from the admin panel we rely on a polling fallback (the
 * onUpdate callback triggers a REST re-fetch), and also listen to the global
 * leaderboard_updated event which fires on completion.
 *
 * NOTE: The backend emits game_started / answer_solved etc. to user:{id} rooms.
 * The admin does NOT join those rooms, so we only get leaderboard_updated
 * from the socket. The hook still provides a central place to extend this in future.
 */
export function useAdminSocket({ onUpdate, onConnected, onDisconnected } = {}) {
  const onUpdateRef = useRef(onUpdate);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);

  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onConnectedRef.current = onConnected; }, [onConnected]);
  useEffect(() => { onDisconnectedRef.current = onDisconnected; }, [onDisconnected]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      onConnectedRef.current?.();
      // Ask to join an admin observer room (backend ignores unknown events gracefully)
      socket.emit('join_admin_observer');
    });

    socket.on('disconnect', () => {
      onDisconnectedRef.current?.();
    });

    // These are the events emitted GLOBALLY by the backend (to all sockets)
    const GLOBAL_EVENTS = ['leaderboard_updated', 'game_completed'];

    GLOBAL_EVENTS.forEach((event) => {
      socket.on(event, (payload) => {
        onUpdateRef.current?.(event, payload);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}
