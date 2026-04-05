# Sprint 4 Plan — Polish + Launch

## Sprint Goal
Optimize performance (Core Web Vitals), add PWA support for offline/install, integrate analytics, prepare for production deployment on Vercel + Railway, and build a polished landing page with SEO optimization.

## Sprint Metadata
| Parameter | Value |
|-----------|-------|
| Sprint number | 4 of 4 |
| Duration | 7 days (simulated) |
| Capacity | 4 agents |
| Sprint start | 2026-04-05 |
| Sprint end | 2026-04-05 |

## Stories

### S-4-01: Core Web Vitals Performance Optimization
**Owner:** performance-engineer
**Points:** 5
**Goal:** Achieve "Good" scores on all Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)

**Subtasks:**
- [ ] Audit current performance with Lighthouse
- [ ] Optimize LCP: image preloading, critical CSS inlining
- [ ] Optimize FID: code splitting, lazy loading, reduce main thread blocking
- [ ] Optimize CLS: reserve space for dynamic content, font loading optimization
- [ ] Add performance monitoring hooks
- [ ] Write tests for performance budget thresholds
- [ ] Document performance optimization decisions

**Deliverables:**
- Performance audit report
- Optimized bundle with code splitting
- Performance monitoring hooks
- Lighthouse score baseline documentation

---

### S-4-02: PWA Support (Offline + Install Prompt)
**Owner:** frontend-developer
**Points:** 5
**Goal:** Convert HumDuel to a Progressive Web App with offline support and install prompt

**Subtasks:**
- [ ] Create manifest.json with app icons and metadata
- [ ] Implement service worker for offline caching
- [ ] Add install prompt UI with "Add to Home Screen" flow
- [ ] Cache strategies: network-first for API, cache-first for assets
- [ ] Offline fallback page for network failures
- [ ] Background sync for pending challenges (when back online)
- [ ] Write tests for service worker registration
- [ ] Document PWA features and caching strategy

**Deliverables:**
- PWA manifest with icons
- Service worker with caching strategies
- Install prompt UI component
- Offline fallback page

---

### S-4-03: Analytics Integration
**Owner:** devops-engineer
**Points:** 4
**Goal:** Integrate privacy-aware analytics to track user engagement and game metrics

**Subtasks:**
- [ ] Choose analytics solution (Plausible/Umami for privacy-first)
- [ ] Create analytics service abstraction layer
- [ ] Track key events: game starts, guesses, wins, shares, daily plays
- [ ] Track performance metrics: page load, recording duration
- [ ] Add opt-out mechanism for privacy compliance
- [ ] Create analytics dashboard configuration
- [ ] Write tests for analytics event tracking
- [ ] Document analytics schema and events

**Deliverables:**
- Analytics service with abstraction layer
- Event tracking for all key user actions
- Privacy-compliant configuration
- Analytics documentation

---

### S-4-04: Production Deployment
**Owner:** devops-engineer
**Points:** 5
**Goal:** Deploy HumDuel to production on Vercel (client) + Railway (server)

**Subtasks:**
- [ ] Create Vercel configuration for client deployment
- [ ] Create Railway configuration for server deployment
- [ ] Set up environment variables in production
- [ ] Configure custom domain (if applicable)
- [ ] Set up CI/CD pipeline for automated deployments
- [ ] Configure health checks and monitoring
- [ ] Create deployment runbook
- [ ] Test production deployment end-to-end
- [ ] Document deployment architecture

**Deliverables:**
- Vercel + Railway deployment configs
- CI/CD pipeline (GitHub Actions)
- Health check endpoints
- Deployment runbook

---

### S-4-05: Landing Page + SEO Optimization
**Owner:** react-specialist
**Points:** 5
**Goal:** Create an engaging landing page and optimize for search engines

**Subtasks:**
- [ ] Design and implement landing page hero section
- [ ] Add feature highlights with animated previews
- [ ] Create "How to Play" section with visual guide
- [ ] Add social proof section (stats, testimonials placeholder)
- [ ] Implement SEO meta tags (Open Graph, Twitter Cards)
- [ ] Add structured data (JSON-LD) for search engines
- [ ] Create sitemap.xml and robots.txt
- [ ] Optimize page titles and descriptions
- [ ] Write tests for landing page components
- [ ] Document SEO strategy

**Deliverables:**
- Polished landing page with hero, features, how-to-play
- SEO meta tags and structured data
- Sitemap.xml and robots.txt
- Open Graph preview images

---

## Agent Assignments

| Agent | Stories | Model | Capacity |
|-------|---------|-------|----------|
| performance-engineer | S-4-01 | sonnet | 1 story |
| frontend-developer | S-4-02 | sonnet | 1 story |
| devops-engineer | S-4-03, S-4-04 | sonnet | 2 stories |
| react-specialist | S-4-05 | sonnet | 1 story |

## Velocity Estimate
- **Total story points:** 24
- **Expected velocity:** 24 (based on Sprint 1-3 trend)

## Dependencies
- S-4-01 (performance) → can run in parallel with others
- S-4-02 (PWA) → benefits from S-4-01 optimizations
- S-4-03 (analytics) → independent
- S-4-04 (deployment) → depends on S-4-01, S-4-02, S-4-05 being complete
- S-4-05 (landing) → can run in parallel

## Definition of Done
- [ ] All subtasks completed
- [ ] Code compiles without errors
- [ ] Unit tests written and passing (100% pass rate)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Integrated with existing codebase
- [ ] Conventional commit messages used

## Sprint Planning Outcome
**Status:** Approved
**Total Stories:** 5
**Total Points:** 24
**Agents Assigned:** 4
