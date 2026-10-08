-- Step 2: persist file analysis while keeping file metadata and binary storage intact.
alter table public.files
    add column if not exists analysis_status text,
    add column if not exists analyzed_at timestamptz;

-- Exact duplicates reference the same Storage object, so storage_path must not be unique.
alter table public.files drop constraint if exists files_storage_path_key;

create index if not exists files_file_hash_idx
    on public.files (file_hash) where file_hash is not null;
create index if not exists files_deduplication_status_idx
    on public.files (deduplication_status);
create index if not exists files_analysis_status_idx
    on public.files (analysis_status);

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'files_deduplication_status_check'
    ) then
        alter table public.files add constraint files_deduplication_status_check
            check (deduplication_status is null or deduplication_status in ('pending', 'unique', 'duplicate', 'similar'));
    end if;
    if not exists (
        select 1 from pg_constraint where conname = 'files_analysis_status_check'
    ) then
        alter table public.files add constraint files_analysis_status_check
            check (analysis_status is null or analysis_status in ('pending', 'completed', 'unsupported', 'failed'));
    end if;
end $$;

-- Extracted text is capped by the backend (30,000 characters by default) and kept
-- separate from the primary metadata table to avoid bloating every file record.
create table if not exists public.file_analysis (
    file_id uuid primary key references public.files(id) on delete cascade,
    extracted_text text not null default '',
    updated_at timestamptz not null default now()
);
