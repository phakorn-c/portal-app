# Khon Kaen Procurement Portal Design System

## 1. Atmosphere & Identity

A clear, trustworthy public-information workspace. The signature is a restrained blue civic accent over quiet neutral surfaces, with Thai procurement facts kept readable before decorative treatment.

## 2. Color

The Tailwind theme in `resources/css/app.css` is the source of truth. Use only the semantic tokens `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, and `ring`, including their foreground variants. Amber is reserved for review/provenance cautions, emerald for success, and red for PDF/destructive affordances already present in the product.

## 3. Typography

- Primary: Sarabun, then the existing system sans-serif fallback stack.
- Display: `text-3xl` to `text-4xl`, bold or black, tight tracking, balanced wrapping.
- Page heading: `text-2xl` to `text-4xl`, black, tight leading, natural Thai wrapping.
- Section heading: `text-lg` to `text-2xl`, semibold or bold.
- Body: `text-base` with comfortable line height.
- Metadata: `text-sm`; labels may use `text-xs` with semibold weight.
- Numeric facts use tabular figures where alignment or comparison matters.

Thai text must wrap at natural phrase boundaries. Long titles and organization/contact values may grow vertically but must not clip or create horizontal page scrolling.

## 4. Spacing & Layout

- Base unit: 4px, using Tailwind's existing spacing scale.
- Page gutters: 16px on narrow screens and 32px from the medium breakpoint.
- Section rhythm: 16px to 32px depending on hierarchy.
- Public search uses a 12-column desktop grid and collapses to one readable column below `lg`.
- Detail facts use one column on narrow screens, two at `md`, and four at `lg`.
- Primary content must remain within the viewport at 375px and must not depend on fixed text widths.

## 5. Components

### Procurement result card

- Structure: semantic `article`, status and ID, title, organization/method metadata, budget/deadline facts, detail action.
- States: default, hover/focus through existing card and button tokens, closed with muted opacity.
- Layout: vertical stack on narrow screens; fact/action cluster becomes horizontal when space permits.
- Accessibility: semantic heading and link; icons supplement visible labels.

### Procurement detail facts

- Structure: responsive grid of labeled values followed by document, contact, provenance, timeline, and description cards.
- States: unavailable optional facts render as `-`; unavailable attachment action is disabled.
- Accessibility: source and PDF actions are real links; phone numbers use `tel:` when present.

### Budget range control

- Structure: two-thumb range slider synchronized with the minimum and maximum amount fields.
- Interaction: each thumb supports pointer and keyboard adjustment without crossing the other value.
- Accessibility: expose distinct Thai labels for the minimum and maximum thumbs; never rely on visual position alone.

### Provenance card

- Structure: source heading, external source URL, optional source reference, contextual notice.
- Variants: `.invalid` demo source and normal imported source.
- Accessibility: URL remains visible and keyboard reachable; external-link semantics remain explicit.

## 6. Motion & Interaction

Keep existing short color/shadow transitions for actionable cards, links, and buttons. Motion communicates hover, focus, active, or state change only. Respect reduced-motion preferences through the existing component system; do not add decorative motion.

## 7. Depth & Surface

Use the existing mixed strategy: semantic borders define information regions, subtle shadows lift result cards and primary actions, and muted tonal fills distinguish secondary or caution content. Do not introduce new raw color values or elevation recipes for this data-polish work.

## 8. Accessibility Constraints & Accepted Debt

- Target WCAG 2.2 AA, visible keyboard focus, semantic landmarks, and no horizontal overflow at 375px.
- Thai dates explicitly use the Buddhist calendar with Latin digits and Bangkok timezone.
- Monetary values preserve two decimal places so imported procurement amounts remain exact.
- Raw OCR, confidence, warnings, and extraction internals remain absent from guest pages.

### Accepted debt

None.
