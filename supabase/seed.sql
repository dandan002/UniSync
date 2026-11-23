-- Demo data that mirrors the design mockups. Company names are placeholders.
-- Demo sign-ins use the reserved .test domain so no real inbox gets mail.
-- Every demo account shares the password below (see README).

begin;

-- Schools
insert into public.schools (id, name, short_name, email_domain, term_label, required_hours) values
  ('10000000-0000-4000-8000-000000000001', 'Bayview State University', 'Bayview State', 'bayview.test', 'Midyear OJT 2027', 486),
  ('10000000-0000-4000-8000-000000000002', 'Laguna Tech', 'Laguna Tech', 'lagunatech.test', 'Midyear OJT 2027', 600),
  ('10000000-0000-4000-8000-000000000003', 'Rizal Polytechnic', 'Rizal Polytechnic', 'rizalpoly.test', 'Midyear OJT 2027', 486)
on conflict (id) do nothing;

-- Companies (two still need review)
insert into public.companies (id, name, city, about, logo, logo_bg, registration_type, registration_no, work_email, phone,
  registration_check, email_check, phone_check, verified_at) values
  ('20000000-0000-4000-8000-000000000001', 'Kalye Logistics', 'Pasig', 'A same-day delivery company serving online sellers in Metro Manila and Calabarzon.', 'kalye', '#F1EDFF', 'SEC', 'CS201912345', 'hr@kalye.test', '+63 2 8123 4567', 'confirmed', 'confirmed', 'confirmed', now() - interval '60 days'),
  ('20000000-0000-4000-8000-000000000002', 'Mabuhay Foods', 'Calamba', 'A family-owned food manufacturer in Laguna since 1987.', 'mabuhay', '#E8EBFF', 'SEC', 'CS198700112', 'people@mabuhay.test', '+63 49 545 1100', 'confirmed', 'confirmed', 'confirmed', now() - interval '90 days'),
  ('20000000-0000-4000-8000-000000000003', 'Banaba Bank', 'Makati', 'A rural bank with branches across Luzon.', 'banaba', '#F1EDFF', 'SEC', 'CS199500877', 'careers@banaba.test', '+63 2 8888 2200', 'confirmed', 'confirmed', 'confirmed', now() - interval '120 days'),
  ('20000000-0000-4000-8000-000000000004', 'Tanglaw Software', 'Cebu', 'A 25-person software company in Cebu building tools for small businesses.', 'tanglaw', '#E8EBFF', 'SEC', 'CS202100456', 'jobs@tanglaw.test', '+63 32 234 5678', 'confirmed', 'confirmed', 'confirmed', now() - interval '30 days'),
  ('20000000-0000-4000-8000-000000000005', 'Halo-Halo Labs', 'Taguig', 'A small digital studio working with Philippine consumer brands.', 'halo', '#EEF0FA', 'DTI', 'DTI-3345521', 'halohalolabs@gmail.com', '+63 917 555 0142', 'confirmed', 'failed', 'confirmed', null),
  ('20000000-0000-4000-8000-000000000006', 'Pulo Telecom', 'Iloilo', 'A regional telecom provider serving the Visayas and Mindanao.', 'pulo', '#F1EDFF', 'SEC', 'CS201500998', 'talent@pulotelecom.test', '+63 33 320 7000', 'confirmed', 'confirmed', 'pending', null)
on conflict (id) do nothing;

insert into public.school_partners (school_id, company_id, moa_status) values
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'signed'),
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'signed'),
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'sent'),
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'none'),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'signed')
on conflict do nothing;

