# Design system — Quero um website/portal, que futuramente será também

A focused web app generated in Startup.ai.

Designs must be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.

For all designs you implement in this project: default to **JSX + Tailwind utility classes**, the **shadcn/ui** primitives already in `src/components/ui`, **React hooks**, and **lucide-react** for icons. Optional shadcn primitives are available through the Startup.ai UI registry when needed. Do not install other packages for UI themes, icons, or stock illustration unless absolutely necessary or the user explicitly requests them. Use icons from **lucide-react** for logos and UI chrome. Use stock photos from **Unsplash** (direct image URLs) where appropriate; do not pull random hotlinked assets from unknown hosts without user consent.

---

## Color and surfaces (non‑negotiable)

Never use direct Tailwind palette classes for surfaces or typography such as **`text-white`**, **`bg-white`**, **`text-black`**, **`bg-black`**, **`text-gray-500`**, **`bg-gray-100`**, **`text-slate-600`**, **`bg-zinc-900`**, or similar fixed palette utilities.

Always use **semantic design tokens** mapped to CSS variables, for example:

- `bg-background`, `text-foreground`
- `bg-card`, `text-card-foreground`
- `bg-muted`, `text-muted-foreground`
- `border-border`, `border-input`
- `bg-primary`, `text-primary-foreground`
- `bg-secondary`, `text-secondary-foreground`
- `bg-accent`, `text-accent-foreground`
- `bg-destructive`, `text-destructive-foreground`
- `ring-ring`

Customize **component variants** (Button, Badge, Alert, etc.) or extend tokens in `src/index.css` and `tailwind.config.js` instead of sprinkling one-off hex colors or arbitrary Tailwind palette classes across JSX.

---

## Layout and responsiveness

Always make layouts responsive on **all breakpoints** with a **mobile‑first** mindset. Use **Tailwind’s built‑in breakpoints only**: `sm`, `md`, `lg`, `xl` (and `2xl` when truly needed). Do **not** invent custom breakpoint values unless the user explicitly asks.

Touch targets on interactive controls should be **at least 44×44px** on mobile (`min-h-11` / adequate padding).

---

## Motion

Respect **`prefers-reduced-motion`**. Avoid gratuitous animation; prefer subtle transitions already supported by shadcn/Radix patterns. Use `tailwindcss-animate` utilities where appropriate; do not rely on undefined custom keyframes.

---

## Accessibility (baseline)

Target practical alignment with **WCAG 2.1** expectations for generated UI:

- Use **semantic HTML**: real `<button>` elements for actions, anchors for navigation, headings in order, landmarks where helpful.
- Provide **`alt` text** on informative images (empty `alt` only for decorative images).
- Give **`aria-label`** (or visible text) for **icon‑only** buttons and controls.
- Ensure **keyboard access**: focus order matches visual order; interactive elements are focusable.
- Provide visible **focus styles** on interactive elements (`focus-visible:ring-*` with `ring-ring` / `ring-offset-background`). Do not leave controls with no focus affordance.

---

## Density and first impressions

Unless the user asks for a **complete business or SaaS landing page**, **less is more** for early iterations: limit placeholder copy, avoid spawning many low-value files, and polish one coherent surface end‑to‑end (layout, spacing, typography, states) before expanding breadth.

Make the **first preview** useful before making it exhaustive. A focused, product-specific surface that loads quickly is better than delaying preview for peripheral pages or decorative polish.

---

## Editing discipline

Prefer **search‑and‑replace style edits** (`Edit`, surgical `apply_patch`) over rewriting entire files when adjusting **`tailwind.config.js`**, **`src/index.css`**, or shared tokens — faster, cheaper, fewer regressions.

Use **`Write`** for new files or intentional full‑file rewrites of generated modules.

---

## Dark mode

The scaffold ships **light and dark** token blocks. Prefer **`class`-based dark mode** on `<html>` (`dark`) when implementing theme toggles — tokens under `.dark { … }` are already wired.

---

## References in-repo

Core component inventory: `src/components/ui/`. Use the Startup.ai UI registry for optional primitives that are not present.

Editable marketing copy for the default landing stub: `src/data/siteContent.ts`.

Routing entry: `src/App.tsx`; pages: `src/pages/`.

---

## Anti‑patterns

- Raw inline styles or `style={{}}` except tiny unavoidable cases (e.g. dynamic transforms explicitly requested).
- Decorative gradients, blobs, or emoji‑as‑icons unless the user asks or the existing design system already uses them.
- Provider secrets or env‑var tutorials inside customer‑facing UI (keep setup in tooling/docs).
