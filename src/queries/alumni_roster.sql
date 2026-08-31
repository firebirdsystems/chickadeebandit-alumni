SELECT
  id,
  member_name,
  grad_year,
  city,
  employer,
  job_title
FROM app_alumni__profiles
ORDER BY grad_year DESC, id ASC
LIMIT 500
-- Served by app_alumni__profiles_grad_id_idx with no sort step, so the LIMIT
-- stops the scan early. Blank grad years land last without a leading
-- (grad_year = '') expression -- '' is the minimum TEXT value and this ordering
-- is DESC -- and the tiebreak is `id` rather than `member_name` because
-- member_name is encrypted at rest and would sort as ciphertext. See
-- migrations/002 and sortRoster() in src/logic.js.
