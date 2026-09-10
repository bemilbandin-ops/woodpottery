# Woodpottery design specification

## Goal
Build a complete Swedish-only storefront for a small woodworking / pottery shop with very few products and low stock, plus a local-first admin CMS that is deliberately easy to replace with secure backend adapters later.

## Public design
- Dark but not black: graphite/olive-charcoal background, warm off-white type, muted clay/copper accent, restrained sage secondary accent.
- Editorial rather than template-like: oversized typography, asymmetric media, thin rules, generous negative space, subtle texture and motion.
- Minimal public copy. No generic quality claims, lifestyle sales copy, maker-story clichés, badges, fake testimonials, fake metrics, or filler sections.
- Swedish UI and Swedish kronor only.
- Public surfaces: start/shop, product detail, cart drawer, checkout, order confirmation, terms/privacy/contact footer surfaces.
- Low-stock behavior is visible and enforced in cart quantities.

## Seed content
Temporary editable brand: `RÅFORM`.
Hero: `Trä / Keramik` and a single action `Se objekt`.
Demo products use concise factual copy only: material, dimensions and finish/glaze.

## Commerce behavior
- Cart persists locally.
- Quantity cannot exceed current stock.
- Sold-out products cannot be added.
- Checkout collects Swedish-market fields and produces a local demo order/confirmation.
- Checkout is isolated behind an adapter so a later server/Stripe/Klarna implementation can replace it without changing storefront components.
- No fake claim that payment has been captured in the frontend-only build.

## Admin
- `/admin` login gate using a demo auth adapter. The UI must clearly identify local demo authentication as non-secure for public deployment.
- Auth is isolated behind an interface so a real backend auth provider can replace it.
- Product CRUD: title, slug, category, price, stock, visibility, featured state, description/details, image URL or upload, alt text and sort order.
- Uploaded demo images are resized/compressed and stored locally; media access is isolated so backend object storage can replace it.
- Content CMS exposes all public text strings through a registry and supports adding/removing custom text blocks by page.
- Rich text editing supports bold, italic, underline, alignment and font-size controls; output is sanitized before rendering.
- Settings include brand name, contact email, social URL, shipping amount and free-shipping threshold.
- Demo orders are visible in admin.
- Reset-to-seed action is provided.

## Data architecture
Use typed interfaces and local adapters:
- `ShopRepository`: catalog, content, settings and demo orders.
- `AuthAdapter`: login/logout/session.
- `CheckoutAdapter`: submit an order and return a confirmation.

The React UI consumes these interfaces rather than calling `localStorage` directly. A backend implementation can later supply adapters with the same methods.

## Technical architecture
- React + TypeScript + Vite.
- React Router for public/admin routes.
- DOMPurify for rich text rendering.
- Lucide React for consistent iconography.
- CSS custom properties and focused component classes; no generic component library.
- Local SVG demo artwork so the repo is visually complete without external image hotlinks.
- Vitest for data/cart utility tests.

## Accessibility and responsive behavior
- Semantic controls and labels, visible keyboard focus, alt text, escape-to-close for cart drawer where relevant.
- Respect `prefers-reduced-motion`.
- Desktop composition collapses cleanly to a single-column mobile layout without horizontal overflow.

## Security boundary
The included login is a UI/demo gate only. No client-only authentication can protect an admin surface on a public deployment. The adapter boundary is the migration point for server-validated sessions and protected API routes.

## Acceptance
- `npm run build` and `npm test -- --run` pass.
- Public storefront, cart, checkout and admin CRUD/content editing are interactive.
- All persistent demo data goes through repository/auth/checkout adapters.
- Public copy remains sparse and factual.
