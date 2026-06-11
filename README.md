# Alcovia — Offline-First Study App

An offline-first study app with **Focus Sessions** and **Syllabus Progress** tracking, featuring two-device sync with conflict resolution and n8n automation.

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Start the Backend Server

```bash
cd server
npm install
npm run dev
```

The server runs on `http://localhost:3001`.

### 2. Start the Client App

```bash
cd client
npm install
npx expo start --web
```

### 3. Open Two Devices

Open two browser tabs:
- **Device A**: `http://localhost:8081?device=a`
- **Device B**: `http://localhost:8081?device=b`

Each tab simulates a separate device with its own storage.

### 4. (Optional) Set Up n8n

1. Start n8n: `npx n8n` (runs on `http://localhost:5678`)
2. Import `n8n-workflow.json` via the n8n UI
3. Activate the workflow

The server will fire webhooks to n8n on successful focus sessions. If n8n is not running, notifications are still logged on the server.

---

## Features

### Feature A: Focus Sessions
- Choose duration (1, 5, 25, 45, 60 minutes)
- Countdown timer runs fully offline
- **Success**: Earns coins, advances streak, adds to today's focus total
- **Fail**: Give Up button or app switch (5-second grace period)
- All rewards computed locally (optimistic) and verified on server sync

### Feature B: Syllabus Progress
- 3 subjects (Math, Science, English), each with 2 chapters
- Tasks cycle through: Not Started → In Progress → Done
- Chapter progress = completed tasks / total tasks (%)
- Subject progress = average of chapter percentages
- Task deletion supported (soft delete with tombstone)

### Feature C: n8n Automation
- Server fires webhook to n8n on successful focus session sync
- n8n workflow: Webhook → Dedup Check → Send Notification (mock)
- **Exactly-once guarantee**: Dedup at both server and n8n level

### Dev Panel
- **Network Toggle**: Switch each device online/offline
- **Sync Button**: Manual sync trigger
- **State Viewer**: Current stats, sessions, operation log
- **Notification Log**: See webhook events fired
- **Full State Debug**: Raw JSON of device state

---

## Conflict Resolution

| Scenario | Resolution |
|---|---|
| Same task, different status | Higher HLC timestamp wins |
| Task edited + task deleted | Delete wins (tombstone) |
| Same sync message twice | Deduplicated by operation UUID |
| Out-of-order messages | HLC ordering, not arrival order |
| Focus session from both devices | Deduplicated by session UUID |

See [DECISIONS.md](./DECISIONS.md) for detailed explanations.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐
│  Device A   │     │  Device B   │
│  (Tab 1)    │     │  (Tab 2)    │
│             │     │             │
│ Local Store │     │ Local Store │
│ Op Log      │     │ Op Log      │
└──────┬──────┘     └──────┬──────┘
       │  POST /api/sync   │
       ▼                   ▼
┌──────────────────────────────┐
│       Express Server         │
│  - Dedup by operation ID     │
│  - HLC conflict resolution   │
│  - Idempotent rewards        │
│  - Exactly-once webhook      │
└──────────────┬───────────────┘
               │ POST webhook
               ▼
┌──────────────────────────────┐
│       n8n Workflow            │
│  Webhook → Dedup → Notify    │
└──────────────────────────────┘
```

---

## Demo Scenarios (for video)

1. **Offline focus session**: Device A completes a session offline → goes online → syncs → coins/streak update
2. **Both devices offline**: Both complete sessions → both sync → rewards counted once each → n8n fires once per session
3. **Task conflict**: Device A marks task "Done", Device B marks same task "In Progress" → sync → higher HLC wins
4. **Edit vs Delete**: Device A edits task, Device B deletes → sync → delete wins
5. **Replay safety**: Same sync message replayed → no duplicates

---

## Tech Stack

- **Client**: TypeScript, React Native (Expo), Expo Router
- **Server**: TypeScript, Express
- **Automation**: n8n
- **Storage**: AsyncStorage (client), In-memory (server)
- **Sync**: Custom operation-log + HLC, no off-the-shelf sync libraries

---

## What's Not Included (and What We'd Do Next)

- **Persistence on server**: Currently in-memory. Would add PostgreSQL with operation log table.
- **Real WhatsApp**: Using mock notification endpoint. Would integrate Twilio/AiSensy.
- **Auto-sync**: Currently manual sync via Dev Panel. Would add periodic sync + reconnect sync.
- **3+ devices**: Architecture supports it, but only tested with 2.
- **Crash recovery**: Partially handled (AsyncStorage persists state). Full recovery would need WAL-style durability.