-- Auth users. The on_auth_user_created trigger builds each profile.
create temporary table demo_users (id uuid, email text, full_name text, meta jsonb) on commit drop;
insert into demo_users values
  ('30000000-0000-4000-8000-000000000001', 'bea.santos@bayview.test', 'Bea Santos', '{}'),
  ('30000000-0000-4000-8000-000000000002', 'paolo.dizon@bayview.test', 'Paolo Dizon', '{}'),
  ('30000000-0000-4000-8000-000000000003', 'jasmine.uy@bayview.test', 'Jasmine Uy', '{}'),
  ('30000000-0000-4000-8000-000000000004', 'mark.villanueva@bayview.test', 'Mark Villanueva', '{}'),
  ('30000000-0000-4000-8000-000000000005', 'andrea.lim@bayview.test', 'Andrea Lim', '{}'),
  ('30000000-0000-4000-8000-000000000006', 'carlo.ramos@bayview.test', 'Carlo Ramos', '{}'),
  ('30000000-0000-4000-8000-000000000007', 'nica.fernandez@bayview.test', 'Nica Fernandez', '{}'),
  ('30000000-0000-4000-8000-000000000008', 'joshua.tan@bayview.test', 'Joshua Tan', '{}'),
  ('30000000-0000-4000-8000-000000000009', 'kim.navarro@bayview.test', 'Kim Navarro', '{}'),
  ('30000000-0000-4000-8000-000000000010', 'ana.castillo@lagunatech.test', 'Ana Castillo', '{}'),
  ('30000000-0000-4000-8000-000000000011', 'ella.ramos@lagunatech.test', 'Ella Ramos', '{}'),
  ('30000000-0000-4000-8000-000000000012', 'leo.bautista@rizalpoly.test', 'Leo Bautista', '{}'),
  ('30000000-0000-4000-8000-000000000013', 'nina.garcia@bayview.test', 'Nina Garcia', '{}'),
  ('30000000-0000-4000-8000-000000000020', 'maria.reyes@bayview.test', 'Maria Reyes', '{}'),
  ('30000000-0000-4000-8000-000000000021', 'ramon.cruz@bayview.test', 'Ramon Cruz', '{}'),
  ('30000000-0000-4000-8000-000000000030', 'liza@kalye.test', 'Liza Ocampo', '{"account_type":"employer"}'),
  ('30000000-0000-4000-8000-000000000031', 'ryan@mabuhay.test', 'Ryan Go', '{"account_type":"employer"}'),
  ('30000000-0000-4000-8000-000000000032', 'tess@pulotelecom.test', 'Tess Navarro', '{"account_type":"employer"}');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated', d.email,
  extensions.crypt('unisync-demo-2027', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', d.full_name) || d.meta,
  now() - interval '45 days', now(),
  '', '', '', '', '', '', '', ''
from demo_users d
where not exists (select 1 from auth.users u where u.id = d.id);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select d.id::text, d.id,
  jsonb_build_object('sub', d.id::text, 'email', d.email, 'email_verified', true),
  'email', now(), now(), now()
from demo_users d
where not exists (select 1 from auth.identities i where i.user_id = d.id and i.provider = 'email');

-- Staff and supervisors
update public.profiles set role = 'coordinator', school_id = '10000000-0000-4000-8000-000000000001', scope = 'BSIT, BSCS'
  where id = '30000000-0000-4000-8000-000000000020';
update public.profiles set role = 'admin', school_id = '10000000-0000-4000-8000-000000000001', scope = 'All programs', last_active_at = now() - interval '2 hours'
  where id = '30000000-0000-4000-8000-000000000021';
update public.profiles set company_id = '20000000-0000-4000-8000-000000000001', scope = 'Kalye Logistics', last_active_at = now() - interval '1 day'
  where id = '30000000-0000-4000-8000-000000000030';
update public.profiles set company_id = '20000000-0000-4000-8000-000000000002', scope = 'Mabuhay Foods', status = 'paused', last_active_at = now() - interval '32 days'
  where id = '30000000-0000-4000-8000-000000000031';
update public.profiles set company_id = '20000000-0000-4000-8000-000000000006', scope = 'Pulo Telecom'
  where id = '30000000-0000-4000-8000-000000000032';
delete from public.student_forms where student_id in (
  '30000000-0000-4000-8000-000000000020', '30000000-0000-4000-8000-000000000021');

insert into public.invites (email, role, school_id, scope, invited_by)
values ('jun.mercado@bayview.test', 'coordinator', '10000000-0000-4000-8000-000000000001', 'BSBA', '30000000-0000-4000-8000-000000000021')
on conflict do nothing;

-- Students
update public.profiles p set course = v.course, year_level = '4th year', city = v.city, last_active_at = now() - v.idle
from (values
  ('30000000-0000-4000-8000-000000000001'::uuid, 'BS Information Technology', 'Laguna', interval '2 hours'),
  ('30000000-0000-4000-8000-000000000002'::uuid, 'BS Information Technology', 'Cainta', interval '1 day'),
  ('30000000-0000-4000-8000-000000000003'::uuid, 'BS Information Technology', 'Makati', interval '3 hours'),
  ('30000000-0000-4000-8000-000000000004'::uuid, 'BS Information Technology', 'Antipolo', interval '16 days'),
  ('30000000-0000-4000-8000-000000000005'::uuid, 'BS Information Technology', 'Calamba', interval '5 hours'),
  ('30000000-0000-4000-8000-000000000006'::uuid, 'BS Information Technology', 'Calamba', interval '2 days'),
  ('30000000-0000-4000-8000-000000000007'::uuid, 'BS Information Technology', 'Santa Rosa', interval '14 days'),
  ('30000000-0000-4000-8000-000000000008'::uuid, 'BS Information Technology', 'Pasig', interval '1 day'),
  ('30000000-0000-4000-8000-000000000009'::uuid, 'BS Information Systems', 'Marikina', interval '6 hours'),
  ('30000000-0000-4000-8000-000000000010'::uuid, 'BS Computer Science', 'Santa Rosa', interval '1 day'),
  ('30000000-0000-4000-8000-000000000011'::uuid, 'BS Information Technology', 'Biñan', interval '1 day'),
  ('30000000-0000-4000-8000-000000000012'::uuid, 'BS Industrial Engineering', 'Pasig', interval '2 days'),
  ('30000000-0000-4000-8000-000000000013'::uuid, 'BS Information Technology', 'Taguig', interval '1 hour')
) as v(id, course, city, idle)
where p.id = v.id;

insert into public.resumes (student_id, data, template, approved_at) values
  ('30000000-0000-4000-8000-000000000001', '{
    "name": "Bea Santos", "course": "BS Information Technology", "school": "Bayview State University",
    "email": "bea.santos@bayview.test", "city": "Laguna", "language": "Taglish", "availability": "April to July",
    "projects": [{"title": "Canteen inventory system, capstone", "line": "Designed the SQL database for a four-person team''s inventory and sales tracker.", "when": "2026"}],
    "experience": [
      {"section": "Leadership", "title": "Treasurer, IT Society", "line": "Collected dues and wrote monthly finance reports for 120 members.", "when": "2025-26"},
      {"section": "Work", "title": "Store assistant, family business", "line": "Restocking, daily cash count and supplier orders.", "when": "2022-present"}
    ],
    "skills": ["SQL", "Database design", "Python", "Figma", "Google Sheets", "Budgeting", "Inventory"],
    "prefs": {"places": ["Pasig", "Calamba", "Remote"], "minAllowance": 3000}
  }', 'classic', now() - interval '20 days'),
  ('30000000-0000-4000-8000-000000000002', '{
    "name": "Paolo Dizon", "course": "BS Information Technology", "school": "Bayview State University", "city": "Cainta", "availability": "April to July",
    "projects": [{"title": "Tourism dashboard", "line": "Made a Power BI dashboard used by the city tourism office.", "when": "2026"}],
    "experience": [{"section": "Activities", "title": "Python and SQL coursework", "line": "Top grades in data management electives.", "when": "2025"}],
    "skills": ["Power BI", "Python", "SQL"], "prefs": {"places": ["Pasig", "Taguig"], "minAllowance": 3000}
  }', 'modern', now() - interval '40 days'),
  ('30000000-0000-4000-8000-000000000003', '{
    "name": "Jasmine Uy", "course": "BS Information Technology", "school": "Bayview State University", "city": "Makati", "availability": "March to June",
    "projects": [{"title": "Help desk ticket tracker", "line": "Built a ticket queue for the campus IT office.", "when": "2026"}],
    "experience": [], "skills": ["Networking", "Customer support", "Windows"], "prefs": {"places": ["Makati"], "minAllowance": 5000}
  }', 'classic', now() - interval '50 days'),
  ('30000000-0000-4000-8000-000000000005', '{
    "name": "Andrea Lim", "course": "BS Information Technology", "school": "Bayview State University", "city": "Calamba", "availability": "April to July",
    "projects": [{"title": "Sari-sari store POS", "line": "Built a point-of-sale app for neighborhood stores.", "when": "2026"}],
    "experience": [{"section": "Leadership", "title": "Secretary, Computing Society", "line": "Ran meeting notes and event sign-ups for 80 members.", "when": "2025-26"}],
    "skills": ["JavaScript", "SQL", "Excel"], "prefs": {"places": ["Calamba", "Santa Rosa"], "minAllowance": 3000}
  }', 'compact', now() - interval '10 days'),
  ('30000000-0000-4000-8000-000000000006', '{
    "name": "Carlo Ramos", "course": "BS Information Technology", "school": "Bayview State University", "city": "Calamba", "availability": "April to July",
    "projects": [{"title": "Warehouse stock app", "line": "Tracked stock levels for a school canteen.", "when": "2026"}],
    "experience": [], "skills": ["Excel", "Inventory", "SQL"], "prefs": {"places": ["Calamba"], "minAllowance": 3000}
  }', 'classic', now() - interval '35 days'),
  ('30000000-0000-4000-8000-000000000008', '{
    "name": "Joshua Tan", "course": "BS Information Technology", "school": "Bayview State University", "city": "Pasig", "availability": "April to July",
    "projects": [{"title": "Jeepney route finder", "line": "Mapped 40 jeepney routes in a mobile web app.", "when": "2026"}],
    "experience": [{"section": "Work", "title": "Part-time encoder", "line": "Encoded 300 records a day for a clinic.", "when": "2025"}],
    "skills": ["React", "Maps", "Data entry"], "prefs": {"places": ["Pasig", "Remote"], "minAllowance": 0}
  }', 'modern', now() - interval '8 days'),
  ('30000000-0000-4000-8000-000000000009', '{
    "name": "Kim Navarro", "course": "BS Information Systems", "school": "Bayview State University", "city": "Marikina", "availability": "April to July",
    "projects": [{"title": "Tableau class project", "line": "Built sales dashboards from a 50,000-row dataset.", "when": "2026"}],
    "experience": [{"section": "Work", "title": "Part-time encoder", "line": "Cleaned and encoded customer records.", "when": "2025"}],
    "skills": ["SQL", "Tableau", "Excel"], "prefs": {"places": ["Pasig", "Marikina"], "minAllowance": 3000}
  }', 'classic', now() - interval '12 days'),
  ('30000000-0000-4000-8000-000000000010', '{
    "name": "Ana Castillo", "course": "BS Computer Science", "school": "Laguna Tech", "city": "Santa Rosa", "availability": "April to July",
    "projects": [{"title": "Thesis: delivery route analysis", "line": "Analyzed delivery routes in Python to cut travel time.", "when": "2026"}],
    "experience": [{"section": "Activities", "title": "Dean''s list", "line": "Three semesters.", "when": "2024-26"}],
    "skills": ["Python", "Pandas", "SQL"], "prefs": {"places": ["Pasig", "Santa Rosa"], "minAllowance": 5000}
  }', 'classic', now() - interval '9 days'),
  ('30000000-0000-4000-8000-000000000011', '{
    "name": "Ella Ramos", "course": "BS Information Technology", "school": "Laguna Tech", "city": "Biñan", "availability": "March to July",
    "projects": [{"title": "Data mining elective", "line": "Top of class in a data mining elective.", "when": "2026"}],
    "experience": [], "skills": ["Python", "SQL", "Statistics"], "prefs": {"places": ["Pasig"], "minAllowance": 5000}
  }', 'modern', now() - interval '15 days'),
  ('30000000-0000-4000-8000-000000000012', '{
    "name": "Leo Bautista", "course": "BS Industrial Engineering", "school": "Rizal Polytechnic", "city": "Pasig", "availability": "May to July",
    "projects": [],
    "experience": [{"section": "Work", "title": "Hardware store assistant", "line": "Ran weekly inventory counts and Excel stock reports.", "when": "2024-present"}],
    "skills": ["Excel", "Inventory", "Operations"], "prefs": {"places": ["Pasig"], "minAllowance": 3000}
  }', 'compact', now() - interval '7 days')
on conflict (student_id) do nothing;

-- Forms (resume is approved for anyone with an approved resume)
update public.student_forms f set status = 'approved'
from public.resumes r where r.student_id = f.student_id and f.form_key = 'resume' and r.approved_at is not null;

update public.student_forms f set status = v.status::public.form_status, updated_at = now() - interval '3 days'
from (values
  ('30000000-0000-4000-8000-000000000001'::uuid, 'consent', 'submitted'),
  ('30000000-0000-4000-8000-000000000001'::uuid, 'endorsement', 'approved'),
  ('30000000-0000-4000-8000-000000000001'::uuid, 'training_plan', 'submitted'),
  ('30000000-0000-4000-8000-000000000002'::uuid, 'consent', 'approved'),
  ('30000000-0000-4000-8000-000000000002'::uuid, 'medical', 'approved'),
  ('30000000-0000-4000-8000-000000000002'::uuid, 'orientation', 'approved'),
  ('30000000-0000-4000-8000-000000000002'::uuid, 'endorsement', 'approved'),
  ('30000000-0000-4000-8000-000000000002'::uuid, 'training_plan', 'approved'),
  ('30000000-0000-4000-8000-000000000003'::uuid, 'consent', 'approved'),
  ('30000000-0000-4000-8000-000000000003'::uuid, 'medical', 'approved'),
  ('30000000-0000-4000-8000-000000000003'::uuid, 'orientation', 'approved'),
  ('30000000-0000-4000-8000-000000000003'::uuid, 'endorsement', 'approved'),
  ('30000000-0000-4000-8000-000000000003'::uuid, 'training_plan', 'approved'),
  ('30000000-0000-4000-8000-000000000004'::uuid, 'consent', 'submitted'),
  ('30000000-0000-4000-8000-000000000005'::uuid, 'consent', 'approved'),
  ('30000000-0000-4000-8000-000000000005'::uuid, 'medical', 'submitted'),
  ('30000000-0000-4000-8000-000000000005'::uuid, 'orientation', 'approved'),
  ('30000000-0000-4000-8000-000000000005'::uuid, 'endorsement', 'approved'),
  ('30000000-0000-4000-8000-000000000006'::uuid, 'consent', 'approved'),
  ('30000000-0000-4000-8000-000000000006'::uuid, 'medical', 'approved'),
  ('30000000-0000-4000-8000-000000000006'::uuid, 'orientation', 'approved'),
  ('30000000-0000-4000-8000-000000000006'::uuid, 'endorsement', 'approved'),
  ('30000000-0000-4000-8000-000000000007'::uuid, 'consent', 'submitted'),
  ('30000000-0000-4000-8000-000000000007'::uuid, 'medical', 'submitted'),
  ('30000000-0000-4000-8000-000000000008'::uuid, 'consent', 'approved'),
  ('30000000-0000-4000-8000-000000000008'::uuid, 'orientation', 'submitted'),
  ('30000000-0000-4000-8000-000000000009'::uuid, 'consent', 'approved'),
  ('30000000-0000-4000-8000-000000000009'::uuid, 'endorsement', 'approved')
) as v(student_id, form_key, status)
where f.student_id = v.student_id and f.form_key = v.form_key;

-- Jobs
insert into public.jobs (id, company_id, title, city, mode, allowance, schedule, dates, hours, teaser, about, duties, needs, perks, programs, skills, openings, created_at) values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Data intern', 'Pasig', 'On-site', 6000,
   'Weekdays, 8 a.m. to 5 p.m.', 'April to July 2027', 600,
   'Build delivery dashboards for the operations team.',
   'Join a six-person analytics team that tracks 3,000 daily deliveries in Metro Manila.',
   array['Clean and join delivery data in SQL', 'Build weekly dashboards for route managers', 'Present one improvement idea at the end'],
   array['BSIT, BSCS, BSIS or BS Statistics', 'Basic SQL and spreadsheets', 'Available April to July for 600 hours'],
   array['Free lunch on-site', 'A mentor from the data team', 'Return offer for top interns'],
   array['Information Technology', 'Computer Science', 'Information Systems', 'Statistics'],
   array['SQL', 'Excel', 'Google Sheets', 'Python', 'Power BI', 'Tableau'], 3, now() - interval '2 days'),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Inventory systems intern', 'Calamba', 'On-site', 3500,
   'Weekdays, 8 a.m. to 5 p.m.', 'April to July 2027', 486,
   'Track inventory across four branches.',
   'Help the supply team fix stock errors between the warehouse and four branches.',
   array['Update the stock database daily', 'Find and fix count mismatches', 'Document how the system works'],
   array['Any IT or business program', 'Spreadsheet skills', 'Lives near Calamba'],
   array['Separate transportation allowance', 'Daily snacks'],
   array['Information Technology', 'Business Admin', 'Accountancy', 'Information Systems'],
   array['Excel', 'Inventory', 'SQL', 'Google Sheets'], 2, now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'IT support intern', 'Makati', 'On-site', 5000,
   'Weekdays, 9 a.m. to 6 p.m.', 'May to July 2027', 486,
   'Provide IT support to 40 branches.',
   'Join the IT service desk that supports 40 branches.',
   array['Answer help desk tickets', 'Set up laptops for new hires', 'Write simple how-to guides'],
   array['BSIT or BSCS', 'Patience on phone calls', 'NBI clearance before start'],
   array['HMO for interns', 'Certificate and reference letter'],
   array['Information Technology', 'Computer Science'],
   array['Networking', 'Customer support', 'Windows'], 2, now() - interval '4 days'),
  ('40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004', 'QA intern', 'Cebu', 'Remote', 4000,
   'Flexible, 30 hours a week', 'April to August 2027', 486,
   'Test a payroll app used by 200 businesses.',
   'Test a payroll web app used by 200 small businesses.',
   array['Write test cases for new features', 'Run regression tests before each release', 'Log clear bug reports'],
   array['Any computing program', 'Stable internet at home', 'Attention to detail'],
   array['Fully remote', 'Internet subsidy'],
   array['Information Technology', 'Computer Science', 'Information Systems'],
   array['Testing', 'Attention to detail', 'Web dev'], 1, now() - interval '3 days'),
  ('40000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000005', 'Web dev intern', 'Taguig', 'Hybrid', 0,
   'Three days a week on-site', 'April to July 2027', 486,
   'Build landing pages with the design team.',
   'Build marketing pages for clients with two designers and a lead developer.',
   array['Code pages in React', 'Fix layout bugs on mobile', 'Join weekly design reviews'],
   array['HTML, CSS and some React', 'A portfolio or GitHub link'],
   array['Work for your portfolio', 'Hybrid schedule'],
   array['Information Technology', 'Computer Science'],
   array['React', 'Web dev', 'JavaScript', 'Figma'], 2, now() - interval '6 days'),
  ('40000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000006', 'Analyst trainee', 'Iloilo', 'Remote', 8000,
   'Weekdays, 9 a.m. to 5 p.m.', 'April to July 2027', 600,
   'Analyze why customers switch networks.',
   'Join the retention team studying why prepaid customers leave.',
   array['Pull churn reports', 'Spot patterns in customer data', 'Present findings to the team'],
   array['IT, Statistics or Business Analytics', 'Excel or SQL', 'Clear writing'],
   array['Laptop provided', 'Mentor from the retention team'],
   array['Information Technology', 'Statistics', 'Business Admin'],
   array['SQL', 'Excel', 'Python'], 2, now() - interval '5 days')
