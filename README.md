# Peek

A websocket-powered shared todo + chat prototype for surviving micromanagement with humor.

## Quick start

```bash
npm install
npm start
```

Open `http://localhost:3000`.

- Click **Sign in as Default Human** (single default user for this prototype).
- Share the room URL (`?room=...`) so others can watch and chat in real time.
- Chat supports **Regular** and **YELL** mode.

## Data storage

When the CLI server starts, Peek auto-generates local data files under:

- `data/users.json`
- `data/rooms/<room-id>.json`

These files are created automatically when needed and are ignored in git.
