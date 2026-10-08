-- Initial file metadata schema. Apply in the Supabase SQL Editor or with the CLI.
create extension if not exists pgcrypto;

create table if not exists public.files (
    id uuid primary key default gen_random_uuid(),
    original_filename text not null check (length(original_filename) > 0),
    stored_filename text not null check (length(stored_filename) > 0),
    file_size bigint not null check (file_size > 0),
    mime_type text not null,
    storage_path text not null unique,
    created_at timestamptz not null default now(),
    -- Reserved for a later deduplication phase; unused by this backend foundation.
    file_hash text,
    duplicate_of uuid references public.files(id) on delete set null,
    similarity_score real check (similarity_score is null or similarity_score between 0 and 1),
    deduplication_status text
);

create index if not exists files_created_at_idx on public.files (created_at desc);
