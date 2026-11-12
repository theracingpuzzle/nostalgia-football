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

## End-of-season experience

Previously, once all 38 fixtures were played, "Play Next Fixture" just quietly
disabled itself with no explanation. Fixed:

- **Season Summary screen**: pops up automatically the moment the last
  fixture of the season is played (same overlay pattern as the match result
  and transfer windows). Shows a headline based on final league position
  (champions / Champions League / Europa / relegation / mid-table, reusing
  the zone bands from `utils/leagueZones.ts`), the final W-D-L-GD-Pts record,
  top 5 scorers, and a full-season "Team of the Season" (the exact same
  `FormationXIPitch` component Team of the Month uses, just computed across
  matchdays 1-38 instead of one month's block — extracted into
  `components/ui/FormationXIPitch.tsx` so both screens share it).
- Two buttons: **Review First** (dismiss and go look at the table/squad —
  reopenable from Fixtures via a "View Season Summary" button) and
  **Start New Season** (fresh fixture list for the same 20 clubs, resets the
  January-window flag and seeds a new pre-season transfer window; squads —
  including any transfers made — carry over as-is).
- **Known limitation, flagged on the relegation headline**: there's no
  promotion/relegation between divisions. A relegated club's next season
  still starts back in the same 20-club Premier League — the game doesn't
  model a second division. Said so directly on-screen, not just here.
- **Fixtures list now shows a W/D/L badge** next to each played score (green/
  grey/red), not just the raw scoreline — was hard to read at a glance.

## Club overview, post-match landing, morale, and Stats (new additions)

- **Club overview**: tap any row in the League Table to see that club's
  season record plus a per-player breakdown (appearances, goals, average
  rating) — `screens/ClubOverviewScreen.tsx`, works for any of the 20 clubs.
- **Landing screen after a match**: continuing past a match result now
  always returns to Team Selection (previously it left you wherever you'd
  clicked "Play Next Fixture" from, usually Fixtures).
- **Player morale** (`engine/ratings.ts` → `computePlayerMorale`): a new
  addition — the original's actual morale mechanic, if it had one, isn't
  confirmed/known. Rather than a separate tracked stat, morale is *derived*
  from data already on hand: how much of the season a player's actually
  played, and how well they've rated in it. A green/grey/red dot shows next
  to each name in the Squad and Substitutes lists (with a legend), and
  Coach's Help now calls out specific players: who's unsettled from lack of
  game time, who's short of confidence despite playing regularly, and —new—
  a concrete "in great form, not in your XI yet" nudge naming an actual
  player. Thresholds are set relative to the rating formula's 6.0 baseline
  (not hugging it), otherwise ordinary average performances constantly
  misfire as good or bad — caught and fixed this round after first shipping
  with a threshold that flagged nearly the entire first-team as "unsettled."
- **Stats screen** (replaces Scorers): still goals, now also **assists** and
  **yellow cards**, with tabs to re-sort the same table by whichever column.
  Required extending the match engine: goals can now carry an assist (~82%
  do, weighted toward midfielders/passing — the rest are "solo" goals), and
  yellow-card events are now tallied per player across the season the same
  way goals always were (`MatchResult.homeAssists/awayAssists/homeBookings/
  awayBookings`, all added to `homeXI`/`awayXI` as required fields).
- **Team of the Month/Season formation is no longer fixed at 4-3-3**: it now
  tries every formation the game itself offers (4-4-2/4-3-3/3-5-2/4-5-1) for
  that block of performances and picks whichever yields the strongest XI —
  so a month heavy on good forwards and light on standout defenders might
  come back as a 3-5-2 instead. Confirmed live: September came back as a
  genuine 3-5-2 rather than the old hardcoded shape.

## Match animation: a real shot, not just wandering dots

Addressed "the players just move around the screen and the ball doesn't
actually go in the goal" — two separate problems in `MatchAnimationScreen.tsx`:

- **The ball now visibly shoots and lands in the net.** Previously a goal
  just teleported the ball near the edge of the pitch on the normal
  900ms "wander" transition — easy to miss, no clear sense it had entered
  the goal. Now a goal is a two-stage animation: the ball drifts to the
  edge of the box (a windup), then — on a much faster 300ms transition —
  is struck into the net, where a white pulse ring (`animate-ping`) confirms
  it landed there. **Found and fixed a real bug while building this**: the
  pulse was originally a single nullable value; when two goals land close
  together (two goals a simulated minute apart are only ~100ms apart in this
  9-second-per-match animation), the earlier goal's cleanup timer could fire
  after the later goal's pulse was set, wiping it out before it was ever
  seen. Fixed by keying each pulse with its own id in a list, each with its
  own independent cleanup timer. Verified the underlying fix is sound via a
  same-execution-context DOM check (confirming the pulse element really is
  in the DOM ~100ms after being set) — the browser automation tooling used
  this session proved too latency-prone to reliably screenshot a ~2-second
  live event by itself, so that direct check stood in for a screenshot.
