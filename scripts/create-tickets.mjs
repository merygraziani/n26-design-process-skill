#!/usr/bin/env node
/**
 * Standalone Jira ticket creator for the Design Process Creator.
 * Reads JSON from stdin, creates the full ticket hierarchy, outputs JSON to stdout.
 *
 * Input (stdin):
 *   { tasks: Task[], projectInfo: ProjectInfo, initiativeLink: string }
 *
 * Output (stdout):
 *   { results: CreatedTicket[], errors: TicketError[], epics: {}, stories: {} }
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

function loadEnv() {
  try {
    const content = readFileSync(join(PROJECT_ROOT, ".env.local"), "utf-8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

const CLOUD_ID = "88ee171b-941c-4f1e-a762-25e49b508245";
const BASE_URL = `https://api.atlassian.com/ex/jira/${CLOUD_ID}/rest/api/3`;

// ─── Jira helpers ─────────────────────────────────────────────────────────────

async function createIssue(payload, auth) {
  const res = await fetch(`${BASE_URL}/issue`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.errorMessages?.[0] ?? `HTTP ${res.status}` };
  }
  const data = await res.json();
  return { key: data.key, id: data.id };
}

async function lookupIssueId(key, auth) {
  const res = await fetch(`${BASE_URL}/issue/${key}?fields=id`, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id ?? null;
}

async function lookupAccountId(email, auth) {
  const res = await fetch(
    `${BASE_URL}/user/search?query=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Basic ${auth}`, Accept: "application/json" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const exact = data.find((u) => u.emailAddress === email);
  return (exact ?? data[0]).accountId ?? null;
}

async function linkIssues(inwardId, outwardId, auth) {
  await fetch(`${BASE_URL}/issueLink`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      type: { name: "Relates" },
      inwardIssue: { id: inwardId },
      outwardIssue: { id: outwardId },
    }),
  });
}

function parseIssueKey(input) {
  const trimmed = input.trim();
  if (/^[A-Z]+-\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/\/([A-Z]+-\d+)(?:[/?#]|$)/);
  return match ? match[1] : null;
}

// ─── ADF builders ─────────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).substring(2, 18);
}

function adfBulletList(items) {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [{ type: "paragraph", content: [{ type: "text", text: item }] }],
    })),
  };
}

const STORY_WHAT_WE_DO = {
  "Problem & Opportunity": [
    "Kick start: We create the team, its rules & rituals (if applicable). We understand the project brief and challenges. We get to know our stakeholders and their concern. We define OKRs and Objectives. We define the type of the project (simple, complex, complicated) to understand where we need to start the process.",
    "Understand: We define clear research goals that can be achieved within our timelines. We review past research findings (if applicable). We review CS data (if applicable). We review data analytics (if applicable). We decide which method we will use for research depending on the necessity of the problem/opportunity. We plan, coordinate and conduct the study(s). We look at both qualitative and quantitative data to make the unknown known.",
    "Define: We synthesise information into research findings that enable decisions. We prepare the research reports and share them with our stakeholders. We define the problem based on the research output. We create our HMW statements. We investigate the problem to conclude if it is Viable (Business Needs), Desirable (User Needs), Feasible (Tech Ability), and Compliant (Legal Needs).",
  ],
  Solution: [
    "Ideate: We reframe the challenge by revisiting the problem. We brainstorm a range of creative ideas that address the problem that we defined. We diverge solutions without judging the ideas. We mix and remix the ideas.",
    "Validate: We iteratively converge the alternative solutions. We evaluate the alternatives against parameters, matrices, etc. We identify the main validation points. Prototype, test and analyse. We refine the solution to ensure that it is: Viable (Business Needs), Desirable (User Needs), Feasible (Tech Ability), Compliant (Legal Needs).",
    "Refine: We align with stakeholders and have technical solution discovery. We decompose the solutions into epics, stories and tasks (each epic or story can have its own small process). We map out use cases and validations. We consider NXD compliance and localisation.",
  ],
  Build: [
    "We build the solution in sprints.",
    "We have QA tests (development and design).",
    "We build test automation.",
    "We have usability research in the company and with friends and family.",
    "We define tracking.",
    "We have A/B testing plans.",
    "We have a release plan.",
  ],
  Measure: [
    "We track the data to see how the solution performs.",
    "We analyse the A/B test results.",
  ],
  Iterations: [
    "We have usability researches & journey mapping to understand users' pain and gain points.",
    "We overview CS data report understanding users' pain points in the field.",
  ],
};

function buildEpicAdfDescription() {
  return { version: 1, type: "doc", content: [] };
}

function buildStoryAdfDescription(storyLabel) {
  const whatWeDo = STORY_WHAT_WE_DO[storyLabel] ?? [];
  return {
    version: 1,
    type: "doc",
    content:
      whatWeDo.length > 0
        ? [
            {
              type: "panel",
              attrs: { panelType: "note" },
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "What we do", marks: [{ type: "strong" }] },
                  ],
                },
                adfBulletList(whatWeDo),
              ],
            },
          ]
        : [],
  };
}

function buildSubTaskAdfDescription(task, contactEmail) {
  const infoContent = [
    ...(task.what
      ? [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "What: ", marks: [{ type: "strong" }] },
              { type: "text", text: task.what },
            ],
          },
        ]
      : []),
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Owner: ", marks: [{ type: "strong" }] },
        { type: "text", text: task.owner },
      ],
    },
    ...(task.outcome
      ? [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Outcome: ", marks: [{ type: "strong" }] },
              { type: "text", text: task.outcome },
            ],
          },
        ]
      : []),
  ];

  const successContent = [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Acceptance Criteria",
          marks: [{ type: "strong" }],
        },
      ],
    },
  ];
  if (task.acceptanceCriteria?.length) {
    successContent.push({
      type: "taskList",
      attrs: { localId: makeId() },
      content: task.acceptanceCriteria.map((c) => ({
        type: "taskItem",
        attrs: { localId: makeId(), state: "TODO" },
        content: [{ type: "text", text: c }],
      })),
    });
  }
  if (task.subTasks?.length) {
    successContent.push(
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Sub-tasks", marks: [{ type: "strong" }] },
        ],
      },
      {
        type: "taskList",
        attrs: { localId: makeId() },
        content: task.subTasks.map((st) => ({
          type: "taskItem",
          attrs: { localId: makeId(), state: "TODO" },
          content: [{ type: "text", text: st }],
        })),
      }
    );
  }

  return {
    version: 1,
    type: "doc",
    content: [
      { type: "panel", attrs: { panelType: "info" }, content: infoContent },
      {
        type: "panel",
        attrs: { panelType: "success" },
        content: successContent,
      },
      {
        type: "panel",
        attrs: { panelType: "note" },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Designs",
                marks: [{ type: "strong" }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Add Figma link" }],
          },
        ],
      },
      {
        type: "panel",
        attrs: { panelType: "warning" },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Tools",
                marks: [{ type: "strong" }],
              },
            ],
          },
          {
            type: "paragraph",
            content: contactEmail
              ? [
                  {
                    type: "text",
                    text: "There are no designated skills or tools for this task. If you have one, please contact ",
                  },
                  {
                    type: "text",
                    text: contactEmail,
                    marks: [
                      {
                        type: "link",
                        attrs: { href: `mailto:${contactEmail}` },
                      },
                    ],
                  },
                ]
              : [
                  {
                    type: "text",
                    text: "There are no designated skills or tools for this task.",
                  },
                ],
          },
        ],
      },
    ],
  };
}

// ─── Epic / story hierarchy config ────────────────────────────────────────────

const STATE_TO_EPIC = {
  "problem-opportunity": "discovery",
  solution: "discovery",
  implementation: "delivery",
};

const EPIC_LABELS = {
  discovery: "Discovery",
  delivery: "Delivery",
  "post-launch": "Post Launch",
};

const EPIC_ISSUE_TYPE = {
  discovery: "Discovery",
  delivery: "Epic",
  "post-launch": "Epic",
};

const STATE_STORY_LABEL = {
  "problem-opportunity": "Problem & Opportunity",
  solution: "Solution",
  implementation: "Build",
};

const PHASE_STORY_LABEL = {
  build: "Build",
  measure: "Measure",
  iterations: "Iterations",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv();
  const email = process.env.JIRA_EMAIL || env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN || env.JIRA_API_TOKEN;

  if (!email || !apiToken) {
    throw new Error(
      "Missing credentials. Set JIRA_EMAIL and JIRA_API_TOKEN in .env.local"
    );
  }

  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const input = JSON.parse(Buffer.concat(chunks).toString());

  const { tasks, projectInfo, initiativeLink } = input;
  const projectName = projectInfo?.projectName ?? "Design Project";

  if (!Array.isArray(tasks) || tasks.length === 0)
    throw new Error("No tasks provided");
  if (!initiativeLink?.trim()) throw new Error("Initiative link is required");

  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

  // Resolve initiative
  const initiativeKey = parseIssueKey(initiativeLink.trim());
  if (!initiativeKey)
    throw new Error("Could not parse an issue key from the initiative link");

  const projectKey = initiativeKey.split("-")[0];
  const initiativeId = await lookupIssueId(initiativeKey, auth);
  if (!initiativeId)
    throw new Error(`Could not find initiative ${initiativeKey} in Jira`);

  process.stderr.write(`Creating tickets in project ${projectKey}...\n`);

  // Post Launch initiative
  const postLaunchInitiative = await createIssue(
    {
      fields: {
        project: { key: projectKey },
        summary: `${projectName} Post Launch`,
        issuetype: { name: "Initiative" },
      },
    },
    auth
  );
  if ("error" in postLaunchInitiative)
    throw new Error(
      `Failed to create Post Launch initiative: ${postLaunchInitiative.error}`
    );
  const postLaunchInitiativeId = postLaunchInitiative.id;

  await linkIssues(initiativeId, postLaunchInitiativeId, auth);

  // People
  let assigneeAccountId = null;
  const designerEmail = projectInfo.designers?.split(",")[0]?.trim();
  if (designerEmail) {
    assigneeAccountId = await lookupAccountId(designerEmail, auth);
    if (!assigneeAccountId)
      throw new Error(
        `Could not find a Jira user matching designer "${designerEmail}"`
      );
  }

  let reporterAccountId = null;
  const pmEmail = projectInfo.pm?.trim();
  if (pmEmail) {
    reporterAccountId = await lookupAccountId(pmEmail, auth);
    if (!reporterAccountId)
      throw new Error(
        `Could not find a Jira user matching PM "${pmEmail}"`
      );
  }

  const peopleFields = {
    ...(assigneeAccountId ? { assignee: { accountId: assigneeAccountId } } : {}),
    ...(reporterAccountId ? { reporter: { accountId: reporterAccountId } } : {}),
  };

  // Determine needed epics
  const epicGroupsNeeded = [...new Set(tasks.map((t) => STATE_TO_EPIC[t.state]))];
  const epicIdByGroup = {};

  for (const epicGroup of epicGroupsNeeded) {
    const epicLabel = EPIC_LABELS[epicGroup];
    const parentId =
      epicGroup === "post-launch" ? postLaunchInitiativeId : initiativeId;
    const result = await createIssue(
      {
        fields: {
          project: { key: projectKey },
          summary: `[${projectName}] ${epicLabel}`,
          description: buildEpicAdfDescription(),
          issuetype: { name: EPIC_ISSUE_TYPE[epicGroup] },
          labels: [],
          ...(parentId ? { parent: { id: parentId } } : {}),
          ...peopleFields,
        },
      },
      auth
    );
    if ("error" in result)
      throw new Error(`Failed to create epic "${epicLabel}": ${result.error}`);
    epicIdByGroup[epicGroup] = result.id;
    process.stderr.write(`  Created epic: ${epicLabel} (${result.key})\n`);
  }

  // Story slots
  const storyKey = (state, phase) =>
    state === "implementation" ? `${state}::${phase}` : state;

  const storyIdByKey = {};
  const storySlots = [];
  const seen = new Set();

  for (const task of tasks) {
    let label, epicGroup, slotPhase;
    if (task.state === "implementation") {
      label = PHASE_STORY_LABEL[task.phase] ?? "Build";
      epicGroup =
        task.phase === "measure" || task.phase === "iterations"
          ? "post-launch"
          : "delivery";
      slotPhase = task.phase;
    } else {
      label = STATE_STORY_LABEL[task.state];
      epicGroup = STATE_TO_EPIC[task.state];
      slotPhase = "all";
    }
    const key = storyKey(task.state, task.phase);
    if (!seen.has(key)) {
      seen.add(key);
      storySlots.push({ state: task.state, phase: slotPhase, label, epicGroup });
    }
  }

  // Ensure post-launch epic exists
  if (!epicIdByGroup["post-launch"]) {
    const result = await createIssue(
      {
        fields: {
          project: { key: projectKey },
          summary: `[${projectName}] ${EPIC_LABELS["post-launch"]}`,
          description: buildEpicAdfDescription(),
          issuetype: { name: EPIC_ISSUE_TYPE["post-launch"] },
          labels: [],
          parent: { id: postLaunchInitiativeId },
          ...peopleFields,
        },
      },
      auth
    );
    if ("error" in result)
      throw new Error(`Failed to create Post Launch epic: ${result.error}`);
    epicIdByGroup["post-launch"] = result.id;
    process.stderr.write(`  Created epic: Post Launch (${result.key})\n`);
  }

  // Ensure any remaining missing epics from story slots
  for (const slot of storySlots) {
    if (!epicIdByGroup[slot.epicGroup]) {
      const epicLabel = EPIC_LABELS[slot.epicGroup];
      const parentId =
        slot.epicGroup === "post-launch" ? postLaunchInitiativeId : initiativeId;
      const result = await createIssue(
        {
          fields: {
            project: { key: projectKey },
            summary: `[${projectName}] ${epicLabel}`,
            description: buildEpicAdfDescription(),
            issuetype: { name: EPIC_ISSUE_TYPE[slot.epicGroup] },
            labels: [],
            ...(parentId ? { parent: { id: parentId } } : {}),
            ...peopleFields,
          },
        },
        auth
      );
      if ("error" in result)
        throw new Error(`Failed to create epic "${epicLabel}": ${result.error}`);
      epicIdByGroup[slot.epicGroup] = result.id;
    }
  }

  // Create stories
  for (const slot of storySlots) {
    const tasksInSlot = tasks.filter((t) =>
      slot.state === "implementation"
        ? t.state === slot.state && t.phase === slot.phase
        : t.state === slot.state
    );
    const epicId = epicIdByGroup[slot.epicGroup];
    const result = await createIssue(
      {
        fields: {
          project: { key: projectKey },
          summary: `[${projectName}] ${slot.label}`,
          description: buildStoryAdfDescription(slot.label),
          issuetype: { name: "Story" },
          labels: [],
          ...(epicId ? { parent: { id: epicId } } : {}),
          ...peopleFields,
        },
      },
      auth
    );
    if ("error" in result)
      throw new Error(`Failed to create story "${slot.label}": ${result.error}`);
    storyIdByKey[storyKey(slot.state, slot.phase)] = result.id;
    process.stderr.write(`  Created story: ${slot.label} (${result.key})\n`);
  }

  // Always create Iterations story under Post Launch
  const postLaunchEpicId = epicIdByGroup["post-launch"];
  if (postLaunchEpicId) {
    await createIssue(
      {
        fields: {
          project: { key: projectKey },
          summary: `[${projectName}] Iterations`,
          description: buildStoryAdfDescription("Iterations"),
          issuetype: { name: "Story" },
          labels: [],
          parent: { id: postLaunchEpicId },
          ...peopleFields,
        },
      },
      auth
    );
  }

  // Create sub-tasks
  const results = [];
  const errors = [];

  for (const task of tasks) {
    const key = storyKey(task.state, task.phase);
    const storyId = storyIdByKey[key];
    const result = await createIssue(
      {
        fields: {
          project: { key: projectKey },
          summary: `[UX] ${task.jiraTemplate.summary}`,
          description: buildSubTaskAdfDescription(task, designerEmail || null),
          issuetype: { name: "Sub-task" },
          labels: ["CI_UX"],
          components: [{ name: "design" }],
          ...(storyId ? { parent: { id: storyId } } : {}),
          ...peopleFields,
        },
      },
      auth
    );
    if ("error" in result) {
      errors.push({ taskId: task.id, error: result.error });
      process.stderr.write(`  ERROR: ${task.title} — ${result.error}\n`);
    } else {
      results.push({
        taskId: task.id,
        title: task.title,
        jiraKey: result.key,
        jiraUrl: `https://number26-jira.atlassian.net/browse/${result.key}`,
      });
      process.stderr.write(`  Created: ${task.title} → ${result.key}\n`);
    }
  }

  return {
    projectKey,
    initiativeKey,
    results,
    errors,
    epics: Object.fromEntries(
      Object.entries(epicIdByGroup).map(([group, id]) => [group, id])
    ),
  };
}

main()
  .then((result) => {
    process.stdout.write(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    process.stderr.write(`Fatal: ${err.message}\n`);
    process.stdout.write(JSON.stringify({ error: err.message }));
    process.exit(1);
  });
