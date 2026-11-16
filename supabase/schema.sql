-- Pinote: skema database untuk Supabase
-- Cara pakai: buka SQL Editor di dashboard Supabase, tempel seluruh isi file ini, lalu klik Run.
-- Aman dijalankan ulang (memakai IF NOT EXISTS).
-- Bucket gambar "images" dibuat manual lewat menu Storage (private).

-- =========================================================
-- Folder
-- =========================================================
create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 100),
  is_private  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- =========================================================
-- Item (link / image / text)
-- =========================================================
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('link', 'image', 'text')),
  title       text not null check (char_length(title) between 1 and 200),
  url         text check (url is null or char_length(url) <= 2048),
  image_path  text,
  content     text check (content is null or char_length(content) <= 5000),
  note        text check (note is null or char_length(note) <= 1000),
  folder_id   uuid references public.folders(id) on delete set null,
  is_favorite boolean not null default false,
  is_private  boolean not null default false,
  created_at  timestamptz not null default now(),

  -- setiap jenis item wajib punya isi yang sesuai
  constraint items_type_payload check (
    (type = 'link'  and url is not null)
    or (type = 'image' and image_path is not null)
    or (type = 'text'  and content is not null)
  ),
  -- URL hanya boleh http atau https
  constraint items_url_scheme check (
    url is null or url ~* '^https?://'
  )
);

create index if not exists items_created_at_idx on public.items (created_at desc);
create index if not exists items_folder_id_idx  on public.items (folder_id);
create index if not exists items_type_idx       on public.items (type);

-- =========================================================
-- Tag
-- =========================================================
create table if not exists public.tags (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
        check (char_length(name) between 1 and 30 and name = lower(name))
);

create table if not exists public.item_tags (
  item_id uuid not null references public.items(id) on delete cascade,
  tag_id  uuid not null references public.tags(id)  on delete cascade,
  primary key (item_id, tag_id)
);

create index if not exists item_tags_tag_id_idx on public.item_tags (tag_id);

-- =========================================================
-- Riwayat pencarian (satu pengguna, jadi bersifat global)
-- =========================================================
create table if not exists public.search_history (
  id           uuid primary key default gen_random_uuid(),
  query        text not null unique check (char_length(query) between 1 and 100),
  searched_at  timestamptz not null default now()
);

create index if not exists search_history_searched_at_idx
  on public.search_history (searched_at desc);

-- =========================================================
-- Percobaan login (untuk pembatasan sandi salah)
-- =========================================================
create table if not exists public.login_attempts (
  id            bigint generated always as identity primary key,
  ip            text not null,
  attempted_at  timestamptz not null default now()
);

create index if not exists login_attempts_ip_time_idx
  on public.login_attempts (ip, attempted_at desc);

-- =========================================================
-- Keamanan: aktifkan Row Level Security tanpa policy publik.
-- Artinya kunci publik (anon) tidak bisa membaca atau menulis apa pun.
-- Server aplikasi memakai service role key, yang melewati RLS.
-- =========================================================
alter table public.folders         enable row level security;
alter table public.items           enable row level security;
alter table public.tags            enable row level security;
alter table public.item_tags       enable row level security;
alter table public.search_history  enable row level security;
alter table public.login_attempts  enable row level security;