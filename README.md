# Alumni Network

A searchable alumni roster — graduation year, current city, employer, and
opt-in contact info. Alumni update their own profile, active members browse the
network, and leadership manages the roster. Keeps chapter history alive without
giving alumni full hub access.

---

## Access model

- **`app_alumni__profiles`** — `owner_or_visibility` with `write_owner_only`:
  - Everyone can read the roster (all profiles are `visibility: 'everyone'`).
  - Each alum can create/edit/remove **only their own** profile (INSERT forces
    `member_id` to the caller).
  - The configured **leadership** group (`privileged_groups`) can edit/remove
    **any** profile.
  - `email` / `phone` are masked by `column_read_acls` — visible only to the
    profile **owner**, an **adult** (active member), or **leadership**. Contact
    info is opt-in: leave it blank to keep it private.
- **`app_alumni__alumni_settings`** — `app_config`. Holds the leadership group
  pointer; writable **only** through the admin-gated `api/admin-config`
  endpoint, so an ordinary adult can't crown themselves leadership. A hub admin
  picks the group from the in-app settings bar.

The `isLeadership` client gate mirrors the hub's group resolution exactly (no
"all adults" fallback when unconfigured) and is pinned by the shared
privileged-gate contract test in `__tests__/logic.test.mjs`.

## Quick start

```bash
npm run dev     # preview at http://localhost:3001
npm run build   # produce dist/bundle.json
npm test        # manifest + logic/gate contract tests
```
