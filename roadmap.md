# Temporary feature notices

- [x] Identify all user-facing Perplexity and Firecrawl actions.
- [x] Show a shared temporary-disable notice and prevent affected requests.
- [x] Verify signed-in discovery notice and dismissal on desktop/mobile; confirm no affected requests are sent and all six guard tests pass.

Verification limitation: the existing Admin panel closes when opened in the browser check, so its notice controls could not be exercised end-to-end.

# October 2026 provisional dataset

- [x] Validate uploaded CSV/workbook and inspect live schema/outlet mapping read-only.
- [x] Prepare approved addition, acceptance and rollback plan.
- [ ] Implement file-backed review preview in a separate draft; no database writes.
- [x] Resolve scenario mapping: BBC News United Kingdom, Reuters United Kingdom, Jordan Peterson Podcast Canada; existing records unchanged.
- [ ] Validate preview/round-trip/area rules — continue in the draft.
- [ ] Database staging/import/rollback — blocked until an isolated environment or separate live-data approval is available.
- [ ] Live import/publication — requires a separate release decision after preview review.