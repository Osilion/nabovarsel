-- =============================================================
-- Nabovarsel – Database Schema
-- =============================================================

-- 0. Helper: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. Profiles (mirrors auth.users)
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text,
  company     text,
  phone       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Projects (a nabovarsel case for a property)
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  name            text not null,
  description     text,
  kommune_nr      text,
  kommune_navn    text,
  gnr             integer,
  bnr             integer,
  fnr             integer,
  snr             integer,
  address         text,
  status          text not null default 'draft'
    check (status in ('draft','ready','sending','partially_sent','sent','completed','archived')),
  deadline        date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.projects enable row level security;
create policy "Users manage own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- 3. Neighbors (identified from matrikkel/grunnbok)
create table public.neighbors (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects on delete cascade,
  -- Property info
  gnr             integer,
  bnr             integer,
  fnr             integer,
  snr             integer,
  kommune_nr      text,
  address         text,
  -- Owner info (from grunnbok)
  owner_name      text,
  owner_type      text check (owner_type in ('person','company','municipality','state','unknown')),
  org_number      text,
  person_id       text,           -- masked/hashed for privacy
  contact_email   text,
  contact_phone   text,
  contact_address text,
  -- Relation to source property
  relation_type   text not null default 'neighbor'
    check (relation_type in ('neighbor','gjenboer','adjacent','easement_holder','other')),
  distance_meters numeric,
  -- Notification status
  notification_status text not null default 'pending'
    check (notification_status in ('pending','sending','sent','delivered','read','responded','protested','no_response','failed')),
  notification_sent_at  timestamptz,
  notification_method   text check (notification_method in ('altinn','email','mail','manual')),
  response_deadline     date,
  response_received_at  timestamptz,
  response_type         text check (response_type in ('no_protest','protest','conditional','none')),
  response_text         text,
  -- Meta
  source          text default 'manual' check (source in ('matrikkel','grunnbok','manual','utskiller')),
  raw_data        jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.neighbors enable row level security;
create policy "Users manage neighbors via project" on public.neighbors
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

create trigger neighbors_updated_at before update on public.neighbors
  for each row execute function public.set_updated_at();

-- 4. Notification log (audit trail for every send attempt)
create table public.notification_log (
  id                uuid primary key default gen_random_uuid(),
  neighbor_id       uuid not null references public.neighbors on delete cascade,
  project_id        uuid not null references public.projects on delete cascade,
  method            text not null check (method in ('altinn','email','mail','manual')),
  altinn_reference  text,
  status            text not null default 'queued'
    check (status in ('queued','sending','sent','delivered','failed','bounced')),
  error_message     text,
  sent_at           timestamptz,
  delivered_at      timestamptz,
  payload           jsonb,
  created_at        timestamptz default now()
);

alter table public.notification_log enable row level security;
create policy "Users view own notification logs" on public.notification_log
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- 5. Documents (attached to project – situasjonsplan, vedlegg, etc.)
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects on delete cascade,
  name          text not null,
  file_path     text,
  file_type     text,
  file_size     integer,
  doc_type      text not null default 'attachment'
    check (doc_type in ('nabovarsel_skjema','situasjonsplan','tegning','vedtak','attachment','response')),
  uploaded_by   uuid references auth.users,
  created_at    timestamptz default now()
);

alter table public.documents enable row level security;
create policy "Users manage own documents" on public.documents
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- Indexes
create index idx_projects_user_id on public.projects (user_id);
create index idx_neighbors_project_id on public.neighbors (project_id);
create index idx_neighbors_status on public.neighbors (notification_status);
create index idx_notification_log_neighbor on public.notification_log (neighbor_id);
create index idx_notification_log_project on public.notification_log (project_id);
create index idx_documents_project_id on public.documents (project_id);
