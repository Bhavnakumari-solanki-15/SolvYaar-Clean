-- Drop existing table if it exists
drop table if exists public.math_history;

-- Create the math_history table with the correct structure
create table public.math_history (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    tool_used text not null,
    input_type text not null,
    topic text,
    content jsonb not null,
    result jsonb not null,
    explanation text,
    created_at timestamptz not null default now(),
    
    constraint fk_user
        foreign key (user_id)
        references auth.users (id)
        on delete cascade
);

-- Create index on user_id and timestamp for faster queries
create index idx_math_history_user_timestamp 
    on public.math_history(user_id, created_at desc);

-- Enable Row Level Security
alter table public.math_history enable row level security;

-- Create policy to allow users to read their own history
create policy "Users can read their own history"
    on public.math_history
    for select
    using (auth.uid() = user_id);

-- Create policy to allow users to insert their own history
create policy "Users can insert their own history"
    on public.math_history
    for insert
    with check (auth.uid() = user_id);

-- Create policy to allow users to delete their own history
create policy "Users can delete their own history"
    on public.math_history
    for delete
    using (auth.uid() = user_id); 