# N26 Design Process Skill

A Claude Code plugin that creates the full Jira ticket hierarchy for an N26 design initiative — using the Design Process (D2D) framework — directly from Claude chat.

No website, no manual ticket creation. Tell Claude you're starting a new project and it handles the rest: asks 3 diagnostic questions, shows a reviewable task list, collects project info, then creates Initiatives → Epics → Stories → Sub-tasks in the right Jira board.

## Setup

### 1. Set up Jira credentials (required — do this first)

The skill needs your Jira credentials to create tickets. Without them it won't work.

Open your shell profile (`~/.zshrc` or `~/.bash_profile`) and add these two lines:

```bash
export JIRA_EMAIL=your.email@n26.com
export JIRA_API_TOKEN=your-api-token-here
```

Get your API token here (takes 30 seconds): https://id.atlassian.com/manage-profile/security/api-tokens

Then reload your shell so the changes take effect:
```bash
source ~/.zshrc
```

You only need to do this once. The credentials stay on your machine and are never shared.

### 2. Install the plugin

In Claude Code, run these three commands:

```
/plugin marketplace add merygraziani/n26-design-process-skill
/plugin install design-process-creator@n26-design-process-skill
/reload-plugins
```

### 3. Use it

Either type the skill directly:
```
/design-process-creator:create
```

Or just describe what you need — Claude will recognise when to use this skill automatically based on context (e.g. "I'm starting a new project, can you create the design process tickets?").

---

## What it creates

Based on the D2D project type, it creates:

| Type | Tasks | Starts from |
|------|-------|-------------|
| **Simple** | 6 | Implementation (solution decided) |
| **Complicated** | 11 | Solution (problem clear) |
| **Complex** | 22 | Discovery (full research needed) |

Ticket hierarchy:
```
[Initiative] CIAM-123 (existing, user-provided)
└── [Initiative] Project Name Post Launch (created)
    ├── [Epic] Discovery
    │   ├── [Story] Problem & Opportunity
    │   │   └── [Sub-task] Discovery
    │   │   └── [Sub-task] Competitor Analysis
    │   │   └── ...
    │   └── [Story] Solution
    │       └── [Sub-task] Solution Wireframes
    │       └── ...
    ├── [Epic] Delivery
    │   └── [Story] Build
    │       └── [Sub-task] Design QA
    │       └── ...
    └── [Epic] Post Launch
        ├── [Story] Measure
        │   └── [Sub-task] Data Tracking / Monitoring
        │   └── ...
        └── [Story] Iterations (always created, empty)
```

Tickets always go to the board matching the initiative key (e.g. `CIAM-123` → `CIAM` board).

---

## Editing tasks before creation

After the task list is displayed, you can adjust it before anything is created:

- `remove 3 7` — skip tasks 3 and 7
- `edit 4 Wireframes v2` — rename task 4
- `done` — proceed with current list

---

## Troubleshooting

**"JIRA_EMAIL is not set"** — Add the env vars to your shell profile and run `source ~/.zshrc`.

**"Could not find initiative CIAM-123"** — Check that the issue key exists in Jira and you have access to that board.

**"Could not find a Jira user matching designer..."** — The email must exactly match a Jira account. Check in Jira's user directory.

---

## Updating

When there's a new version:
```
/plugin marketplace update design-process-creator
/reload-plugins
```
