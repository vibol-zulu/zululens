# Temporary feature notices

- [x] Identify all user-facing Perplexity and Firecrawl actions.
- [x] Show a shared temporary-disable notice and prevent affected requests.
- [x] Verify signed-in discovery notice and dismissal on desktop/mobile; confirm no affected requests are sent and all six guard tests pass.

Verification limitation: the existing Admin panel closes when opened in the browser check, so its notice controls could not be exercised end-to-end.

# October 2026 provisional dataset

- [x] Validate uploaded CSV/workbook and inspect live schema/outlet mapping read-only.
- [x] Prepare approved addition, acceptance and rollback plan.
- [ ] Implement isolated review preview — blocked: no isolated draft backend is available; new drafts share live data. Await approval for a file-backed preview alternative or an isolated environment.
- [ ] Resolve BBC News identity/country and Reuters/Jordan Peterson outlet-country mapping — awaiting explicit user decision.
- [ ] Stage/import and run acceptance/rollback checks — blocked by isolation and mapping decisions.
- [ ] Live import/publication — requires a separate release decision after preview review.