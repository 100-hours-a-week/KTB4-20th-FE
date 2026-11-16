# Bottom Nav Mobile Viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove only the community item from the frontend bottom navigation and make shared mobile-height and safe-area behavior consistent across supported screen sizes.

**Architecture:** Keep the existing route and page tree intact. Make one focused navigation-data change, then strengthen the existing CSS viewport foundation with `100vh` fallbacks followed by `100dvh` overrides and horizontal safe-area padding at the shared root and fixed bottom navigation.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS utilities, CSS Modules

**Spec:** `docs/superpowers/specs/2026-11-11-bottom-nav-mobile-viewport-design.md`

## Global Constraints

- Change frontend files only; do not modify backend, API, authentication, or data flow.
- Keep `/community` and `src/pages/Community/Community.tsx` intact.
- Add no packages.
- Preserve current design, accessibility label, keyboard focus behavior, and 480px mobile content width.
- Retain `100vh` as the legacy fallback and place `100dvh` immediately after it.

## Review Focus

- Three remaining navigation items must divide the full available width evenly.
- Direct navigation to `/community` must remain configured.
- Short mobile viewports with collapsing browser chrome must not use only static `100vh`.
- Devices with left/right safe areas must not place shared content or bottom-nav actions beneath the unsafe inset.
- Desktop widths above 480px must keep the existing centered mobile canvas.

---

### Task 1: Remove the Community Bottom Tab

**Files:**
- Modify: `src/components/BottomNav/BottomNav.tsx:1-10`

**Interfaces:**
- Consumes: Existing `NAV_ITEMS` rendering and `NavLink` behavior.
- Produces: A three-item `NAV_ITEMS` array containing `/`, `/photo-missions`, and `/open-chat` only.

- [ ] **Step 1: Run the acceptance assertion and confirm the current source fails it**

Run a read-only Node assertion that requires the bottom-nav source to omit the `Users` icon, `/community`, and `커뮤니티`, while the route source still contains `/community`.

Expected: FAIL because the bottom-nav source still contains the community item.

- [ ] **Step 2: Remove the community item and unused `Users` import**

Keep the existing item order, labels, icons, `flex-1` distribution, accessibility label, and active/focus styling unchanged.

- [ ] **Step 3: Re-run the acceptance assertion**

Expected: PASS; route source still contains `<Route path="/community" ...>`.

### Task 2: Normalize Dynamic Viewport Height and Safe Areas

**Files:**
- Modify: `src/styles/global.css:17-37`
- Modify: `src/components/BottomNav/BottomNav.tsx:14-18`
- Modify: `src/routes/RequireAuth.module.css:1-6`
- Modify: `src/pages/Survey/Survey.module.css:1-7,80-87,146-159`
- Modify: `src/pages/ChatRoom/ChatRoom.module.css:160-169`

**Interfaces:**
- Consumes: Existing `--max-width-mobile`, existing bottom safe-area padding, and page-specific CSS layouts.
- Produces: Shared horizontal safe-area padding, dynamic viewport-height overrides, and unchanged desktop centering.

- [ ] **Step 1: Record the current static viewport-height occurrences**

Run: `rg -n "100vh" src --glob '*.css'`

Expected: Matches in the shared root, auth loading state, survey states, and chat-room status state.

- [ ] **Step 2: Add shared root and bottom-nav safe-area handling**

In `global.css`, keep `min-height: 100vh`, add `min-height: 100dvh`, and add logical inline padding using `env(safe-area-inset-left)` and `env(safe-area-inset-right)`. Add equivalent left/right padding to the fixed bottom-nav wrapper because fixed positioning does not inherit root padding.

- [ ] **Step 3: Add dynamic viewport overrides to remaining static-height states**

For each `min-height: 100vh`, add `min-height: 100dvh` immediately after it. For `min-height: calc(100vh - 220px)`, add `min-height: calc(100dvh - 220px)` immediately after it.

- [ ] **Step 4: Verify fallback ordering**

Run: `rg -n -A1 "100vh" src --glob '*.css'`

Expected: Every `100vh` match is immediately followed by the corresponding `100dvh` override.

### Task 3: Full Frontend Verification and Visual Check

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: Evidence that the frontend remains lint-clean, type-safe, buildable, and visually stable.

- [ ] **Step 1: Run repository verification**

Run: `npm run lint`, `npm run typecheck`, and `npm run build`.

Expected: All commands exit 0.

- [ ] **Step 2: Start the Vite development server and inspect representative viewports**

Inspect at least 320×568, 390×844, 430×932, and a desktop width. Confirm no horizontal overflow, the centered 480px canvas remains, and fixed bottom UI respects the available area.

- [ ] **Step 3: Review the final diff against the spec**

Confirm that only frontend navigation/layout files and approved documentation changed, the `/community` route and page remain, and no dependency or backend file changed.
