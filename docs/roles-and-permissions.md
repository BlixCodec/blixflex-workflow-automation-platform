# Roles & Permissions

> The access-control model for BlixFlex. Sanitized: illustrative SQL/TypeScript shown to
> communicate the pattern; not a literal copy of production policies.

## Principles

1. **Authorize in the database, not the UI.** The UI hides things for usability, but the
   real decision is made by Row-Level Security (RLS) policies and helper functions in
   Postgres. App, automation, and direct queries all obey the same rules.
2. **Roles live in their own table.** A user's role is stored in `user_roles`, never on the
   editable user profile — so a user can't grant themselves a role by editing their own row.
3. **Least privilege, granularly.** Beyond coarse roles, admins get per-section
   `view` / `edit` / `delete` flags so access maps to actual responsibility.

## Two layers

### Layer 1 — Coarse roles

A small enum of roles:

| Role | Scope |
|---|---|
| `admin` | Operate the platform (scoped further by granular permissions) |
| `analyst` | Review and manage assigned cohorts/accounts |
| `participant` | Their own application, onboarding, account, and progress |

A `SECURITY DEFINER` helper checks role membership and is referenced by RLS policies:

```sql
-- Roles are stored separately from the profile to prevent self-escalation.
create table user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    app_role not null,                  -- enum: 'admin' | 'analyst' | 'participant'
  unique (user_id, role)
);

-- SECURITY DEFINER so the check can read user_roles regardless of the caller's RLS.
create or replace function has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = _user_id and role = _role
  );
$$;
```

Example policy using it:

```sql
-- Admins can read every account; participants can read only their own.
create policy accounts_select on accounts
for select using (
  has_role(auth.uid(), 'admin')
  or owner_id = auth.uid()
);
```

### Layer 2 — Granular admin permissions

Not every admin should touch everything. A permissions table scopes admins by section:

```sql
create table admin_permissions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  section    varchar(100) not null,   -- e.g. 'payouts', 'applications', 'branding'
  can_view   boolean default false,
  can_edit   boolean default false,
  can_delete boolean default false,
  granted_by uuid,
  unique (user_id, section)
);
```

A helper resolves an effective permission, and sensitive sections check it in addition to
the `admin` role:

```sql
create or replace function can_edit_section(_user_id uuid, _section text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_permissions
    where user_id = _user_id and section = _section and can_edit = true
  );
$$;
```

So an admin scoped to `applications` can edit applications but not, say, payouts — even
though both are "admin" areas.

## How the client uses it

The client mirrors these checks for UX only — to hide controls a user can't use — but
**never relies on them for security**. Every protected read/write is still gated by RLS, so
a forged client request simply fails at the database.

A small, framework-agnostic example of resolving and checking permissions is in
[`../code-samples/role-based-access/`](../code-samples/role-based-access/).

## Permission matrix (illustrative)

| Capability | Participant | Analyst | Admin (scoped) | Admin (full) |
|---|:--:|:--:|:--:|:--:|
| View own application / onboarding | ✅ | — | — | ✅ |
| View assigned cohorts/accounts | — | ✅ | per-section | ✅ |
| Review applications | — | — | if `applications` | ✅ |
| Review/approve payouts | — | — | if `payouts` | ✅ |
| Manage roles & permissions | — | — | if granted | ✅ |
| Edit branding/content | — | — | if `branding` | ✅ |

## Audit

Permission grants and changes, approvals, and other sensitive actions write audit records
(`who`, `what`, `when`). See [`../examples/sample-admin-action-log.json`](../examples/sample-admin-action-log.json)
for the shape.

## Related docs
- [architecture.md](architecture.md)
- [handoff-runbook.md](handoff-runbook.md)
