# Live Agent Monitoring Dashboard

A real-time contact-centre agent monitoring dashboard built with React,
Next.js, TypeScript, Zustand and Tailwind CSS.

The dashboard monitors 300 contact-centre agents and processes live device
and agent state events from an unreliable event stream.

The implementation focuses on correctness under out-of-order events,
duplicate events, reconnects, replayed events, clock skew, API failures,
and efficient rendering of live updates.

---

## Tech Stack

- Next.js
- React
- TypeScript
- Zustand
- Tailwind CSS
- Mock event stream

---

## Features

### Agent Monitoring

- Live monitoring of 300 agents
- Agent name and extension
- Queue information
- Site and team information
- Device state
- Agent state
- Combined actionable state
- Current call information

### Real-Time Updates

- Live device and agent state updates
- Sequence-based event ordering
- Duplicate event protection
- Out-of-order event protection
- Pre-snapshot event protection
- Replayed event protection after reconnect
- Automatic reconnect handling
- Visible connection status

### Search, Filtering and Sorting

- Search by agent name
- Search by extension
- Search by agent ID
- Filter by queue
- Filter by site
- Filter by actionable state
- Sort by every displayed column
- Ascending and descending sorting
- Filters persisted in URL query parameters
- Filters survive page refreshes
- Filter state can be shared through the URL

### Agent Details

- Agent detail side panel
- Agent state
- Device state
- Actionable state
- Site
- Team
- Queues
- Recent call history
- Paginated call history
- Previous / Next pagination
- Retry on API failure
- Loading state
- Empty state
- Error state
- Escape key to close the panel

### Call Monitoring

- Live call duration timer
- Timer isolated from the main grid
- Current longest call summary
- Current call ID tracking

### Dashboard Summary

The dashboard provides summary metrics for:

- Total agents
- Available agents
- Agents on call
- Agents on break
- Agents in After Call Work
- Logged-out agents
- Stale devices
- Longest current call

### Device Freshness

The dashboard tracks the last received device event for each agent.

If no device event is received for 30 seconds, the device is considered
stale and the actionable state is shown as `Stale`.

The threshold is currently a frontend assumption because the provided API
contract does not define a heartbeat or stale-device threshold.

### Accessibility

- Keyboard-accessible agent rows
- Enter key opens agent details
- Space key opens agent details
- Focus states
- Semantic buttons
- Dialog semantics
- `aria-modal`
- `aria-labelledby`
- Connection status exposed through an ARIA live region
- Escape key closes the agent detail panel

---

## Architecture

The application separates live domain state, UI state, API access and
presentation components.

```text
                    Initial Snapshot
                          |
                          v
                    fetchAgents()
                          |
                          v
                 Zustand Agent Store
                          |
              +-----------+-----------+
              |                       |
              v                       v
          AgentGrid                SummaryBar
              |
              v
          AgentRow
              |
              v
          CallTimer
       (local 1s state)


                    Event Stream
                         |
                         v
                  sequence validation
                         |
                         v
                 Zustand Agent Store
                         |
                         v
                affected AgentRow
```

The main live agent state is maintained centrally in Zustand.

The grid derives filtered and sorted views from the store, while individual
rows subscribe to their own agent state.

High-frequency call timers are kept local to the row instead of updating
global state every second.

---

## Project Structure

```text
agent-monitoring/
├── mock/
│   ├── agents.json
│   ├── agentStream.js
│   ├── calls.json
│   └── events.json
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── AgentFilters.tsx
│   │   ├── AgentGrid.tsx
│   │   ├── AgentRow.tsx
│   │   ├── AgentDetailPanel.tsx
│   │   ├── CallTimer.tsx
│   │   ├── ConnectionStatus.tsx
│   │   ├── SummaryBar.tsx
│   │   └── SortableHeader.tsx
│   │
│   ├── services/
│   │   └── agentService.ts
│   │
│   ├── store/
│   │   ├── agentTypes.ts
│   │   ├── agentStore.ts
│   │   └── agentSelectors.ts
│   │
│   └── utils/
│       └── status.ts
│
└── README.md
```

---

## State Management

Zustand is used as the central store for live agent state.

Agents are normalized by `agentId`:

```ts
Record<string, AgentRuntime>;
```

Each runtime agent contains the original agent information plus runtime
state such as the latest processed sequence and last received device event.

The store is responsible for:

- Initializing agents from the snapshot
- Tracking the latest processed sequence
- Processing device events
- Processing agent events
- Ignoring stale events
- Ignoring duplicate events
- Ignoring replayed events
- Updating current call information
- Tracking connection status

The UI derives presentation-specific state from this central state.

---

## Event Ordering

The event stream is intentionally unreliable.

Events can arrive:

- Out of order
- More than once
- After reconnect
- As part of replay
- Late relative to the initial snapshot

