SELECT
  id,
  member_name,
  grad_year,
  city,
  employer,
  job_title
FROM app_alumni__profiles
ORDER BY (grad_year = ''), grad_year DESC, member_name ASC
LIMIT 500