- **Players now have a simple "momentum" sway** instead of pure independent
  random wandering: one side periodically pushes further forward for a few
  seconds (nudging their own FWD/MID dots, and the resting ball, toward the
  opponent's goal) before the momentum swings to the other side. Cosmetic
  only — not tied to the actual simulated score or chances — but reads as
  waves of attack rather than 22 dots drifting with no relationship to each
  other.

## Simulated injuries (new addition, league-wide)

Previously `Player.injured` was a static flag — 4 specific real players
hardcoded as injured for the whole season, never recovering, nobody else
ever hurt. Replaced with an actual simulated mechanic, same spirit as
morale/ratings/transfer window: a new addition, not confirmed from the
original.

- **`engine/injuries.ts`**: after every matchday, every player who actually
  started a match (for *any* of the 20 clubs, not just the managed one) has
  a small independent chance (3%) of picking up an injury, out for a random
  number of matchdays (mostly a 1-2 matchday knock, sometimes a 3-4 matchday
  strain, occasionally a longer 5-8 matchday lay-off). An injured player
  recovers automatically once the matchday reaches their stored
  `injuryReturnMatchday`. Driven by the same seeded random generator the
  match engine itself uses (one continuous sequence advanced by
  `CareerScreen.playNextFixture`), so a career replays identically from its
  starting seed, same guarantee the matches already had.
- **`engine/squadAuto.ts` (`pickBestXI`) fix**: AI-controlled clubs now also
  avoid fielding injured players (previously didn't check at all — harmless
  before since injuries never changed, became a real gap once AI squads can
  genuinely have players out). Falls back to including them only if a club
  somehow has fewer than 11 fit players, so a match always has a full XI.
- **Found and fixed a real bug while verifying this**: Team Selection keeps
  its own pitch-slot state locally and was never told when a player already
  placed in the XI became injured after a match — the pitch kept showing an
  injured player as a valid starter. Fixed with a `useEffect` in
  `TeamSelectionScreen` that clears any slot whose occupant has since become
  injured, whenever the squad prop updates. Verified live: an injury on a
  starting XI player correctly knocked the "Starting XI" count down (e.g.
  11/11 → 9/11 for two simultaneous injuries) and Coach's Help correctly
  refilled with fit replacements.
- Coach's Help and the club overview screen both now show the return
  matchday next to an injured player's name (e.g. "Tim Howard (back MD10)"),
  not just the fact that they're out.

## Red cards added to Stats

The match engine already had yellow cards; red cards were missing entirely.
Added as a new, much rarer independent event (`RED_CARD_RATE_PER_MINUTE`,
tuned to roughly 1 every 15-ish matches) — not a second-yellow escalation,
just its own rare roll, same lightweight spirit as the existing yellow-card
mechanic. Tallied into `MatchResult.homeRedCards`/`awayRedCards` the same
way goals/assists/bookings already are. The Stats screen gained a fourth
sort tab ("Red Cards") alongside Goals/Assists/Yellow Cards, with a new RC
column shown in red; the Match Events list on the full-time screen now
bolds and reddens a "sent off" line the same way it already bolds goals.
Does **not** reduce the sent-off player's team to 10 men for the rest of
the match — purely a tracked stat, not a simulated numbers-disadvantage
effect (same as yellow cards never did either).

## Morale "unsettled" threshold toned down

User feedback: bench players were showing as unhappy with their game time
after as few as 3 matches — too trigger-happy, flagging half the squad by
matchday 3. `computePlayerMorale` (`engine/ratings.ts`) now requires a real
stretch of being overlooked before judging someone unsettled: at least 6
games played (was 3) and under 20% of appearances (was under 34%). Verified
live: an unused player shows no bad-tone morale through 8 played matches now
(previously would have flagged by match 3).

## Team Selection: pitch names, mobile layout order

- **Pitch cards abbreviate the first name** ("Tim Howard" → "T. Howard") —
  pitch cards only, via a new `abbreviatePitchName` helper in
  `TeamSelectionScreen.tsx`. Squad list, substitutes list, and Coach's Help
  advice all keep full names, as asked.
- **Mobile layout reordered**: previously the sidebar (Formation picker +
  Coach's Help/advice + Continue) stacked *above* the pitch on narrow
  screens — on a real squad with injury/morale notes, that could push the
  actual pitch most of the way down the page before a manager ever saw it.
  Below the `lg` breakpoint the pitch (and Substitutes, Squad) now comes
  right after a compacted horizontal Formation row; Coach's Help and
  Continue follow after the squad. Desktop's original sidebar + main-area
  layout is untouched — driven by `order`/`lg:order` utility classes on four
  extracted panel pieces (formation/coach/continue/main-area), not by
  duplicating the expensive parts (pitch, substitutes, squad stay rendered
  exactly once); only the cheap small panels render twice, once per layout.
  Verified in the browser at 375px and 1024px.
- **Coach's Help advice is now icon-prefixed** (🏥 injuries, 😠 unsettled, 📉
  low confidence, ⭐ in-form) instead of a plain bulleted list — scans faster.
- **Screen switches now scroll to the top** (`CareerScreen` added a
  `useEffect` on `screen`) — Team Selection in particular stays mounted
  (just hidden) between visits, so without this a manager could land back
  on it still scrolled partway down from an earlier visit.

## Fixed: getting stuck below 11 players after injuries

User report: sometimes after a run of injuries they couldn't field 11
players and were stuck. Root cause was two-fold, fixed both ways:

- **Several clubs were genuinely too thin for an injury mechanic to exist
  safely.** Blackburn, Hull, Middlesbrough, and West Brom (plus others)
  originally had as few as 11 total players and, in four clubs' case, only
  *one* recognized goalkeeper — any single injury to that keeper left the
  GK slot with nobody real to fill it. Bulked up all 20 clubs with real
  2008/09 squad players (see `data/realSquads2008_09.ts`'s updated header
  for the confidence caveat — depth signings are lower-confidence than
  first-teamers, flagged the same way the rest of this data always has
  been). Every club is now at least 13 players; all but three now have 2-3
  recognized keepers.
- **The actual hard blocker, fixed properly**: even with enough total fit
  players, both "Coach's Help" (`fillEmptySlotsWithCoachPick`) and manual
  drag/tap placement (`dropOnSlot`) in `TeamSelectionScreen.tsx` strictly
  required an actual goalkeeper for the GK slot — if a club's only
  keeper(s) were injured, that slot was unfillable *regardless of total
  squad depth*, since fuller squads don't help if there's still zero
  keepers. Added a deliberate, narrow "emergency keeper" fallback: only
  when **every** recognized keeper at a club is injured, the game (and the
  manager, manually) can put the best available outfield player in goal —
  a real, if rare, football scenario, not a free-for-all position swap. A
  real keeper is always preferred when one's fit. Blackburn, Hull, and
  Middlesbrough are still only one keeper deep (couldn't find a real
  backup name I was confident enough to add rather than guess) — this
  fallback is exactly the safety net for those three. Verified live: the
  normal fill path (Hull, 11/11 via Coach's Help) still works correctly;
  the emergency-fallback branch itself was verified by code review and
  typecheck rather than forcing the ~3%-per-match injury roll to land on
  that exact single keeper within a reasonable test session.

## Transfer deadline news feed + other clubs actually transfer now

User asked whether other clubs get transfers too — answer was previously
no: the only squad changes among AI clubs were as the counterparty to a
swap generated for your own club (accepting an offer did move a player
both ways, but no club ever did business independently). Added
`simulateLeagueTransferActivity` in `CareerScreen.tsx`: whenever a transfer
window opens (pre-season, January, and a new season's pre-season), a
handful of random other clubs now make their own silly straight-swap
deals with each other too — applied directly to their squads, no
offer/accept step since it's not the player's business. Produces a short
list of tabloid headlines ("BREAKING: MUN confirm Federico Macheda heads
to LIV...") shown in a new "Transfer Deadline News" panel at the top of
`TransferWindowScreen`, above the player's own offers. Same spirit as the
rest of the transfer window: a fun addition, not a transfer-market
simulation — AI-to-AI swaps aren't rating-aware, so an occasional headline
reads as comically lopsided (a big name for a squad player), same as the
player's own offers already could. Verified live: news renders correctly,
the player's own accept/decline flow is unaffected, and squads genuinely
update from the AI-to-AI swaps (not just cosmetic text).

**Follow-up, same day**: the window originally dumped everything at once
("one click and it's over"). Rebuilt as a live "deadline day" sequence
instead — asked the user clarifying questions first (clock vs no clock,
skippable or not, combined vs separate feeds, rough duration), all
answered with the recommended option. `TransferWindowScreen` now ticks a
simulated clock hour by hour (09:00-22:00, ~35s total if not skipped,
`DEADLINE_DAY_START_HOUR`/`END_HOUR` exported alongside it), revealing news
and the player's own offers interleaved on one chronological timeline as
their scheduled hour arrives (`CareerScreen.scheduleTransferTimeline`
shuffles both into random hours). A "Skip to Deadline" button jumps
straight to the end, same pattern as the match screen's "Skip to Full
Time"; "Continue" only appears once the sequence has actually finished.
Verified live: clock ticks and progress bar fill, offers/news interleave
correctly, accepting an offer mid-sequence still works, and skip reveals
everything and unlocks Continue.

## Added a 5th formation + trimmed Stats columns

- **5-3-2 formation** added to `data/formations.ts` at the user's explicit
  request — unlike the original 4 (4-4-2/4-3-3/3-5-2/4-5-1, confirmed from
  inspecting the real Team Selection screen), this one is **not** confirmed
  from the original; flagged as such directly in the file's comment, same
  honesty pattern as every other new addition this project has made.
- **Stats screen now shows one column at a time**, matching whichever tab
  is active (Goals/Assists/Yellow Cards/Red Cards), instead of all four
  stat columns regardless of which you'd picked — cleaner, and the sort
  tab you're on is now obviously also the only number on screen.

## Formation change no longer wipes the whole XI

Changing formation used to rebuild every slot empty, even for positions the
new formation still needed the same number of. Replaced with
`transferSlotsToFormation` in `TeamSelectionScreen.tsx`: carries players
over by position — if the new formation needs the same or more of a
position everyone already there stays (extra slots just start empty); if
it needs fewer, only the overflow (last in slot order) gets bumped back to
the bench. So 4-4-2 → 4-3-3 keeps all 4 DEF and 3 of the 4 MID, leaving
just the new 3rd FWD slot and the bumped MID player to sort out — not a
blank pitch. Also corrected a comment that had claimed wipe-on-change was
"confirmed from a real screenshot" — that was true of the *starting* empty
state, not of what happens on a later formation change, which was never
actually confirmed either way; this is a usability choice, not a
faithfulness claim. Verified live: switching 4-4-2 → 4-3-3 → 5-3-2 kept
the same back four and attackers throughout, only ever touching the one
changed position each time.

## Full Time screen tidy-up

User feedback: the per-match "provisional statistical engine... see PLAN.md
Stage 8" disclaimer, shown after *every single match*, was too naggy for
ongoing play — removed the heading's "— Placeholder Simulation" suffix and
the whole explanatory paragraph from `MatchResultScreen.tsx`. The
underlying honesty — this isn't the original's real match engine, which is
still unknown — isn't lost, it's just not repeated on-screen after every
match; PLAN.md remains the source of truth for that caveat. Also put each
scorer on their own line instead of joining them with " · " on one line
(e.g. four different scorers no longer run together into one long string).

## Stadium name and simulated attendance

Added `stadiumName`/`stadiumCapacity` fields to `ClubListing` in
`data/premierLeague0809.ts`, filled in for all 20 clubs. Stadium names and
their 2008/09-era naming are real and era-accurate where it matters most —
notably Manchester City's ground is named "City of Manchester Stadium",
not the "Etihad Stadium" it became in 2011. Capacities are approximate,
rounded figures for the period, not verified exact numbers.

Attendance itself is **not** a real historical figure — there's no source
for actual 2008/09 gate numbers per fixture in this project. `computeAttendance`
in the new `utils/attendance.ts` simulates a plausible attendance as 82%-99%
of the home club's capacity, deterministically hashed from the fixture id
(reusing the same `hash01` string-hash pattern already used for rating
variance in `engine/ratings.ts`) so the same fixture always shows the same
number rather than changing between the live match screen and Full Time.
Purely presentational — not read by the match engine, doesn't affect
results. Shown as "{Stadium Name} · Attendance {number}" under the
scoreboard in `MatchAnimationScreen.tsx` and under the "Full Time" heading
in `MatchResultScreen.tsx`.

## Transfer deadline day: newest-first, rumours, and a countdown

Three refinements to the deadline-day feed in `TransferWindowScreen.tsx`,
all user-requested:

- **Newest at the top.** The feed used to grow downward as the clock
  ticked; `revealed` is now reversed only for display, so the latest
  reveal always appears first, like a live news feed rather than a log.
- **Rumours vs done deals.** Previously every "other clubs" headline was
  phrased as an already-completed swap. Added `simulateLeagueRumours` in
  `CareerScreen.tsx` (new `TRANSFER_RUMOUR_TEMPLATES`) — speculative
  headlines about a player and an "interested" club that are **never**
  applied to any squad, same as real transfer gossip not always coming
  off. Each news entry now carries `confirmed: boolean` and renders a
  clear "DONE DEAL" (green) or "RUMOUR" (amber) badge, so it's obvious at
  a glance which headlines actually moved a player and which are just talk.
- **"Hours left" countdown entries.** `buildCountdownEntries` in
  `CareerScreen.tsx` injects fixed checkpoints (12/9/6/3/1 hours left)
  into the timeline at their corresponding hour, rendered as a distinct
  dashed banner between news/offer panels — not tied to any deal, purely
  there to convey how much of deadline day is left.

All of this is still the same "just for fun" simulation it always was —
no fees, no transfer values, no real market — now just presented with
clearer signal (confirmed vs rumour) and better pacing (newest-first,
countdown) per direct user feedback.

## Club crests in the transfer window

Added small club crests (`ClubCrest`, same component used elsewhere)
alongside every entry in the deadline-day feed: each news item now shows
both clubs involved (linked by a "↔"), and each offer panel shows your
own club against the club the incoming player is coming from. Needed
`clubIds`/`inClubId` plumbed through from `simulateLeagueTransferActivity`,
`simulateLeagueRumours`, and `generateTransferOffers` in `CareerScreen.tsx`
(previously these only carried club *names* in the headline text, not ids),
and a new `managedClubId` prop on `TransferWindowScreen`. Purely visual —
doesn't change which deals/rumours/offers get generated.

## Deadline day gets busier toward the end

User feedback: real deadline days are quiet in the morning and go mad in
the final couple of hours — the feed previously spread news/offers evenly
across the window (roughly one per hour). Replaced the uniform hour
assignment with `pickBiasedHour` in `CareerScreen.tsx`: each item's hour
is still rolled independently, but using the max of three uniform rolls,
which skews the result toward `DEADLINE_DAY_END_HOUR` (several items can
now land in the same hour, and early hours are often empty) rather than
guaranteeing one tidy item per hour. Verified live: a typical window now
has most of its news/offers landing from 18:00 onward, with the last hour
or two visibly the busiest. No change to how many deals/rumours/offers are
generated, just when they land.

## Mobile Team Selection reorder, and a fixable "pick 11" warning

Two usability fixes, both user-reported:

- **Mobile Team Selection order.** Coach's Help and Continue used to sit
  below the entire Squad list, meaning a long scroll past every player row
  just to reach Continue. Reordered `TeamSelectionScreen.tsx`'s mobile
  (below `lg`) stack to Formation → Pitch+Substitutes → Coach's Help +
  Continue → Squad, so both sit right after the pitch instead of at the
  bottom of the page. Desktop's sidebar + main-area layout is unchanged —
  the squad list now gets explicit `lg:col-start-2` placement (it used to
  just follow the pitch panel inside one bundled div) so it still lands in
  the main column below the pitch rather than wrapping under the sidebar.
- **"Pick 11 starters" warning is now a button.** The amber warning shown
  above the fixture list when the XI isn't ready used to be read-only text
  telling you to go fix it on another screen. `FixturesScreen.tsx` now
  takes an `onGoToTeamSelection` prop and renders a "Go to Team Selection"
  button right inside that warning, wired to `setScreen('team')` in
  `CareerScreen.tsx` — one tap instead of finding the nav menu yourself.

## Coach's Help in the pitch title, and live cards under the scoreboard

Two more user-requested refinements:

- **Coach's Help moved into the Pitch panel's title bar.** `Panel.tsx` got
  a new optional `titleAction` slot (rendered right-aligned alongside the
  title text), and `TeamSelectionScreen.tsx` now puts the Coach's Help
  button there instead of in its own "Coach says..." panel further down
  the page. The "drag, or tap a player then tap a slot" instruction moved
  out of the title string (which would've been cramped next to the
  button) to a small caption below the pitch itself. The "Coach says..."
  panel still shows the actual advice content, just without its own
  button now that the trigger lives up by the pitch.
- **Live yellow/red cards under the scoreboard.** `MatchAnimationScreen.tsx`
  already surfaced goals as they happened under the scoreboard; cards now
  do the same — a small colored rectangle (yellow or red, not an emoji, so
  it renders consistently) next to the player's name and minute, appended
  to the same home/away columns as the goal list as `yellow-card`/
  `red-card` events fire during the live match.

## localStorage save/resume

The app previously had zero persistence — closing or refreshing the tab
lost an entire career (squad, fixtures played, injuries, transfers, the
lot). Added a single-slot localStorage save:

- `utils/careerStorage.ts` — `saveCareer`/`loadCareer`/`clearCareer`
  against one fixed key (`fsm-career-v1`), with `loadCareer` rejecting
  anything that isn't valid JSON or is missing the required fields, so a
  corrupted or foreign value in that key can't crash the app on load.
  Covered by its own unit tests (round-trip, overwrite, corrupted JSON).
- `CareerScreen.tsx` now accepts an optional `initialSave` prop and seeds
  every persisted piece of state (formation, XI, fixtures, squads,
  transfer window state, etc.) from it when present and it matches the
  current club; a single `useEffect` autosaves the full snapshot to
  localStorage whenever any of that state changes. Deliberately one save
  slot, not one per club — matches the app's existing single-playthrough
  flow (there's no multi-career-at-once UI).
- `App.tsx` loads the save once at startup and, if present, `TitleScreen`
  shows a "Continue as {Club} — {Manager}" button alongside "New Career".
  Starting a new career or using "Change Club" explicitly clears the save
  (both the localStorage copy and the in-memory one) rather than letting
  it get silently overwritten — picking the same club back wouldn't
  otherwise resurrect the career you just abandoned.
- Never resumes mid-match-animation — a save always restores to the Full
  Time screen for the last-played fixture instead (the result is already
  in `fixtures`, so nothing is lost, just the animation itself replaying).

This is browser-local only — no account, no sync between devices/browsers,
clearing site data wipes it. Good enough for "don't lose your season if
you refresh the tab," not a backend.

## Half time and substitutions

User-requested: a real break at half time, and the ability to make
substitutions during the match instead of only before kickoff. This
needed a genuine engine change, not just a UI one — up to now the whole
90 minutes were simulated instantly, up front, before the live screen
even started (the "live" match was purely a cosmetic replay of an
already-decided result). A substitution that didn't actually change the
remaining minutes would have been a fake feature, so:

- `matchSimulator.ts`: `simulateMatch` is now a thin wrapper around a new
  `createMatchSimulation`, which returns a handle with `advanceTo(minute)`,
  `substitute(side, outPlayerId, inPlayer)`, and `getResult()`. The engine
  can be paused mid-match and resumed; a substitution swaps a player in
  the live XI in place, so scorer/assist/card eligibility for *future*
  minutes picks it up while past events stand untouched. Verified this
  produces byte-identical results to the old one-shot `simulateMatch` for
  a full 90 minutes with no substitution (existing tests + new ones
  covering split-advance, substitution timing, and `homeXI`/`awayXI` now
  including everyone who featured, not just the starting XI).
- `MatchAnimationScreen.tsx` now runs the managed club's match live
  instead of replaying a pre-computed one: first half ticks 1-45, pauses
  on a Half Time panel showing the current on-pitch XI with a same-position
  bench dropdown per player, up to **3 substitutions** (the real limit for
  this era — the five-sub rule didn't exist until 2020), a sent-off player
  can't be subbed (shown struck through, "Sent off"), then "Continue to
  Second Half" runs 46-90. "Skip to Full Time" works from either half or
  from the half-time screen itself, finishing with whatever subs (if any)
  were already made.
- Only the **managed club** gets substitutions — the AI opponent keeps its
  starting XI the whole match. Not confirmed either way from the original
  (which almost certainly let you sub anytime, not just at half time);
  flagged here as a deliberate simplification, not a faithfulness claim.
- `CareerScreen.tsx`'s `playNextFixture` still simulates every *other*
  matchday fixture eagerly and immediately (that's unaffected — only your
  own match is now interactive), but defers the managed fixture itself
  (just reserving its seed, same sequence as before) to the live screen;
  `handleManagedMatchFinished` commits its result and runs the matchday's
  injury pass once the real final XI (starters + subs) is known. A reload
  mid-match (e.g. sitting at half time) isn't persisted — deliberately not
  worth the complexity; it just means replaying that one fixture fresh.

## Cards on the Full Time scoreboard, and a proper match report

Two refinements to `MatchResultScreen.tsx`, both user-requested:

- **Cards alongside the goalscorers.** The scoreboard already listed each
  side's scorers under the score; yellow/red cards now get the same
  treatment in their own row underneath, each with the same small colored
  `CardIcon` used on the live match screen (extracted to a shared
  `components/ui/CardIcon.tsx` so both screens render cards identically).
  Built from `homeBookings`/`homeRedCards` (and the away equivalents),
  flattened and sorted by minute.
- **Match Events now reads like an actual match report.** Added synthetic
  "Kick Off", "Half Time — {score}", and "Full Time — {score}" entries,
  merged into the event list by minute (`buildDisplayEvents`) — these
  aren't stored on `MatchResult` itself, purely a presentational addition.
  Half Time's score is computed from goal events up to minute 45, which
  is now a real match phase the engine actually pauses at (see the half
  time/substitutions entry above), not just an arbitrary cutoff. Every
  card event in the list also gets its `CardIcon` plus colored text —
  previously only red cards were styled differently from a goal; yellow
  cards now get their own color too.

## Multi-league foundation + La Liga (Phase 1 of 3)

User request: expand beyond the Premier League to other European leagues,
plus a Champions League/Europa-style continental competition unlocked by
league-position qualification. Given the size, this is split into three
phases — this entry covers the first: removing every single-league
assumption from the app, and adding one complete second league (La Liga
2008/09) to prove the architecture actually works end-to-end. Serie A,
Bundesliga, and Ligue 1 (mechanical repeats of this same pattern) and the
actual European competition are deliberately follow-up work, not built
here — see the full phased plan this was built from if picking this back
up later.

- **New league registry** (`data/leagues.ts`): `LEAGUES` (currently
  Premier League + La Liga), `ALL_CLUBS` (every club across every league,
  flattened — club ids are globally unique by construction), and
  `getLeagueForClub(clubId)`. Adding a league from here is: a new
  `ClubListing[]` + squad data file following `premierLeague0809.ts` /
  `realSquads2008_09.ts`'s pattern, then one entry in `LEAGUES`.
- **La Liga 2008/09**: `data/laLiga0809.ts` (20 real clubs, club ids
  prefixed `ll-` to guarantee no collision with any other league) and
  `data/realSquadsLaLiga0809.ts` (full rosters for all 20 — every club
  needs a fieldable XI for AI-vs-AI matchday simulation to work at all,
  same reason the Premier League data covers all 20). Same caveats as the
  Premier League data: best-effort reconstruction from memory, not a
  verified source, confidence higher for the bigger clubs. No crest SVGs
  sourced for this league (none fetched, not worth the scope here) — these
  clubs fall back to `ClubCrest`'s generic colored shield, which is why
  `ClubListing.crestPath` is now optional rather than required.
- **Season length generalized**: `JANUARY_MATCHDAY` (was a hardcoded 20)
  and `SEASON_MONTHS` (was a hardcoded 38-matchday breakdown) are now
  computed from the managed league's own club count
  (`(clubCount - 1) * 2` matchdays) via `buildSeasonMonths(totalMatchdays)`
  in `data/seasonMonths.ts` — verified it reproduces the original 38-
  matchday Premier League boundaries exactly (4 matchdays × 8 months, 3 ×
  2), so nothing shifts for existing careers; also verified it splits
  sensibly for an 18-club league's 34 matchdays, ready for Bundesliga in
  Phase 2.
- **Transfer system scoped to the managed league**: `simulateLeagueTransferActivity`,
  `simulateLeagueRumours`, and `generateTransferOffers` (all in
  `CareerScreen.tsx`) used to derive "other clubs" from every key in
  `allSquads` — harmless with one league's worth of clubs in there, but
  once `SQUADS_BY_CLUB_ID` holds multiple leagues' squads this would have
  let a Premier League club swap/rumor players with a La Liga club. Fixed
  by scoping all three to the managed club's own league's club-id list.
  Verified live: a full La Liga pre-season window's headlines and offers
  only ever involved La Liga clubs.
- **League selection UI**: new `screens/LeagueSelectScreen.tsx` inserted
  into `App.tsx`'s flow between manager name and club selection;
  `ClubListScreen` now takes the chosen `league` as a prop instead of
  importing the Premier League directly. `CareerSaveData` gained a
  `leagueId` field; the title screen's "Continue as..." label now also
  shows the league (e.g. "Continue as Real Madrid (La Liga) — Alex").
- Verified live end-to-end in both directions: a brand-new La Liga career
  (Real Madrid and Barcelona both tested) — league select, club select,
  pre-season transfer window with La Liga-only news/offers, playing a live
  match with correct stadium/attendance, Full Time report, league table
  showing all 20 La Liga clubs with qualification zones, save/reload
  correctly resuming "Real Madrid (La Liga)" — and a fresh Premier League
  career, confirming zero regression (transfer headlines stayed
  Premier-League-only, fixtures/table/stats all unaffected).

## League logos on the Choose a League screen

User request: show each league's real 2008/09 title-sponsor logo on the
new league-select screen, not just plain text. Era-matched, same spirit
as the rest of the project (e.g. Man City's stadium not yet being called
the Etihad):

- **Premier League**: the Barclays Premier League lion crest (used
  2007-2016, so exactly era-correct for 2008/09) — `public/leagues/premier-league.png`.
  This one is **not** sourced from Wikipedia like the club crests are:
  the file was deleted from Wikipedia at some point (non-free logos get
  removed once a sponsorship ends and they no longer illustrate current
  content), so it isn't available there anymore. Sourced instead from
  sportslogohistory.com, a sports-logo archive site, under the same
  "private, non-distributed build" basis already established for the
  real (trademarked) club crests — confirmed with the user before
  fetching from a different site than usual.
- **La Liga**: the user first asked for era accuracy here too, and
  "Liga BBVA" (BBVA sponsored La Liga 2008/09-2015/16) went in first —
  but the user then pasted the specific logo they actually meant: the
  modern "LaLiga" pinwheel-ball logo (introduced 2016), not an era match
  at all. Swapped in by their explicit request; the two league logos are
  **not** on the same era-accuracy footing as a result (flagged in the
  `logoPath` doc comment in `leagues.ts`). `public/leagues/la-liga.png`,
  sourced from logowik.com (same "private, non-distributed build" basis
  as the Premier League one — this exact logo isn't on Wikimedia Commons
  either; what's there under "LaLiga.svg" and similar titles has been
  deleted repeatedly per Commons' deletion log).
- `LeagueDefinition` gained an optional `logoPath` (same relative-path,
  no-leading-slash convention as `ClubListing.crestPath`, so it also
  works under GitHub Pages' sub-path). `LeagueSelectScreen.tsx` renders
  it at a fixed height with `object-contain`, since the two logos have
  very different native aspect ratios (a roughly-square badge vs. a wide
  wordmark) — falls back to just the league name if a future league
  doesn't have one sourced yet.

## Swap Continue and Coach's Help positions on Team Selection

User request: Continue moves to where Coach's Help was (the Pitch
panel's title bar, next to the formation name), and Coach's Help moves to
the top-right of the pitch itself. `TeamSelectionScreen.tsx`:

- `Panel`'s `titleAction` for the Pitch panel is now `continueButton`
  instead of `coachHelpButton`.
- `coachHelpButton` is now absolutely positioned (`absolute right-1.5
  top-1.5 z-10`) inside the green pitch div itself, overlaid on the field
  rather than living in a panel header.
- `continueButton` no longer needs duplicating between the mobile
  (order-3) and desktop (sidebar) layout blocks — it only ever renders
  once now, inside the Pitch panel's title, which itself isn't
  duplicated. Simplifies the mobile/desktop layout split slightly.

## Fixed: goalkeepers getting booked far more than anyone else

User-reported: goalkeepers seemed to pick up yellow/red cards more often
than outfield players. Confirmed as a real engine bug, not perception —
card recipients were picked via `weightedPick(pool, (p) => 100 -
p.attributes.defending)`, and a goalkeeper's `defending` attribute is a
meaningless placeholder (0, same as all their non-goalkeeping stats in
`realSquads2008_09.ts`'s `mk()` — GKs don't have a real "defending"
rating, unlike outfield players who at least have a placeholder value
meant to represent something). `100 - 0 = 100` made a keeper's card
weight the *highest* on the pitch (vs ~30 for every outfield player with
the current placeholder data) — backwards from reality, where keepers are
booked far less often than outfield players. With 1 GK in an 11-man XI,
this gave them roughly a 1-in-4 chance of being the player picked for any
given card, instead of a fair ~1-in-11.

Fixed with a dedicated `cardWeight()` in `matchSimulator.ts` that gives
goalkeepers a low fixed weight (10) instead of running them through the
same `100 - defending` formula as outfield players — rare, not never,
since real keepers do occasionally pick up a card (challenges outside the
box, time-wasting, dissent). Used for both yellow and red card selection.

Added a regression test (`does not over-book goalkeepers relative to
outfield players`) that builds a realistic XI (GK `defending: 0`, matching
production data — the existing test helper's flat 60-for-everyone
defaults didn't actually reproduce the bug) and checks goalkeepers make up
well under their "fair share" of cards across 500 simulated matches.
Verified this test fails loudly (23% of cards going to the keeper) against
the old formula and passes against the fix, so it's a real guard, not a
vacuous one.
