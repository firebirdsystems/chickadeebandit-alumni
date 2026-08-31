-- Serve the roster ordering from an index instead of sorting the whole table.
--
-- The roster read (manifest `preload.profiles`, the app's own fetch, and the
-- alumni_roster AI export) orders by grad_year descending. It used to lead with
-- `(grad_year = '')` to push blank years to the end, but that expression is
-- redundant under DESC — '' is the minimum TEXT value, so descending already
-- sorts it last — and a leading expression blocks any index, so the query fell
-- back to a full scan plus a temp b-tree over every profile.
--
-- The tiebreak is `id`, not `member_name`: member_name is encrypted at rest
-- (only grad_year is declared in db_plaintext_columns), so ordering it in SQL
-- sorted ciphertext and never produced the alphabetical roster it looked like.
-- The alphabetising now happens client-side after decrypt, in logic.js.
--
-- With (grad_year DESC, id ASC) the plan is
--   SCAN app_alumni__profiles USING INDEX app_alumni__profiles_grad_id_idx
-- with no sort step at all, so a bounded read stops early instead of ordering
-- the whole roster to find its first page.
CREATE INDEX IF NOT EXISTS app_alumni__profiles_grad_id_idx
  ON app_alumni__profiles (grad_year DESC, id ASC);
