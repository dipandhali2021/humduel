# HumDuel — Stitch MCP Project Reference

**Date:** 2026-04-04
**Author:** pdlc-orchestrator

---

## Project Information

| Property | Value |
|----------|-------|
| **Project Name** | HumDuel — Social Melody Guessing Game |
| **Project ID** | `15759218275488447742` |
| **Project Resource** | `projects/15759218275488447742` |
| **Created** | 2026-04-04T16:06:01Z |
| **Type** | PROJECT_DESIGN |
| **Visibility** | PRIVATE |
| **Origin** | STITCH |

---

## Design System

| Property | Value |
|----------|-------|
| **Asset ID** | `2159400510209959013` |
| **Asset Resource** | `assets/2159400510209959013` |
| **Display Name** | HumDuel Design System |
| **Version** | 1 |

### Theme Configuration

```json
{
  "colorMode": "DARK",
  "colorVariant": "VIBRANT",
  "headlineFont": "SPACE_GROTESK",
  "bodyFont": "INTER",
  "labelFont": "DM_SANS",
  "roundness": "ROUND_TWELVE",
  "customColor": "#7C3AED",
  "overridePrimaryColor": "#7C3AED",
  "overrideSecondaryColor": "#3B82F6",
  "overrideTertiaryColor": "#EC4899",
  "overrideNeutralColor": "#1E1B2E"
}
```

---

## Generated Screens

| # | Screen | Screen ID | Status |
|---|--------|-----------|--------|
| 1 | Home / Landing | `78278a8c5a0a49c3abe0a4975f5acffb` | Complete |
| 2 | Recording | `802aea5f7e084e3f984e022a85038d69` | Complete |
| 3 | Challenge / Guessing | `10abf42e78cf4f34a1f8c87f3c92fea5` | Complete |
| 4 | Result / Share | `ab60a26cd16944de93e04bf0e5d8c840` | Complete |
| 5 | Daily Challenge + Leaderboard | — | Planned (Sprint 2) |
| 6 | Profile / Stats | — | Planned (Sprint 3) |

### Screen Resource URLs

```
projects/15759218275488447742/screens/78278a8c5a0a49c3abe0a4975f5acffb  # Home
projects/15759218275488447742/screens/802aea5f7e084e3f984e022a85038d69  # Recording
projects/15759218275488447742/screens/10abf42e78cf4f34a1f8c87f3c92fea5  # Challenge
projects/15759218275488447742/screens/ab60a26cd16944de93e04bf0e5d8c840  # Result
```

### HTML Code Downloads

Each screen has a downloadable HTML file that serves as a pixel-perfect reference:

| Screen | HTML File Resource |
|--------|-------------------|
| Home | `projects/15759218275488447742/files/5158d4f7bc59437c98eaea6275f82593` |
| Recording | `projects/15759218275488447742/files/fc74d2a3d4084e7f89e6e306d25a05d0` |
| Challenge | `projects/15759218275488447742/files/da7ab83fa89c43a79d2dce1bef911801` |
| Result | `projects/15759218275488447742/files/166cdb29f6bc4188b03741e3e2886635` |

---

## Stitch Tools Used

| Tool | Purpose | When |
|------|---------|------|
| `create_project` | Created project container | Design phase init |
| `create_design_system` | Defined color palette, fonts, tokens | Design phase |
| `update_design_system` | Applied design system to project | Design phase |
| `generate_screen_from_text` | Generated screen mockups from prompts | Design phase |
| `get_screen` | Retrieved screen details and assets | Design phase |
| `get_project` | Verified project state and thumbnail | Design phase |

## Tools Available for Development Phase

| Tool | Purpose | When |
|------|---------|------|
| `edit_screens` | Iterate on screen designs | Sprint revisions |
| `generate_variants` | Create A/B test variants | Feature testing |
| `apply_design_system` | Apply updated tokens to screens | Design system changes |
| `react-components` | Generate React code from screens | Sprint development |
| `shadcn-ui` | Integrate shadcn/ui components | Sprint development |

---

## How to Access in Future Sessions

To retrieve this project in a new Claude Code session:

```
# List all projects
mcp__stitch__list_projects()

# Get project details
mcp__stitch__get_project(name="projects/15759218275488447742")

# List screens
mcp__stitch__list_screens(projectId="15759218275488447742")

# Get specific screen
mcp__stitch__get_screen(
  name="projects/15759218275488447742/screens/{screenId}",
  projectId="15759218275488447742",
  screenId="{screenId}"
)
```
