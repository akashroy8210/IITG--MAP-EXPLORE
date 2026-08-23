# Campus Treasure Hunt

MERN backend for a 25-team, real-time treasure hunt across 5 Gather maps. The
server is authoritative for timing, question progression, and code
verification; Gather is used purely as a visual space (no Gather API calls).
Full design rationale lives in the system design doc this was built from.

## Stack

Express 5 · MongoDB/Mongoose · Socket.IO · JWT auth · bcrypt

## Getting started

```bash
cd BACKEND
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, ADMIN_KEY
npm run seed            # creates the 5 maps + one demo team (TEAM001 / demo1234)
npm run dev              # starts the API + Socket.IO server with nodemon
```

Health check: `GET /api/health`.

## Authoring real event content

The demo seed only creates one team with two questions, enough to exercise
the whole flow locally. Real event content (25 teams, all questions, all
per-team routes) is loaded through the admin bulk endpoints, in this order:

1. `POST /api/admin/maps/bulk` — the 5 maps
2. `POST /api/admin/teams/bulk` — 25 teams (teamCode, password, teamNumber, mapId/mapNumber, routeKey)
3. `POST /api/admin/questions/bulk` — all pre-authored questions (mapId/mapNumber, routeKey, stageIndex, ...)
4. `POST /api/admin/team-routes/bulk` — per-team question sequence + Main Gate code (auto-derived from mapId+routeKey if `questionIds` is omitted)

All admin routes require an `x-admin-key` header matching `ADMIN_KEY`.

## API surface

| Area | Endpoint |
|---|---|
| Auth | `POST /api/auth/login` |
| Game | `GET /api/team/me`, `POST /api/game/start`, `/answer`, `/verify-code`, `/hint`, `/bonus`, `/final-answer`, `/maingate-code` |
| Admin | `/api/admin/maps/bulk`, `/teams/bulk`, `/questions/bulk`, `/team-routes/bulk`, `GET /teams`, `GET /leaderboard`, `POST /game/lock-registration` |

Game routes require `Authorization: Bearer <token>` from login.

## Socket.IO

Client emits `join_team` with `{ token }`; server replies with a unicast
`state_sync` snapshot, then joins the socket to `team:<teamId>`. Every game
mutation broadcasts a matching event to that room (`game_started`,
`answer_solved`, `code_verified`, `hint_used`, `bonus_used`,
`final_puzzle_unlocked`, `final_solved`, `game_completed`) so both
teammates' screens stay in sync without polling.

## Folder structure

```
BACKEND/
  config/db.js
  models/          Mongoose schemas
  routes/          Express routers
  controllers/      request handlers / game logic
  sockets/          Socket.IO server + broadcast emitters
  middleware/       JWT auth, admin auth, rate limiting, error handling
  utils/            scoring, answer normalization, shared state builder
  scripts/seed.js   local-dev bootstrap data
  server.js
```

## Not built yet

- React frontend (player game screen, admin control-room dashboard)
- Deployment config

See the open decisions in the design doc (wrong-code penalty, hint penalty
curve, bonus reward types, synchronized vs. staggered starts, reconnect UX)
— this implementation takes the recommended defaults (time-based bonuses
only, no live-timer effect from penalties, a lightweight per-question code
cooldown) but they're easy to tune via `gameConfig`.
