---
description: Create Jira tickets for a new design initiative using the N26 Design Process framework. Use when the user says "create process tickets", "set up design process", "create design tickets", "kick off a new project with Jira tickets", or mentions starting a new design project and needing Jira tasks created.
argument-hint: "[optional: initiative link e.g. CIAM-123]"
allowed-tools: [AskUserQuestion, Bash, Read, Write]
---

# Design Process Creator

Create the full Jira ticket hierarchy for a design initiative — from the N26 Design Process framework — without opening any website.

**Script:** `$CLAUDE_PLUGIN_ROOT/scripts/create-tickets.mjs`
**Task data:** `$CLAUDE_PLUGIN_ROOT/references/tasks.json`

---

## Phase 1 — Determine Project Type

First, use `AskUserQuestion` to ask:

```
Question: "Do you know which project type this is?"
Options:
  - "Yes — Simple (solution already decided)"
  - "Yes — Complicated (problem is clear, need to define solution)"
  - "Yes — Complex (need full discovery)"
  - "Not sure — help me figure it out"
```

**If they pick a known type** → use it directly, skip to Phase 2.

**If they pick "Not sure"** → ask the 3 diagnostic questions in one `AskUserQuestion` call:

```
Question 1: "Is the problem space well understood?"
Options:
  - "No — we need to discover" (We don't have a clear problem statement yet)
  - "Yes — problem is clear" (We know the problem, ready to ideate)
  - "Solution is already decided" (Regulatory, tech-driven, or leadership directive)

Question 2: "Do you have existing user research or data for this topic?"
Options:
  - "Yes — research exists" (Studies, data, or previous insights available)
  - "Partially" (Some data exists but gaps remain)
  - "No — starting from scratch" (No relevant research available)

Question 3: "Is this a regulatory or tech-driven initiative?"
Options:
  - "Yes" (Requirements largely fixed by external constraints)
  - "No" (We have full design freedom)
```

**Determine D2D type from answers:**
- Q1 = "Solution is already decided" → **Simple**
- Q1 = "Yes — problem is clear" → **Complicated**
- Q1 = "No — we need to discover" → **Complex**

---

## Phase 2 — Present Task List for Review

Display the task list for the detected project type. Show a clear header, then tasks grouped by epic and story. Number every task sequentially so the user can reference them.

**Use this exact display format:**

```
─────────────────────────────────────────────────────
  DESIGN PROCESS — [TYPE] PROJECT
  [N] tasks total · [R] required · [O] optional
─────────────────────────────────────────────────────

### Discovery Epic

**Problem & Opportunity**
  1. Discovery                                   Designer          required
  2. Product Requirement Share-out               PM → Designer     required
  ...

**Solution**
  14. Solution Wireframes                        Designer          required
  ...

### Delivery Epic

**Build**
  17. Design QA                                  Designer          required
  ...

### Post Launch Epic

**Measure**
  21. Data Tracking / Monitoring                 Designer + PM     required
  22. Continuous Discovery                       Designer + CS     required

─────────────────────────────────────────────────────
To edit: type  remove 3 7               to skip tasks by number
               edit task 4 New title    to rename a task
               add task New task title  to add a custom task at the end
               done                     when you're happy
─────────────────────────────────────────────────────
```

### Task lists by project type

#### COMPLEX (all 22 tasks — starts from discovery)

**Discovery Epic — Problem & Opportunity story**
1.  id: `discovery`               · Discovery                                · Designer                · required
2.  id: `product-requirement-shareout` · Product Requirement Share-out       · PM → Designer           · required
3.  id: `competitor-analysis`     · Competitor Analysis                      · Designer                · required
4.  id: `desktop-research`        · Desktop Research & Analysis              · Designer                · required
5.  id: `users-jobs-definition`   · Users & Jobs to Be Done Definition       · Designer + PM           · required
6.  id: `journey-mapping`         · Journey Mapping                          · Designer                · required
7.  id: `qualitative-data-analysis` · Qualitative Data Analysis              · Designer                · required
8.  id: `quantitative-data-analysis` · Quantitative Data Analysis            · Designer + Data Analyst · required
9.  id: `request-quantitative-data` · Request Quantitative Data              · Designer                · **optional**
10. id: `user-research`           · User Research                            · Designer + UX Researcher· **optional**
11. id: `user-research-analysis`  · User Research Analysis                   · Designer                · **optional**
12. id: `kickoff-session`         · Kick-off Session                         · Designer + PM           · required
13. id: `cs-quality-analysis`     · Customer Support Quality Analysis        · Designer + CS           · required

