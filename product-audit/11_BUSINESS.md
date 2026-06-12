# Business Analysis & Competitive Landscape

## Problem Statement

Wedding guests expect instant, shareable photo memories at events. Professional photographers deliver days later. Generic photo booths lack branding, offline reliability, and operator visibility. **Wedding Photobooth** bridges this gap with a branded, offline-first kiosk and cloud gallery.

---

## Target Audience

### Primary: Wedding Operators / Photobooth Rental Companies

| Attribute | Detail |
|-----------|--------|
| Model | B2B — operator deploys at venue with attendant |
| Event type | Luxury weddings, Kerala traditional ceremonies |
| Scale | Single booth per event (current) |
| Technical skill | Low — needs plug-and-play with on-site support |
| Budget | Premium pricing tolerance for reliability |

### Secondary: Venue Direct (Future)

Hotels, banquet halls offering photobooth as add-on service.

### Not Ready For

- Corporate activations (branding immature)
- Exhibition multi-booth (fleet management incomplete)
- Self-serve consumer rental (provisioning too complex)

---

## Core Value Proposition

| Stakeholder | Value |
|-------------|-------|
| **Guests** | Instant branded photos, QR download, fun GIF/boomerang modes |
| **Couple** | Custom theme, hashtag, cloud gallery to relive memories |
| **Operator** | Dashboard visibility, device health, PDF reports, gallery publish |
| **Venue** | Reliable offline operation, locked kiosk, minimal intervention |

**Positioning:** *Premium, offline-resilient wedding photobooth platform — not a generic selfie app.*

---

## Revenue Opportunities

### Current State: No Monetization

Payment infrastructure does not exist. Stripe mentioned only in `PLATFORM_MIGRATION.md` as future Phase 2.

### Identified Revenue Models

| Model | Fit | Effort | Revenue Potential |
|-------|-----|--------|-------------------|
| **Per-event license** | High — matches current operator model | Low | $200–500/event |
| **SaaS subscription** | Medium — needs multi-tenant + self-serve | High | $99–499/month |
| **Print upsell** | High — print queue exists | Low | $2–5/print |
| **SMS/MMS pass-through** | Medium — Twilio costs exist | Low | Cost + margin |
| **Premium gallery hosting** | Medium — R2 storage costs | Medium | $10–30/event |
| **White-label for venues** | Low now — branding immature | High | Enterprise pricing |
| **AI premium filters** | Low — beauty is stub | Medium | $1–3/session |

### Recommended First Monetization

**Per-event license** with operator dashboard access — lowest friction, matches current attendant-present deployment model.

---

## Engagement Opportunities

| Opportunity | Exists | Potential |
|-------------|--------|-----------|
| GIF/Boomerang viral sharing | ⚠️ Partial | High — social media amplification |
| Hashtag branding | ✅ | Medium — Instagram discovery |
| Public gallery | ✅ | High — post-event revisits |
| Live capture counter | ✅ | Low — operator satisfaction |
| Guest email collection | ❌ | Medium — marketing list for couple |
| Social wall display | ❌ | High — venue engagement |
| Photo voting / contests | ❌ | Medium — guest interaction |

---

## Retention Opportunities

| Opportunity | Status |
|-------------|--------|
| Post-event gallery link | ✅ Gallery with expiry |
| Email "your photos are ready" | ❌ No email worker |
| Anniversary reminders | ❌ |
| Operator re-booking (CRM) | ❌ |
| Multi-event operator accounts | ❌ |
| Usage analytics for operators | ⚠️ Basic stats only |

---

## Missing Monetization Infrastructure

| Component | Status |
|-----------|--------|
| Stripe integration | ❌ |
| Subscription tiers | ❌ (names only: Starter/Pro/Studio/Enterprise) |
| Invoicing | ❌ |
| Usage metering | ❌ |
| Pricing page | ❌ |
| Trial / freemium | ❌ |
| Payment in guest flow | ❌ |

