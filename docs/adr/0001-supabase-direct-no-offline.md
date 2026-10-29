# ADR-001: Supabase directly, no offline writes in v0.1

**Status:** accepted, 27 Oct 2026

## Context

Offline-first needs a local database, a write queue, conflict rules and sync status. It is the
largest risk in the project, and v0.1 has about 7 users and a 3-day target.

## Decision

The app talks to Supabase directly. TanStack Query provides optimistic updates so the UI feels
instant. The schema stays sync-ready: client-generated UUIDs, `updated_at`, and soft deletes
(`deleted_at`).

## Consequences

- Logging an expense needs a connection in v0.1.
- Adding offline support later (P2) needs no schema migration.
