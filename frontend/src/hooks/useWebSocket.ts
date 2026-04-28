import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const setLivePrice = useStore((s) => s.setLivePrice);
  const setConnected = useStore((s) => s.setConnected);
  const updatePositions = useStore((s) => s.setPositions);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
    });

    socket.on('live-price', (data) => {
      setLivePrice(data);
    });

    socket.on('positions-update', (data) => {
      updatePositions(data);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current = socket;
  }, [setLivePrice, setConnected, updatePositions]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [connect]);

  return socketRef.current;
}