on conflict (id) do nothing;

-- Applications (inserted in their final state)
insert into public.applications (job_id, student_id, status, viewed_at, interview_at, interview_where, created_at, updated_at) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'interview', now() - interval '20 days',
     (date_trunc('day', now() at time zone 'Asia/Manila') + interval '2 days 14 hours') at time zone 'Asia/Manila', 'Google Meet',
     now() - interval '21 days', now() - interval '2 hours'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'reviewing', now() - interval '1 day', null, null, now() - interval '6 days', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'new', null, null, null, now() - interval '5 days', now() - interval '5 days'),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', 'declined', now() - interval '3 days', null, null, now() - interval '8 days', now() - interval '3 days'),
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'hired', now() - interval '40 days', null, null, now() - interval '45 days', now() - interval '35 days'),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'hired', now() - interval '55 days', null, null, now() - interval '60 days', now() - interval '50 days'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000006', 'hired', now() - interval '30 days', null, null, now() - interval '33 days', now() - interval '25 days'),
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005', 'new', null, null, null, now() - interval '1 day', now() - interval '1 day'),
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000008', 'reviewing', now() - interval '2 days', null, null, now() - interval '4 days', now() - interval '2 days'),
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000009', 'interview', now() - interval '5 days',
     (date_trunc('day', now() at time zone 'Asia/Manila') + interval '3 days 10 hours') at time zone 'Asia/Manila', 'Kalye Logistics office, Pasig',
     now() - interval '9 days', now() - interval '4 days'),
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000010', 'new', null, null, null, now() - interval '2 days', now() - interval '2 days'),
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000011', 'offer', now() - interval '10 days', null, null, now() - interval '14 days', now() - interval '2 days'),
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000012', 'new', null, null, null, now() - interval '3 days', now() - interval '3 days')
on conflict (job_id, student_id) do nothing;

