# Development process

This document is for humans joining or reviewing this project. It covers how
timekeeper came together and, more importantly, *why* it's built the way it
is — the tradeoffs behind decisions that aren't obvious just from reading the
code. It's a living document: later work sessions should extend it rather
than rewrite the parts that are still accurate.

## Phase 1 — Starting point

The project began from the default `npm create vite@latest` TypeScript
scaffold, which turned out to be broken on arrival (it referenced files that
didn't exist on disk). The first real commit (`d5ee9c8`) built a countdown
timer feature — hours/minutes input driving a start/pause/reset countdown.

## Phase 2 — Pivot to time logging

The countdown timer was the wrong feature for what was actually wanted, and
was scrapped in favor of the app's real purpose: a daily time-logging form
plus a stats/visualization page (`5604b4d`). This is the point where the
app's actual shape emerged — categories you log hours/minutes against, per
day, with the data kept in `localStorage` and no backend at all.

**Why no backend / no framework:** the app is small, single-user, and local
by design — there was no requirement for accounts, sync, or multi-device
access, so adding a server or a framework (React, Vue, etc.) would have been
overhead without payoff. Vanilla TypeScript + Vite keeps the whole thing
inspectable in a handful of files.

**Why manual template-string HTML instead of a UI framework:** consistent
with the "no framework" call above — for four pages each rendering a
moderate amount of static-ish HTML, hand-written templates with `escapeHtml`/
`escapeAttr` guards were simpler than pulling in a rendering library. The
tradeoff is more manual re-render calls (`render()` functions called
explicitly after every state change) instead of reactive bindings, which is
a fine trade at this scale but would need revisiting if the UI grew much
more interactive.

**Chart approach:** rather than reach for a charting library, bars are
hand-rolled `<div>`s sized via inline `style="width/height"`. The project
followed an internal `dataviz` skill's guidance for chart-type selection
(horizontal bar for comparing magnitudes, stacked bar for part-to-whole),
color palette (an 8-color categorical palette that was run through a
contrast validator), and accessibility basics (tooltips on hover *and*
keyboard focus, a table-view fallback per chart, dark mode). The validator
flagged a few low-contrast color pairs; rather than change the palette, the
mitigation was to always show direct value labels and offer the table
toggle, so contrast issues don't block reading the data.

## Phase 3 — Settings, Categories split, Stats range filter, midnight reset

This phase added four related but independent pieces of work in one
session (`916efe9`):

**Settings page.** A simple destructive "reset app" action (wipes both
localStorage keys) behind a confirm dialog — the confirm step exists
because this action is genuinely destructive and irreversible, unlike
category removal (see below).

**Splitting category management out of the Log time page.** Originally, the
Log time page did triple duty: log hours, reorder categories, and add/
delete categories, all in one form. This was split so that add/delete moved
to a new, dedicated Categories page, while **reordering stayed on the Log
time page**. That split point was a deliberate choice, not the "obvious"
one — reordering categories is something you naturally do while looking at
your logging form (to put frequently-used categories at the top), whereas
adding or removing a category is a rarer, more administrative action better
suited to its own page where it can't be triggered by accident while trying
to log time. It also directly addressed a concrete usability complaint: the
Log time page had gotten visually cluttered with add/remove/reorder controls
all competing for space next to the actual hour/minute inputs.

Category removal on the new page intentionally has **no confirmation
dialog** — this was a deliberate asymmetry with the Settings "reset" flow.
Removing a category doesn't delete historical time entries for that
category name (they just stop showing up in the log form going forward, and
would reappear in history if the same name were ever re-added), so it's a
low-stakes, easily-undone action and a confirm step would just be friction.

**Stats history range filter (3 days / 1 week / 1 month).** The original
history chart showed a fixed "last 14 days," but it actually meant "the last
14 days that happened to have any logged time" — silently skipping empty
days meant the labeled window could span far more than 14 calendar days if
the user had gaps. Two things changed together: the fixed 14-day window
became a user-selectable 3-day/1-week/1-month toggle, and the underlying
logic switched from "last N days with data" to "last N *calendar* days,
period" — empty days now render as visible empty bars instead of being
skipped. This was chosen deliberately over the alternative of keeping
skip-empty-days logic, because a date-range label should mean what it says;
a chart that silently reaches back further than its label claims is
misleading in a way that's easy to miss until someone's trying to explain a
gap.

**Midnight auto-reset for Log time.** Discovered as a real gap: the page
computed "today's date" once, at load time, and never revisited it. A
browser tab left open across midnight would keep showing and saving against
the *previous* day indefinitely, since nothing re-checked the date. Two
independent mechanisms fixed it, deliberately redundant: a `setTimeout`
scheduled for the exact next local midnight (recomputed fresh each time it
fires, rather than a flat 24-hour repeating interval, to avoid clock drift),
and a `visibilitychange` listener that double-checks the date whenever the
tab regains focus. The second mechanism isn't belt-and-suspenders paranoia —
browsers throttle timers in backgrounded tabs, so a `setTimeout` alone can
fire late if the tab was minimized or the OS suspended it; the visibility
check catches that case without needing to poll continuously.

## Phase 4 — Naming polish

The Log time page's H1 read "Log time" and the browser tab title read
lowercase "timekeeper." Both were updated to read "Timekeeper" (matching the
app's actual name), covering both the on-page heading and the browser tab
title as separate, deliberate changes rather than assuming one implied the
other.

## Working pattern used in this project

Several rounds of this work were done by fanning out independent,
narrowly-scoped background agents in parallel (e.g., one agent scoped
strictly to the Categories/spacing work, another strictly to `stats.ts` plus
additive-only CSS, another strictly to the midnight-reset logic in
`main.ts`), rather than one agent touching everything sequentially. Each
agent's instructions explicitly listed which files were off-limits (owned by
a concurrently-running agent) to avoid merge conflicts on shared files like
`style.css`. This is worth knowing if you're planning further parallel work
on this repo: scope each agent to specific files, tell it which files
*not* to touch, and prefer additive-only edits (e.g., "only append new CSS
rules, don't reformat existing ones") on any file more than one agent might
touch in the same round.
