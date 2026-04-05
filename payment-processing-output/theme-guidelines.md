# Theme Guidelines — avery-pay-platform

> Design system rules for a static site built with Go

## Styling Approach

**No CSS framework detected.** Using vanilla CSS custom properties.

- Import `theme.css` at the root of the application
- Use `var(--token-name)` to reference design tokens
- Avoid hardcoded colors, spacing, and typography values

## Color Usage

| Context | Token Range | Example |
|---------|------------|---------|
| Background (light) | neutral-50 to neutral-100 | Page backgrounds, cards |
| Background (dark) | neutral-800 to neutral-900 | Dark mode surfaces |
| Text (primary) | neutral-900 / neutral-50 (dark) | Body text |
| Text (secondary) | neutral-500 to neutral-600 | Labels, captions |
| Interactive | primary-500 to primary-600 | Buttons, links |
| Interactive (hover) | primary-600 to primary-700 | Hover states |
| Success | success-500 | Confirmations, valid states |
| Warning | warning-500 | Caution indicators |
| Error | error-500 | Error messages, destructive actions |

## Typography

- Use `font-sans` for UI text and body copy
- Use `font-mono` for code blocks, terminal output, and technical data
- Heading scale: h1=4xl, h2=3xl, h3=2xl, h4=xl, h5=lg, h6=base
- Body text: base size (1rem / 16px) with normal line-height (1.5)
- Small text: sm size for captions, helper text, labels
- Never use more than 3 font weights on a single page

## Spacing

- Use the 4-point grid: all spacing should be multiples of `--space-1` (0.25rem)
- Component padding: `--space-3` to `--space-4` (12–16px)
- Section gaps: `--space-6` to `--space-8` (24–32px)
- Page margins: `--space-4` on mobile, `--space-8` on desktop
- Stack spacing (vertical gaps): `--space-2` to `--space-4`

## Component Patterns

Detected 89 component file(s). Apply these patterns:

- Buttons: `radius-md`, `primary-500` bg, `space-2` horizontal padding, `space-1` vertical
- Cards: `radius-lg`, `shadow-base`, `space-4` padding, `neutral-50` bg
- Inputs: `radius-base`, `neutral-200` border, `space-2` padding, `neutral-50` bg
- Modals: `radius-xl`, `shadow-lg`, centered with backdrop
- Badges: `radius-full`, `font-size-xs`, `space-1` padding

## Animation & Motion

### Available Animations

| Class | Effect | Duration | Use For |
|-------|--------|----------|---------|
| `.animate-fade-in` | Opacity 0→1 | 200ms | Page sections, lazy content |
| `.animate-slide-up` | Translate Y + fade | 200ms | Cards, list items, toasts |
| `.animate-slide-down` | Translate Y + fade | 200ms | Dropdowns, menus |
| `.animate-scale-in` | Scale 0.95→1 + fade | 150ms | Modals, popovers |
| `.animate-spin` | 360° rotate | 1s loop | Loading spinners |
| `.animate-pulse` | Opacity pulse | 2s loop | Skeleton loaders |
| `.animate-shimmer` | Gradient sweep | 1.5s loop | Loading placeholders |

### Motion Rules

- **Entrances**: Use `fade-in` or `slide-up`. Keep under 300ms.
- **Exits**: Reverse the entrance or use `fade-out` (opacity 1→0).
- **Hover/focus**: Use `transition: all var(--transition-fast)` — never animate on hover with keyframes.
- **Loading states**: Prefer `pulse` or `shimmer` over spinner when layout is known.
- **Reduced motion**: All animations are automatically disabled via `prefers-reduced-motion: reduce`.
- **Easing**: Default to `--ease-out` for entrances, `--ease-in` for exits, `--ease-bounce` for playful micro-interactions.

## Responsive Strategy

### Breakpoints

| Token | Width | Target |
|-------|-------|--------|
| `sm` | 640px | Large phones (landscape) |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Rules

- **Mobile-first**: Write base styles for the smallest screen, then layer up with `min-width` queries.
- **Container widths**: Cap content at `max-width: 1280px` with auto margins.
- **Touch targets**: Minimum 44×44px for all interactive elements on mobile.
- **Spacing**: Use `--space-4` page margins on mobile, `--space-8` on `md+`.
- **Typography**: Body stays at `base` (1rem). Headings can scale down 1 step on mobile (e.g., `h1` from `4xl` to `3xl`).
- **Grid**: Prefer CSS Grid with `auto-fit` / `minmax()` for naturally responsive layouts.

## Surface Hierarchy

| Surface | CSS Class | Use For |
|---------|-----------|---------|
| Page | `--surface-page` | Root background |
| Card | `.surface-card` | Primary content containers |
| Elevated | `.surface-elevated` | Floating panels, popovers |
| Inset | `.surface-inset` | Code blocks, secondary areas |
| Overlay | `--surface-overlay-backdrop` | Modal/dialog backdrops |

Surfaces automatically adapt in dark mode via CSS custom properties.

## Accessibility

### Contrast Requirements (WCAG 2.1)

| Level | Ratio | Applies To |
|-------|-------|------------|
| AA | 4.5:1 | Normal text (< 18px) |
| AA | 3:1 | Large text (≥ 18px bold / 24px), UI components, icons |
| AAA | 7:1 | Enhanced — target for body text on critical pages |

### Token Contrast Reference

| Combination | Approximate Ratio | Grade |
|-------------|-------------------|-------|
| neutral-900 on neutral-50 | 18.1:1 | AAA |
| neutral-900 on neutral-100 | 16.0:1 | AAA |
| primary-600 on neutral-50 | 5.2:1 | AA |
| neutral-500 on neutral-50 | 4.6:1 | AA (text) |
| neutral-400 on neutral-50 | 3.2:1 | AA (large only) |
| error-500 on white | 4.0:1 | AA (large only) |

### Focus & Interaction

- All interactive elements use `:focus-visible` with a `2px` ring in `--ring-color`.
- Do not rely on color alone to convey state — pair with icons, text, or shape changes.
- Use `prefers-reduced-motion` to disable animations (already wired in theme.css).
- Test with screen readers, keyboard-only navigation, and Windows High Contrast Mode.
