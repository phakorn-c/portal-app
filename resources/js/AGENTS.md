# FRONTEND KNOWLEDGE BASE

**Location:** `resources/js/`

## OVERVIEW

React 19 frontend layer using Inertia.js, Tailwind v4, and Wayfinder for typed routing.

## STRUCTURE

```
.
├── components/          # Shared UI components
│   └── ui/              # shadcn/ui primitives (Radix)
├── hooks/               # React hooks (theme, auth, etc.)
├── layouts/             # Persistent Inertia layouts
├── lib/                 # Core utilities and helpers
├── pages/               # Route-mapped page components
├── types/               # Shared TypeScript interfaces
├── app.tsx              # Client entry (Inertia setup)
└── ssr.tsx              # SSR entry (Vite SSR)
```

## WHERE TO LOOK

| Task          | File/Folder                | Note                                 |
| ------------- | -------------------------- | ------------------------------------ |
| Client Boot   | `app.tsx`                  | `createInertiaApp` + page resolver   |
| SSR Boot      | `ssr.tsx`                  | `createServer` for backend rendering |
| UI Primitives | `components/ui/`           | shadcn/ui components; do not format  |
| Theme State   | `hooks/use-appearance.tsx` | Module-level state + cookie sync     |
| Utilities     | `lib/utils.ts`             | `cn()` and `toUrl()` helpers         |
| Type Exports  | `types/index.ts`           | Barrel export for `@/types`          |
| Page Logic    | `pages/`                   | Domain-nested (e.g., `procurement/`) |

## CONVENTIONS

- **Path Aliasing**: Always use `@/*` for internal imports.
- **Typed Routes**: Use Wayfinder-generated `route()` for links/visits.
- **Imports**: Enforce `import type` for TS definitions; keep imports sorted.
- **Styling**: Use `cn()` for conditional Tailwind classes.
- **React Compiler**: Enabled; avoid manual `useMemo`/`useCallback` unless necessary.

## ANTI-PATTERNS

- **Relative Paths**: Avoid `../../` nesting; use `@/` aliases.
- **Direct DOM**: Avoid direct DOM manipulation; use React refs/state.
- **Manual Theme**: Don't bypass `useAppearance` for theme checks.
- **UI Formatting**: Leave `components/ui/` as-is to match shadcn/ui source.
