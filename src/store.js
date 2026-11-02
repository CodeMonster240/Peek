const fs = require('fs');
const path = require('path');
const { normalizeRoom } = require('./roomState');

function safeRoomId(roomId) {
  const trimmed = String(roomId || '').trim();
  if (!trimmed) {
    return 'main';
  }
  return trimmed.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 64) || 'main';
}

function createStore(options = {}) {
  const root = options.root || process.cwd();
  const dataDir = options.dataDir || path.join(root, 'data');
  const roomsDir = path.join(dataDir, 'rooms');
  const usersFile = path.join(dataDir, 'users.json');
  const roomCache = new Map();

  function ensureStorage() {
    fs.mkdirSync(roomsDir, { recursive: true });

    if (!fs.existsSync(usersFile)) {
      const defaultUsers = { users: [{ id: 'default-user', name: 'Default Human' }] };
      fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
    }

    const defaultRoomFile = path.join(roomsDir, 'main.json');
    if (!fs.existsSync(defaultRoomFile)) {
      const mainRoom = normalizeRoom({ id: 'main', todos: [], chat: [] });
      fs.writeFileSync(defaultRoomFile, JSON.stringify(mainRoom, null, 2));
    }
  }

  function roomFile(roomId) {
    return path.join(roomsDir, `${safeRoomId(roomId)}.json`);
  }

  function loadRoom(roomId) {
    ensureStorage();
    const id = safeRoomId(roomId);
    if (roomCache.has(id)) {
      return roomCache.get(id);
    }

    const file = roomFile(id);
    let room;

    if (fs.existsSync(file)) {
      room = normalizeRoom(JSON.parse(fs.readFileSync(file, 'utf8')));
      room.id = id;
    } else {
      room = normalizeRoom({ id, todos: [], chat: [] });
      fs.writeFileSync(file, JSON.stringify(room, null, 2));
    }

    roomCache.set(id, room);
    return room;
  }

  function saveRoom(roomId) {
    const id = safeRoomId(roomId);
    const room = loadRoom(id);
    fs.writeFileSync(roomFile(id), JSON.stringify(room, null, 2));
  }

  return {
    dataDir,
    roomsDir,
    usersFile,
    ensureStorage,
    loadRoom,
    saveRoom,
    safeRoomId
  };
}

module.exports = { createStore };
