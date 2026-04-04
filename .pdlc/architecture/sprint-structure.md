# HumDuel — Sprint Structure

## Sprint Cadence

| Parameter | Value |
|-----------|-------|
| Sprint duration | 7 days |
| Total sprints | 4 |
| Sprint capacity | 4 development agents |
| Velocity target | 19-23 story points/sprint |
| Utilization | 75% (25% buffer for blockers, reviews, integration) |

## 7-Day Sprint Schedule

| Day | Activity | Output |
|-----|----------|--------|
| Monday | Sprint Planning Meeting | `sprints/sprint-N/plan.md`, `meetings/sprint-planning.md` |
| Tuesday | Day 1 — Standup + development | Subtask commits, standup log |
| Wednesday | Day 2 — Standup + development | Subtask commits, standup log |
| Thursday | Day 3 — Standup + development | Subtask commits, standup log |
| Friday | Day 4 — Standup + development | Subtask commits, standup log |
| Saturday | Day 5 — Standup + development | Subtask commits, standup log |
| Sunday AM | Day 6 — Final subtasks + bug fixes | Final commits |
| Sunday PM | Integration + Sprint Review + Retro | `results.md`, `meetings/sprint-review.md`, `meetings/retro.md` |

## Ceremonies

### Sprint Planning (Monday)
- **Facilitator:** scrum-master
- **Participants:** product-manager, all assigned development agents
- **Duration:** ~60 min simulated
- **Output:** Finalized sprint plan with story assignments, estimates, subtask breakdowns

### Daily Standup (Tue-Sun)
- **Facilitator:** scrum-master
- **Format:** 3 questions per agent: yesterday, today, blockers
- **Tracking:** Subtasks done/total per story
- **Output:** Appended to `meetings/standups.md`

### Sprint Review (Sunday PM)
- **Facilitator:** scrum-master
- **Participants:** product-manager, all sprint agents, simulated user personas
- **Activities:** Demo completed stories, PM evaluation, user persona feedback
- **Output:** `meetings/sprint-review.md`, `user-feedback.md`

### Sprint Retrospective (Sunday PM)
- **Facilitator:** scrum-master
- **Format:** What went well / What needs improvement / Action items
- **Output:** `meetings/retro.md`

## Definition of Done (per story)

- [ ] Code written, compiles, and runs
- [ ] Unit tests written and passing
- [ ] Code reviewed by code-reviewer agent
- [ ] Documentation updated
- [ ] No critical security issues
- [ ] Integrated with existing codebase
- [ ] Committed with conventional commit messages

## Agent Assignments by Sprint

### Sprint 1: Core Audio Engine
| Agent | Stories | Model |
|-------|---------|-------|
| devops-engineer | S-1-01 (scaffolding + CI/CD) | sonnet |
| frontend-developer | S-1-02 (hum recording) | sonnet |
| react-specialist | S-1-03 (waveform viz), S-1-04 (playback) | sonnet |
| ui-designer | S-1-05 (layout + landing) | sonnet |

### Sprint 2: Social Challenge Loop
| Agent | Stories | Model |
|-------|---------|-------|
| backend-developer | S-2-01 (challenge API) | sonnet |
| react-specialist | S-2-02 (guessing UI) | sonnet |
| frontend-developer | S-2-03 (shareable links + OG cards) | sonnet |
| fullstack-developer | S-2-04 (result screen), S-2-05 (integration) | sonnet |

### Sprint 3: Daily Game + Community
| Agent | Stories | Model |
|-------|---------|-------|
| backend-developer | S-3-01 (daily challenge), S-3-04 (Spotify API) | sonnet |
| react-specialist | S-3-02 (leaderboard) | sonnet |
| fullstack-developer | S-3-03 (user accounts) | sonnet |
| frontend-developer | S-3-05 (stats tracking) | sonnet |

### Sprint 4: Polish + Launch
| Agent | Stories | Model |
|-------|---------|-------|
| performance-engineer | S-4-01 (Core Web Vitals) | sonnet |
| frontend-developer | S-4-02 (PWA) | sonnet |
| devops-engineer | S-4-03 (analytics), S-4-04 (production deploy) | sonnet |
| react-specialist | S-4-05 (landing + SEO) | sonnet |
