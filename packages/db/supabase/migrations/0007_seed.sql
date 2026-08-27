-- 0007 — Seed data, translated from lib/mock-data.ts
--
-- Fixed UUIDs so the file is re-runnable and rows can be referenced by hand.
-- Timestamps are relative to now() so the Hot and New feeds stay meaningful
-- however long after setup this is applied.
--
-- The eight authors are demo profiles with user_id null — nobody can log in as
-- them. Sign up normally and handle_new_user() creates a real profile.
--
-- Scores start at 0. Real votes in post_votes / comment_votes drive score
-- via triggers (see 0004 / 0014).

-- ------------------------------------------------------------- profiles ----

insert into public.profiles (id, username, display_name) values
  ('11111111-1111-4111-8111-000000000001', 'aung_min',    'Aung Min'),
  ('11111111-1111-4111-8111-000000000002', 'su_latt',     'Su Latt'),
  ('11111111-1111-4111-8111-000000000003', 'khin_thidar', 'Khin Thidar'),
  ('11111111-1111-4111-8111-000000000004', 'zaw_htet',    'Zaw Htet'),
  ('11111111-1111-4111-8111-000000000005', 'nyein_chan',  'Nyein Chan'),
  ('11111111-1111-4111-8111-000000000006', 'thiha_dev',   'Thiha'),
  ('11111111-1111-4111-8111-000000000007', 'htet_aung',   'Htet Aung'),
  ('11111111-1111-4111-8111-000000000008', 'may_phyu',    'May Phyu')
on conflict do nothing;

-- ---------------------------------------------------------- communities ----

insert into public.communities
  (id, slug, name, description, accent, tags, member_count, online_count, founded_at)
values
  ('22222222-2222-4222-8222-000000000001', 'EEE', 'Electrical Engineering',
   'Circuits, power systems, embedded design and everything EE at MTU.',
   'orange', array['engineering','hardware'], 0, 0, now() - interval '1180 days'),

  ('22222222-2222-4222-8222-000000000002', 'IT', 'Information Technology',
   'Software, algorithms, web, AI and IT coursework discussions.',
   'teal', array['software','ai','programming'], 0, 0, now() - interval '1320 days'),

  ('22222222-2222-4222-8222-000000000003', 'Mech', 'Mechanical Engineering',
   'Thermodynamics, CAD, manufacturing and robotics.',
   'navy', array['engineering','robotics'], 0, 0, now() - interval '1090 days'),

  ('22222222-2222-4222-8222-000000000004', 'Civil', 'Civil Engineering',
   'Structures, surveying, materials and construction projects.',
   'green', array['engineering','construction'], 0, 0, now() - interval '1010 days'),

  ('22222222-2222-4222-8222-000000000005', 'CampusLife', 'Campus Life',
   'Events, clubs, hostels, canteen reviews and student life.',
   'emerald', array['social','events'], 0, 0, now() - interval '1400 days'),

  ('22222222-2222-4222-8222-000000000006', 'Exams', 'Exams & Resources',
   'Past papers, study guides, notes and exam schedules.',
   'indigo', array['academics','resources'], 0, 0, now() - interval '1260 days'),

  ('22222222-2222-4222-8222-000000000007', 'MusicClub', 'Music Club',
   'Jam sessions, band practice, gig announcements and gear talk for MTU musicians.',
   'blue', array['club','music','arts'], 0, 0, now() - interval '860 days'),

  ('22222222-2222-4222-8222-000000000008', 'SciTechClub', 'Science & Technology Club',
   'Hackathons, maker projects, research showcases and STEM competitions across MTU.',
   'teal_deep', array['club','stem','projects'], 0, 0, now() - interval '940 days'),

  ('22222222-2222-4222-8222-000000000009', 'PhotographyClub', 'Photography Club',
   'Photo walks, campus shots, editing tips and monthly themed challenges.',
   'navy', array['club','photography','arts'], 0, 0, now() - interval '720 days'),

  ('22222222-2222-4222-8222-000000000010', 'SportsClub', 'Sports Club',
   'Football, basketball, tournaments, fitness and inter-department matches.',
   'emerald', array['club','sports','fitness'], 0, 0, now() - interval '1150 days'),

  ('22222222-2222-4222-8222-000000000011', 'DebateClub', 'Debate & Literary Club',
   'Debates, public speaking, creative writing and English practice sessions.',
   'green', array['club','debate','writing'], 0, 0, now() - interval '680 days')