**Discovery Epic — Solution story**
14. id: `solution-wireframes`     · Solution Wireframes                      · Designer                · required
15. id: `high-fidelity-ui`        · High-Fidelity UI                         · Designer                · required
16. id: `implementation-phases-scope` · Implementation Phases Scope-down     · Designer + PM + Eng     · required

**Delivery Epic — Build story**
17. id: `design-qa`               · Design QA                                · Designer                · required
18. id: `tracking-documentation`  · Tracking Documentation                   · Designer + PM + Data    · required
19. id: `translation-request`     · Translation Request                      · Designer + Content      · required
20. id: `pre-launch-usability`    · Pre-launch Usability F&F or Internal Testing · Designer            · required

**Post Launch Epic — Measure story**
21. id: `data-tracking-monitoring` · Data Tracking / Monitoring              · Designer + PM + Data    · required
22. id: `continuous-discovery`    · Continuous Discovery                     · Designer + CS           · required

#### COMPLICATED (11 tasks — starts from solution, 2 discovery tasks carried over)

**Discovery Epic — Problem & Opportunity story** (carried over)
1.  id: `product-requirement-shareout` · Product Requirement Share-out       · PM → Designer           · required
2.  id: `kickoff-session`         · Kick-off Session                         · Designer + PM           · required

**Discovery Epic — Solution story**
3.  id: `solution-wireframes`     · Solution Wireframes                      · Designer                · required
4.  id: `high-fidelity-ui`        · High-Fidelity UI                         · Designer                · required
5.  id: `implementation-phases-scope` · Implementation Phases Scope-down     · Designer + PM + Eng     · required

**Delivery Epic — Build story**
6.  id: `design-qa`               · Design QA                                · Designer                · required
7.  id: `tracking-documentation`  · Tracking Documentation                   · Designer + PM + Data    · required
8.  id: `translation-request`     · Translation Request                      · Designer + Content      · required
9.  id: `pre-launch-usability`    · Pre-launch Usability F&F or Internal Testing · Designer            · required

**Post Launch Epic — Measure story**
10. id: `data-tracking-monitoring` · Data Tracking / Monitoring              · Designer + PM + Data    · required
11. id: `continuous-discovery`    · Continuous Discovery                     · Designer + CS           · required

#### SIMPLE (6 tasks — solution already decided, starts from implementation)

**Delivery Epic — Build story**
1.  id: `design-qa`               · Design QA                                · Designer                · required
2.  id: `tracking-documentation`  · Tracking Documentation                   · Designer + PM + Data    · required
3.  id: `translation-request`     · Translation Request                      · Designer + Content      · required
4.  id: `pre-launch-usability`    · Pre-launch Usability F&F or Internal Testing · Designer            · required

**Post Launch Epic — Measure story**
5.  id: `data-tracking-monitoring` · Data Tracking / Monitoring              · Designer + PM + Data    · required
6.  id: `continuous-discovery`    · Continuous Discovery                     · Designer + CS           · required

---

## Phase 3 — Edit Loop

After displaying the task list, wait for user input.

- If they type `done` or say they're happy → proceed to Phase 4.
- If they type `remove 3 7` → remove those tasks from the working list, show updated list, wait again.
- If they type `edit task 4 New title` → rename task 4's `jiraTemplate.summary` and `title` to the new text. Renumber and show updated list. Wait again.
- If they type `add task New task title` → append a custom task at the end of the working list. Assign it a temporary id `custom-1`, `custom-2`, etc. (incrementing). Set `title` and `jiraTemplate.summary` to the provided text. Mark it as `required`. Show updated list, wait again.
- If they make multiple edits in one message (e.g. "remove 9 10 11 and edit task 14 to Wireframes v2") → apply all changes, show updated list.
- Keep the renumbering consistent: always re-number from 1 after any removal or addition.
- When showing an updated list, only show the diff summary ("Added: New task title" / "Removed: ...") and the updated full list.

---

## Phase 4 — Collect Project Info

Collect project info in three sequential steps. Wait for a reply after each before moving on.

**Step 1 — Project details:**
```
What's the project about?

Project name (required): 
Problem statement: 
Markets (ALL, DEU, FRA, ES, ITA, ROE): 
Targeted users: 
```

**Step 2 — Ownership:**
```
Who's responsible for the project?

Designer email (required): 
PM email: 
```

**Step 3 — Jira link:**
```
Jira initiative link (required): 

This is needed to create the tickets — all tasks will be created under this initiative. If you don't have it, ask your PM.
```