-- Time logs: approved history plus a pending week
insert into public.time_logs (student_id, company_id, work_date, hours, note, status, approved_by, created_at)
select s.student_id, s.company_id, current_date - (s.total_days - g + 7), 8, '', 'approved', s.supervisor, now() - (s.total_days - g + 7) * interval '1 day'
from (values
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 26, '30000000-0000-4000-8000-000000000030'::uuid),
  ('30000000-0000-4000-8000-000000000003'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 42, null::uuid),
  ('30000000-0000-4000-8000-000000000006'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 12, '30000000-0000-4000-8000-000000000031'::uuid)
) as s(student_id, company_id, total_days, supervisor)
cross join lateral generate_series(1, s.total_days) as g
where not exists (select 1 from public.time_logs t where t.student_id = s.student_id);

insert into public.time_logs (student_id, company_id, work_date, hours, note, status, created_at)
select v.student_id, v.company_id, current_date - v.d, v.h, v.note, 'pending', now() - v.d * interval '1 day'
from (values
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 1, 8.0, 'Route dashboard filters'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 2, 4.0, 'Data cleanup'),
  ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 3, 8.0, 'Weekly report'),
  ('30000000-0000-4000-8000-000000000003'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 1, 8.0, 'Help desk'),
  ('30000000-0000-4000-8000-000000000003'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 2, 8.0, 'Laptop setup'),
  ('30000000-0000-4000-8000-000000000003'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 3, 8.0, 'Help desk'),
  ('30000000-0000-4000-8000-000000000006'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 1, 8.0, 'Stock count'),
  ('30000000-0000-4000-8000-000000000006'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 2, 8.0, 'Branch visit'),
  ('30000000-0000-4000-8000-000000000006'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 3, 8.0, 'Database fixes')
) as v(student_id, company_id, d, h, note)
where not exists (select 1 from public.time_logs t where t.student_id = v.student_id and t.status = 'pending');