on conflict do nothing;

-- ------------------------------------------------------ community rules ----

-- The four rules every community shares.
insert into public.community_rules (community_id, position, body)
select c.id, r.position, r.body
  from public.communities c
 cross join (values
   (1::smallint, 'Be respectful. No harassment, hate speech, or personal attacks.'),
   (2::smallint, 'Stay on topic and keep posts relevant to MTU students.'),
   (3::smallint, 'No spam, self-promotion, or reselling of academic material.'),
   (4::smallint, 'Cite sources when sharing notes, papers, or study material.')
 ) as r(position, body)
on conflict do nothing;

-- The one rule each community adds of its own.
insert into public.community_rules (community_id, position, body)
select c.id, 5::smallint, v.body
  from (values
    ('EEE',             'Use the Help flair for circuit troubleshooting and include a schematic.'),
    ('IT',              'Wrap code in code blocks and mention your language/framework.'),
    ('Mech',            'Share CAD files responsibly and respect project ownership.'),
    ('Civil',           'Site photos must not expose private or restricted locations.'),
    ('CampusLife',      'Event posts must include date, venue, and how to join.'),
    ('Exams',           'Label the year and subject clearly when sharing past papers.'),
    ('MusicClub',       'Tag original compositions and covers clearly, and credit collaborators.'),
    ('SciTechClub',     'Project posts should include goals, stack, and how others can contribute.'),
    ('PhotographyClub', 'Only post your own photos and respect the privacy of people in your shots.'),
    ('SportsClub',      'Match posts must include date, venue, and team or department.'),
    ('DebateClub',      'Keep arguments civil — critique ideas, not people.')
  ) as v(slug, body)
  join public.communities c on c.slug = v.slug
on conflict do nothing;

-- ------------------------------------------------- community moderators ----

insert into public.community_moderators (community_id, profile_id)
select c.id, p.id
  from (values
    ('EEE',             'zaw_htet'),
    ('EEE',             'su_latt'),
    ('IT',              'thiha_dev'),
    ('IT',              'aung_min'),
    ('Mech',            'nyein_chan'),
    ('Civil',           'htet_aung'),
    ('CampusLife',      'khin_thidar'),
    ('CampusLife',      'may_phyu'),
    ('Exams',           'su_latt'),
    ('Exams',           'may_phyu'),
    ('MusicClub',       'may_phyu'),
    ('MusicClub',       'khin_thidar'),
    ('SciTechClub',     'thiha_dev'),
    ('SciTechClub',     'nyein_chan'),
    ('PhotographyClub', 'su_latt'),
    ('SportsClub',      'htet_aung'),
    ('SportsClub',      'zaw_htet'),
    ('DebateClub',      'aung_min')
  ) as v(slug, username)
  join public.communities c on c.slug    = v.slug
  join public.profiles    p on p.username = v.username
on conflict do nothing;

-- ---------------------------------------------------------------- posts ----

insert into public.posts
  (id, community_id, author_id, title, body, flair, base_score, score, created_at)
