# UI COMPONENTS KNOWLEDGE BASE

## OVERVIEW
Collection of 32 shadcn/ui-style Radix UI primitives built with Tailwind CSS and `class-variance-authority`.

## CONVENTIONS
- **Import Path**: Use `@/components/ui/{component}`.
- **Styling**: Use `class-variance-authority` (CVA) for variants and `cn()` from `@/lib/utils` for class merging.
- **Composition**: Built on Radix UI primitives for accessibility.
- **Props**: Extend `React.ComponentProps` or Radix props; add `className` for overrides.
- **File Naming**: Kebab-case (e.g., `status-badge.tsx`, `select.tsx`).
- **Export**: Use named exports (e.g., `export { Button, buttonVariants }`).
- **Formatting**: Excluded from Prettier; maintain original shadcn/ui structure.

## ANTI-PATTERNS
- **No Business Logic**: Do not add API calls, state management, or domain-specific logic here.
- **No App-Specific Components**: Move components like `app-header.tsx` to the parent `components/` directory.
- **No Manual Formatting**: Do not run Prettier on these files; they are intentionally excluded.
- **No Inline Styles**: Use Tailwind classes and CSS variables from `app.css`.
- **No Default Exports**: Stick to named exports for consistency.
