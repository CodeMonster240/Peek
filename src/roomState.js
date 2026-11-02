const { randomUUID } = require('crypto');

function normalizeRoom(room) {
  return {
    id: room.id,
    todos: Array.isArray(room.todos) ? room.todos : [],
    chat: Array.isArray(room.chat) ? room.chat : []
  };
}

function addTodo(room, text, author) {
  const safeText = String(text || '').trim();
  if (!safeText) {
    return room;
  }

  room.todos.push({
    id: randomUUID(),
    text: safeText,
    done: false,
    author,
    createdAt: new Date().toISOString()
  });

  return room;
}

function toggleTodo(room, todoId) {
  const todo = room.todos.find((item) => item.id === todoId);
  if (todo) {
    todo.done = !todo.done;
  }
  return room;
}

function deleteTodo(room, todoId) {
  room.todos = room.todos.filter((item) => item.id !== todoId);
  return room;
}

function addChatMessage(room, payload) {
  const text = String(payload.text || '').trim();
  if (!text) {
    return room;
  }

  room.chat.push({
    id: randomUUID(),
    user: payload.user || 'Anonymous',
    mode: payload.mode === 'yell' ? 'yell' : 'say',
    text,
    createdAt: new Date().toISOString()
  });

  if (room.chat.length > 200) {
    room.chat = room.chat.slice(-200);
  }

  return room;
}

module.exports = {
  normalizeRoom,
  addTodo,
  toggleTodo,
  deleteTodo,
  addChatMessage
};
