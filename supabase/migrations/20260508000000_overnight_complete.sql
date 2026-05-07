-- SERVLO overnight complete migration
-- Adds tables for: notifications, leads_marketplace, social_posts, campaigns, connect_posts, connect_messages, referrals, reviews

-- notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info', -- info|success|warning|error|job|invoice|client
  read boolean not null default false,
  href text,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists notifications_owner_select on public.notifications;
drop policy if exists notifications_owner_insert on public.notifications;
drop policy if exists notifications_owner_update on public.notifications;
drop policy if exists notifications_owner_delete on public.notifications;
create policy notifications_owner_select on public.notifications for select using (auth.uid() = owner_id);
create policy notifications_owner_insert on public.notifications for insert with check (auth.uid() = owner_id);
create policy notifications_owner_update on public.notifications for update using (auth.uid() = owner_id);
create policy notifications_owner_delete on public.notifications for delete using (auth.uid() = owner_id);

-- leads_marketplace
create table if not exists public.leads_marketplace (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  suburb text,
  state text,
  postcode text,
  budget_min integer,
  budget_max integer,
  urgency text default 'standard', -- urgent|standard|flexible
  posted_at timestamptz not null default now(),
  expires_at timestamptz,
  contact_name text,
  contact_phone text,
  contact_email text,
  claimed_by uuid references auth.users(id),
  claimed_at timestamptz,
  status text not null default 'open' -- open|claimed|closed
);
alter table public.leads_marketplace enable row level security;
drop policy if exists leads_marketplace_select on public.leads_marketplace;
create policy leads_marketplace_select on public.leads_marketplace for select using (true);
drop policy if exists leads_marketplace_update on public.leads_marketplace;
create policy leads_marketplace_update on public.leads_marketplace for update using (auth.uid() = claimed_by or claimed_by is null);

-- Insert 12 demo leads
insert into public.leads_marketplace (title, description, category, suburb, state, postcode, budget_min, budget_max, urgency, contact_name, status) values
('Bathroom renovation — full gut and retile', 'Remove existing tiles, waterproof, retile floor and walls, install new vanity and toilet. 2 bathroom home.', 'Tiling', 'Norwood', 'SA', '5067', 3500, 6000, 'standard', 'Sarah M', 'open'),
('Split system AC installation x3 units', 'Need 3 split systems installed across 2-storey home. Existing ducted will remain. Prefer Daikin or Mitsubishi.', 'Air Conditioning', 'Prospect', 'SA', '5082', 4500, 7000, 'standard', 'James K', 'open'),
('URGENT: burst pipe in kitchen', 'Water coming through the wall behind the sink. Need emergency plumber ASAP. Insurance job.', 'Plumbing', 'Glenelg', 'SA', '5045', 800, 2000, 'urgent', 'Linda T', 'open'),
('Deck build — 60sqm treated pine', 'Rear yard deck, approx 60sqm, treated pine, stairs to lawn, balustrade required. Sloped block.', 'Carpentry', 'Burnside', 'SA', '5066', 12000, 18000, 'flexible', 'Robert H', 'open'),
('Roof restoration and repoint', 'Terracotta roof, 1960s home. Repoint ridge capping, clean and reseal entire roof. Quote required.', 'Roofing', 'Unley', 'SA', '5061', 4000, 8000, 'standard', 'Patricia G', 'open'),
('Full house rewire — pre-sale', '3BR 1970s home selling in 90 days, needs rewire to pass inspection. Meter upgrade also needed.', 'Electrical', 'St Peters', 'SA', '5069', 8000, 14000, 'standard', 'David W', 'open'),
('Concrete driveway reseal and crack repair', 'Long driveway, approx 80sqm. Some hairline cracks, moss growth. Clean, repair, reseal.', 'Concreting', 'Modbury', 'SA', '5092', 1200, 2500, 'flexible', 'Karen B', 'open'),
('Install roller shutters — 6 windows', 'Need manual roller shutters on 6 windows. Existing frames are aluminium. Supply and install.', 'Security', 'Campbelltown', 'SA', '5074', 3000, 5500, 'standard', 'Michael S', 'open'),
('Landscaping — native garden front yard', 'Remove existing lawn, install native garden beds, decomposed granite paths, irrigation system.', 'Landscaping', 'Mitcham', 'SA', '5062', 6000, 10000, 'flexible', 'Anne L', 'open'),
('Commercial kitchen exhaust clean', 'Restaurant, bi-annual exhaust clean required for insurance compliance. Canopy, filters and ducts.', 'Commercial Cleaning', 'Adelaide CBD', 'SA', '5000', 600, 1200, 'urgent', 'Tony F', 'open'),
('Painting — full interior 4BR home', 'Prep and paint entire interior, ceilings white, walls agreed colour, trim gloss. 4BR + living areas.', 'Painting', 'Salisbury', 'SA', '5108', 7000, 12000, 'standard', 'Helen P', 'open'),
('Solar 10kW system + battery', '10kW solar, want Enphase microinverters, 1x Powerwall 3 or equiv. Full install, grid connection.', 'Solar', 'Tea Tree Gully', 'SA', '5091', 18000, 28000, 'flexible', 'Chris N', 'open')
on conflict do nothing;

