-- Default categories and site settings. Safe to re-run.
insert into public.categories (slug, name, icon, sort_order) values
  ('parties-events',        'Parties & Events',       'party-popper',   10),
  ('food-catering',         'Food & Catering',        'utensils',       20),
  ('education-tutoring',    'Education & Tutoring',   'graduation-cap', 30),
  ('health-beauty',         'Health & Beauty',        'sparkles',       40),
  ('home-repairs',          'Home & Repairs',         'wrench',         50),
  ('kids-baby',             'Kids & Baby',            'baby',           60),
  ('fashion-accessories',   'Fashion & Accessories',  'shirt',          70),
  ('handmade-gifts',        'Handmade & Gifts',       'gift',           80),
  ('tech-electronics',      'Tech & Electronics',     'laptop',         90),
  ('cars-transport',        'Cars & Transport',       'car',           100),
  ('professional-services', 'Professional Services',  'briefcase',     110),
  ('photography-media',     'Photography & Media',    'camera',        120),
  ('other',                 'Other',                  'shapes',        130)
on conflict (slug) do nothing;

insert into public.site_settings (key, value) values
  ('tagline', 'Find services and goods from people you know, across Lebanon.'),
  ('contact_email', 'hello@example.com'),
  ('about_text', E'As7ab is a free directory for Lebanon. Anyone who offers a service or sells goods can post a listing with photos and contact details, and anyone can find them by searching or browsing categories.\n\nEverything is free for members. The site is kept running by a small number of paid advertising slots.'),
  ('terms_text', E'By posting on As7ab you agree to the following.\n\nYou only post services or goods that are legal in Lebanon.\n\nThe contact details you share are accurate and belong to you or your business.\n\nAdmins may edit, hide or remove any listing at any time, and may remove accounts that abuse the site.\n\nAs7ab connects people; it is not a party to any deal made between members and visitors.'),
  ('announcement_text', ''),
  ('announcement_enabled', 'false')
on conflict (key) do nothing;
