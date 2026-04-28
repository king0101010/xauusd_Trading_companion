import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import * as marketService from './marketService.js';
import * as tradeService from './tradeService.js';

let io: SocketIOServer | null = null;
let priceInterval: NodeJS.Timeout | null = null;

export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    marketService.getLivePrice().then((d) => socket.emit('live-price', d));

    socket.on('request-price', async () => {
      socket.emit('live-price', await marketService.getLivePrice());
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  if (priceInterval) clearInterval(priceInterval);
  priceInterval = setInterval(async () => {
    if (!io) return;
    try {
      // Use tickLivePrice to simulate small movements between API calls
      const price = await marketService.tickLivePrice();
      io.emit('live-price', price);

      // Also emit the current live candle so chart can update in real-time
      const liveCandle = marketService.getCurrentLiveCandle();
      if (liveCandle) {
        io.emit('live-candle', liveCandle);
      }

      await tradeService.updatePositionPrices(price.price);
      io.emit('positions-update', await tradeService.getOpenPositions());
    } catch {}
  }, 5000);

  console.log('🔌 WebSocket server initialized');
  return io;
}

export function emitEvent(event: string, data: any) {
  if (io) io.emit(event, data);
}