The implementation uses `sequence` as the authoritative ordering key.

It does not use `emittedAt` for ordering because the assignment explicitly
allows clock skew.

Each agent starts with its snapshot sequence:

```ts
latestSequence = snapshotSeq;
```

When an event arrives:

```ts
if (event.sequence <= agent.latestSequence) {
    return;
}
```

Only events with a newer sequence are applied. After processing:

```ts
latestSequence = event.sequence;
```

### Example

If the snapshot has:

```ts
snapshotSeq = 100;
```

and events arrive in this order:

```
98
102
101
103
102
```

the client processes:

```
102
103
```

and ignores:

```
98
101
102
```

This protects the UI from stale state and makes replay handling idempotent.

---

## Snapshot and Event Reconciliation

The initial agent state is loaded using `fetchAgents()`.

The snapshot provides the initial state and `snapshotSeq` for each agent.

The stream is connected after the initial snapshot has been initialized.

This establishes:

```
Snapshot
   |
   v
latestSequence = snapshotSeq
   |
   v
Connect event stream
   |
   v
Process only events with newer sequences
```

This prevents events that belong before the snapshot from overwriting the
initial state.

---

## Reconnect Handling

The mock stream periodically disconnects and reconnects.

The UI exposes the connection state through:

- Connecting
- Live
- Reconnecting

The mock stream also replays recent events after reconnect.

Because event processing checks the sequence number, events that have
already been processed are ignored. This allows the same event to be safely
delivered more than once without corrupting the agent's current state.

---

## Connection State

The connection status is visible in the dashboard.

The UI communicates whether the stream is:

- Connecting
- Live
- Reconnecting

The status is also exposed through an ARIA live region so connection changes
can be communicated to assistive technology users.

---

## Combined Actionable State

Device state and agent state are received from separate event streams.

The dashboard derives a combined actionable state instead of storing another
independent state value.

The current priority is:

1. Stale
2. Logged Out
3. Unavailable
4. Ringing
5. On Call
6. On Hold
7. On Break
8. After Call Work
9. Available

For example:

- Agent State: `Available`
- Device State: `Answered`
- Actionable State: `On Call`

This gives operators a single state that is easier to understand while
retaining the underlying device and agent states separately.

---

## Device Freshness

The dashboard tracks `lastDeviceEventAt` for each agent.

If no device event has been received for more than 30 seconds, the derived
actionable state becomes `Stale`.

The 30-second threshold is a frontend assumption for this assignment because
the provided API contract does not define a heartbeat or stale-device
threshold. A production API should make this behavior explicit through a
heartbeat, last-seen timestamp, or device health field.

---

## Live Call Timer

When an agent receives an `Answered` device event with a call ID, the
dashboard tracks the active call.

The timer is implemented as a separate `CallTimer` component:

```
AgentRow
   |
   └── CallTimer
```

The timer owns its own one-second interval. This is intentional so that the
entire grid does not re-render every second just because a call duration
changed. The timer also cleans up its interval when it unmounts.

---

## Clock Skew

The provided event stream can contain timestamps affected by clock skew.
Therefore, `emittedAt` is not used as the ordering mechanism — the event
`sequence` is treated as the authoritative ordering key.

For the live timer, the current implementation uses client-side receive time
when an `Answered` event is processed. A production API should provide an
authoritative `callStartedAt` timestamp for active calls.

---

## Search and Filtering

The dashboard supports:

- Search by agent name
- Search by extension
- Search by agent ID
- Queue filtering
- Site filtering
- Actionable state filtering

Search input is debounced to avoid unnecessary filtering work while the user
is typing.

Filters are stored in URL query parameters, for example:

```
?search=John&queue=Sales&site=Bangalore&state=On%20Call
```

This allows filters to:

- Survive page refreshes
- Be shared through the URL
- Be restored when navigating back to the page

---

## Sorting

The grid supports sorting for every displayed column.

Sorting supports:

- Ascending order
- Descending order

Displayed columns can be sorted based on their respective values.

Sorting is handled at the grid level so that row components remain focused
on rendering individual agents.

---

## Agent Detail Panel

Clicking or keyboard-selecting an agent opens the detail panel.

The panel displays:

- Agent state
- Device state
- Actionable state
- Site
- Team
- Queues
- Recent calls

The panel supports:

- Loading state
- Empty state
- Error state
- Retry
- Previous page
- Next page
- Escape key to close
- Accessible dialog semantics

### Call History

Call history is loaded from `fetchCalls()`.

The detail panel requests 20 calls at a time. Pagination uses offset-based
pagination:

```
Previous | Page X | Next
```

