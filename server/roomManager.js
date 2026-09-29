// server/roomManager.js - Room lifecycle and state management following nodejs-backend-patterns
import { UnoGameEngine } from '../src/game/engine.js';
import { BotBrain, createBot } from '../src/game/bots.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(ownerInfo, settings = {}) {
    let roomId = this.generateRoomCode();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomCode();
    }

    const room = {
      id: roomId,
      ownerId: ownerInfo.id,
      settings: {
        maxPlayers: settings.maxPlayers || 8,
        language: settings.language || 'English',
        turnTime: settings.turnTime || 30,
        rounds: settings.rounds || 3,
        gameMode: settings.gameMode || 'Normal',
        startingCards: settings.startingCards || 7,
        houseRules: settings.houseRules || 'none',
        customRules: settings.customRules || ''
      },
      clients: new Map(), // playerId -> ws
      players: [
        {
          id: ownerInfo.id,
          name: ownerInfo.name || 'Player 1',
          avatar: ownerInfo.avatar,
          isOwner: true,
          isBot: false,
          points: 0,
          connected: true
        }
      ],
      engine: null,
      botBrain: null,
      status: 'lobby' // 'lobby' | 'in_game' | 'game_over'
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, playerInfo, ws) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'lobby') return { error: 'Game already in progress' };
    if (room.players.length >= room.settings.maxPlayers) return { error: 'Room is full' };

    const player = {
      id: playerInfo.id,
      name: playerInfo.name || `Player ${room.players.length + 1}`,
      avatar: playerInfo.avatar,
      isOwner: false,
      isBot: false,
      points: 0,
      connected: true
    };

    room.players.push(player);
    if (ws) room.clients.set(player.id, ws);

    return { room, player };
  }

  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.delete(playerId);
    const pIndex = room.players.findIndex(p => p.id === playerId);
    if (pIndex !== -1) {
      const wasOwner = room.players[pIndex].isOwner;
      room.players.splice(pIndex, 1);

      if (room.players.length === 0) {
        this.rooms.delete(roomId);
        return;
      }

      if (wasOwner && room.players.length > 0) {
        room.players[0].isOwner = true;
        room.ownerId = room.players[0].id;
      }
    }
  }

  broadcast(room, type, payload) {
    const msg = JSON.stringify({ type, payload });
    for (const [playerId, client] of room.clients.entries()) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(msg);
      }
    }
  }
}
