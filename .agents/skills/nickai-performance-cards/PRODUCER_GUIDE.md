# NickAI Performance Cards — Producer Guide

How to wire a NickAI workflow up to feed the pixelnick card pipeline.

This is the **producer side** — what a workflow author has to do so their
workflow's performance becomes a card. The **consumer side** (rendering + Slack
posting) is in [SKILL.md](./SKILL.md).

## The big picture

```
NickAI workflow (runs on a schedule)
  └─ a function node inside the workflow writes JSON to R2:
       nickai/agents/{workflowId}/profile.json                  ← identity
       nickai/agents/{workflowId}/snapshot.json                 ← cumulative state
       nickai/agents/{workflowId}/runs/{date}/{executionId}.json ← this run's detail

pixelnick pipeline (runs weekly, separate)
  ├─ lists every profile + snapshot pair in R2
  ├─ ranks Top N per source by profitPercent
  └─ renders PNG + MP4 cards, posts them to Slack
```

You write to R2 on each execution. Badi's weekly job does the rest.

---

## Step-by-step

### 1. Get the JSON template

Authoritative spec lives in the pixelnick repo:
- **Types:** `data/agent-output.ts` (the source of truth)
- **Example:** `data/agents.template.json`
- **Quick recap below in [Schemas](#schemas).**

### 2. Add a function node to your workflow

In the NickAI editor, drop a function node **at the end of your flow** (after
performance metrics are computed, before completion). It does three things:

1. Compute the values for `profile`, `snapshot`, and the per-execution `runs`
   record.
2. Write all three to R2 at the canonical paths.
3. Log success/failure so you can verify in the workflow execution logs.

### 3. Set the things the function node can't see

NickAI function nodes **cannot** dynamically read:

| Value | Why it can't be read | Where to put it instead |
|---|---|---|
| Workflow's own name | No introspection API | Workflow variable `agentName` (or hard-code in the node) |
| Workflow's node count | No introspection API | Workflow variable `nodes` (number, not array) |
| Builder's name + avatar | No user-context API | Workflow variables `builder.name` + `builder.avatarUrl` |

Use **workflow variables** rather than hard-coding so the same function-node
code drops into any workflow with no edits. The shared infrastructure (R2 creds,
bucket name, Slack tokens) lives in the **enterprise marketing NickAI account**
as the single source of truth — reuse those, don't recreate.

### 4. Reusing the function node across workflows (the tricky bit)

If you save the function node as a **custom node** for reuse, you'll hit a UX
limitation: when you drop a custom node into a new workflow, **the builder
can't open it or modify its code or params.** That makes hard-coded values
unfixable per workflow.

So the reuse path is *not* "drop in the custom node." It's:

1. Add the custom node to a temporary workflow, open it, **copy its code**.
2. In the target workflow, create a **new** function node and **paste** the
   code into it.
3. Ask the builder to **wire each hard-coded value to a workflow variable**
   (best) — or update the hard-coded values in place (workable but fragile).

This is *the* reason to favour workflow variables: the function node body
stays generic, every workflow just sets its own variables. You never have to
edit the code per workflow.

### 5. Run the workflow + verify

**a) Trigger one execution.** Check NickAI's execution logs for the function
node — it should log the R2 write. Errors there are usually permissions
(token doesn't have Object Write on the prefix) or bad bucket name.

**b) Have Claude verify R2 contents.** With the `nickai-performance-cards`
skill active in the pixelnick repo, ask Claude to inspect what your producer
wrote. Phrases that work:

> "check the bucket for workflow `wfl_xxx`"
> "show me the latest snapshot for `wfl_xxx`"
> "is `wfl_xxx` schema-conformant?"

Claude lists the bucket, fetches `profile.json` + `snapshot.json`, validates
each required field, and tells you what's missing.

**c) Iterate.** Fix the producer → re-trigger → re-check until Claude says
"all required fields present."

### 6. Render a card on-demand (optional)

Once the schema's clean, you can render a single card without waiting for the
weekly job. In the pixelnick repo:

```bash
bun scripts/generate-cards.ts --slug=<your-slug>
```

Or just ask Claude: *"render the card for `wfl_xxx`."* It'll pull from R2,
render PNG + MP4, post to **#tests-agents-output** while we're in testing.

### 7. Weekly automation

Once your workflow consistently writes clean data, you're automatically in the
weekly cards run. Badi (or whoever owns the schedule) runs the pipeline once a
week — it picks the Top N per source by `profitPercent`, renders cards for the
winners, posts to Slack. No further action from the workflow author needed.

---

## Schemas

