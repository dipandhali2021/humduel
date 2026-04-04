# HumDuel — Design System

**Date:** 2026-04-04
**Author:** ui-designer (Stitch MCP)
**Status:** Approved
**Stitch Project:** `projects/15759218275488447742`
**Design System Asset:** `assets/2159400510209959013`

---

## Brand Identity

HumDuel combines a **dark, immersive gaming atmosphere** with **vibrant music-inspired accents**. The visual identity sits at the intersection of Spotify's premium dark aesthetic and Wordle's clean shareability.

### Design Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Mobile-First** | Every screen designed for thumb-friendly mobile interaction first |
| 2 | **Playful but Clean** | Vibrant gradients balanced with generous whitespace |
| 3 | **Audio-Visual** | Waveform visualizations are the signature visual element |
| 4 | **Social-Ready** | Share cards must be visually striking on social media |
| 5 | **Accessible** | WCAG AA contrast, 44px min touch targets, clear hierarchy |

---

## Color Palette

### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#7C3AED` (Violet) | CTA buttons, active states, recording indicator |
| `--color-secondary` | `#3B82F6` (Blue) | Links, info elements, waveform base |
| `--color-tertiary` | `#EC4899` (Pink) | Success states, streaks, social accents |

### Surface Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-surface` | `#1E1B2E` | App background |
| `--color-surface-elevated` | `#2A2640` | Cards, modals |
| `--color-surface-hover` | `#352F50` | Hover/focus states |
| `--color-on-surface` | `#FFFFFF` | Primary text |
| `--color-on-surface-muted` | `#A0A0B8` | Secondary text, captions |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#22C55E` | Correct guess |
| `--color-error` | `#EF4444` | Wrong guess, recording stop |
| `--color-warning` | `#F59E0B` | Timer warning |

### Waveform Gradient

The signature HumDuel waveform uses a 3-stop gradient:
```css
background: linear-gradient(90deg, #7C3AED 0%, #3B82F6 50%, #EC4899 100%);
```

---

## Typography

### Font Stack

| Role | Font | Fallback |
|------|------|----------|
| Headlines | Space Grotesk | system-ui, sans-serif |
| Body | Inter | system-ui, sans-serif |
| Labels/UI | DM Sans | system-ui, sans-serif |

### Type Scale

| Level | Font | Size/Line Height | Weight | Usage |
|-------|------|-----------------|--------|-------|
| Display | Space Grotesk | 48px/56px | 700 | Hero headlines |
| H1 | Space Grotesk | 32px/40px | 700 | Page titles |
| H2 | Space Grotesk | 24px/32px | 600 | Section headers |
| H3 | Space Grotesk | 20px/28px | 600 | Card titles |
| Body | Inter | 16px/24px | 400 | Paragraph text |
| Body Small | Inter | 14px/20px | 400 | Descriptions |
| Label | DM Sans | 14px/20px | 500 | UI labels, metadata |
| Caption | DM Sans | 12px/16px | 400 | Timestamps, hints |

---

## Spacing & Layout

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps |
| `--space-sm` | 8px | Icon gaps, inline spacing |
| `--space-md` | 16px | Standard padding |
| `--space-lg` | 24px | Section spacing |
| `--space-xl` | 32px | Major section gaps |
| `--space-2xl` | 48px | Page-level spacing |

### Border Radius

All components use `border-radius: 12px` (ROUND_TWELVE) for a modern, friendly feel.

| Component | Radius |
|-----------|--------|
| Cards | 12px |
| Buttons | 12px |
| Inputs | 12px |
| Modals | 16px |
| Record Button | 50% (circle) |
| Avatars | 50% (circle) |

---

## Motion & Animation

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Waveform pulse | Real-time | linear | Audio input |
| Record button glow | 2s loop | ease-in-out | Idle state |
| Page transition | 200ms | ease-out | Navigation |
| Confetti burst | 1.5s | ease-out | Correct guess |
| Shake (wrong) | 300ms | ease-in-out | Wrong guess |
| Button press | 100ms | ease-out | Touch/click |
| Fade in | 150ms | ease-out | Element mount |

---

## Accessibility

- **Color contrast:** All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- **Touch targets:** Minimum 44x44px for all interactive elements
- **Focus indicators:** Visible violet outline (2px solid #7C3AED) for keyboard navigation
- **Screen reader:** All icons have aria-labels; waveform has alt text
- **Reduced motion:** Respects `prefers-reduced-motion` — disables animations
- **Dark mode only:** High contrast by default; light mode not planned for MVP

---

## Stitch MCP Integration

This design system was created and managed through Google Stitch MCP:

```
Project ID:     15759218275488447742
Asset ID:       2159400510209959013
Color Mode:     DARK
Color Variant:  VIBRANT
Headline Font:  SPACE_GROTESK
Body Font:      INTER
Label Font:     DM_SANS
Roundness:      ROUND_TWELVE
Custom Color:   #7C3AED
```

Stitch tools used:
- `create_project` — Created HumDuel project container
- `create_design_system` — Defined tokens and guidelines
- `update_design_system` — Applied to project
- `generate_screen_from_text` — Generated all screen designs
