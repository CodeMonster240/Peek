const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createStore } = require('../src/store');
const { addTodo, addChatMessage } = require('../src/roomState');

test('createStore auto-generates data folder and room files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'peek-test-'));
  const store = createStore({ root });

  store.ensureStorage();
  const room = store.loadRoom('team-room');

  assert.equal(room.id, 'team-room');
  assert.equal(fs.existsSync(path.join(root, 'data')), true);
  assert.equal(fs.existsSync(path.join(root, 'data', 'users.json')), true);
  assert.equal(fs.existsSync(path.join(root, 'data', 'rooms', 'main.json')), true);
  assert.equal(fs.existsSync(path.join(root, 'data', 'rooms', 'team-room.json')), true);
});

test('room updates are persisted', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'peek-test-'));
  const store = createStore({ root });
  const room = store.loadRoom('persist-room');

  addTodo(room, 'ship prototype', 'Default Human');
  addChatMessage(room, { user: 'Boss', mode: 'yell', text: 'STATUS???' });
  store.saveRoom('persist-room');

  const file = path.join(root, 'data', 'rooms', 'persist-room.json');
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));

  assert.equal(saved.todos.length, 1);
  assert.equal(saved.chat.length, 1);
  assert.equal(saved.chat[0].mode, 'yell');
});
