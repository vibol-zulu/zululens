# October 2026 provisional dataset — review plan

## Approval gates
Plan only: no app/database/permission/deployment/publication changes. Implementation requires approval; live data import and publication require a separate release decision. Use an isolated draft/test backend for review preview because current backend also serves the public app. Stop before migrations/import if isolation is unavailable. Keep defaults 2025/United States, 2000/2025 selections, styling, colours, logos and contributor/moderation workflows.

## Verified findings
- Revision fe1ee2e13ab120a7087df2b66643e2ef802ccc5d matches the brief; initial working tree clean.
- CSV UTF-8/BOM: 54 unique names/18 fields, 15 corporate/39 independent, 49 Low/5 Very low; country/change_pct blank. Bounds numeric/non-negative/ordered. All 972 fields match workbook Diagram data numerically/exact text/blanks; 12 sheets. Source fact-check/formula recalculation not performed.
- Live read-only: 14 approved 2000; 76 approved 2025 (56 US, 5 UK, 5 Lithuania, 10 TEST), one pending UK, one rejected Global; no 2026. Required country defaults US/year 2025; primary-key/category constraints only. RLS/actual ACL access verified. Existing policies/ownership untouched.
- Hook uses DB brands/static metadata; missing metadata→zero. Years/profiles hard-coded; loading/error ignored. Linear rounded/minimum radii, hidden 0.8 scale, 6px collapsed state, no collision resolution; canvas/guides/settings/methodology need coordinated review.

## Country/identity mapping — approval required
Country means outlet geography, not audience location. Original country blanks remain in provenance/export. US = United States copied from exact live 2025 name/category match, not default. Exact means a unique live match; retain full UUIDs in the import manifest. No fuzzy merges/existing-row edits.

BBC News has no live record (only static): propose new identity/UK pending approval. Reuters/Jordan Peterson Podcast have exact US records but need geography review: explicitly approve US or specify intended country. Alternative: null country, Global-only with “Outlet country unconfirmed”, never country=Global/default US. Implementation approval alone does not resolve choices.

|#|Source outlet|Proposed country|Existing match|
|---|---|---|---|
|1|Fox News|US|Exact|
|2|CNN (Warner Bros. Discovery)|US|Exact|
|3|MSNBC (NBCUniversal)|US|Exact|
|4|NBC News (NBCUniversal)|US|Exact|
|5|ABC News (Disney)|US|Exact|
|6|CBS News (Paramount)|US|Exact|
|7|The New York Times|US|Exact|
|8|The Washington Post|US|Exact|
|9|BBC News|UK? review|New identity required|
|10|Reuters|US? review|Exact|
|11|AP News|US|Exact|
|12|NPR|US|Exact|
|13|PBS NewsHour|US|Exact|
|14|USA Today|US|Exact|
|15|The Wall Street Journal|US|Exact|
|16|Shawn Ryan Show|US|Exact|
|17|MeidasTouch|US|Exact|
|18|Dan Bongino|US|Exact|
|19|Brian Tyler Cohen|US|Exact|
|20|Steven Crowder|US|Exact|
|21|Candace Owens|US|Exact|
|22|Alex Jones|US|Exact|
|23|The Rubin Report|US|Exact|
|24|David Pakman|US|Exact|
|25|Tucker Carlson|US|Exact|
|26|Charlie Kirk|US|Exact|
|27|Megyn Kelly (The Megyn Kelly Show)|US|Exact|
|28|Catturd|US|Exact|
|29|V Spehar (Under The Desk News)|US|Exact|
|30|Jack Posobiec|US|Exact|
|31|Benny Johnson|US|Exact|
|32|Joe Rogan|US|Exact|
|33|Ben Shapiro|US|Exact|
|34|The Young Turks (TYT)|US|Exact|
|35|The Jimmy Dore Show|US|Exact|
|36|Matt Walsh|US|Exact|
|37|Tim Pool (Timcast)|US|Exact|
|38|Michael Knowles|US|Exact|
|39|Kyle Kulinski (Secular Talk)|US|Exact|
|40|HasanAbi|US|Exact|
|41|Breaking Points|US|Exact|
|42|The Hill / Rising|US|Exact|
|43|Heather Cox Richardson|US|Exact|
|44|Jordan Peterson Podcast|US? review|Exact|
|45|LegalEagle|US|Exact|
|46|Channel 5 with Andrew Callaghan|US|Exact|
|47|Beau of the Fifth Column|US|Exact|
|48|Lex Fridman|US|Exact|
|49|Tim Dillon|US|Exact|
|50|Theo Von|US|Exact|
|51|Philip DeFranco|US|Exact|
|52|The Majority Report|US|Exact|
|53|Mehdi Hasan (Zeteo)|US|Exact|
|54|The Good Liars|US|Exact|

53 exact matches/no duplicates. Scope/status review: Fox portfolio, NYT bundle, Hill/Rising, MSNBC/MS NOW, Charlie Kirk archive, Beau/Belle and Alex Jones successors. Preserve source labels/notes; identity linkage does not prove comparable scope. Extra existing outlets untouched/outside scenario.

## Display and workflow
Add “2026 - provisional (October)”; header/details “October 2026 provisional scenario”. Select by dataset identity, not year alone. Historical queries unchanged; scenario only its 54 approved rows with reviewed country filters, Global all. Never mix community 2026 estimates; offer separate “2026 — community records” when available. Same-outlet estimates separately selectable, not added/substituted.