---

## Competitive Analysis

### Named Competitors (Inferred from Feature Set)

| Competitor | Type | Strengths vs Us | Our Strengths vs Them |
|------------|------|-----------------|----------------------|
| **Breeze Systems (DSLR Remote Pro)** | Professional tethered booth | Mature, DSLR quality, green screen | Offline-first, cloud gallery, modern UI |
| **Snappic** | iPad wedding booth SaaS | Polished UX, social sharing, analytics | Android kiosk lock, open-source control, custom themes |
| **Simple Booth** | Event photo sharing app | Simple guest flow, strong sharing | Full kiosk mode, print integration, operator dashboard |
| **LumaBooth** | iPad photobooth | GIF/boomerang, templates, printing | Cloud backend, retention, gallery tokens |
| **Photobot (UK)** | Physical booth rental | Hardware + software bundle | Software-only, lower capex |
| **Custom WordPress + WooCommerce booths** | DIY | Cheap, flexible | Professional architecture, offline resilience |

### Comparison Matrix

| Dimension | Wedding Photobooth | Snappic | LumaBooth | Simple Booth |
|-----------|-------------------|---------|-----------|--------------|
| Product quality | 6/10 | 8/10 | 8/10 | 7/10 |
| User experience | 6/10 | 9/10 | 8/10 | 7/10 |
| Feature set | 6/10 | 9/10 | 8/10 | 6/10 |
| Design quality | 6/10 | 8/10 | 8/10 | 6/10 |
| Offline capability | **9/10** | 5/10 | 6/10 | 4/10 |
| Open architecture | **9/10** | 3/10 | 3/10 | 3/10 |
| Scalability | 5/10 | 8/10 | 7/10 | 6/10 |
| Kiosk lockdown | **8/10** | 7/10 | 7/10 | 2/10 |
| Pricing/monetization | 0/10 | 8/10 | 7/10 | 6/10 |

### Competitive Gaps (Where We Lose)

1. **Polish** — Competitors have years of UX refinement; our admin is thin, kiosk is generic Material3
2. **Template library** — Single postcard template vs hundreds of overlays
3. **Social integrations** — No Instagram/Facebook direct post; intent-only sharing
4. **Analytics** — No charts, funnels, or per-event insights
5. **Self-serve onboarding** — Competitors offer signup → configure → deploy; we require developer setup
6. **Payment** — Competitors charge subscriptions; we have no billing
7. **Green screen / AI backgrounds** — Background segmentation is stub only
8. **Support / documentation** — Operator guides missing

### Competitive Advantages (Where We Win)

1. **Offline-first architecture** — QR works without cloud; competitors often cloud-dependent
2. **Open modular codebase** — Customizable per client/region (Kerala traditional theme)
3. **Signed local QR URLs** — Security-conscious LAN sharing
4. **Full-stack ownership** — Backend + kiosk + admin + print host in one repo
5. **Kiosk lock task** — Device Owner mode for venue security
6. **Retention/GDPR sweep** — Automated PII cleanup (competitors often overlook)

---

## Market Positioning Recommendation

**Short-term:** Position as *"Premium wedding photobooth platform for operators who need offline reliability and full technical control"* — niche, high-touch, attendant-present.

**Medium-term:** Evolve to *"Self-serve wedding photobooth SaaS"* after fixing security, tests, onboarding, and adding Stripe.

**Differentiator to emphasize:** *"Works when the venue Wi-Fi doesn't."*

---

## Business Readiness Score

| Dimension | Score |
|-----------|-------|
| Product-market fit (wedding vertical) | 6/10 |
| Monetization readiness | 1/10 |
| Go-to-market materials | 2/10 |
| Operator onboarding | 3/10 |
| Competitive positioning | 4/10 |
| Scalability for growth | 5/10 |
| **Overall business readiness** | **35/100** |
