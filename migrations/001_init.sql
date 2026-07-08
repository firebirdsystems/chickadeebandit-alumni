-- Alumni Network — a searchable alumni roster.
--
-- alumni_settings: key/value settings, holds the configured leadership group id.
--   Governed by the `app_config` row policy: readable by all, writable ONLY via
--   the admin-gated POST /run/alumni/api/admin-config endpoint. This is the
--   trust root for "who is leadership" — an ordinary adult must not be able to
--   crown themselves by rewriting the pointer.
CREATE TABLE IF NOT EXISTS app_alumni__alumni_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- profiles: one row per alum, owned by that member.
--   owner_or_visibility + write_owner_only: an alum edits only their own
--   profile; the configured leadership group may edit/remove any. Everyone can
--   read the roster; email/phone are masked (column_read_acls) so only the alum,
--   an active adult member, or leadership can see contact info.
--   grad_year is declared plaintext so it can be sorted in SQL.
CREATE TABLE IF NOT EXISTS app_alumni__profiles (
  id          TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL,
  member_name TEXT NOT NULL,
  grad_year   TEXT DEFAULT '',
  city        TEXT DEFAULT '',
  employer    TEXT DEFAULT '',
  job_title   TEXT DEFAULT '',
  bio         TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  visibility  TEXT NOT NULL DEFAULT 'everyone',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS app_alumni__profiles_member_idx
  ON app_alumni__profiles (member_id);
CREATE INDEX IF NOT EXISTS app_alumni__profiles_grad_idx
  ON app_alumni__profiles (grad_year);