values
  ('33333333-3333-4333-8333-000000000001',
   '22222222-2222-4222-8222-000000000002', '11111111-1111-4111-8111-000000000001',
   'Best roadmap to learn AI/ML as an MTU IT student in 2026?',
   'I keep bouncing between courses and YouTube playlists. Should I start with math (linear algebra + probability) first, or jump straight into building projects with PyTorch? Also is the university GPU lab open for final year students only? Would love a structured path that fits alongside our normal coursework.',
   'Discussion', 0, 0, now() - interval '3 hours'),

  ('33333333-3333-4333-8333-000000000002',
   '22222222-2222-4222-8222-000000000006', '11111111-1111-4111-8111-000000000002',
   'Compiled: All EE past papers (2018-2025) in one Drive folder',
   'Spent the weekend scanning and organizing every Electrical Engineering final paper I could find from seniors. Sorted by year and subject, with a few marking schemes included. Drop a comment if a specific subject is missing and I will try to add it.',
   'Resource', 0, 0, now() - interval '9 hours'),

  ('33333333-3333-4333-8333-000000000003',
   '22222222-2222-4222-8222-000000000005', '11111111-1111-4111-8111-000000000003',
   'Robotics Club is hosting a line-follower competition next month',
   'Registration is open for all years. Teams of up to 3. Prizes for top 3 plus components sponsorship. We will run two practice sessions in the mechatronics lab. Comment if you want to join and I can add you to the group.',
   'Event', 0, 0, now() - interval '5 hours'),

  ('33333333-3333-4333-8333-000000000004',
   '22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000004',
   'Why does my op-amp circuit oscillate at high gain? (schematic inside)',
   'Building a non-inverting amplifier with gain around 100. At lower gain it is stable, but past ~50x it starts oscillating around 2MHz. I suspect stray capacitance or a bandwidth issue with the 741. Should I add a compensation cap or switch to a faster op-amp? Details and layout photo below.',
   'Help', 0, 0, now() - interval '1 hour'),

  ('33333333-3333-4333-8333-000000000005',
   '22222222-2222-4222-8222-000000000003', '11111111-1111-4111-8111-000000000005',
   'CAD tip: parametric modeling saved my final year project',
   'For anyone doing design projects, invest time in setting up parameters and constraints properly in SolidWorks/Fusion. When my supervisor asked for dimension changes the day before submission, I updated 3 variables instead of re-drawing everything. Sharing my template.',
   'Guide', 0, 0, now() - interval '20 hours'),

  ('33333333-3333-4333-8333-000000000006',
   '22222222-2222-4222-8222-000000000002', '11111111-1111-4111-8111-000000000006',
   'Made a small app to track hostel mess menu — open source',
   'Got tired of walking to the canteen only to find the same dish. Built a tiny Next.js app where the mess staff can post the daily menu and students get notified. Code is on GitHub. Looking for contributors, especially for a Burmese language toggle.',
   'Project', 0, 0, now() - interval '14 hours'),

  ('33333333-3333-4333-8333-000000000007',
   '22222222-2222-4222-8222-000000000004', '11111111-1111-4111-8111-000000000007',
   'Field trip to the Yadanabon bridge — structural inspection notes',
   'Our structures lecturer arranged a visit to study the bridge design and load distribution. Sharing my notes on the cable-stayed layout and the expansion joints. Great real-world complement to the theory we covered on tension members.',
   'Discussion', 0, 0, now() - interval '30 hours'),

  ('33333333-3333-4333-8333-000000000008',
   '22222222-2222-4222-8222-000000000006', '11111111-1111-4111-8111-000000000008',
   'Study group forming for Signals & Systems final — join us',
   'We meet twice a week in the library, focusing on Fourier and Laplace problem sets. Currently 5 people, room for a few more. We split topics and teach each other. Comment your subject strengths so we can balance the group.',
   'Study Group', 0, 0, now() - interval '2 hours'),

  ('33333333-3333-4333-8333-000000000009',
   '22222222-2222-4222-8222-000000000007', '11111111-1111-4111-8111-000000000008',
   'Open mic night this Friday at the student center — sign-up inside',
   'Music Club is hosting our monthly open mic. Solo acts, bands, and acoustic sets all welcome. We have a PA, two mics, and a keyboard on site — bring your own guitar. Comment your act and rough set length so we can build the running order.',
   'Event', 0, 0, now() - interval '4 hours'),

  ('33333333-3333-4333-8333-000000000010',
   '22222222-2222-4222-8222-000000000008', '11111111-1111-4111-8111-000000000006',
   '48-hour campus hackathon — teams forming now',
   'Sci & Tech Club is running an overnight hackathon next weekend. Theme is "smarter campus". Prizes for top 3 plus a mentorship slot with alumni. Teams of 2-4. Comment your skills (frontend, hardware, ML, design) and we will help match teams.',
   'Event', 0, 0, now() - interval '7 hours'),

  ('33333333-3333-4333-8333-000000000011',
   '22222222-2222-4222-8222-000000000009', '11111111-1111-4111-8111-000000000002',
   'This month theme: "Campus at Golden Hour" — share your shots',
   'Our monthly challenge is live. Shoot anything on campus during sunrise or sunset. Top 3 by community votes get featured on the club board. Please post straight-out-of-camera or note your edits. Excited to see the library at dusk again.',
   'Challenge', 0, 0, now() - interval '11 hours'),

  ('33333333-3333-4333-8333-000000000012',
   '22222222-2222-4222-8222-000000000010', '11111111-1111-4111-8111-000000000007',
   'Inter-department football tournament bracket is out',
   'The knockout bracket for the semester tournament is finalized. First matches are this Saturday on the main ground. EEE vs Civil kicks off at 9am. Full schedule in comments — come support your department and bring water, it will be hot.',
   'Announcement', 0, 0, now() - interval '6 hours'),

  ('33333333-3333-4333-8333-000000000013',
   '22222222-2222-4222-8222-000000000011', '11111111-1111-4111-8111-000000000001',
   'Motion for this week: "AI does more good than harm for students"',
   'Debate Club meets Thursday evening in the seminar room. This week we argue AI in education. Sign up for government or opposition in the comments. Beginners welcome — we pair new speakers with experienced ones for practice rounds.',
   'Discussion', 0, 0, now() - interval '9 hours')
