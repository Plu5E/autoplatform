-- ============================================================
-- AUTOPLATFORM — Supabase database schema
-- Kopieer dit volledig in Supabase → SQL Editor → Run
-- ============================================================

-- Garages tabel (elke SaaS-klant is een garage)
create table if not exists garages (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  email text not null unique,
  telefoon text,
  website text,
  logo_url text,
  kleur text default '#1a3a8f',
  plan text default 'basis' check (plan in ('basis','medium','premium')),
  actief boolean default true,
  aangemaakt_op timestamptz default now()
);

-- Standaard garage aanmaken voor 2maal2
insert into garages (naam, email, telefoon, website, kleur, plan)
values ('2maal2', 'info@2maal2.be', '+32 56 00 00 00', 'https://2maal2.be', '#1a3a8f', 'medium')
on conflict do nothing;

-- Leads tabel (elke voertuigaanvraag van een verkoper)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid references garages(id) on delete cascade,
  referentie text unique not null default 'REF-' || upper(substring(gen_random_uuid()::text, 1, 8)),

  -- Voertuig info
  kenteken text,
  merk text not null,
  model text not null,
  bouwjaar integer,
  brandstof text,
  transmissie text,
  carrosserie text,
  kleur text,
  km integer,
  pk integer,
  opties text,

  -- Staat
  staat text check (staat in ('uitstekend','goed','matig','herstel')),
  gebreken text,
  onderhoud text,

  -- Foto's (array van Supabase Storage URLs)
  foto_urls text[] default '{}',

  -- Bod berekening
  marktwaarde integer,
  staat_correctie integer default 0,
  km_correctie integer default 0,
  herstel_reserve integer default 0,
  bod integer,

  -- Verkoper contact
  verkoper_naam text,
  verkoper_telefoon text,
  verkoper_email text,

  -- Status flow
  status text default 'nieuw' check (status in ('nieuw','in_review','bod_verstuurd','geaccepteerd','inspectie','afgerond','afgewezen','vervallen')),

  -- Timestamps
  aangemaakt_op timestamptz default now(),
  bod_verstuurd_op timestamptz,
  geaccepteerd_op timestamptz,
  afgerond_op timestamptz
);

-- Marges tabel (instellingen per garage)
create table if not exists marges (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid references garages(id) on delete cascade unique,

  -- Basiskorting op marktwaarde (%)
  basis_korting integer default 15,

  -- Staat-correcties (€)
  correctie_uitstekend integer default 0,
  correctie_goed integer default 300,
  correctie_matig integer default 700,
  correctie_herstel integer default 1400,

  -- Km-correctie
  km_drempel integer default 80000,
  km_correctie_per_1000 integer default 35,

  -- Vaste herstelreserve
  herstel_reserve integer default 300,

  bijgewerkt_op timestamptz default now()
);

-- Standaard marges aanmaken voor 2maal2
insert into marges (garage_id)
select id from garages where email = 'info@2maal2.be'
on conflict do nothing;

-- Notificaties log
create table if not exists notificaties (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid references garages(id),
  lead_id uuid references leads(id),
  type text,
  ontvanger text,
  verstuurd_op timestamptz default now(),
  gelukt boolean default true
);

-- Row Level Security inschakelen
alter table garages enable row level security;
alter table leads enable row level security;
alter table marges enable row level security;
alter table notificaties enable row level security;

-- Policies: service role heeft volledige toegang (voor API routes)
create policy "service_role_all" on garages for all using (true);
create policy "service_role_all" on leads for all using (true);
create policy "service_role_all" on marges for all using (true);
create policy "service_role_all" on notificaties for all using (true);

-- Storage bucket voor voertuigfoto's aanmaken
insert into storage.buckets (id, name, public)
values ('voertuig-fotos', 'voertuig-fotos', true)
on conflict do nothing;

-- Storage policy: iedereen mag uploaden, iedereen mag lezen
create policy "publiek lezen" on storage.objects
  for select using (bucket_id = 'voertuig-fotos');

create policy "publiek uploaden" on storage.objects
  for insert with check (bucket_id = 'voertuig-fotos');

-- Voeg fotos_config kolom toe aan marges tabel (voer dit uit in Supabase SQL Editor)
alter table marges add column if not exists fotos_config jsonb default null;

-- Voer dit uit in Supabase SQL Editor om nieuwe velden toe te voegen:
alter table garages add column if not exists adres text default 'Statiestraat 88, 8570 Anzegem';
alter table garages add column if not exists notificatie_email text default null;
alter table garages add column if not exists notificatie_sms text default null;
alter table garages add column if not exists auto_bod boolean default true;
alter table garages add column if not exists openingsuren text default null;
alter table garages add column if not exists welkomstbericht text default null;
alter table leads add column if not exists notitie text default null;
alter table marges add column if not exists fotos_config jsonb default null;