The current mock API does not expose a total count or `hasNext` field.
Therefore, the frontend determines whether another page may exist by
checking whether the returned page contains the requested page size. This is
a limitation of the provided mock contract and is addressed in the
[Expected Production Contract](#expected-production-contract) section below.

---

## Error Handling

The provided mock APIs can intermittently fail.

**Initial Agent Fetch** — The initial agent snapshot request is retried up
to three times. If the request continues to fail, the dashboard displays an
error state.

**Call History** — Call history failures are displayed inside the detail
panel. The user can retry without closing the panel.

**Connection** — The connection state is exposed through the dashboard so
the user can see when the stream is connecting, live, or reconnecting.

---

## Performance

The dashboard is designed to support 300 live agents.

- **Normalized Agent State** — Agents are stored by ID
  (`Record<string, AgentRuntime>`), providing direct access to an individual
  agent.
- **Row-Level Subscriptions** — Each `AgentRow` subscribes to its own agent
  state, preventing every row from needing to consume unrelated agent
  updates.
- **Memoized Rows** — `AgentRow` is memoized to avoid unnecessary renders
  caused by parent component updates.
- **Local Call Timers** — Call timers maintain their own one-second state
  and do not update the global Zustand store every second.
- **Memoized Filtering and Sorting** — Filtering and sorting calculations
  are memoized based on their dependencies.
- **Virtualization** — Not added, because the assignment currently contains
  300 agents. For substantially larger datasets, row virtualization would be
  a reasonable next optimization.

---

## Component Design

The UI is divided into focused components.

| Component          | Responsibility                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `AgentGrid`        | Filtering, sorting, selecting agents, rendering agent rows                                                                   |
| `AgentRow`         | Rendering a single agent; subscribes to the relevant agent state and renders the current device, agent and actionable states |
| `CallTimer`        | Displaying live call duration; state is local to avoid unnecessary global updates                                            |
| `AgentDetailPanel` | Agent information, call history, pagination, loading state, error state, retry                                               |
| `SummaryBar`       | Dashboard-level operational metrics                                                                                          |
| `ConnectionStatus` | Displaying the current event-stream connection state                                                                         |
| `SortableHeader`   | Reusable sorting behavior for grid columns                                                                                   |

---

## Accessibility

- Keyboard-accessible agent rows
- Enter key support
- Space key support
- Visible focus states
- Semantic buttons
- Accessible dialog semantics: `role="dialog"`, `aria-modal`, `aria-labelledby`
- ARIA live region for connection status
- Escape key support for closing the detail panel

---

## API / Contract Review

The provided mock API is intentionally simplified and exposes several
limitations. The frontend implementation handles the limitations that are
observable in the provided mock data.

For a production system, the following parts of the contract should be made
explicit.

### Expected Production Contract

**1. Event Ordering**
Each `(agentId, stream)` should have a monotonically increasing sequence.
The client should use `sequence` as the authoritative ordering key rather
than `emittedAt`. Events with a sequence number less than or equal to the
latest processed sequence should be ignored.

**2. Snapshot and Stream Consistency**
The snapshot and event stream should provide a consistent starting position.
Ideally, the snapshot response should include a stream cursor:

```json
{
    "snapshotTakenAt": "2026-01-01T10:00:00Z",
    "cursor": {
        "device": 120394,
        "agent": 98231
    },
    "agents": []
}
```

The client could then establish the stream from that cursor. This prevents
events from being missed between fetching the snapshot and establishing the
stream connection.

**3. Reconnect and Replay**
The production stream should support cursor-based reconnect and replay:

```
connect(cursor)
      |
      v
replay events after cursor
      |
      v
live events
```

If a requested cursor is no longer available, the API should return an
explicit error such as `CURSOR_EXPIRED`. The client can then fetch a fresh
snapshot and establish a new stream position.

**4. Timestamp Semantics**
The API should clearly distinguish between:

- `occurredAt` — when the event actually occurred
- `emittedAt` — when the server emitted the event
- `receivedAt` — when the client received the event

The client should not use wall-clock timestamps as the authoritative event
ordering mechanism when clock skew is possible.

**5. Authoritative Call Start Time**
For an active call, the backend should provide an authoritative
`callStartedAt`:

```json
{
    "callStartedAt": "2026-01-01T10:30:00Z"
}
```

The frontend can use this value to calculate the displayed call duration.
This is preferable to deriving the actual call start from client receipt
time.

**6. Call History Pagination**
The current mock API does not provide explicit pagination metadata. A
production API should provide fields such as:

```json
{
    "calls": [],
    "offset": 0,
    "limit": 20,
    "total": 1593,
    "hasNext": true
}
```

This avoids inferring pagination state from the number of records returned.

**7. Call History Ordering**
The API should define deterministic ordering for call history, for example
`startedAt DESC`. This ensures recent calls are returned consistently and
makes pagination behavior predictable.

**8. Stale Device Detection**
The current implementation uses a 30-second frontend threshold because the
provided contract does not define stale-device behavior. A production API
should expose either a heartbeat / last-seen timestamp, or an explicit
device health signal:

```json
{
    "lastDeviceEventAt": "2026-01-01T10:30:00Z"
}
```

The stale threshold should ideally be defined as part of the product/API
contract rather than being an undocumented frontend assumption.

**9. Structured API Errors**
Production APIs should return structured errors instead of relying only on
human-readable messages:

```json
{
    "code": "SERVICE_UNAVAILABLE",
    "message": "Unable to fetch agents",
    "retryable": true
}
```

This allows the frontend to make consistent retry and recovery decisions.

**10. Separate Stream Cursors**
Because device and agent events are separate streams, production systems
should maintain independent cursors, for example `deviceCursor` and
`agentCursor`. This avoids making ordering assumptions between independent
streams.

### Production Contract Summary

| Area                 | Expected Contract                          |
| -------------------- | ------------------------------------------ |
| Event ordering       | Monotonic sequence per `(agentId, stream)` |
| Snapshot consistency | Snapshot includes stream cursor            |
| Reconnect            | Cursor-based replay                        |
| Expired cursor       | Explicit `CURSOR_EXPIRED` error            |
| Timestamps           | `occurredAt`, `emittedAt`, `receivedAt`    |
| Active calls         | Authoritative `callStartedAt`              |
| Pagination           | `total` and `hasNext`                      |
| Call ordering        | Deterministic `startedAt DESC`             |
| Device freshness     | Heartbeat / last-seen timestamp            |
| API errors           | Structured `code` and `retryable`          |
| Streams              | Independent device/agent cursors           |

---

## Implementation Decisions

**Sequence Instead of Timestamp**
`sequence` is used because it is the reliable ordering key provided by the
event stream. `emittedAt` is not used for ordering because the assignment
explicitly mentions clock skew.

**Normalized State**
Agents are stored by `agentId` so individual agent updates can be handled
without duplicating the agent data structure.

**Derived Actionable State**
The combined actionable state is derived from device and agent states rather
than stored separately. This prevents multiple sources of truth.

**Local Timer State**
The live call timer is intentionally isolated from the global store.
Updating global state every second for active calls would create
unnecessary rendering work.

**URL-Based Filters**
Filters are stored in URL query parameters so they survive refreshes and can
be shared.

**Bounded Retry**
The initial snapshot uses bounded retries because the provided mock API
intermittently fails. Call history uses explicit user-driven retry.

---

## Tradeoffs

**Virtualization**
Not implemented because the provided dataset contains 300 agents. The
current architecture leaves room to introduce virtualization if the dataset
grows significantly.

**Production Stream Cursor**
The mock stream does not provide a production-style cursor contract. The
implementation therefore uses per-agent sequence reconciliation to handle
the replay behavior provided by the mock.

**Stale Threshold**
The 30-second stale threshold is a frontend assumption because the mock
contract does not define one. A production implementation should receive
this information from an authoritative backend contract.

**Call Pagination**
The mock API does not provide `total` or `hasNext`, so the UI infers whether
another page may exist from the returned page size. A production API should
provide explicit pagination metadata.

---

## Omissions

The implementation focuses on the core requirements and correctness of the
provided assignment. The following are possible production enhancements:

- Row virtualization for substantially larger datasets
- Automated unit and component tests
- End-to-end tests for reconnect and filtering flows
- A full focus trap for the detail dialog
- Cursor-based stream recovery backed by the server
- Server-provided stale-device/heartbeat semantics
- Structured API error contracts
- Explicit pagination metadata

---

## Running Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application at:

```
http://localhost:3000
```

Run linting:

```bash
npm run lint
```

Run the production build:

```bash
npm run build
```

---

## Mock Data

The dashboard uses the provided mock data:

```
mock/agents.json
mock/calls.json
mock/events.json
```

The mock stream simulates unreliable real-time behavior, including:

- Delayed events
- Out-of-order events
- Duplicate events
- Periodic disconnects
- Reconnects
- Replay of recent events
- API failures

This allows the frontend reconciliation and recovery logic to be exercised
against the failure scenarios described in the assignment.

---

## Summary

The dashboard provides a real-time monitoring experience for 300
contact-centre agents while accounting for unreliable event delivery.

The main design decisions are:

- Sequence-based event reconciliation
- Snapshot plus event-stream architecture
- Duplicate and replay protection
- Per-agent normalized state
- Derived actionable state
- Row-level subscriptions
- Isolated live call timers
- URL-persisted filters
- Paginated agent call history
- Visible connection state
- Loading, empty and error handling
- Accessibility support
- Production API contract recommendations

The implementation prioritizes correctness of live state, predictable
reconciliation, and avoiding unnecessary rendering work while keeping the
architecture simple enough for the current dataset and assignment scope.
