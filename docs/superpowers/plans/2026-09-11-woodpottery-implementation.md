# Woodpottery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a visually distinctive Swedish storefront and backend-ready local admin CMS for a tiny low-stock wood/ceramics shop.

**Architecture:** React + TypeScript + Vite with storefront/admin routes. UI talks to typed auth, repository and checkout adapters; initial adapters persist to localStorage, allowing later replacement by server APIs without rewriting page components.

**Tech Stack:** React 19, TypeScript, Vite, React Router, DOMPurify, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-11-woodpottery-design.md`

## Global Constraints
- Swedish-only public UI.
- Dark graphite/olive-charcoal design; no plain light theme and no pitch-black theme.
- Sparse factual copy; no generic quality/longevity/sentimental maker sales language.
- SEK prices.
- Every persistent demo mutation goes through an adapter.
- Client-only admin authentication is explicitly demo-only and structured for later backend replacement.
- All public text values are editable in admin; custom text blocks can be added and removed.

---

### Task 1: Tooling and behavior tests

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `vite.config.ts`, `index.html`
- Create: `src/lib/shop.test.ts`

**Interfaces:**
- Tests define required helpers: `clampCartQuantity(requested, stock)` and `formatSek(ore)`.

- [ ] Add Vite/Vitest configuration and dependencies.
- [ ] Write tests proving quantity is clamped to 0..stock and Swedish currency is formatted from öre.
- [ ] Run tests and confirm they fail because `src/lib/shop.ts` does not yet exist.

### Task 2: Typed domain and local adapters

**Files:**
- Create: `src/types.ts`, `src/data/seed.ts`, `src/lib/shop.ts`
- Create: `src/adapters/repository.ts`, `src/adapters/auth.ts`, `src/adapters/checkout.ts`

**Interfaces:**
- `ShopRepository`: `snapshot`, product/content/settings CRUD, order append, reset.
- `AuthAdapter`: `getSession`, `login`, `logout`.
- `CheckoutAdapter`: `submit`.

- [ ] Implement tested helpers and run the tests green.
- [ ] Define products, content entries, custom blocks, settings, cart items, customers and orders.
- [ ] Seed concise Swedish demo data and local SVG image paths.
- [ ] Implement versioned localStorage repository with safe seed fallback.
- [ ] Implement demo auth adapter with session storage and an obvious non-production boundary.
- [ ] Implement demo checkout adapter that validates stock, decrements inventory through repository APIs, records the order and returns confirmation.

### Task 3: Storefront UI

**Files:**
- Create: `src/main.tsx`, `src/App.tsx`, `src/context/ShopContext.tsx`
- Create: `src/components/Storefront.tsx`, `src/components/CartDrawer.tsx`, `src/components/RichText.tsx`

**Interfaces:**
- Context exposes snapshot, cart state, repository actions and checkout.

- [ ] Build header/hero/product composition with sparse editable copy.
- [ ] Build product detail dialog and low-stock/add-to-cart behavior.
- [ ] Build persistent cart with stock-safe quantity controls.
- [ ] Build checkout form and local demo confirmation state without claiming real payment capture.
- [ ] Render editable legal/custom text blocks safely through DOMPurify.

### Task 4: Admin CMS

**Files:**
- Create: `src/components/Admin.tsx`, `src/components/RichTextEditor.tsx`

**Interfaces:**
- Admin consumes repository/auth only through adapters exposed by context.

- [ ] Implement `/admin` demo login gate.
- [ ] Implement product list/create/edit/delete, sort, visibility, stock, price, metadata and image URL/upload.
- [ ] Compress/rescale uploaded images before persistence.
- [ ] Implement content registry editor for all public text.
- [ ] Implement custom text blocks with page placement, alignment and size controls.
- [ ] Implement formatting toolbar: bold, italic, underline, alignment and font size.
- [ ] Implement settings, demo order view and reset action.

### Task 5: Visual system, responsive behavior and assets

**Files:**
- Create: `src/styles.css`
- Create: `public/assets/vessel.svg`, `public/assets/cup.svg`, `public/assets/board.svg`

**Interfaces:**
- CSS tokens define palette, spacing, typography, borders, motion and responsive rules shared by storefront/admin.

- [ ] Implement graphite/clay visual system, texture, editorial typography and asymmetric layouts.
- [ ] Add hover/reveal/cart transitions with `prefers-reduced-motion` fallback.
- [ ] Make mobile layouts and admin controls usable without horizontal overflow.
- [ ] Add polished local SVG demo artwork that is clearly replaceable in admin.

### Task 6: Verification and handoff

**Files:**
- Create: `README.md`

- [ ] Run `npm test -- --run`.
- [ ] Run `npm run build`.
- [ ] Exercise storefront/cart/checkout/admin in a browser if browser tooling is available; otherwise record the blocker and validate via build/tests.
- [ ] Document local run, demo admin credentials, backend migration seams and the fact that frontend-only auth is not secure for public deployment.
