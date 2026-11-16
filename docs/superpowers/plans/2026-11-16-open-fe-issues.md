# Open Frontend Issues Hotfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve frontend issues #71, #72, #73, and #101, preserve regression coverage for the already-fixed #30, and verify #70 remains fixed.

**Architecture:** Add small pure functions for date formatting, numeric route validation, chat access decisions, and WebSocket URL construction. Page components consume those functions and retain their current layouts, while invalid inputs are stopped before network work begins.

**Tech Stack:** React 19, TypeScript 7, Vite 8, React Router 7, Axios, Node 24 built-in test runner

**Spec:** `docs/superpowers/specs/2026-11-16-open-fe-issues-design.md`

## Global Constraints

- Do not add runtime dependencies or change backend APIs.
- Use Node 24 `node:test` with `--experimental-strip-types` for regression tests.
- Preserve current Korean copy and existing shared components unless the issue requires a change.
- Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` before the PR.

## Review Focus

- Numeric-looking but invalid IDs such as `0`, negative values, whitespace, decimals, and mixed alphanumeric strings must not trigger page data requests.
- A stale navigation state that says a room is joined must not bypass the latest membership check.
- Membership loss between the initial room-list check and message-history request must still return the user to the list.
- Relative API bases (`/api`) and absolute HTTPS API bases must both produce valid WebSocket URLs.
- The Korean calendar title must use the one-based month number without timezone rollover.

---

### Task 1: Test Harness, Route Validation, and Invalid-Link Mapping (#73, #101)

**Files:**
- Modify: `package.json`
- Create: `src/utils/routeParams.ts`
- Create: `tests/routeParams.test.ts`
- Modify: `src/pages/TripDetail/TripDetail.tsx`
- Modify: `src/pages/PhotoMission/MissionAlbum.tsx`

**Interfaces:**
- Produces: `isValidNumericRouteId(value: string): boolean`
- Consumes: existing `getApiErrorCode(error)` and page invalid/forbidden states

- [ ] **Step 1: Add failing route-parameter tests**

Test that `1` and `123` pass while empty, `0`, negative, decimal, whitespace, and alphanumeric values fail.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test --experimental-strip-types tests/routeParams.test.ts`
Expected: FAIL because `src/utils/routeParams.ts` does not exist.

- [ ] **Step 3: Implement the validator and page guards**

Create `isValidNumericRouteId(value: string): boolean` using the positive-decimal-ID rule. In `TripDetail`, skip `loadTrip` and return the invalid state when the param fails. In `MissionAlbum`, render the forbidden state and skip album requests when the query param fails. Add `INVALID_REQUEST` to both server error mappings.

- [ ] **Step 4: Add the reusable test script and verify GREEN**

Add `"test": "node --test --experimental-strip-types tests/*.test.ts"` to `package.json`.

Run: `npm run test`
Expected: PASS with the route-parameter cases green.

- [ ] **Step 5: Commit**

Commit: `fix: handle invalid trip links`

### Task 2: Korean Deadline Calendar Title (#71)

**Files:**
- Modify: `src/utils/date.ts`
- Create: `tests/dateFormat.test.ts`
- Modify: `src/pages/TripCreate/TripCreate.tsx`

**Interfaces:**
- Produces: `formatKoreanYearMonth(year: number, monthIndex: number): string`
- Consumes: zero-based calendar `monthIndex`

- [ ] **Step 1: Add a failing formatting test**

Assert `formatKoreanYearMonth(2026, 9) === '2026년 10월'` and January uses `1월`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --experimental-strip-types tests/dateFormat.test.ts`
Expected: FAIL because the export does not exist.

- [ ] **Step 3: Implement and use the formatter**

Add the pure formatter to `src/utils/date.ts` and replace the hardcoded `en-US` `Intl.DateTimeFormat` call in `DeadlineCalendarDialog`.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test`
Expected: PASS for route and date tests.

- [ ] **Step 5: Commit**

Commit: `fix: localize deadline calendar title`

### Task 3: Chat Deep-Link Membership Guard (#72)

**Files:**
- Create: `src/pages/ChatRoom/chatRoomAccess.ts`
- Create: `tests/chatRoomAccess.test.ts`
- Modify: `src/pages/ChatRoom/ChatRoom.tsx`

**Interfaces:**
- Produces: `resolveChatRoomAccess(rooms, roomId)` returning `joined`, `membership-required`, or `not-found`
- Consumes: `RegionalChatRoomItem[]`, current room ID, React Router navigation

- [ ] **Step 1: Add failing access-decision tests**

Cover joined, unjoined, missing room, and a stale local room scenario where the fresh list is authoritative.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --experimental-strip-types tests/chatRoomAccess.test.ts`
Expected: FAIL because the resolver does not exist.

- [ ] **Step 3: Implement the resolver and gate side effects**

Always fetch the room list on entry. Redirect non-members to `/open-chat` with replacement and a participation-required toast. Do not fetch message history, poll counts, or connect the socket until membership is confirmed. Treat `REGIONAL_CHAT_MEMBER_REQUIRED` from message history as membership loss and perform the same redirect.

- [ ] **Step 4: Verify GREEN**

Run: `npm run test`
Expected: PASS for all access decisions.

- [ ] **Step 5: Commit**

Commit: `fix: guard unjoined chat room links`

### Task 4: WebSocket URL Regression Coverage (#30) and Full Verification

**Files:**
- Create: `src/realtime/chatSocketUrl.ts`
- Create: `tests/chatSocketUrl.test.ts`
- Modify: `src/realtime/chatSocket.ts`

**Interfaces:**
- Produces: `buildChatWebSocketUrl(apiBaseUrl: string, pageOrigin: string): string`
- Consumes: `VITE_API_BASE_URL` and `window.location.origin`

- [ ] **Step 1: Add failing URL tests**

Assert `/api` with an HTTPS page produces `wss://<host>/ws`, an absolute HTTPS API base preserves its host, and HTTP produces `ws://`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --experimental-strip-types tests/chatSocketUrl.test.ts`
Expected: FAIL because the builder does not exist.

- [ ] **Step 3: Extract and use the URL builder**

Keep the current relative-base behavior intact while moving it into the pure tested helper.

- [ ] **Step 4: Run full verification**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`
Expected: exit 0; only baseline lint and bundle-size warnings may remain.

- [ ] **Step 5: Confirm #70 remains fixed and commit**

Inspect the one-member and two-member branches in `Home.tsx` without changing them.

Commit: `test: cover chat websocket url`

### Task 5: Review, PR, Merge, and Issue Closure

**Files:**
- Review all branch changes; no planned production file beyond Tasks 1–4

**Interfaces:**
- Consumes: green verification output and issue-to-commit mapping
- Produces: one PR targeting `dev`, merged commit, and closure comments for #30, #70, #71, #72, #73, and #101

- [ ] **Step 1: Run a whole-branch review against `origin/dev`**

Expected: no Critical or Important findings remain.

- [ ] **Step 2: Push and create the PR**

Title: `fix: resolve remaining frontend issues`

- [ ] **Step 3: Wait for required CI and merge**

Expected: required checks succeed and the PR is merged into `dev`.

- [ ] **Step 4: Close resolved issues with evidence**

Comment with the fixing commit or PR, then close #30, #70, #71, #72, #73, and #101.
