# DECISIONS.md — Architecture & Design Decisions

## Data & Sync Model

### Overview
The app uses an **operation-log-based sync model** (a lightweight form of event sourcing). Every user action — starting a focus session, changing a task's status, deleting a task — is recorded as an immutable **operation** with a unique ID and a **Hybrid Logical Clock (HLC)** timestamp.

### Why Operation Log Over State Sync?
State sync (sending the current state of objects) cannot detect conflicts. If Device A sets a task to "Done" and Device B sets the same task to "In Progress," a naive state sync would just overwrite one with the other, with no way to determine which happened "later."

By syncing operations, we preserve the full history of changes. Each operation carries an HLC timestamp, giving us a total ordering across devices without requiring synchronized clocks.

### Sync Flow
```
Client                              Server
  │                                    │
  ├── Collect unsynced operations ──>  │
  │                                    ├── Deduplicate by operation ID
  │                                    ├── Apply new operations to state
  │                                    ├── Process rewards (idempotent)
  │                                    ├── Fire webhook if needed (exactly-once)
  │                                    │
  │  <── Return: new ops + state ─── ──┤
  │                                    │
  ├── Apply server state locally       │
  ├── Mark ops as synced               │
```

### Why the Server Sends Full State (Not Just Ops)
After processing operations, the server sends back the complete computed state. This is simpler than having each client independently replay all operations to derive state. The server is the single source of truth after sync.

**Tradeoff**: This means more data per sync, but it's simpler and eliminates client-side state derivation bugs. For a small number of subjects/tasks, the payload size is negligible.

---

## Hybrid Logical Clock (HLC)

### Why Not Wall Clock?
The assignment explicitly warns against wall-clock "last write wins." Device clocks disagree — a phone might be 2 minutes ahead of a laptop. If we used `Date.now()`, the device with the faster clock would always "win" conflicts, regardless of which change actually happened last.

### How HLC Works
An HLC timestamp is a triple: `{ wallTime, counter, nodeId }`.

- **wallTime**: The physical clock reading, but only used as a rough guide.
- **counter**: Breaks ties when wallTime is the same. Incremented on every local event if the physical clock hasn't advanced.
- **nodeId**: Final tiebreaker for determinism (not semantically meaningful).

**Key properties:**
1. Monotonically increasing on each device
2. Causally consistent: if event A caused event B, then HLC(A) < HLC(B)
3. No clock synchronization required

### Comparison: `compareHLC(a, b)`
1. Compare wallTime → bigger is later
2. If tied, compare counter → bigger is later
3. If still tied, compare nodeId → alphabetical (just for determinism)

---

## Conflict Resolution

### Rule 1: Same Field, Two Devices → Higher HLC Wins
When both devices change the same task's status offline, the operation with the higher HLC timestamp takes precedence. This is NOT wall-clock LWW — it's HLC-based, which respects causal ordering.

**Example:**
- Device A (HLC: 1000:0:a) sets task to "Done"
- Device B (HLC: 1001:0:b) sets same task to "In Progress"
- After sync: task is "In Progress" (HLC 1001 > 1000)

### Rule 2: Edit vs Delete → Delete Wins
If one device edits a task and another deletes it, the delete always wins. We use soft deletes (a `deleted: true` flag) so the tombstone persists and prevents the task from being "resurrected" by a concurrent edit.

**Rationale**: Bringing back a deleted item because another device edited it is a worse user experience than losing the edit. The user explicitly chose to delete — that intent should be respected.

### Rule 3: Focus Sessions → No Conflicts
Focus sessions are append-only events. Each session has a unique UUID created on one device. Two devices cannot independently create the same session, so there are no conflicts to resolve. Sessions are merged by simple union.

### Rule 4: Sync Messages → Deduplicated by ID
Every operation has a UUID. If the same operation arrives twice (network retry, both devices send it), the server skips it. The `processedOpIds` set on the server ensures each operation is applied exactly once.

### Rule 5: Out-of-Order Messages
Operations are processed in the order received, but conflict resolution is based on HLC timestamps, not arrival order. This means even if operations arrive out of order, the final state is the same as if they arrived in HLC order.

---

## Idempotency

### Backend Rewards
The server maintains a `rewardedSessionIds` set. When a `FOCUS_SESSION_COMPLETE` operation is processed, the server checks this set before awarding coins/streak. If the session ID is already in the set, the reward is skipped.

**Why this is needed**: The same session can arrive from both devices during sync. Without this check, the student would get double coins and a double streak bump.

### n8n Notifications
Idempotency is enforced at TWO levels:

1. **Server-side**: The `firedWebhookSessionIds` set ensures the server only sends the webhook to n8n once per session.
2. **n8n workflow**: The Code node uses `$getWorkflowStaticData('global')` to maintain a persistent set of processed session IDs. Even if the webhook fires twice (extremely unlikely, but possible in edge cases), n8n's dedup will catch it.

This "belt and suspenders" approach ensures exactly-once notification delivery.

---

## Why Two Devices Always End Up Identical

After both devices sync, they converge to the same state because:

1. **Operations are deduplicated**: Same op ID = processed once.
2. **Conflict resolution is deterministic**: HLC comparison produces the same winner regardless of which device processes it first.
3. **Server is the source of truth**: After sync, both devices receive the server's computed state, which incorporates all operations from both devices.
4. **The same merge rules apply everywhere**: Both the client merge and the server merge use identical HLC-based conflict resolution.

---

## Key Tradeoff

**Tradeoff: Server state push vs. client-side replay.**

We chose to have the server send the full computed state after sync, rather than having clients replay all operations to derive state. This means:

- **Pro**: Simpler client logic. No risk of client and server state diverging due to different replay implementations.
- **Pro**: Clients don't need to store the full operation history — only unsynced ops.
- **Con**: Larger sync payloads (but negligible for our data size).
- **Con**: Client's local state is "optimistic" between syncs — it might slightly differ from the server (e.g., coins might be counted before the server confirms), but the server always corrects it on sync.

We chose simplicity over efficiency because the data volume is small and correctness is more important than bandwidth optimization for this use case.

---

## Storage Choices

- **Client**: AsyncStorage (React Native) with per-device key namespacing (`device-a:state`, `device-b:state`). In-memory cache for fast access, persisted on every mutation.
- **Server**: In-memory JavaScript objects. No database. This is acceptable per the assignment constraints and keeps the codebase simple. A production version would use PostgreSQL.

---

## Two-Device Simulation

Each device is a separate browser tab with a `?device=a` or `?device=b` URL parameter. The parameter determines the storage namespace, so two tabs have completely independent state. This simulates two real devices sharing an account.
