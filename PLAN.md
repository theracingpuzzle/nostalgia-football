# Implementation Plan — Flash Soccer Manager 08/09 Recreation

> **Scope change (2026-11-09):** this project is no longer "a modern game
> inspired by" the original. It is a **preservation/recreation** project.
> Priority order: (1) faithful interface/visual style, (2) faithful
> management systems, (3) faithful match experience incl. overhead animated
> pitch, (4) faithful 2008/09 setting/teams/players/league, (5) avoid modern
> features or complexity the original didn't have.
>
> Anything below marked **[ASSUMPTION]** is our best guess, not a confirmed
> fact about the original game — see "Open Questions" at the bottom before
> treating it as real. Do not build Stage 8 (live match engine) until those
> are resolved.

## What exists from the previous (now-superseded) milestone

The first pass built a *different* game: a modern-styled management game
with 8 fictional clubs, Tailwind UI, and an invented statistical match
simulator.

**Removed 2026-11-09** (at the user's request, once the new flow covered the
same ground): the old screens (MainMenu/ClubSelect/Squad/Tactics/Fixtures/
LeagueTable/MatchResult), `TopNav`, the entire `src/state/` folder
(GameContext + reducer), and the fictional data (`src/data/clubs.ts`,
`generateClub.ts`, `namePools.ts`). `App.tsx` no longer has an old/new toggle
— the new flow (club list → Team Selection) is just the app now.

| Piece | Verdict |
|---|---|
| Tooling (React/TS/Vite/Tailwind/Vitest/Playwright) | **Keep.** Matches the brief. |
| `src/engine/rng.ts` (seeded PRNG) | **Kept.** Determinism is still a stated goal; not yet wired to any new screen. |
| `src/engine/league.ts` (round-robin + table) | **Kept**, resize to 20 clubs / 38 games once confirmed — not yet wired to any new screen. |
| `src/engine/teamStrength.ts`, `matchSimulator.ts` | **Kept but unused.** Still an invented statistical model with no basis in the original's actual mechanics. Unit tests still pass; nothing currently imports them. May end up replaced entirely once Stage 8 is actually scoped. |
| Old screens, old state, fictional data | **Deleted**, see above. |
alongside/in place of the placeholders stage by stage, per priority order.

## Architecture (unchanged in shape, data contents will change)
```
src/engine/   Pure TypeScript simulation/rules. No React, no DOM. Unit-tested.
src/data/     Clubs, players, formations, fixtures — data-driven.
src/state/    React Context + reducer wiring UI to engine.
src/screens/  One component per original screen.
src/components/ Small reusable UI pieces, now styled to match the original chrome.
```

## Development stages (small, independently testable, in priority order)

**Stage 0 — Foundations reset (no visible gameplay change)**
Confirm tooling stays. Add a `/reference` folder (gitignored) for screenshots/notes
captured during inspection, so later stages can be checked against them without
committing anyone else's copyrighted art into the repo. Decide the asset/IP stance
(see Open Questions) before Stage 4.
*Test:* build still passes; no behavior claims.

**Stage 1 — Visual language**
Establish the retro chrome (colors, fonts, borders, button/panel style) as a small
set of reusable primitives, checked by eye against the inspected screenshots.
*Test:* manual visual comparison against reference images.

**Stage 2 — Team Selection & Formation screen, static — ✅ built 2026-11-09**
`src/screens/TeamSelectionScreen.tsx` — now the app's own Team Selection screen,
reached directly from the club list (the old prototype it was built alongside
has since been deleted entirely, see above). Pitch with position slots for the 4 confirmed formations, squad list,
substitutes panel, pink injured-player highlighting, a Coach Advice box
explicitly labeled placeholder (content unknown), and a Continue button that's
honest about Stage 8 not existing yet rather than faking it.
Since this is private (per your call), uses a real club: `src/data/demoSquad.ts`
is a best-effort-from-memory reconstruction of Everton's 2008/09 squad — **not
verified against a real source**, flagged in the file's own comment, to be
checked/replaced in Stage 4's full dataset.
*Verified:* typecheck, build, lint, and all 21 engine unit tests still pass;
manually exercised in-browser (formation switching reassigns the XI correctly,
injured players excluded from auto-pick and shown pink in both squad list and
subs panel).
*Not yet done:* drag-and-drop (Stage 3), real pixel-accurate pitch styling
(blocked on reference screenshots — see Open Questions), squad list column
set (currently just name + position, since the original's actual columns are
unconfirmed).