on conflict do nothing;

-- ------------------------------------------------------------- comments ----
-- Inserted parents-first so the composite (parent_id, post_id) foreign key
-- resolves. posts.comment_count is maintained by trigger, not set here.

insert into public.comments
  (id, post_id, parent_id, author_id, body, base_score, score, created_at)
values
  ('44444444-4444-4444-8444-000000000001', '33333333-3333-4333-8333-000000000001', null,
   '11111111-1111-4111-8111-000000000002',
   'Do the math foundations in parallel, not before. Spend 60% building projects and 40% filling math gaps as you hit them. You retain far more that way.',
   88, 88, now() - interval '2.5 hours'),

  ('44444444-4444-4444-8444-000000000002', '33333333-3333-4333-8333-000000000001',
   '44444444-4444-4444-8444-000000000001', '11111111-1111-4111-8111-000000000001',
   'That makes sense. Any specific first project you would recommend that is not just MNIST?',
   21, 21, now() - interval '2.2 hours'),

  ('44444444-4444-4444-8444-000000000003', '33333333-3333-4333-8333-000000000001',
   '44444444-4444-4444-8444-000000000002', '11111111-1111-4111-8111-000000000005',
   'Build something that uses campus data — a timetable clash detector or a past-paper search engine. Real data keeps you motivated.',
   34, 34, now() - interval '2 hours'),

  ('44444444-4444-4444-8444-000000000004', '33333333-3333-4333-8333-000000000001', null,
   '11111111-1111-4111-8111-000000000003',
   'The GPU lab is open to 3rd and 4th years with a supervisor sign-off. Email the IT department head to get added to the access list.',
   45, 45, now() - interval '1.8 hours'),

  ('44444444-4444-4444-8444-000000000005', '33333333-3333-4333-8333-000000000002', null,
   '11111111-1111-4111-8111-000000000004',
   'This is incredible, thank you. Could you add Power Systems II from 2021? It is missing from the folder.',
   40, 40, now() - interval '8 hours'),

  ('44444444-4444-4444-8444-000000000006', '33333333-3333-4333-8333-000000000002',
   '44444444-4444-4444-8444-000000000005', '11111111-1111-4111-8111-000000000002',
   'Added it just now along with the 2020 version. Refresh the folder.',
   52, 52, now() - interval '7.5 hours'),

  ('44444444-4444-4444-8444-000000000007', '33333333-3333-4333-8333-000000000002', null,
   '11111111-1111-4111-8111-000000000008',
   'Pinning this in our study group. Seniors like you make this place better.',
   30, 30, now() - interval '6 hours'),

  ('44444444-4444-4444-8444-000000000008', '33333333-3333-4333-8333-000000000003', null,
   '11111111-1111-4111-8111-000000000006',
   'Count me in. I can help with the microcontroller firmware side.',
   18, 18, now() - interval '4.5 hours'),

  ('44444444-4444-4444-8444-000000000009', '33333333-3333-4333-8333-000000000003', null,
   '11111111-1111-4111-8111-000000000007',
   'Is there a weight limit on the chassis? Planning our design around it.',
   12, 12, now() - interval '4 hours'),

  ('44444444-4444-4444-8444-000000000010', '33333333-3333-4333-8333-000000000004', null,
   '11111111-1111-4111-8111-000000000005',
   'The 741 is way too slow and its layout is picky. At 2MHz oscillation you are almost certainly seeing feedback instability. Add a small compensation cap (a few pF) across the feedback resistor first.',
   61, 61, now() - interval '0.8 hours'),

  ('44444444-4444-4444-8444-000000000011', '33333333-3333-4333-8333-000000000004',
   '44444444-4444-4444-8444-000000000010', '11111111-1111-4111-8111-000000000004',
   'Tried 5pF and the oscillation stopped but gain dropped slightly. Acceptable tradeoff?',
   15, 15, now() - interval '0.6 hours'),

  ('44444444-4444-4444-8444-000000000012', '33333333-3333-4333-8333-000000000004', null,
   '11111111-1111-4111-8111-000000000001',
   'Also keep your feedback loop physically short and add a ground plane. Stray capacitance on a breadboard causes exactly this.',
   28, 28, now() - interval '0.5 hours'),

  ('44444444-4444-4444-8444-000000000013', '33333333-3333-4333-8333-000000000005', null,
   '11111111-1111-4111-8111-000000000007',
   'Constraints are underrated. Also name your sketches and features — future you will thank present you.',
   22, 22, now() - interval '18 hours'),

  ('44444444-4444-4444-8444-000000000014', '33333333-3333-4333-8333-000000000005', null,
   '11111111-1111-4111-8111-000000000003',
   'Would love the template. Does it include a title block for our department format?',
   9, 9, now() - interval '16 hours'),

  ('44444444-4444-4444-8444-000000000015', '33333333-3333-4333-8333-000000000006', null,
   '11111111-1111-4111-8111-000000000008',
   'This is genuinely useful. I can help with the Burmese translation toggle, DM me the repo.',
   26, 26, now() - interval '13 hours'),

  ('44444444-4444-4444-8444-000000000016', '33333333-3333-4333-8333-000000000006',
   '44444444-4444-4444-8444-000000000015', '11111111-1111-4111-8111-000000000006',
   'Amazing, added you as a collaborator. Localization files are in /locales.',
   14, 14, now() - interval '12 hours'),

  ('44444444-4444-4444-8444-000000000017', '33333333-3333-4333-8333-000000000007', null,
   '11111111-1111-4111-8111-000000000005',
   'Cable-stayed vs suspension is such a good comparison to see in person. Thanks for the notes.',
   11, 11, now() - interval '28 hours'),

  ('44444444-4444-4444-8444-000000000018', '33333333-3333-4333-8333-000000000008', null,
   '11111111-1111-4111-8111-000000000001',
   'Strong on Laplace, weak on Z-transform. Happy to trade.',
   7, 7, now() - interval '1.5 hours'),

  ('44444444-4444-4444-8444-000000000019', '33333333-3333-4333-8333-000000000009', null,
   '11111111-1111-4111-8111-000000000003',
   'Putting my name down for a 10-minute acoustic set. Can I borrow a capo on the night?',
   19, 19, now() - interval '3.5 hours'),

  ('44444444-4444-4444-8444-000000000020', '33333333-3333-4333-8333-000000000009',
   '44444444-4444-4444-8444-000000000019', '11111111-1111-4111-8111-000000000008',
   'Added you to the list. Yes, we will have a couple of capos at the desk.',
   11, 11, now() - interval '3.2 hours'),

  ('44444444-4444-4444-8444-000000000021', '33333333-3333-4333-8333-000000000010', null,
   '11111111-1111-4111-8111-000000000005',
   'In for hardware and a bit of embedded. Would love a frontend teammate to pair with.',
   24, 24, now() - interval '6.5 hours'),

  ('44444444-4444-4444-8444-000000000022', '33333333-3333-4333-8333-000000000010',
   '44444444-4444-4444-8444-000000000021', '11111111-1111-4111-8111-000000000006',
   'I can cover frontend and design. Let us form a team — I will DM you.',
   17, 17, now() - interval '6 hours'),

  ('44444444-4444-4444-8444-000000000023', '33333333-3333-4333-8333-000000000011', null,
   '11111111-1111-4111-8111-000000000004',
   'Got a great shot of the workshop building with the sun behind it last week. Posting tonight.',
   13, 13, now() - interval '10 hours'),

  ('44444444-4444-4444-8444-000000000024', '33333333-3333-4333-8333-000000000012', null,
   '11111111-1111-4111-8111-000000000004',
   'EEE squad ready. Can we get the full schedule pinned so we can plan practice?',
   16, 16, now() - interval '5.5 hours'),

  ('44444444-4444-4444-8444-000000000025', '33333333-3333-4333-8333-000000000012',
   '44444444-4444-4444-8444-000000000024', '11111111-1111-4111-8111-000000000007',
   'Pinned it. Group stage runs Saturday and Sunday, semis next week.',
   10, 10, now() - interval '5 hours'),

  ('44444444-4444-4444-8444-000000000026', '33333333-3333-4333-8333-000000000013', null,
   '11111111-1111-4111-8111-000000000002',
   'Sign me up for opposition. Good practice before the regional competition.',
   8, 8, now() - interval '8.5 hours')
on conflict do nothing;