Dataset-aware query/cache/selection keys; clear stale selections/ignore stale responses; explicit loading/error/empty; reload retains current default. Scenario submissions explicitly go to community 2026 through existing moderation, never snapshot edits. Admin/moderator scenario read-only except authorised review/release. Audit form-year defaults, discovery 2025 paths/PDFs/exports; no blanket literal replacement or re-enabled external APIs.

Standing notice:
> Working global cross-platform audience scenarios, not audited unique people. All estimates are low or very-low confidence. Ranges reflect assumptions. The 2025 baseline is not method-comparable, so growth is not shown.

Details show approximate point/range (millions, one decimal), confidence, both available URLs, full input window/method/scope/status notes; mobile-readable without new signup barrier. October is target, not every source period. Revise existing MethodologyModal/inline text: intended UMA versus uncalibrated repetition/overlap/identity/geography/coverage. Bounds are sensitivity scenarios, not statistical intervals. No Mechanical comparison/growth arrows/rankings/percentages.

Omit aggregate by default; if retained, 2,632.3M labelled “Sum of outlet estimates; people may overlap”, not unique people/coverage/market share. Missing metadata=null/unavailable, not zero; boundaries layout-only; no inherited US denominator.

## Technical proposal
Two additive public tables; no user_channels values/columns/triggers changed:
- audience_datasets: ID october-2026-working54-v2, year/label/target window/global scenario/provisional flag, methodology/notice, filenames+SHA-256/version, review/release state/audit dates/users.
- audience_dataset_estimates: UUID/dataset FK, stable outlet identity independent of label/version, optional existing_channel_id, nullable explicitly reviewed country/evidence/state, moderation status/reviewer separate from confidence, source order, typed fields plus exact original 18-field text payload. Unique(dataset,outlet); finite/non-negative/ordered bounds; change_pct null for this dataset. New user references plain UUID/public.profiles, not auth.users.

Point/low/high/2025 reference numeric millions. Preserve exact name/category/platform/contentType/politicalLean/startDate, no locale parsing. Keep confidence/URLs/blanks/window/method/status; original payload retains numeric spellings/country/change blanks for faithful ordered export; mapped country separate. Extend BrandData/query/profile mapping with all qualifications/dataset ID and nullable metadata.

Each table: CREATE→explicit GRANT→RLS→policies. Public SELECT only released/approved; authenticated admin/moderator review via server-validated has_role; controlled privileged import/admin-only release/rollback. No anonymous writes/existing-policy changes/browser roles. Test in isolation.

Shared radius=k*sqrt(millions), positive documented pixels/sqrt(million), same scale across categories/country groups per view. Recalibrate separate area settings, retain old linear settings for rollback; fold 0.8 into scale. No caps/rounding/visible minima; zero area/invalid rejection; separate ≥44px hit targets. Collapsed 6px navigation dots non-quantitative; disclose animation/test settled areas. Label auto-fit; year-independent scale per mode/country. Audit static/live helpers/settings/canvas/collisions/guides/bins/labels/hover/fit/zoom/images/exports together. Preserve logos/colours; decoration cannot substitute quantitative area.

## Staging/import/rollback
1. Preserve sources/hashes; offline/isolated parser/mapping with row+field report. Reject malformed/duplicate/non-finite/negative/misordered, never blank→zero.
2. Fresh schema/record read and dry-run insert/update/skip/conflicts. Expect 54 candidate inserts/0 updates/skips (not executed dry run); BBC identity/three geography choices unresolved. Changed same-key payload conflicts, not silent overwrite.
3. Private affected-record/settings backup; fingerprint complete pre-existing channels (ownership/moderation/timestamps/values) and linked profiles/notifications. No new dataset records currently to back up.
4. Transactional dataset+outlet import; retry skips 54/inserts 0. No baseline copying to 2025, legacy approval triggers or contributor edits. Verify 54 rows/972-field export.
5. Rehearse isolated rollback: withdraw release; restore only dataset backup/settings or delete only dataset-ID rows; retain schema, never year-wide deletion. Old fingerprints unchanged; revert preview sizing/selection separately. Live rollback approval required.

## Acceptance and handover — after approval
- 54x18 source/staged/export equality, exact text/URLs/dates/blanks; numeric/category/confidence counts/bounds/null growth; retry/no duplicates/conflict rejection.
- Complete old-record/side-effect before/after comparison; exactly 54 dataset rows, not whole year/database; approved mapping/unknown-country filters/community isolation.
- Automated 1/4 values: radius ratio 2/area ratio 4; zero/negative/NaN/infinity/positive scale/hit targets/validation/null growth/dataset isolation/server permissions. Keep/run concrete rule tests.
- Desktop/mobile/admin 2000/2025/scenario/reload/country/fast-switch/loading/error/empty; authenticated contributor submission/read-back/moderation; all 54 details, both modes/small-large/labels/overlaps/fit/zoom/PDFs/source export/paused notices. Reproduce known admin-close issue if it blocks checks; no bypass claimed passed.
- Run tests/lint; inspect harness build/console/runtime/screenshots. Runtime/import/security/rollback checks not run yet. Handover: mapping, hashes, dry run, private backup, migration/import steps, results/screenshots/limitations/tested rollback. Preview review before separate production decision.
