# Multi-Tenancy Design — Workspaces

Companion to `../ARCHITECTURE.md`. How Veritas supports individuals **and**
organizations with one model, one code path, and no future migration.

## The core decision

**Everything belongs to a workspace; a user never owns resources directly.**
Every user gets a *personal workspace* at signup. An organization is just a
workspace with more members. Individuals and orgs are the same code path —
a person is a team of one (the GitHub/Vercel/Linear model).

```
auth.users (Supabase — identity only)
     │
     ▼
workspace_members (user_id, workspace_id, role: owner|admin|member)
     │
     ▼
workspaces (id, name, kind: personal|org, plan: free|pro)
     │
     ├── history       who scanned what, when (tenant-private)
     ├── invitations   pending email invites (token, role, expiry)
     ├── usage_events  per-scan metering → billing later
     └── audit_log     append-only org actions (dormant until Phase B)
```

`reports` (the hash-keyed analysis cache) deliberately stays **global** —
the same image yields the same evidence regardless of who scanned it, and
viral images stay near-free. Only *history* is tenant-private.

## Request context

- Client sends the Supabase JWT (`Authorization: Bearer …`) and optionally
  `X-Workspace-Id` to act in a specific workspace.
- No header → the user's personal workspace.
- Header without membership → 403.
- No JWT → anonymous: IP-based quota, no history. Anonymous stays first-class.

Quotas are keyed per **workspace** (`rl:ws:{id}:{day}`), with limits chosen
by the workspace's `plan`. Anonymous remains per-IP.

## Authorization layers

1. **Backend (authoritative)** — runs with the service key; checks membership
   and roles in app code on every request.
2. **RLS (defense-in-depth)** — `is_member(workspace_id)` policies so a future
   direct-from-client path can never read across tenants.

## Identity

Supabase Auth end to end: email/password and OAuth now; SAML SSO later for
enterprise (Supabase supports it). A Postgres trigger on `auth.users` creates
the personal workspace + owner membership atomically at signup.

## Phases

| Phase | Scope | Status |
|---|---|---|
| **A** | Schema, personal-workspace trigger, backend workspace context, web login + server-side history | ✅ this commit |
| **B** | Org creation UI, invite flow (`invitations` + accept endpoint), members page, role enforcement, audit log writes | planned |
| **C** | Stripe per workspace, API keys, SSO, usage-based billing from `usage_events` | planned |

## Phase B sketch (when needed)

- `POST /v1/workspaces` (kind=org), `GET /v1/workspaces` (mine)
- `POST /v1/workspaces/{id}/invites` → row + Supabase `invite_user_by_email`
- `POST /v1/invites/{token}/accept` → membership (validates email + expiry)
- `GET/PATCH/DELETE /v1/workspaces/{id}/members/{user_id}` (role changes, removal)
- Roles: owner (billing + delete), admin (members + invites), member (scan + read history)
- Every mutation writes `audit_log`.

## Scale notes

Single Postgres with `workspace_id` indexes carries this for years — no
sharding, no service split. The API is stateless; horizontal scaling only
requires Upstash (already wired) for shared quota counters. Billing maps
1 Stripe customer = 1 workspace, so personal→Pro upgrades and org seats
need no remodeling.