-- Updates: replace trigger noise with the mockup feed
delete from public.notifications;
insert into public.notifications (user_id, title, kind, created_at) values
  ('30000000-0000-4000-8000-000000000001', 'Kalye Logistics wants to interview you', 'interview', now() - interval '2 hours'),
  ('30000000-0000-4000-8000-000000000001', 'Your parent signed the consent form', 'form', now() - interval '1 day'),
  ('30000000-0000-4000-8000-000000000001', 'Two new internships near Calamba', 'job', now() - interval '1 day 2 hours'),
  ('30000000-0000-4000-8000-000000000011', 'Kalye Logistics sent you an offer', 'offer', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000030', 'Andrea Lim applied to Data intern', 'applicant', now() - interval '1 day'),
  ('30000000-0000-4000-8000-000000000030', 'Leo Bautista applied to Data intern', 'applicant', now() - interval '3 days');

-- Activity log
delete from public.audit_log where school_id = '10000000-0000-4000-8000-000000000001';
insert into public.audit_log (school_id, actor_id, actor_name, action, created_at) values
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000020', 'Maria Reyes', 'placed Paolo Dizon at Kalye Logistics', now() - interval '3 hours'),
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000021', 'Ramon Cruz', 'invited Jun Mercado as a coordinator', now() - interval '4 hours'),
  ('10000000-0000-4000-8000-000000000001', null, 'Unisync', 'blocked a message from Halo-Halo Labs asking for a deposit', now() - interval '1 day'),
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000030', 'Liza Ocampo', 'approved four weeks of hours', now() - interval '1 day 3 hours'),
  ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000020', 'Maria Reyes', 'exported the CHED report', now() - interval '22 days');

commit;
