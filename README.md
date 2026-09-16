# Live Agent Monitoring Dashboard

A real-time contact-centre agent monitoring dashboard built with React, Next.js, TypeScript and Zustand.

## Tech Stack

- Next.js
- React
- TypeScript
- Zustand
- Tailwind CSS
- Mock event stream

## Features

- Live monitoring of 300 agents
- Device and agent state tracking
- Combined actionable agent state
- Real-time event updates
- Sequence-based event ordering
- Duplicate and replay protection
- Reconnect handling
- Search and filtering
- URL-persisted filters
- Column sorting
- Live call timers
- Agent detail panel
- Paginated call history
- Loading, error and empty states
- Keyboard-accessible agent rows

## State Management

Zustand is used as the central state store.

Each agent maintains:

- Current device state
- Current agent state
- Current call ID
- Call start time
- Latest processed sequence

The grid rows subscribe to their individual agent state so an update to one agent does not require every row component to re-render.

## Event Ordering

`sequence` is treated as the authoritative ordering key.

Events are ignored when:

```text
event.sequence <= agent.latestSequence
```
