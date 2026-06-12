# UI Audit

## Design Systems

### Android Kiosk

**Location:** `core/designsystem/`

| Token | Value | Usage |
|-------|-------|-------|
| Primary | Material3 dynamic from theme | Buttons, headings |
| BigButton | Large touch target component | All CTAs |
| CountdownOverlay | Full-screen countdown | Capture |
| Typography | Material3 defaults | No custom wedding fonts |

**Themes (domain):** `luxury_gold`, `kerala_traditional`, `royal_purple` — referenced by ID; partial application on attract screen.

### Admin Dashboard

**Location:** `admin-dashboard/src/app/globals.css`, Tailwind config

| Token | Value |
|-------|-------|
| Background | `#0F0F0F` |
| Surface | `#1A1A1A`, `#242424` |
| Accent (gold) | `#D4A843` |
| Text primary | `#F0EDE8` |
| Display font | Cormorant Garamond |
| Body font | DM Sans |
| Noise texture | `/noise.svg` overlay |

**Components:** Hand-rolled (Button, Card, Badge, Input, Toast) — no shadcn/Radix.

---

## Visual Hierarchy

### Kiosk

| Screen | Hierarchy | Score |
|--------|-----------|-------|
| Attract | Strong — large names, pulsing CTA | 8/10 |
| Consent | Clear heading → body → actions | 7/10 |
| Capture | Camera dominates; buttons at bottom | 7/10 |
| Share | QR centered; buttons equal weight | 5/10 |
| Admin | Flat text list, no visual grouping | 4/10 |

### Admin

| Screen | Hierarchy | Score |
|--------|-----------|-------|
| Dashboard | Stat cards with GSAP counters — strong | 8/10 |
| Events list | Clean cards with badges | 7/10 |
| Create event | Form sections, good spacing | 7/10 |
| Event detail | Dense information, weak section separation | 6/10 |
| Gallery (public) | Beautiful masonry, strong brand header | 8/10 |

---

## Typography

| Platform | Display | Body | Issues |
|----------|---------|------|--------|
| Android | Material3 default | Material3 default | No luxury wedding font; generic feel |
| Admin | Cormorant Garamond | DM Sans | Strong luxury pairing; good hierarchy |

**Inconsistency:** Android and admin use completely different type systems.

---

## Color System

| Platform | Palette | Consistency |
|----------|---------|-------------|
| Android | Material3 light theme (white splash) | ⚠️ White flash on cold start |
| Admin | Dark luxury gold | ✅ Consistent across pages |
| Gallery public | Inherits event theme color | ✅ |

**Issue:** Kiosk uses light Material theme; admin uses dark luxury — brand disconnect.

---

## Component Reuse

### Android
- `BigButton` — used consistently across all screens ✅
- `OutlinedTextField` — admin/pairing only
- No shared card/panel component for admin health

### Admin
- `Card`, `Button`, `Badge` — consistent ✅
- `FormField` — create event only
- `StatCard` — dashboard only
- No shared data table component

---

## Responsiveness

### Admin Dashboard

| Breakpoint | Behavior | Status |
|------------|----------|--------|
| Desktop (1280+) | Full sidebar + 4-col stats | ✅ |
| Tablet (768–1279) | 2-col stats, fixed sidebar | ⚠️ Cramped |
| Mobile (<768) | Fixed 240px sidebar overlaps content | ❌ Broken |

**Missing:** Hamburger menu, responsive sidebar collapse, touch-friendly mobile nav.

### Public Gallery

| Breakpoint | Columns |
|------------|---------|
| Default | 2 |
| md | 3 |
| lg | 4 |

✅ Responsive masonry works well.

### Android Kiosk

Designed for tablet landscape/portrait. No phone layout. Target: Samsung Tab A9+ class devices.

| Orientation | Support |
|-------------|---------|
| Portrait | ✅ Primary |
| Landscape | ⚠️ Not optimized (camera aspect) |

---

## Android Experience

| Aspect | Assessment |
|--------|------------|
| Touch targets | ✅ Large BigButtons (kiosk-appropriate) |
| Splash screen | ❌ White Material light flash (~6s) |
| Animations | ✅ Attract shimmer; NavHost fade transitions |
| Reduce motion | ✅ Respected |
| System bars | ⚠️ Immersive/lock task varies by provisioning |
| Material3 | ✅ Used but not customized to brand |

---

## Tablet Experience

| Aspect | Score | Notes |
|--------|-------|-------|
| Layout scaling | 7/10 | Compose fills screen well |
| Camera preview | 7/10 | Full-screen CameraX |
| Admin on tablet | N/A | Admin is web-only |
| Kiosk admin panel | 5/10 | Same layout, no tablet-optimized grid |

---

## Inconsistencies Catalog

| # | Inconsistency | Platforms | Severity |
|---|---------------|-----------|----------|
| 1 | Light (Android) vs dark (admin) brand | Android / Admin | High |
| 2 | Different fonts (Material vs Cormorant) | Android / Admin | Medium |
| 3 | Gold accent only in admin, not Android theme | Both | Medium |
| 4 | Share screen buttons all same style | Android | Low |
| 5 | Admin panel uses basic Text, not Cards | Android | Medium |
| 6 | Event detail captures show text not images | Admin | High |
| 7 | `/analytics` identical to `/` | Admin | Medium |
| 8 | Login page dark card but no brand logo | Admin | Low |
| 9 | Pairing page in admin has QR; kiosk has text only | Admin / Android | Medium |
| 10 | No favicon/branding in gallery vs admin | Admin / Gallery | Low |

---

## UI Score Summary

| Dimension | Android | Admin | Gallery |
|-----------|---------|-------|---------|
| Visual hierarchy | 6/10 | 7/10 | 8/10 |
| Typography | 5/10 | 8/10 | 7/10 |
| Color consistency | 5/10 | 9/10 | 8/10 |
| Component reuse | 7/10 | 8/10 | 7/10 |
| Responsiveness | 7/10 | 4/10 | 8/10 |
| Brand cohesion | 4/10 | 8/10 | 7/10 |

**Overall UI Score:** 6.5/10 — Admin and gallery are polished; Android kiosk feels generic Material3.

---

## Top UI Recommendations

1. **Unify brand** — Apply gold/dark luxury theme to Android kiosk (splash + Material3 color scheme)
2. **Admin mobile** — Collapsible sidebar with hamburger
3. **Capture thumbnails** — Render `thumbKey` images in event detail grid
4. **Share screen hierarchy** — Primary CTA on QR; secondary channels grouped
5. **Kiosk admin panel** — Card-based layout matching admin dashboard patterns
6. **Shared design tokens file** — Cross-platform JSON/TOML tokens for colors, fonts, spacing
