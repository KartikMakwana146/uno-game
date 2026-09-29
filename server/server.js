// server/server.js - Production-ready Node.js WebSocket & HTTP Server
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { RoomManager } from './roomManager.js';
import { UnoGameEngine } from '../src/game/engine.js';
import { BotBrain, createBot } from '../src/game/bots.js';

const PORT = process.env.PORT || 3001;
const roomManager = new RoomManager();

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), rooms: roomManager.rooms.size }));
    return;
  }

  // Room status endpoint
  if (req.url.startsWith('/api/room/')) {
    const roomId = req.url.split('/api/room/')[1];
    const room = roomManager.getRoom(roomId);
    if (!room) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Room not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: room.id,
      playerCount: room.players.length,
      maxPlayers: room.settings.maxPlayers,
      status: room.status
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('UNO skribbl.io game server is running');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let currentRoomId = null;
  let currentUserId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { type, payload } = data;

      switch (type) {
        case 'create_room': {
          const room = roomManager.createRoom(payload.user, payload.settings);
          currentRoomId = room.id;
          currentUserId = payload.user.id;
          room.clients.set(currentUserId, ws);

          ws.send(JSON.stringify({
            type: 'room_created',
            payload: { room: serializeRoom(room), playerId: currentUserId }
          }));
          break;
        }

        case 'join_room': {
          const res = roomManager.joinRoom(payload.roomId, payload.user, ws);
          if (res.error) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: res.error } }));
            return;
          }
          currentRoomId = res.room.id;
          currentUserId = payload.user.id;

          // Notify joining player
          ws.send(JSON.stringify({
            type: 'room_joined',
            payload: { room: serializeRoom(res.room), playerId: currentUserId }
          }));

          // Broadcast to existing players
          roomManager.broadcast(res.room, 'player_joined', {
            player: res.player,
            players: res.room.players
          });
          break;
        }

        case 'update_settings': {
          const room = roomManager.getRoom(currentRoomId);
          if (!room || room.ownerId !== currentUserId) return;
          room.settings = { ...room.settings, ...payload.settings };
          roomManager.broadcast(room, 'settings_updated', { settings: room.settings });
          break;
        }

        case 'start_game': {
          const room = roomManager.getRoom(currentRoomId);
          if (!room || room.ownerId !== currentUserId) return;

          // If not enough players, fill with bots up to selected players count or minimum 2
          const targetCount = Math.max(2, Math.min(room.settings.maxPlayers, 4));
          let botIdx = 0;
          while (room.players.length < targetCount) {
            const bot = createBot(botIdx++);
            room.players.push(bot);
          }

          room.status = 'in_game';
          room.engine = new UnoGameEngine(room.settings);
          room.engine.setPlayers(room.players);

          // Setup bot brain
          room.botBrain = new BotBrain(
            room.engine,
            (botPlayer, text) => {
              roomManager.broadcast(room, 'chat_message', {
                senderId: botPlayer.id,
                senderName: botPlayer.name,
                text
              });
            },
            (botPlayer, reaction) => {
              roomManager.broadcast(room, 'reaction', {
                senderId: botPlayer.id,
                senderName: botPlayer.name,
                reaction
              });
            }
          );

          // Hook engine updates
          room.engine.onUpdate((event, eventData, publicState) => {
            roomManager.broadcast(room, 'game_event', { event, eventData, publicState });

            // Send private hand updates to connected human clients
            for (const [pId, client] of room.clients.entries()) {
              const p = room.engine.players.find(x => x.id === pId);
              if (p && client.readyState === 1) {
                client.send(JSON.stringify({
                  type: 'hand_update',
                  payload: { hand: p.hand }
                }));
              }
            }

            // Let bots act if it's their turn
            const activePlayer = room.engine.getCurrentPlayer();
            if (activePlayer && activePlayer.isBot) {
              room.botBrain.handleTurn(activePlayer);
            }
          });

          roomManager.broadcast(room, 'game_started', {
            room: serializeRoom(room),
            gameState: room.engine.getPublicState()
          });

          room.engine.startNewGame();
          break;
        }

        case 'play_card': {
          const room = roomManager.getRoom(currentRoomId);
          if (!room || !room.engine) return;
          room.engine.playCard(currentUserId, payload.cardId);
          break;
        }

        case 'draw_card': {
          const room = roomManager.getRoom(currentRoomId);
          if (!room || !room.engine) return;
          room.engine.drawCard(currentUserId);
          break;
        }

        case 'choose_color': {
          const room = roomManager.getRoom(currentRoomId);
          if (!room || !room.engine) return;
          room.engine.resolveColorChoice(currentUserId, payload.color);
          break;
        }

        case 'say_uno': {
          const room = roomManager.getRoom(currentRoomId);
          if (!room || !room.engine) return;
          room.engine.sayUno(currentUserId);
          break;
        }

        case 'chat_message': {
          const room = roomManager.getRoom(currentRoomId);
          if (!room) return;
          const player = room.players.find(p => p.id === currentUserId);
          if (player) {
            roomManager.broadcast(room, 'chat_message', {
              senderId: player.id,
              senderName: player.name,
              text: payload.text
            });
          }
          break;
        }

        case 'reaction': {
          const room = roomManager.getRoom(currentRoomId);
          if (!room) return;
          const player = room.players.find(p => p.id === currentUserId);
          if (player) {
            roomManager.broadcast(room, 'reaction', {
              senderId: player.id,
              senderName: player.name,
              reaction: payload.reaction
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message handling error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && currentUserId) {
      const room = roomManager.getRoom(currentRoomId);
      if (room) {
        roomManager.leaveRoom(currentRoomId, currentUserId);
        roomManager.broadcast(room, 'player_left', {
          playerId: currentUserId,
          players: room.players,
          ownerId: room.ownerId
        });
      }
    }
  });
});

function serializeRoom(room) {
  return {
    id: room.id,
    ownerId: room.ownerId,
    settings: room.settings,
    players: room.players,
    status: room.status
  };
}

server.listen(PORT, () => {
  console.log(`[UNO Server] Listening on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server shut down cleanly.');
      process.exit(0);
    });
  });
});