**Also added 2026-11-09 — the main club list:** `src/data/premierLeague0809.ts`
(the real 20-club 2008/09 Premier League, replacing the old prototype's 8
fictional clubs for the new flow) and `src/screens/ClubListScreen.tsx`, which
is now the entry point of the new flow — pick a club, land on its Team
Selection screen. `TeamSelectionScreen` was generalized to take club/squad as
props instead of hardcoding Everton.

**Updated same day — all 20 clubs now "Ready":** `src/data/realSquads2008_09.ts`
replaces the Everton-only `demoSquad.ts` (deleted) with a squad for all 20
clubs (12-19 players each), consolidated under `src/data/clubSquads.ts`.
Verified in-browser across several clubs (Everton, Hull City, Bolton, West
Brom) including the sparsest squads. Same memory-reconstruction caveat as
before, now written once at the top of `realSquads2008_09.ts` instead of
per-file: club identities and the top-6/bottom-3 of the table are solid;
exact mid-table order, kit colors, squad depth, and January-transfer-window
timing (a few players who moved clubs mid-season are only listed under one
club) are not verified against a source. Flag anything known to be wrong and
it'll get corrected rather than guessed around.

**Updated same day — club colors & crest, old prototype removed:**
`src/components/ui/ClubCrest.tsx` started as a generic shield SVG in the
club's colors with its short code, deliberately not a reproduction of any
real logo — then **upgraded to real crests** the same day once you confirmed
that's fine for this private, non-distributed build. Real official crest
SVGs were downloaded from each club's English Wikipedia article (resolved via
the article's infobox `image` field, not guessed filenames) into
`public/crests/<id>.svg`, referenced via `crestPath` on each `ClubListing` in
`premierLeague0809.ts`. `ClubCrest` renders the real image when `crestPath` is
given and falls back to the generic shield shape (still exported, unused by
default now) if it's missing or fails to load. **Caveats:** these are current
crests by default, not verified as 2008/09-accurate — Stoke City and
Newcastle United have both rebranded since then (their downloaded files are
literally named "...crest 2026.svg"), and others may be off too, just not as
obviously.

**Fixed same day for 3 clubs, at your request — Man City, West Ham,
Portsmouth now use their actual 2008/09-era badges**, not the current ones.
English Wikipedia had already deleted the old Man City and Portsmouth files
(standard practice once a non-free logo is replaced) — found working
replacements via German Wikipedia's separately-uploaded files instead
(`ManCity.svg`, last touched 2012, within the pre-2016 shield era; `Portsmouth
FC 2008.svg`, uploaded Oct 2008 — about as era-exact as it gets). West Ham's
old file was still live on English Wikipedia directly. Tried Logopedia (a fan
wiki that archives retired logos by era) first as a more systematic source,
but its image CDN is behind a Cloudflare bot challenge that blocked both curl
and the automated browser — abandoned that path rather than keep fighting an
anti-bot measure. Visually verified all three in-browser before committing:
Man City's eagle/shield/"Superbia In Proelio" badge, Portsmouth's star-and-
crescent, West Ham's twin-castle-towers crest. The other 17 clubs are still
on their current-day crest with the above caveat — same fix is available for
any of them on request, just slower (needs a working per-club source).

`public/crests/` is gitignored — real trademarked logos stay local to this
build, not committed, so they never end up pushed or shared anywhere by
accident. Used on the club list and the Team Selection header.
`TeamSelectionScreen` is also themed in the
selected club's own colors throughout (panel headers via `Panel`'s new
`accentColor` prop, pitch shirts, the selected formation button, the in-XI
squad-list border) via a new `getContrastTextColor` helper
(`src/utils/colorContrast.ts`) that picks black/white text for readability
against whatever color a club has. Injured-player pink stays a hardcoded
override regardless of club color, since it's a status, not a brand.
Also removed the old prototype entirely (see table above) and its
preview-toggle button — the new flow is just the app now.
*Verified:* typecheck/lint/build/tests all pass; checked in-browser across
clubs with very different palettes (Man Utd red/yellow, Newcastle black/white,
Everton blue/white) to confirm the contrast logic holds up at both ends.

