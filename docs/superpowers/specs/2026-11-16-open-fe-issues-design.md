# Open Frontend Issues Hotfix Design

## Intent

Resolve the remaining actionable frontend issues quickly from the latest `dev` branch, while preserving the repository's existing UX and avoiding a broad error-handling rewrite. Issues #30 and #70 are already fixed in `dev`; this change adds regression coverage for #30 and implements #71, #72, #73, and #101.

## Goals

- Show the custom deadline calendar month and year in Korean.
- Keep non-members from entering or repeatedly retrying a regional chat room URL.
- Treat malformed trip IDs as invalid links before sending API requests.
- Map backend `INVALID_REQUEST` responses to invalid-link states for trip detail and photo album pages.
- Preserve the relative `VITE_API_BASE_URL` WebSocket fix already shipped for #30.
- Deliver one hotfix PR with issue-focused commits, then close the resolved issues with evidence.

## Non-goals

- Redesigning the chat join flow or opening the join modal from a deep link.
- Refactoring every page's error classification.
- Changing backend APIs, route shapes, or authentication behavior.
- Reworking the already-correct #70 copy.

## Constraints

- React 19, TypeScript, Vite, React Router, Axios, and existing UI components remain unchanged.
- No runtime dependency is added. Regression tests use Node 24's built-in test runner and TypeScript stripping.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` must pass.

## Approaches

1. **One hotfix PR with small pure helpers and issue-specific commits — selected.** This is the fastest review and CI path, gives #73 and #101 a shared numeric-ID rule, and makes the previously fixed #30 behavior testable.
2. Separate PRs by screen. This reduces per-PR scope but repeats CI and merge waits and makes the shared invalid-link behavior harder to land atomically.
3. A broad error-boundary and route-validation refactor. This could improve consistency across the app, but it expands risk and does not match the speed-first request.

## Design

- Add `isValidNumericRouteId(value)` in `src/utils/routeParams.ts`. It accepts positive decimal IDs only and is used before trip-detail or album requests.
- Add `INVALID_REQUEST` to both pages' invalid-link error mapping so server-side validation failures receive the same user-facing state.
- Add `formatKoreanYearMonth(year, monthIndex)` to the existing date utility and use it in the deadline calendar header.
- Add a pure chat-room access resolver. `ChatRoom` always validates current membership from the room list before loading history or opening the socket. A non-member is redirected to `/open-chat` with a short toast; a missing room keeps the existing not-found state. A `REGIONAL_CHAT_MEMBER_REQUIRED` history response performs the same redirect.
- Extract the WebSocket URL builder from `chatSocket.ts` so both relative (`/api`) and absolute API base URLs are covered by regression tests.
- Keep #70 unchanged because current `dev` already distinguishes one-member and two-member deletion copy.

## Acceptance

- `2026-10` displays as `2026년 10월` in the custom deadline calendar.
- `/trips/abc` and `/photo-missions/album?tripId=invalid_id` render invalid-link states without issuing their main data requests.
- A direct URL to an unjoined chat room returns to `/open-chat` and does not load history or connect a socket.
- Relative and absolute API base URLs produce valid `ws://` or `wss://` endpoints.
- All repository verification commands pass and the hotfix PR is merged into `dev`.
