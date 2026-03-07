<!--
  SYNC NOTES — When updating this file, check whether these adjacent files need changes:
  - Root CLAUDE.md (../../CLAUDE.md) — if the gateway URL or overall routing architecture changes
  - core CLAUDE.md (../../core/CLAUDE.md) — if SPARQL/ingest/health routes change
    (the dashboard and JP bridge call these routes)
  - Platform CLAUDE.md (../../apps/platform/CLAUDE.md) — if church search routes, MCP endpoint,
    or auth policies change (the platform calls these routes)
  Key coupling points: route paths, policy names, env var names, MCP tool schema
-->

# globalchurch-api-gateway — Zuplo API Gateway

## What This Is

The Zuplo API gateway that sits in front of both GraphDB (knowledge graph) and Supabase (church directory). Handles authentication, rate limiting, CORS, and request routing. Also exposes an MCP server endpoint for AI agent integration.

Deployed at: **api.global.church** (custom domain, migrated from `global-church-main-ba4d06e.zuplo.app`)

## Routes

Both `/v0/` (new) and `/v1/` (legacy) routes are served. Consumers should migrate to `/v0/`. Legacy routes will be removed after a 30-day deprecation window.

### Knowledge Graph

| Method | New Path | Legacy Path | Backend | Purpose |
|--------|----------|-------------|---------|---------|
| POST | `/v0/sparql` | `/v1/gc-core/sparql` | GraphDB SPARQL endpoint | Query the knowledge graph |
| POST | `/v0/ingest` | `/v1/gc-core/ingest` | GraphDB statements endpoint | Ingest RDF triples (Turtle, N-Triples, RDF/XML) |
| GET | `/v0/health` | `/v1/gc-core/health` | GraphDB size endpoint | Health check |

Accept headers for SPARQL: `application/sparql-results+json`, `application/sparql-results+xml`, `text/csv`, `text/turtle`

### Organization Search (Directory)

| Method | New Path | Legacy Path | Backend | Purpose |
|--------|----------|-------------|---------|---------|
| GET | `/v0/orgs/search` | `/v1/churches/search` | Supabase Edge Function | Free-text, geo, filter search |
| GET | `/v0/orgs/{id}` | `/v1/churches/{id}` | Supabase Edge Function | Fetch full org details |

### MCP Server

| Method | New Path | Legacy Path | Purpose |
|--------|----------|-------------|---------|
| POST | `/v0/mcp` | `/mcp` | MCP tool listing endpoint for AI agents |

Exposes `churches_search_v1` tool. Auth via Bearer token or `?apiKey=` query param.

### Onboarding & Claims

| Method | New Path | Legacy Path | Backend |
|--------|----------|-------------|---------|
| POST | `/v0/onboarding/claim-org` | `/v1/onboarding/claim-org` | Supabase Edge Function |
| GET/POST | `/v0/onboarding/check-user` | `/v1/onboarding/check-user` | Supabase Edge Function |
| PATCH | `/v0/profile` | — | Supabase Edge Function |
| GET | `/v0/admin/claims` | `/v1/admin/claims` | Supabase Edge Function |
| POST | `/v0/admin/claims/review` | `/v1/admin/claims/review` | Supabase Edge Function |
| GET | `/v0/engagement-claims` | `/v1/engagement-claims` | Supabase Edge Function |
| POST | `/v0/engagement-claims/submit` | `/v1/engagement-claims/submit` | Supabase Edge Function |
| POST | `/v0/hex-viewport` | `/v1/hex-viewport` | Supabase Edge Function |

## Policies

- **require-api-key** — API key authentication on all routes
- **ratelimit-per-partner** — 200 requests/minute, dynamic rate limiting function
- **inject-partner-id** — Injects consumer subject into `x-partner-subject` header
- **inject-graphdb-auth** — Sets Basic Auth header for GraphDB routes (SPARQL, ingest, health)
- **inject-supabase-jwt** — For church search routes (Supabase integration)
- **custom-cors** — Shared CORS policy for all GC-Core routes
- **log-incoming-headers-mcp** — Request/response logging
- **mcp-query-param-to-header-inbound** — Query param to header conversion for MCP auth

## Key Config Files

- `config/routes.oas.json` — OpenAPI route definitions
- `config/policies.json` — Policy configurations
- `modules/` — Custom policy implementations (rate limiting function, header injection, logging)

## Environment Variables

- `GRAPHDB_URL` — GraphDB endpoint URL
- `GRAPHDB_BASIC_AUTH` — Basic Auth header value for GraphDB (e.g. `Basic enVwbG9fcmVhZGVyOnNlY3JldA==`). Used by `inject-graphdb-auth` policy on SPARQL, ingest, and health routes.
- `SUPABASE_FUNCTIONS_BASE` — Supabase Edge Functions base URL
- `SUPABASE_ANON_JWT` — Supabase anonymous JWT
- `SUPABASE_SECRET_KEY` — Supabase secret key