**Stage 3 — Drag-and-drop squad management — ✅ built 2026-11-09**
Native HTML5 drag-and-drop (no library) in `TeamSelectionScreen.tsx`: drag from
the squad list, substitutes panel, or another pitch slot onto a pitch slot;
dropping on the squad/substitutes panel benches a player. Swaps the two
players' slots; injured players aren't draggable at all (`draggable={false}`);
GK ↔ outfield drops are rejected (checked in the drop handler, not just
visually). The screen now reports its live formation/XI upward via
`onTeamChange` instead of a one-shot "Continue to commit" — it also stays
mounted continuously inside `CareerScreen` (never remounts when navigating
away via the nav bar), so in-progress arrangements are never lost.
*Verified:* typecheck/lint/build/tests pass. Browser automation's drag
gesture (`left_click_drag`) does **not** fire real HTML5 `DragEvent`s, so
verified the actual logic by dispatching real `DragEvent`s with a
`DataTransfer` via `javascript_tool` instead — confirmed the swap, the
injured-player block (`draggable="false"`), and the GK/outfield rejection all
work correctly against the live DOM, not just by reading the code.

**Then, at your request — "and then game play": a basic playable loop,
explicitly NOT Stage 8.** `CareerScreen.tsx` now owns a full season: real
20-club fixtures (`generateFixtures` over all real club ids), a `CareerNav`
(Team Selection / Fixtures / Table / Change Club, themed in the club's
colors), a `FixturesScreen` showing the managed club's 38 games with opponent
crests, a `MatchResultScreen`, and a `LeagueTableScreen` with all 20 clubs and
crests. "Play Next Fixture" simulates the **whole matchday** (every club, not
just yours) using the existing parked statistical engine
(`teamStrength`/`matchSimulator`) — AI clubs get their best XI in a 4-4-2.
**This is explicitly not Stage 8** and the result screen says so in plain text
("Placeholder Simulation... not a recreation of the original's real match
mechanics") so it's never mistaken for faithful recreation. This folds in
what were separately-planned Stage 4 (real-scale fixtures ✅), 5 (results ✅,
though single-fixture not the two-column full-day view described for the
original — that's still open), and 6 (table ✅, standard columns, original's
exact column set still unconfirmed).
*Verified:* full click-through in-browser — picked Everton, drag-swapped
keepers, played matchday 1, saw a real result with both clubs' crests, Continue
back to Fixtures, Table showed all 20 clubs with Everton's actual result
reflected and correctly highlighted/sorted.

**Added same day, on request: Top 20 Scorers screen.** `ScorersScreen.tsx`,
new nav tab. Tallies goals from every played fixture's `homeScorers`/
`awayScorers`, sorted descending, capped at 20. Not one of the 4 originally-
inspected screens — purely an addition, not presented as confirmed original
behaviour.

**Added same day, on request: a running-players animation.** You asked "can
we have players run around" after seeing the static result screen.
`MatchAnimationScreen.tsx` plays for ~8s between "Play Next Fixture" and the
result: 22 dots (11 per side, club-colored) wander the pitch via randomized
position jitter on a timer, a ball dot nudges toward a goal and a
"GOAL!"-style flash fires in sync with the actual simulated goal minutes, a
minute counter ticks 0→90, and there's a "Skip to Full Time" button. This is
explicitly **not** Stage 8 — no manager commands, no real player-movement
model, nothing claimed as faithful; it's cosmetic motion over the same
placeholder statistical result, built because you asked for *some* visible
action, not because we now know how the original's real match engine works.
Said so directly in the component's own doc comment so it can't later be
mistaken for Stage 8 progress.

**Also same day: sizing/layout pass.** You asked to make text and crests
larger throughout, and to make Team Selection fit one screen without
scrolling. Bumped crest sizes and font sizes across every screen (`Panel`
title bar, `ClubListScreen`, `CareerNav`, `FixturesScreen`,
`LeagueTableScreen`, `MatchResultScreen`). Reworked `TeamSelectionScreen`'s
layout from one long vertical stack into a sidebar (Formation / Coach Advice
/ Continue) + main area (Pitch+Substitutes side by side, Squad below with an
internal scroll cap) — a usability-driven layout change, not a claim about
the original's actual pixel layout (still unconfirmed).
*Verified:* at a realistic 1366×900 viewport, the whole Team Selection screen
(nav, header, sidebar, pitch, substitutes, squad) is visible with no page
scroll — confirmed via full accessibility-tree dump, not just a screenshot.

**Note on verifying this session:** partway through, the long-lived dev
server browser tab accumulated broken Vite HMR state from everything deleted
earlier in the session (old prototype screens, `GameContext`, etc.) and
started silently failing to navigate / throwing `useGameState must be used
within a GameProvider` in the console — looked exactly like the app was
broken. It wasn't: a fresh `npm run build` the whole time was clean, and a
dev-server restart + new tab fixed it immediately. Worth remembering if
things look "stuck" again — restart the dev server before assuming the app
regressed.

**Stage 7 — Sports News Extra screen**
Templated headline + match report text + both teams' player lists with ratings
out of 10, using a placeholder rating formula clearly marked as provisional.
*Test:* Playwright renders the screen correctly from a mock match result.

**Stage 8 — Live match screen & engine (gated — do not start)**
Overhead animated pitch, the six manager commands, stats tracking, defend/attack
slider, mid-match substitutions. This is architecturally different from the old
precomputed simulator — it's a real-time interactive state machine, and we don't
yet know enough about how the original's mechanics actually work to design it
responsibly. Needs its own research/design spike once the Open Questions below
are answered. **Flagged as highest risk, highest unknown, do last.**

## Missing information (things more inspection of the original could resolve)

**Team Selection & Formation**
- Exact player attribute set and how it's displayed (which stats, what ranges/scale).
- Drag-and-drop rules: can you swap two filled slots directly, or must one go via
  the bench first? Does changing formation keep players in their relative roles or
  reset the lineup?
- Substitutes panel size (how many subs shown/allowed).
- What "Coach advice" actually says/does — a real suggestion engine, or flavor text?
- Injury mechanic: how acquired, how long out, any info shown beyond the pink
  highlight (tooltip, expected return date)?
- Is there a captain / set-piece-taker designation on this screen?

**Live Match**

*Confirmed 2026-11-09 from a real screenshot of the original's live match
screen, shared in chat — replaces several items below that were previously
unknown:*
- Pitch is landscape, left-to-right, drawn in perspective (trapezoid —
  narrower at the far end), with visible goal frames/nets at each end,
  corner flags, and a crowd/stand border all the way around. (Our rebuild
  copies the left-right attacking direction and goals; not the perspective/
  trapezoid shape or crowd border yet.)
- The 6 commands are laid out as a single vertical column of yellow buttons on
  the right, in this exact order: SHOOT!, PLAY IT WIDE, CROSS IT!, CLEAR IT!,
  TACKLE HIM!, ABUSE REF! — confirms the set and order, not just the names.
- **Shouts are a limited resource** — a "Shouts Left" counter is shown as a
  row of dots next to a manager portrait. Not unlimited spam. (Exact starting
  count and refill rule still unknown.)
- "Other Options" below the shouts: SUBSTITUTES, TACTICS, and a third
  unlabeled/blank button — purpose of the third one unknown.
- Bottom bar has three panels: STATISTICS (total shots / fouls / runs /
  tackles / crosses — confirms exactly these 5, all shown as running counts),
  GOALS (scorer list, presumably), and a panel titled "THE CROWD" showing the
  currently-focused player's name, Fitness (out of 5) and Rating (out of 10),
  plus **two** sliders — "Aggression +" and "Defend/Attack +" (not just the
  one defend/attack slider we'd assumed), plus a "TIME PLAYED" minutes
  counter and the formation (e.g. "Formation: 442").
- Player sprites have an abbreviated surname label next to them on the pitch.
- "Mousebreaker Online Games" branding bottom-left, a big circular "Play"
  button bottom-right.

*Still unknown:*
- Is this continuous real-time animation the manager reacts to, or does it pause
  for each command? How "live" is "live"?
- Exact effect of each of the 6 commands — what do they actually change
  (probability of next event, which player acts, risk/reward tradeoff)? Especially
  ABUSE REF! — effect on referee bias/cards is unclear.
- Starting Shouts count and how/whether it refills.
- How substitutions are made mid-match (does it pause the game?); how many allowed
  (confirm it's 3, matching real football, or something simpler).
- What the third, unlabeled "Other Options" button does.
- How player fitness decays and what it affects; the Rating-out-of-10 formula.
- Whether the statistics shown are purely cosmetic or feed back into the simulation.
- Exact sprite art style/detail, and real-world time a full match takes — does
  it support fast-forward/skip?

*Added this session, explicitly NOT from the above reference (cosmetic only,
built because you asked for visible motion and kit art, not because we now
know the real mechanics):* `MatchAnimationScreen`'s wandering dots, and kit
icons as a generic SVG jersey (`KitIcon.tsx`) rather than a flat color chip —
same "not a real crest/kit license" reasoning as `ClubCrest.tsx`. Goals added
via a new `GoalFrame.tsx` (simple frame + net pattern, not the original's
perspective goal art). Used on both `TeamSelectionScreen` and
`MatchAnimationScreen`, both now oriented left-to-right (GK→FWD / home→away)
to match the confirmed screenshot, replacing the earlier top-to-bottom guess.

**Updated same day, on request ("match engine needs more work", "improve the
UI", "scoreboard", "ball actually going in the net"):**
- `GoalFrame` repositioned to sit fully inside the pitch edge (was half
  outside via a translate, which meant nothing could ever visually enter it)
  so the ball has somewhere real to go.
- Goal events now move the ball to `x: 97` or `x: 3` (right at the now-inside
  net) and hold it there 1.8s before resetting, instead of just nudging
  toward the goal line generally.
- Player dots are no longer uniformly random across the whole pitch — each
  gets a role (GK/DEF/MID/FWD) and a side-appropriate x-zone (e.g. home GK
  confined to x 4-13, home FWD to x 60-84, mirrored for away) and only
  jitters within that zone. Still cosmetic/not tied to the real simulated
  XI or formation, but looks like a match shape instead of 22 dots scattered
  with no regard for position.
- Added a proper scoreboard: crests, a **live** score that increments as
  goals fire during the animation (not the final score shown upfront, which
  would spoil it), minute counter, and a progress bar, all in a themed
  `Panel`. Previously the score only appeared on the Full-Time screen
  afterward.
- Added a ticker line below the pitch that updates with every fired event's
  description (not just goals), so chances and bookings are visible too, not
  only the big GOAL flash.
*Verified:* typecheck/lint/build/tests pass; watched a full animation via the
DOM (not just screenshots, which lagged behind live state a few times in
this session's browser pane — a recurring environment quirk, not an app
bug) — live score ticked 0-1 mid-match, final score matched the same
deterministic Everton v Sunderland result (2-3) seen earlier this session.

**Corrected same day, two follow-ups:**
1. You clarified Team Selection should show full player names, not a kit
   icon — `KitIcon` removed from `TeamSelectionScreen`'s pitch slots,
   reverted to a club-colored name chip with the complete (non-truncated,
   wrapping if needed) name, same as before kits were introduced there.
   Kit icons stay only on `MatchAnimationScreen`, where they represent
   generic "a player is here," not a specific named XI slot.
2. You clarified "actual kits as svg" meant replica-style kit layouts, not
   just a flat primary-color fill. Added `kitPattern` to each `ClubListing`
   (`'solid' | 'stripes' | 'halves' | 'sleeves'`) — a best-effort "what does
   this club's kit generally look like" fact (e.g. Newcastle/Sunderland/
   West Brom stripes, Blackburn's blue/white halves, Arsenal/Villa/West Ham's
   contrast sleeves), same non-infringing reasoning as the crests and the
   kit silhouette itself: recreating a well-known color-layout fact
   generically, not tracing a licensed template. `KitIcon` now renders the
   pattern via an SVG `clipPath` over the shirt silhouette.
*Verified:* typecheck/lint/build/tests pass; confirmed in-browser — Newcastle's
pitch now shows full names with no kit icon on Team Selection, and the match
animation shows Newcastle's players in black/white vertical stripes (caught
via a batched click+screenshot to dodge this session's screenshot-timing lag).

**Fixed same day — real bugs, not placeholder caveats this time:**
1. **Scoreboard was unreadable** — a real contrast bug, not a design choice:
   the club-name spans and the minute badge had no explicit text color, so
   they inherited `text-white` from the screen's outer wrapper while sitting
   on the `Panel`'s light cream background — effectively invisible white-on-
   cream text. Added explicit `text-ink` to both. The dark score pill was
   already fine (white-on-`bg-ink`).
2. **Ticker text under the pitch was too small** — bumped from `text-xs`
   (12px) at 75% opacity to `text-base` (16px) at full white.
3. **Goals/scorers repeating every time** — the actual bug: `CareerScreen`
   seeded its simulation RNG from a hardcoded `useState(1)`, and fixture
   generation has no randomness either, so matchday 1 for a given club was
   always the literal same fixture simulated with the literal same seed —
   deterministically identical every career. Fixed by seeding from
   `Math.random()` at career start instead of a constant. The engine itself
   stays a pure deterministic function of its seed (that's what the unit
   tests check and still pass) — only the *starting* seed now varies per
   session, the way a game should.
*Verified:* typecheck/lint/build/tests pass; confirmed in-browser — scoreboard
clearly legible against the cream panel now; played Everton's matchday 1
twice across two fresh page loads and got two different scorelines/scorers
(2-3 Fellaini/Jagielka vs Cissé/Malbranque/Ferdinand, then 2-1
Arteta/Lescott vs Richardson), then a third different result on matchday 2
(5-goal Everton–Portsmouth game) — confirms the fix holds across fixtures,
not just a one-off.

**Full-Time Results**
- Exact ordering of the two columns of 20 clubs (alphabetical? fixture order?
  home teams vs away teams split?).
- Whether the user's own match is visually distinguished from the rest.

**Sports News Extra**
- How the headline is generated (templated from scoreline/events, or hand-written
  flavor per result bucket?).
- Whether the match photo is a fixed stock image per club/scenario or composed
  dynamically.
- The ratings-out-of-10 formula.
- Whether this screen appears after every match or only the user's own.

**General / meta**
- Single season only, or multi-season with progression?
- Cups (FA Cup, League Cup, Europe) in scope, or Premier League only (the
  Full-Time screen only mentions Premier League clubs, suggesting league-only)?
- Any transfer market, finances, or squad building beyond picking from a fixed
  roster?
- Save/load support in the original?
- Audio (commentary, sound effects) — likely out of scope for a first pass
  regardless, but worth confirming it existed so we know what we're consciously
  dropping per priority #5.

## Open questions for you

1. **Source material** — do you have screenshots, recorded gameplay, or an
   archived/emulated copy of the original we can check specific pixels/behavior
   against as stages land? Or should I do a web search for archived footage /
   wiki pages / Let's-plays to help fill the gaps above? (I haven't done this yet
   — flagging it as an option, not assuming you want it.)
2. ~~Real clubs, players, badges, and crests~~ — **resolved 2026-11-09: private
   project, go ahead with real data, then explicitly confirmed again for real
   crest artwork specifically.** Real crests downloaded from Wikipedia into
   `public/crests/` (gitignored, local-only); Man City, West Ham, and
   Portsmouth upgraded to their actual 2008/09-era badges on request. Still
   open: the other 17 clubs are on their current-day crest — Stoke and
   Newcastle definitely don't match (rebranded since), others unchecked.
   Worth going through the rest the same way, or leave as-is for now?
3. **First feature confirmation** — resolved, Stage 2 built (see above).
4. Anything in "Missing information" above that you *do* already know from your
   inspection and just didn't write down yet — rather than me guessing, flag
   those and I'll fold the confirmed facts in.
5. **New, from building Stage 2:** what columns does the real squad list show
   (just name/position, or shirt number, age, form, value...)? And is the
   `realSquads2008_09.ts` reconstruction (all 20 clubs now) worth getting right
   — I'd want to double check specific names/shirt numbers/mid-season transfers
   against a source rather than rely purely on memory — or is it disposable
   scaffolding either way?

## Recommended first feature to build

**Stage 2: the Team Selection & Formation screen, static (no drag-and-drop yet,
placeholder squad data).** Reasoning:
- It's the most visually distinctive, signature screen of the original and
  directly exercises priority #1 (interface fidelity) without being blocked by
  the harder unknowns (live match mechanics, real data/IP decision).
- It's small and independently testable: given a formation + a squad, render the
  right pitch layout. No simulation engine needed yet.
- It de-risks the visual-language work (Stage 1) immediately, on a real screen,
  rather than in the abstract.
- It sets up Stage 3 (drag-and-drop) and Stage 4 (real data) to slot in without
  redoing the screen itself.

Not recommending Stage 8 (live match) first, deliberately — it's the stage with
the most unknowns, and starting there risks exactly the "invent mechanics and
present them as confirmed" problem this plan is trying to avoid.

**Status: Stage 2 built.** Natural next step is Stage 3 (drag-and-drop), but
that's a good moment to pause and answer open question #5 above first — worth
confirming the squad-list columns before building more UI around a shape that
might need to change.

## Recent changes (mobile pitch orientation, transfer windows, state bug fix)

- **Team Selection pitch on mobile is now portrait** (goal-top, positions
  stacked GK→DEF→MID→FWD down the page, goal-bottom) instead of the old
  horizontal strip. Desktop/landscape view is unchanged (left-to-right pitch).
  Pure CSS breakpoint split (`md:` Tailwind classes), no logic change.
- **Added a deliberately silly, lightweight transfer window** — one before the
  season and one around matchday 20 ("January", since fixtures are only
  numbered 1-38, not dated — this is an approximate marker, not a real
  calendar). No fees, no wages, no negotiation: a few straight-swap offers
  (one of your spare squad players for a same-position player from a random
  other club) with jokey tabloid-style flavor text, Accept/Decline per offer.
  This is **not** a recreation of how the original's transfer market worked —
  that mechanic is still unknown/unconfirmed — it's a fun placeholder feature
  the user asked for, flagged as such on-screen.
- **Fixed a real pre-existing bug**: the Team Selection screen's drag-and-drop
  XI was being wiped back to empty after every match played. Root cause: the
  career screen was conditionally *replacing* its whole render tree with an
  overlay screen (match result, now also transfer window) instead of layering
  the overlay on top — which fully unmounted the persistent Team Selection
  component and lost its internal state. Fixed by always rendering the full
  tree and showing overlays as a sibling layer on top. Verified across a
  19-match run (pre-season window → MD1-19 played with real varying
  results → January window trigger) that the XI count stays intact throughout.

## Team of the Month (new addition, not a reconstruction)

Added at the user's request. The original almost certainly never had this —
it's a new feature, same spirit as the transfer window: fun, flagged as an
addition, not a faithfulness claim.

- **Player ratings**: `engine/ratings.ts` adds a lightweight, deterministic
  post-match rating out of 10 for every player who started a match (not just
  scorers — `MatchResult` now also stores `homeXI`/`awayXI`, the player ids
  who played, so everyone can be rated). The formula: base 6.0, + win/draw/
  loss, + clean sheet / − goals conceded for keepers and defenders, +1 per
  goal scored by that player, a small nudge from the player's own relevant
  attribute (so stronger players edge out ties), and a bit of deterministic
  per-match variance (hashed from fixture id + player id, so re-viewing the
  same match always gives the same numbers — no hidden simulated events like
  tackles or passes behind it).
- **Team of the Month screen**: league-wide (not just your club), picks a
  fixed 1-4-3-3 shape per block of matchdays, ranked by average rating with
  goals scored weighted in on top (per the user's "realistic, based on goals
  scored" ask). Month navigation with prev/next; opens on the latest month
  with any played fixtures.
- **"Month" boundaries**: same approximation style as the January transfer
  window — fixtures are only numbered 1-38, so `data/seasonMonths.ts` chunks
  them into blocks under real Aug-May month names purely for labeling. It's
  a separate approximation from `JANUARY_MATCHDAY` in CareerScreen.tsx and
  deliberately isn't forced to line up with it exactly.
- **Known approximation**: a player who's since been transferred is looked
  up across every club's *current* squad (not the fixture's two clubs), so
  they're still found and credited correctly — but the club crest shown next
  to their name is wherever they are *now*, not necessarily who they played
  for in that past match. Minor, and only visible once a player has actually
  moved mid-season.
