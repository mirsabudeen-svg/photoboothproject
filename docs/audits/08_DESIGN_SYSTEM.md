# Design System Review

## Current State

**Android:** `core:designsystem` module with `PhotoboothTheme`, `BigButton`, Material3 color scheme.  
**Admin:** Ad-hoc inline styles — **no shared design system**.

## Tokens Audit

| Token | Android | Admin | Unified? |
|-------|---------|-------|----------|
| Primary gold | Material `primary` | `#FFD700` | **Partial match** |
| Background dark | Theme dark | `#1a1a1a` / `#2c2c2c` | **Close** |
| Typography | Material typography | System sans | **No** |
| Radius | 12dp cards implied | `12px` | **Ad hoc** |
| Shadows | Material elevation | None | **Missing admin** |
| Spacing | 32dp padding common | 16/24px mix | **No scale** |
| Icons | Minimal | None | **Missing** |

## Components

| Component | Android | Admin |
|-----------|---------|-------|
| Button | `BigButton` | Native `<button>` |
| Input | Material3 | Native `<input>` |
| Card | Compose surfaces | Div + inline style |
| Modal | Not used | Not used |
| Toast/Snackbar | Not standardized | Not used |

## Motion

- No shared motion tokens
- No enter/exit transitions between kiosk screens

## Recommendation: Unified Wedding DS

Create `docs/design-tokens.json` (or extend designsystem):

```json
{
  "color": {
    "primary": "#FFD700",
    "surface": "#1A1A1A",
    "surfaceElevated": "#2C2C2C",
    "error": "#F44336"
  },
  "radius": { "sm": 8, "md": 12, "lg": 16 },
  "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 }
}
```

**Admin modernization:** Add shadcn/ui with CSS variables mapped to tokens — **recommended when admin grows beyond 5 pages**.

**Android:** Already correct location (`core:designsystem`); export tokens from single source.

## Theme Variants (Wedding)

| Theme ID | Status |
|----------|--------|
| `luxury_gold` | Referenced in admin form |
| `kerala_traditional` | Name only |
| `royal_purple` | Name only |

**Gap:** Themes not applied in `PhotoboothTheme` from event config.

## Icons

- No icon library in admin
- Android — minimal

**Recommend:** Lucide (admin) + Material Icons Extended (Android) for parity.
