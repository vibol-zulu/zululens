# Project conventions

- Keep temporary external-feature pauses in `src/lib/temporarilyDisabledFeatures.ts` and show a shared app-level notice before request handlers change state; this prevents disconnected services from producing errors while preserving manual workflows.