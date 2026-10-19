-- SarkariYogta: duplicate entries check/cleanup (Supabase SQL Editor me chalayein)
-- STEP 1 (sirf dekhne ke liye, safe): same title wali entries
select lower(regexp_replace(title, '[^a-zA-Z0-9]+', ' ', 'g')) as norm_title,
       count(*) as copies, array_agg(slug order by created_at desc) as slugs
from public.jobs
group by 1 having count(*) > 1
order by copies desc;

-- STEP 2 (safe): slug par unique constraint - ye na ho to same slug bhi dobara ban sakta hai
create unique index if not exists jobs_slug_key on public.jobs (slug);

-- STEP 3 (DELETE - pehle STEP 1 ka result dekh lein, backup lein): har title ki sabse nayi entry rakho
-- delete from public.jobs j using (
--   select id, row_number() over (
--     partition by lower(regexp_replace(title, '[^a-zA-Z0-9]+', ' ', 'g')), coalesce(job_type,'')
--     order by created_at desc) as rn
--   from public.jobs) d
-- where j.id = d.id and d.rn > 1;
