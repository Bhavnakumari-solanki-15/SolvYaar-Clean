-- Create enum for user roles
create type user_role as enum ('admin', 'developer', 'user');

-- Add role column to profiles table
alter table public.profiles
add column role user_role not null default 'user';

-- Create index on role for faster queries
create index idx_profiles_role on public.profiles(role);

-- Create policy to allow users to read roles
create policy "Users can read roles"
    on public.profiles
    for select
    using (true);

-- Create policy to allow admins to update roles
create policy "Admins can update roles"
    on public.profiles
    for update
    using (auth.uid() in (
        select id from public.profiles where role = 'admin'
    ))
    with check (auth.uid() in (
        select id from public.profiles where role = 'admin'
    ));

-- Insert initial admin user (replace with your admin user's ID)
-- You'll need to set this after creating your first admin user
-- update public.profiles
-- set role = 'admin'
-- where id = 'your-admin-user-id'; 