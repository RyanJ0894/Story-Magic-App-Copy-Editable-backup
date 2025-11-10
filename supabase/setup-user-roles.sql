-- Run this SQL in your Supabase SQL Editor to set up secure role management

-- Create enum for roles
create type public.app_role as enum ('Master', 'Team Lead', 'Staff', 'Client');

-- Create user_roles table
create table public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    role app_role not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique (user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create function to get user's primary role (highest in hierarchy)
create or replace function public.get_user_role(_user_id uuid)
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.user_roles
  where user_id = _user_id
  order by 
    case role
      when 'Master' then 1
      when 'Team Lead' then 2
      when 'Staff' then 3
      when 'Client' then 4
    end
  limit 1
$$;

-- RLS Policies for user_roles
-- Users can view their own roles
create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- Only Masters can insert roles
create policy "Masters can insert roles"
on public.user_roles
for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'Master'::app_role)
);

-- Only Masters can update roles
create policy "Masters can update roles"
on public.user_roles
for update
to authenticated
using (
  public.has_role(auth.uid(), 'Master'::app_role)
);

-- Only Masters can delete roles
create policy "Masters can delete roles"
on public.user_roles
for delete
to authenticated
using (
  public.has_role(auth.uid(), 'Master'::app_role)
);

-- Migrate existing roles from profiles table
insert into public.user_roles (user_id, role)
select user_id, role::app_role
from public.profiles
where role is not null
on conflict (user_id, role) do nothing;

-- Optional: Remove role column from profiles after verifying the migration worked
-- alter table public.profiles drop column if exists role;