Authoritative version: `data/agent-output.ts`. Quick reference:

### `profile.json` (overwrite each execution)
```json
{
  "workflowId": "wfl_...",
  "agentName": "<workflow title>",
  "slug": "<lowercase-hyphenated>",
  "nodes": <number>,
  "builder": {
    "name": "<builder display name>",
    "avatarUrl": "<https URL>"
  },
  "activeSinceISO": "<first-write ISO>"
}
```

### `snapshot.json` (overwrite each execution — CUMULATIVE state, not last run)
```json
{
  "workflowId": "wfl_...",
  "asOfISO": "<now>",
  "pnlUsd": <cumulative USD>,
  "profitPercent": <cumulative %>,
  "runsTotal": <count of all executions>,
  "tradesTotal": <count of all trades across all runs>,
  "lastRunAtISO": "<this execution>",
  "nextRunISO": "<future: asOfISO + cadence>"
}
```

### `runs/{YYYY-MM-DD}/{executionId}.json` (append-only, per execution)
```json
{
  "workflowId": "wfl_...",
  "executionId": "exe_...",
  "startedISO": "<ISO>",
  "completedISO": "<ISO>",
  "pnlDeltaUsd": <this run's PNL change>,
  "trades": [],
  "output": { /* raw signal/indicator data this run */ }
}
```

## Paths

Always under one of these source prefixes:
- `nickai/agents/{workflowId}/...`
- `swarm-arena/agents/{workflowId}/...`

`{workflowId}` is the immutable identity. `slug` is a display-only field that
lives **inside** `profile.json`, never in the path.

---

## Common gotchas (lessons from real iteration)

These are the regressions we hit multiple times during the first live
integrations. Worth reading before you ship.

- **`agentName`, not `name`.** Single most common regression — producer writes
  the wrong key. Pipeline reads `agentName` and shows blank otherwise.
- **`nodes` is a number, not an array.** `26`, not `["Daily Trigger", "AAPL
  Data", ...]`. Card silently falls back to a default if the type's wrong.
- **`snapshot.json` is cumulative state, not a per-run record.** The
  trading-signal output / indicators / latest LLM reasoning belongs in
  `runs/.../output`. Conflating them drops every metric the card needs.
- **`nextRunISO` must be > `asOfISO`.** Equal timestamps render as "Next run
  in now." Compute it as `asOfISO + cadence`.
- **`slug` is lowercase + hyphens** (`mean-reversion-btc-sol`, not
  `Mean-reversion-BTC-SOL`).
- **Overwrite `profile.json` every execution.** A code change doesn't
  propagate until the workflow runs and rewrites the file.
- **Don't drop fields when fixing others.** The "one-fix-one-regress" pattern
  bit us at least four times. When updating the producer, write the full
  schema each time — not just the field you're editing.
- **Validate before writing.** If `agentName`, `slug`, `nodes`,
  `builder.name`, or `activeSinceISO` is missing/empty, fail the write loudly
  instead of writing junk.
- **Don't write at an empty path.** If `workflowId` or `executionId` is empty
  at write time, the producer ends up writing `agents//profile.json`
  (double-slash) — abort instead.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Bucket is empty after trigger | Producer didn't run, or wrote to wrong bucket | Check NickAI exec logs; verify `R2_BUCKET` + path |
| `AccessDenied` from the pipeline | R2 token missing read on the prefix | Reissue token with **Object Read** on the bucket/prefix |
| Card title is blank or shows workflowId | `agentName` written as `name` | Rename field in producer |
| Card shows wrong node count (or "9") | `nodes` missing or wrong type (array) | Set `nodes` as a numeric workflow variable |
| Generic builder + Franklin avatar on card | `builder.name`/`avatarUrl` missing | Set as workflow variables |
| Card shows "Next run in now" | `nextRunISO == asOfISO` | Compute `nextRunISO` as a future timestamp |
| Slug collision between two workflows | Two workflows used the same slug | Make slug unique per workflow |
| Profile change in code isn't reflected | Profile only written on creation | Make producer overwrite profile every execution |
| Negative PNL but card shows "+" / green | Card composition limitation (positive-only) | Open an issue on pixelnick (composition fix) |

---

## Who does what

| Role | Responsibility |
|---|---|
| **Workflow author** | Add the function node, write spec-conformant JSON to R2 each execution |
| **Claude in pixelnick repo** | Validate R2 contents, render single cards on demand, diagnose schema issues |
| **Badi** | Maintain the pipeline, run the weekly cards job |
| **Enterprise marketing NickAI account** | Hosts shared secrets and standard producer variables |