-- social_posts
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  platform text not null, -- facebook|instagram|tiktok
  caption text not null,
  hashtags text[],
  image_url text,
  status text not null default 'draft', -- draft|scheduled|published|failed
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.social_posts enable row level security;
drop policy if exists social_posts_owner_select on public.social_posts;
drop policy if exists social_posts_owner_insert on public.social_posts;
drop policy if exists social_posts_owner_update on public.social_posts;
drop policy if exists social_posts_owner_delete on public.social_posts;
create policy social_posts_owner_select on public.social_posts for select using (auth.uid() = owner_id);
create policy social_posts_owner_insert on public.social_posts for insert with check (auth.uid() = owner_id);
create policy social_posts_owner_update on public.social_posts for update using (auth.uid() = owner_id);
create policy social_posts_owner_delete on public.social_posts for delete using (auth.uid() = owner_id);

-- campaigns (for grow ads)
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  platform text not null default 'facebook',
  objective text,
  budget_daily integer,
  target_suburbs text[],
  headline text,
  body_copy text,
  image_urls text[],
  status text not null default 'draft', -- draft|active|paused|completed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.campaigns enable row level security;
drop policy if exists campaigns_owner_select on public.campaigns;
drop policy if exists campaigns_owner_insert on public.campaigns;
drop policy if exists campaigns_owner_update on public.campaigns;
drop policy if exists campaigns_owner_delete on public.campaigns;
create policy campaigns_owner_select on public.campaigns for select using (auth.uid() = owner_id);
create policy campaigns_owner_insert on public.campaigns for insert with check (auth.uid() = owner_id);
create policy campaigns_owner_update on public.campaigns for update using (auth.uid() = owner_id);
create policy campaigns_owner_delete on public.campaigns for delete using (auth.uid() = owner_id);

-- connect_posts (for SERVLO CONNECT)
create table if not exists public.connect_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  media_urls text[],
  likes integer not null default 0,
  comments integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.connect_posts enable row level security;
drop policy if exists connect_posts_owner_select on public.connect_posts;
drop policy if exists connect_posts_owner_insert on public.connect_posts;
drop policy if exists connect_posts_owner_update on public.connect_posts;
drop policy if exists connect_posts_owner_delete on public.connect_posts;
create policy connect_posts_owner_select on public.connect_posts for select using (auth.uid() = owner_id);
create policy connect_posts_owner_insert on public.connect_posts for insert with check (auth.uid() = owner_id);
create policy connect_posts_owner_update on public.connect_posts for update using (auth.uid() = owner_id);
create policy connect_posts_owner_delete on public.connect_posts for delete using (auth.uid() = owner_id);

-- referrals
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  referrer_name text not null,
  referrer_email text,
  referrer_phone text,
  referred_client_name text,
  referred_client_email text,
  status text not null default 'pending', -- pending|converted|rewarded
  reward_amount integer,
  reward_paid boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;
drop policy if exists referrals_owner_select on public.referrals;
drop policy if exists referrals_owner_insert on public.referrals;
drop policy if exists referrals_owner_update on public.referrals;
drop policy if exists referrals_owner_delete on public.referrals;
create policy referrals_owner_select on public.referrals for select using (auth.uid() = owner_id);
create policy referrals_owner_insert on public.referrals for insert with check (auth.uid() = owner_id);
create policy referrals_owner_update on public.referrals for update using (auth.uid() = owner_id);
create policy referrals_owner_delete on public.referrals for delete using (auth.uid() = owner_id);

-- reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  reviewer_name text not null,
  rating integer not null check (rating between 1 and 5),
  content text,
  platform text not null default 'google', -- google|facebook|yelp
  response text,
  responded_at timestamptz,
  review_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
drop policy if exists reviews_owner_select on public.reviews;
drop policy if exists reviews_owner_insert on public.reviews;
drop policy if exists reviews_owner_update on public.reviews;
drop policy if exists reviews_owner_delete on public.reviews;
create policy reviews_owner_select on public.reviews for select using (auth.uid() = owner_id);
create policy reviews_owner_insert on public.reviews for insert with check (auth.uid() = owner_id);
create policy reviews_owner_update on public.reviews for update using (auth.uid() = owner_id);
create policy reviews_owner_delete on public.reviews for delete using (auth.uid() = owner_id);

-- job_materials
create table if not exists public.job_materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  name text not null,
  quantity numeric not null default 1,
  unit_cost numeric not null default 0,
  supplier text,
  created_at timestamptz not null default now()
);
alter table public.job_materials enable row level security;
drop policy if exists job_materials_owner_select on public.job_materials;
drop policy if exists job_materials_owner_insert on public.job_materials;
drop policy if exists job_materials_owner_update on public.job_materials;
drop policy if exists job_materials_owner_delete on public.job_materials;
create policy job_materials_owner_select on public.job_materials for select using (auth.uid() = owner_id);
create policy job_materials_owner_insert on public.job_materials for insert with check (auth.uid() = owner_id);
create policy job_materials_owner_update on public.job_materials for update using (auth.uid() = owner_id);
create policy job_materials_owner_delete on public.job_materials for delete using (auth.uid() = owner_id);

-- add missing columns to jobs if not exists
alter table public.jobs add column if not exists labour_cost numeric default 0;
alter table public.jobs add column if not exists materials_cost numeric default 0;
alter table public.jobs add column if not exists total_cost numeric default 0;
alter table public.jobs add column if not exists signature_data text;
alter table public.jobs add column if not exists signed_at timestamptz;
alter table public.jobs add column if not exists timer_seconds integer default 0;
alter table public.jobs add column if not exists timer_running boolean default false;
alter table public.jobs add column if not exists timer_started_at timestamptz;
alter table public.jobs add column if not exists is_recurring boolean default false;
alter table public.jobs add column if not exists recurrence_rule text;
alter table public.jobs add column if not exists before_photos text[];
alter table public.jobs add column if not exists after_photos text[];
