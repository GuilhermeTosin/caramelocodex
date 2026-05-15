# Startup.ai Vite Starter

## Purpose

Single locked stack for generated apps: **Vite + React + TypeScript + Tailwind CSS + shadcn/ui (Radix) + lucide-react**. The app starts with a small core primitive set; optional shadcn primitives are materialized from the Startup.ai UI registry when the interface actually needs them.

## Stack (do not swap without explicit user request)

- Build: Vite 5, React 18
- Styling: Tailwind 3 with `tailwindcss-animate`, semantic tokens in `src/index.css` / `tailwind.config.js`
- Components: lean shadcn/ui core in `src/components/ui/` (see `components.json`)
- Icons: `lucide-react` only for icons and icon-style logos
- Routing: `react-router-dom` — routes live in `src/pages/` and are registered in `src/App.tsx`
- Forms: add `form` from the UI registry when a form needs React Hook Form wrappers
- Toasts: `sonner` via `src/components/ui/sonner.tsx`
- Aliases: `@/` → `src/` (see `tsconfig.app.json` and `vite.config.ts`)

## File map

| Path | Role |
|------|------|
| `src/main.tsx` | App bootstrap |
| `src/App.tsx` | `BrowserRouter`, route table, `<Toaster />` |
| `src/pages/Index.tsx` | Default neutral landing shell |
| `src/pages/NotFound.tsx` | 404 route |
| `src/data/siteContent.ts` | Editable name, tagline, CTA labels |
| `src/components/ui/*` | core shadcn primitives (Button, Card, Input, Label, Badge, …) |
| `src/lib/utils.ts` | `cn()` helper |
| `src/index.css` | Tailwind layers, light/dark CSS variables, motion safety |
| `DESIGN.md` | **Read first** — enforceable design and a11y rules |
| `components.json` | shadcn config (for adding more components via CLI locally) |

## First implementation turn

1. Read **TEMPLATE.md** and **DESIGN.md** from context (or Read once if missing).
2. Prefer **narrow edits** (`Edit`, targeted `apply_patch`) over rewriting entire files for `tailwind.config.js`, `src/index.css`, and shared tokens.
3. Keep **semantic Tailwind tokens** only (`bg-background`, `text-foreground`, …). Never swap to raw palette classes unless the user insists.
4. First preview is a checkpoint: prove one useful product surface or core flow before broad app completion.
5. For new screens: add `src/pages/*.tsx` and a `<Route>` in `src/App.tsx`.
6. Call **`request_preview`** once the first surface is typecheckable. Run **`verify_build`** before preview only for dependency changes, Cloud/client wiring, or repair loops.

## Verification

- `npm run dev` — dev server listens on `0.0.0.0`
- `npm run build` — must pass before declaring done on structural changes

## Adding more shadcn components (optional)

Use the Startup.ai UI registry to add missing primitives such as `dialog`, `select`, `table`, `tabs`, `form`, or `dropdown-menu`. Prefer existing imports from `src/components/ui/` first, then materialize only the components the current UI needs.