If any required field is missing after its step, ask for just that field before continuing. Don't repeat the full form.

---

## Phase 5 — Confirm & Create

Show a compact summary:

```
─────────────────────────────────────────────────────
  Ready to create [N] tickets
─────────────────────────────────────────────────────
  Project:    [name]
  Initiative: [CIAM-123]
  Board:      [project key extracted from initiative, e.g. CIAM]
  Designer:   [email or —]
  PM:         [email or —]
  
  Epics:      Discovery · Delivery · Post Launch
  Stories:    [list of story names]
  Sub-tasks:  [N] tasks
─────────────────────────────────────────────────────
  Type  go  to create tickets, or  cancel  to abort.
─────────────────────────────────────────────────────
```

Wait for "go" or confirmation. If they say cancel or no, stop. Don't create anything without explicit confirmation.

---

## Phase 6 — Run Script

**Check credentials first:** Run the following to source the user's shell profile and check for the env var:

```bash
source ~/.zshrc 2>/dev/null || source ~/.bash_profile 2>/dev/null || true
echo "${JIRA_EMAIL:-NOT_SET}"
```

If it prints `NOT_SET`, tell the user:
```
JIRA_EMAIL is not set. Add these to your shell profile (~/.zshrc or ~/.bash_profile) and reload:

  export JIRA_EMAIL=your.email@n26.com
  export JIRA_API_TOKEN=your-api-token

Get your API token at: https://id.atlassian.com/manage-profile/security/api-tokens
```
Then stop — do not proceed to ticket creation.

Build the full task objects from the working task list. Read `$CLAUDE_PLUGIN_ROOT/references/tasks.json` to get the full `what`, `outcome`, `acceptanceCriteria`, `subTasks`, and `jiraTemplate` for each task. Match by `id`. Apply any title edits the user made to `jiraTemplate.summary` and `title`.

For custom tasks (id starts with `custom-`), do not look up tasks.json. Instead construct the task object inline, inheriting `phase` and `state` from the task immediately before it in the list (or defaulting to `"delivery"` / `"build"` if it's the first task). Use this shape:

```json
{
  "id": "custom-1",
  "title": "...",
  "phase": "<inherited>",
  "state": "<inherited>",
  "owner": "Designer",
  "what": "...",
  "outcome": "",
  "acceptanceCriteria": [],
  "subTasks": [],
  "optional": false,
  "jiraTemplate": { "summary": "...", "labels": [] }
}
```

Write the input JSON to `/tmp/design-process-input.json`:

```json
{
  "tasks": [...],
  "projectInfo": {
    "projectName": "...",
    "problemStatement": "...",
    "markets": ["DEU"],
    "targetedUsers": "...",
    "designers": "designer@n26.com",
    "pm": "pm@n26.com"
  },
  "initiativeLink": "CIAM-123"
}
```

Then run:

```bash
source ~/.zshrc 2>/dev/null || source ~/.bash_profile 2>/dev/null || true
node "$CLAUDE_PLUGIN_ROOT/scripts/create-tickets.mjs" < /tmp/design-process-input.json
```

Show a "Creating tickets..." message while the script runs. This takes 30–60 seconds.

---

## Phase 7 — Display Results

Parse the script's JSON output. Display results like this:

```
─────────────────────────────────────────────────────
  Done! [N] tickets created in [BOARD]
─────────────────────────────────────────────────────

### Discovery Epic
**Problem & Opportunity**
  CIAM-234  Discovery               https://number26-jira.atlassian.net/browse/CIAM-234
  CIAM-235  Product Req Share-out   https://number26-jira.atlassian.net/browse/CIAM-235
  ...

### Delivery Epic
**Build**
  CIAM-248  Design QA               https://number26-jira.atlassian.net/browse/CIAM-248
  ...

─────────────────────────────────────────────────────
```

If there were any errors, list them clearly at the end:
```
⚠ Failed to create [N] ticket(s):
  - Translation Request: [error message]
```

If the script returned a top-level `error`, show it clearly and suggest the user check their `JIRA_EMAIL`/`JIRA_API_TOKEN` env vars or Jira permissions.

---

## Rules

- Never create tickets without explicit "go" confirmation in Phase 5.
- If the script fails, show the error and do NOT retry automatically.
- Keep the numbered task list in memory across the entire session — re-number after every removal.
- The task list shown to the user must always match exactly what gets sent to the script.
- Preserve the `phase` and `state` fields unchanged when editing task titles — only the display name and `jiraTemplate.summary` change.
