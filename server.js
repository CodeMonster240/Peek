const path = require('path');
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { createStore } = require('./src/store');
const { addTodo, toggleTodo, deleteTodo, addChatMessage } = require('./src/roomState');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const store = createStore({ root: __dirname });
const roomSockets = new Map();

store.ensureStorage();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

function roomSnapshot(roomId) {
  const room = store.loadRoom(roomId);
  return {
    type: 'snapshot',
    roomId: room.id,
    todos: room.todos,
    chat: room.chat
  };
}

function broadcastRoom(roomId) {
  const peers = roomSockets.get(roomId);
  if (!peers || peers.size === 0) {
    return;
  }

  const message = JSON.stringify(roomSnapshot(roomId));
  for (const socket of peers) {
    if (socket.readyState === socket.OPEN) {
      socket.send(message);
    }
  }
}

wss.on('connection', (socket) => {
  socket.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(String(raw));
    } catch (_err) {
      return;
    }

    if (data.type === 'join') {
      const roomId = store.safeRoomId(data.roomId);
      const user = String(data.user || 'Default Human');

      socket.roomId = roomId;
      socket.user = user;

      if (!roomSockets.has(roomId)) {
        roomSockets.set(roomId, new Set());
      }
      roomSockets.get(roomId).add(socket);

      socket.send(JSON.stringify(roomSnapshot(roomId)));
      return;
    }

    if (!socket.roomId) {
      return;
    }

    const roomId = socket.roomId;
    const room = store.loadRoom(roomId);

    if (data.type === 'todo:add') {
      addTodo(room, data.text, socket.user);
      store.saveRoom(roomId);
      broadcastRoom(roomId);
    } else if (data.type === 'todo:toggle') {
      toggleTodo(room, data.todoId);
      store.saveRoom(roomId);
      broadcastRoom(roomId);
    } else if (data.type === 'todo:delete') {
      deleteTodo(room, data.todoId);
      store.saveRoom(roomId);
      broadcastRoom(roomId);
    } else if (data.type === 'chat') {
      addChatMessage(room, { user: socket.user, mode: data.mode, text: data.text });
      store.saveRoom(roomId);
      broadcastRoom(roomId);
    }
  });

  socket.on('close', () => {
    if (!socket.roomId) {
      return;
    }

    const peers = roomSockets.get(socket.roomId);
    if (!peers) {
      return;
    }

    peers.delete(socket);
    if (peers.size === 0) {
      roomSockets.delete(socket.roomId);
    }
  });
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Peek running at http://localhost:${port}`);
  console.log(`Data auto-generated under: ${path.join(__dirname, 'data')}`);
});
