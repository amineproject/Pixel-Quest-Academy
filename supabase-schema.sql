-- ============================================================================
-- Pixel Quest Academy — Supabase Hardened Database Schema, RLS & Security RPCs
-- Paste this script into your Supabase project's SQL Editor (Dashboard > SQL Editor)
-- Aman dijalankan ulang (idempoten) untuk upgrade keamanan database yang sudah ada.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Dungeons table (Rombel / Kelas Petualangan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dungeons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier TEXT NOT NULL,
    guild_code TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    realm_ids TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.dungeons ADD COLUMN IF NOT EXISTS realm_ids TEXT;

-- ----------------------------------------------------------------------------
-- 2. Heroes table (Siswa / Petualang Terdaftar — TANPA kolom PIN polos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.heroes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    student_code TEXT NOT NULL,
    dungeon_id TEXT REFERENCES public.dungeons(id) ON DELETE SET NULL,
    avatar TEXT NOT NULL DEFAULT 'knight',
    hero_class TEXT NOT NULL DEFAULT 'Arcane Knight',
    active BOOLEAN NOT NULL DEFAULT true,
    joined_date TEXT NOT NULL,
    enrolled_realm_ids TEXT,
    has_pin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.heroes ADD COLUMN IF NOT EXISTS enrolled_realm_ids TEXT;
ALTER TABLE public.heroes ADD COLUMN IF NOT EXISTS has_pin BOOLEAN NOT NULL DEFAULT false;

-- ----------------------------------------------------------------------------
-- 3. Realms table (Mata Pelajaran / Bidang Keilmuan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.realms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'flask',
    accent_color TEXT NOT NULL DEFAULT '#38B764',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 4. Ancient Tomes table (Materi Pembelajaran)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tomes (
    id TEXT PRIMARY KEY,
    realm_id TEXT REFERENCES public.realms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    chapter INTEGER NOT NULL DEFAULT 1,
    read_minutes INTEGER NOT NULL DEFAULT 8,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    link_url TEXT DEFAULT '',
    published_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.tomes ADD COLUMN IF NOT EXISTS link_url TEXT DEFAULT '';

-- ----------------------------------------------------------------------------
-- 5. Active Quests table (Tugas & Misi Petualangan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quests (
    id TEXT PRIMARY KEY,
    realm_id TEXT REFERENCES public.realms(id) ON DELETE CASCADE,
    dungeon_id TEXT NOT NULL DEFAULT 'all',
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    link_url TEXT DEFAULT '',
    deadline TEXT NOT NULL,
    max_exp INTEGER NOT NULL DEFAULT 200,
    difficulty TEXT NOT NULL DEFAULT 'Normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.quests ADD COLUMN IF NOT EXISTS link_url TEXT DEFAULT '';

-- ----------------------------------------------------------------------------
-- 6. Quest Notices table (Papan Pengumuman)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    link_url TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'Medium',
    target_dungeon_id TEXT NOT NULL DEFAULT 'all',
    release_date TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Guild Master',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS link_url TEXT DEFAULT '';

-- ----------------------------------------------------------------------------
-- 7. EXP & Loot Grades table (Nilai Rahasia — Terkunci RLS dari akses publik)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grades (
    id TEXT PRIMARY KEY,
    hero_id TEXT REFERENCES public.heroes(id) ON DELETE CASCADE,
    quest_id TEXT REFERENCES public.quests(id) ON DELETE CASCADE,
    realm_id TEXT REFERENCES public.realms(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 80,
    exp_earned INTEGER NOT NULL DEFAULT 160,
    status TEXT NOT NULL DEFAULT 'tuntas',
    feedback TEXT DEFAULT '',
    graded_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'tuntas';

-- ----------------------------------------------------------------------------
-- 8. System Settings table (Password tidak lagi disimpan polos di sini)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    theme TEXT NOT NULL DEFAULT 'sunny_quest',
    crt_scanlines BOOLEAN NOT NULL DEFAULT false,
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    academic_term TEXT NOT NULL DEFAULT 'Semester Ganjil 2026/2027',
    gm_name TEXT NOT NULL DEFAULT 'Pak Budi Santoso',
    gm_title TEXT NOT NULL DEFAULT 'Guild Master of Science',
    gm_specialty TEXT NOT NULL DEFAULT 'Guru IPA & Pembina Sains',
    gm_avatar TEXT NOT NULL DEFAULT 'guild_master',
    gm_username TEXT NOT NULL DEFAULT 'admin',
    gm_password TEXT NOT NULL DEFAULT '[PROTECTED]',
    gm_require_password BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS gm_username TEXT DEFAULT 'admin';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS gm_password TEXT DEFAULT '[PROTECTED]';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS gm_require_password BOOLEAN DEFAULT true;

-- ----------------------------------------------------------------------------
-- 9. Private Auth Vault (Hash Password Admin & PIN Siswa — ZERO Public Access)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.private_auth (
    id TEXT PRIMARY KEY, -- 'gm' atau 'hero:<hero_id>'
    role TEXT NOT NULL,  -- 'gm' atau 'hero'
    username TEXT DEFAULT '',
    salt TEXT NOT NULL,
    secret_hash TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 10. Row Level Security (RLS) Ketat
-- ----------------------------------------------------------------------------
ALTER TABLE public.dungeons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_auth ENABLE ROW LEVEL SECURITY;

-- Hapus semua policy lama yang terlalu terbuka (FOR ALL USING (true))
DROP POLICY IF EXISTS "Allow public read dungeons" ON public.dungeons;
DROP POLICY IF EXISTS "Allow public read heroes" ON public.heroes;
DROP POLICY IF EXISTS "Allow public read realms" ON public.realms;
DROP POLICY IF EXISTS "Allow public read tomes" ON public.tomes;
DROP POLICY IF EXISTS "Allow public read quests" ON public.quests;
DROP POLICY IF EXISTS "Allow public read notices" ON public.notices;
DROP POLICY IF EXISTS "Allow public read grades" ON public.grades;
DROP POLICY IF EXISTS "Allow public read settings" ON public.settings;

DROP POLICY IF EXISTS "Allow all on dungeons" ON public.dungeons;
DROP POLICY IF EXISTS "Allow all on heroes" ON public.heroes;
DROP POLICY IF EXISTS "Allow all on realms" ON public.realms;
DROP POLICY IF EXISTS "Allow all on tomes" ON public.tomes;
DROP POLICY IF EXISTS "Allow all on quests" ON public.quests;
DROP POLICY IF EXISTS "Allow all on notices" ON public.notices;
DROP POLICY IF EXISTS "Allow all on grades" ON public.grades;
DROP POLICY IF EXISTS "Allow all on settings" ON public.settings;
DROP POLICY IF EXISTS "Deny all private_auth" ON public.private_auth;

-- Hanya READ-ONLY (SELECT) untuk tabel materi/kelas/roster publik.
-- Penulisan/Edit/Hapus HANYA boleh lewat fungsi RPC terautentikasi!
CREATE POLICY "Allow public read dungeons" ON public.dungeons FOR SELECT USING (true);
CREATE POLICY "Allow public read heroes" ON public.heroes FOR SELECT USING (true);
CREATE POLICY "Allow public read realms" ON public.realms FOR SELECT USING (true);
CREATE POLICY "Allow public read tomes" ON public.tomes FOR SELECT USING (true);
CREATE POLICY "Allow public read quests" ON public.quests FOR SELECT USING (true);
CREATE POLICY "Allow public read notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);

-- CATATAN KEAMANAN:
-- Tabel `grades` dan `private_auth` TIDAK diberi policy SELECT/ALL untuk anon.
-- Siswa tidak bisa membaca nilai angka siswa lain ataupun hash password via REST API!

-- ----------------------------------------------------------------------------
-- 11. Fungsi Hash & Verifikasi Internal (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._pqa_hash_secret(p_salt TEXT, p_secret TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(sha256((p_salt || ':' || p_secret)::bytea), 'hex');
$$;

CREATE OR REPLACE FUNCTION public._pqa_is_gm(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_auth RECORD;
  v_set RECORD;
  v_salt TEXT;
  v_clean_user TEXT := LOWER(TRIM(COALESCE(p_username, '')));
  v_clean_pass TEXT := COALESCE(p_password, '');
BEGIN
  IF v_clean_user = '' OR v_clean_pass = '' THEN
    RETURN false;
  END IF;

  SELECT * INTO v_auth FROM public.private_auth WHERE id = 'gm';
  IF FOUND THEN
    RETURN LOWER(TRIM(v_auth.username)) = v_clean_user
       AND v_auth.secret_hash = public._pqa_hash_secret(v_auth.salt, v_clean_pass);
  END IF;

  -- Migrasi otomatis jika tabel private_auth belum terisi dari settings lama
  SELECT * INTO v_set FROM public.settings WHERE id = 'global' LIMIT 1;
  IF FOUND AND COALESCE(v_set.gm_password, '') <> '[PROTECTED]' THEN
    IF LOWER(TRIM(COALESCE(v_set.gm_username, 'admin'))) = v_clean_user
       AND COALESCE(v_set.gm_password, 'admin') = v_clean_pass THEN
      v_salt := gen_random_uuid()::text;
      INSERT INTO public.private_auth (id, role, username, salt, secret_hash)
      VALUES ('gm', 'gm', TRIM(COALESCE(v_set.gm_username, 'admin')), v_salt, public._pqa_hash_secret(v_salt, v_clean_pass))
      ON CONFLICT (id) DO NOTHING;

      UPDATE public.settings
      SET gm_password = '[PROTECTED]', gm_require_password = true
      WHERE id = 'global';
      RETURN true;
    END IF;
    RETURN false;
  END IF;

  -- Fallback awal jika database baru saja dibuat dan settings masih kosong
  IF v_clean_user = 'admin' AND v_clean_pass = 'admin' THEN
    v_salt := gen_random_uuid()::text;
    INSERT INTO public.private_auth (id, role, username, salt, secret_hash)
    VALUES ('gm', 'gm', 'admin', v_salt, public._pqa_hash_secret(v_salt, 'admin'))
    ON CONFLICT (id) DO NOTHING;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public._pqa_is_hero_valid(p_hero_id TEXT, p_pin TEXT DEFAULT '')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_hero RECORD;
  v_auth RECORD;
  v_pin TEXT := TRIM(COALESCE(p_pin, ''));
BEGIN
  SELECT * INTO v_hero FROM public.heroes WHERE id = p_hero_id;
  IF NOT FOUND OR NOT v_hero.active THEN
    RETURN false;
  END IF;

  SELECT * INTO v_auth FROM public.private_auth WHERE id = ('hero:' || p_hero_id);
  IF FOUND THEN
    IF v_pin = '' THEN
      RETURN false;
    END IF;
    RETURN v_auth.secret_hash = public._pqa_hash_secret(v_auth.salt, v_pin);
  END IF;

  IF v_hero.has_pin THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public._pqa_hash_secret(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._pqa_is_gm(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._pqa_is_hero_valid(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 12. Public RPC API (Autentikasi & Operasi Aman Berbasis Role)
-- ----------------------------------------------------------------------------

-- A. Verifikasi Login Game Master (Admin)
CREATE OR REPLACE FUNCTION public.verify_gm_login(p_username TEXT, p_password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF public._pqa_is_gm(p_username, p_password) THEN
    RETURN jsonb_build_object('ok', true, 'security_mode', 'rpc_hardened');
  END IF;
  RETURN jsonb_build_object('ok', false, 'error', 'invalid_credentials');
END;
$$;

-- B. Ganti Username / Password Game Master
CREATE OR REPLACE FUNCTION public.update_gm_credentials(
  p_old_username TEXT,
  p_old_password TEXT,
  p_new_username TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_salt TEXT;
  v_new_user TEXT := TRIM(COALESCE(p_new_username, ''));
  v_new_pass TEXT := COALESCE(p_new_password, '');
BEGIN
  IF NOT public._pqa_is_gm(p_old_username, p_old_password) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Kredensial GM lama tidak valid.');
  END IF;
  IF v_new_user = '' OR LENGTH(v_new_pass) < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Username wajib diisi dan password minimal 4 karakter.');
  END IF;

  v_salt := gen_random_uuid()::text;
  INSERT INTO public.private_auth (id, role, username, salt, secret_hash, updated_at)
  VALUES ('gm', 'gm', v_new_user, v_salt, public._pqa_hash_secret(v_salt, v_new_pass), now())
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    salt = EXCLUDED.salt,
    secret_hash = EXCLUDED.secret_hash,
    updated_at = now();

  UPDATE public.settings
  SET gm_username = v_new_user,
      gm_password = '[PROTECTED]',
      gm_require_password = true
  WHERE id = 'global';

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- C. Verifikasi Login Siswa (NIS/Username + PIN Rahasia jika diatur)
CREATE OR REPLACE FUNCTION public.verify_hero_login(p_identifier TEXT, p_pin TEXT DEFAULT '')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_q TEXT := LOWER(TRIM(COALESCE(p_identifier, '')));
  v_pin TEXT := TRIM(COALESCE(p_pin, ''));
  v_hero RECORD;
  v_auth RECORD;
BEGIN
  IF v_q = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT * INTO v_hero
  FROM public.heroes
  WHERE LOWER(username) = v_q OR LOWER(student_code) = v_q
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF NOT v_hero.active THEN
    RETURN jsonb_build_object('ok', false, 'error', 'inactive');
  END IF;

  SELECT * INTO v_auth FROM public.private_auth WHERE id = ('hero:' || v_hero.id);
  IF FOUND THEN
    IF v_pin = '' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'pin_required', 'hero_name', v_hero.name);
    END IF;
    IF v_auth.secret_hash <> public._pqa_hash_secret(v_auth.salt, v_pin) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_pin');
    END IF;
    RETURN jsonb_build_object('ok', true, 'hero_id', v_hero.id, 'has_pin', true);
  END IF;

  IF v_hero.has_pin THEN
    RETURN jsonb_build_object('ok', false, 'error', 'pin_required');
  END IF;

  RETURN jsonb_build_object('ok', true, 'hero_id', v_hero.id, 'has_pin', false);
END;
$$;

-- D. Siswa Ubah/Buat PIN Sendiri
CREATE OR REPLACE FUNCTION public.change_own_hero_pin(
  p_hero_id TEXT,
  p_current_pin TEXT,
  p_new_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_salt TEXT;
  v_new TEXT := TRIM(COALESCE(p_new_pin, ''));
BEGIN
  IF NOT public._pqa_is_hero_valid(p_hero_id, p_current_pin) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN saat ini salah atau akun tidak aktif.');
  END IF;
  IF LENGTH(v_new) < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN baru minimal 4 karakter.');
  END IF;

  v_salt := gen_random_uuid()::text;
  INSERT INTO public.private_auth (id, role, username, salt, secret_hash, updated_at)
  VALUES ('hero:' || p_hero_id, 'hero', p_hero_id, v_salt, public._pqa_hash_secret(v_salt, v_new), now())
  ON CONFLICT (id) DO UPDATE SET
    salt = EXCLUDED.salt,
    secret_hash = EXCLUDED.secret_hash,
    updated_at = now();

  UPDATE public.heroes SET has_pin = true WHERE id = p_hero_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- E. Siswa Ganti Avatar Sendiri
CREATE OR REPLACE FUNCTION public.update_own_hero_avatar(
  p_hero_id TEXT,
  p_pin TEXT,
  p_avatar TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT public._pqa_is_hero_valid(p_hero_id, p_pin) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sesi siswa tidak valid.');
  END IF;

  UPDATE public.heroes
  SET avatar = COALESCE(NULLIF(TRIM(p_avatar), ''), 'knight')
  WHERE id = p_hero_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- E2. Siswa Ubah Username Sendiri (Maksimal 5 Karakter, Unik & Aman)
CREATE OR REPLACE FUNCTION public.update_own_hero_username(
  p_hero_id TEXT,
  p_pin TEXT,
  p_username TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_clean TEXT := LOWER(REGEXP_REPLACE(TRIM(COALESCE(p_username, '')), '\s+', '', 'g'));
BEGIN
  IF NOT public._pqa_is_hero_valid(p_hero_id, p_pin) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sesi siswa tidak valid.');
  END IF;

  IF LENGTH(v_clean) < 1 OR LENGTH(v_clean) > 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Username harus 1 sampai 5 karakter (tanpa spasi).');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.heroes
    WHERE id <> p_hero_id
      AND (
        (username <> '' AND LOWER(username) = v_clean)
        OR LOWER(student_code) = v_clean
      )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Username sudah digunakan siswa lain!');
  END IF;

  UPDATE public.heroes
  SET username = v_clean
  WHERE id = p_hero_id;

  RETURN jsonb_build_object('ok', true, 'username', v_clean);
END;
$$;

-- F. Ambil Status Nilai Siswa (Hanya Milik Siswa Tersebut & TANPA Skor Angka)
CREATE OR REPLACE FUNCTION public.get_hero_grade_statuses(
  p_hero_id TEXT,
  p_pin TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_rows JSONB;
BEGIN
  IF NOT public._pqa_is_hero_valid(p_hero_id, p_pin) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized', 'grades', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', g.id,
    'hero_id', g.hero_id,
    'quest_id', g.quest_id,
    'realm_id', g.realm_id,
    'score', 0,
    'exp_earned', 0,
    'status', COALESCE(g.status, CASE WHEN g.score >= 70 THEN 'tuntas' ELSE 'remidial' END),
    'feedback', COALESCE(g.feedback, ''),
    'graded_date', g.graded_date
  )), '[]'::jsonb)
  INTO v_rows
  FROM public.grades g
  WHERE g.hero_id = p_hero_id;

  RETURN jsonb_build_object('ok', true, 'grades', v_rows);
END;
$$;

-- G. Ambil Seluruh Nilai untuk GM Terautentikasi
CREATE OR REPLACE FUNCTION public.get_gm_grades(p_gm_user TEXT, p_gm_pass TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_rows JSONB;
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized', 'grades', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', g.id,
    'hero_id', g.hero_id,
    'quest_id', g.quest_id,
    'realm_id', g.realm_id,
    'score', g.score,
    'exp_earned', g.exp_earned,
    'status', COALESCE(g.status, CASE WHEN g.score >= 70 THEN 'tuntas' ELSE 'remidial' END),
    'feedback', COALESCE(g.feedback, ''),
    'graded_date', g.graded_date
  )), '[]'::jsonb)
  INTO v_rows
  FROM public.grades g;

  RETURN jsonb_build_object('ok', true, 'grades', v_rows);
END;
$$;

-- H. GM CRUD RPCs (Terproteksi Password GM di Database)
CREATE OR REPLACE FUNCTION public.gm_upsert_dungeon(p_gm_user TEXT, p_gm_pass TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak: Kredensial GM tidak valid.');
  END IF;
  INSERT INTO public.dungeons (id, name, tier, guild_code, capacity, description, realm_ids)
  VALUES (
    p_data->>'id', p_data->>'name', p_data->>'tier', p_data->>'guild_code',
    COALESCE((p_data->>'capacity')::int, 30), COALESCE(p_data->>'description', ''),
    COALESCE(p_data->>'realm_ids', '[]')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, tier = EXCLUDED.tier, guild_code = EXCLUDED.guild_code,
    capacity = EXCLUDED.capacity, description = EXCLUDED.description, realm_ids = EXCLUDED.realm_ids;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_delete_dungeon(p_gm_user TEXT, p_gm_pass TEXT, p_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  UPDATE public.heroes SET dungeon_id = NULL WHERE dungeon_id = p_id;
  DELETE FROM public.notices WHERE target_dungeon_id = p_id;
  DELETE FROM public.dungeons WHERE id = p_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_upsert_hero(p_gm_user TEXT, p_gm_pass TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE
  v_hero_id TEXT := p_data->>'id';
  v_pin TEXT := NULLIF(TRIM(COALESCE(p_data->>'pin', '')), '');
  v_clear_pin BOOLEAN := COALESCE((p_data->>'clear_pin')::boolean, false);
  v_salt TEXT;
  v_has_pin BOOLEAN;
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak: Kredensial GM tidak valid.');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.private_auth WHERE id = 'hero:' || v_hero_id) INTO v_has_pin;
  IF v_pin IS NOT NULL THEN
    v_has_pin := true;
  ELSIF v_clear_pin THEN
    v_has_pin := false;
  END IF;

  INSERT INTO public.heroes (id, name, username, student_code, dungeon_id, avatar, hero_class, active, joined_date, enrolled_realm_ids, has_pin)
  VALUES (
    v_hero_id, p_data->>'name', p_data->>'username', p_data->>'student_code',
    NULLIF(TRIM(COALESCE(p_data->>'dungeon_id', '')), ''),
    COALESCE(p_data->>'avatar', 'knight'), COALESCE(p_data->>'hero_class', 'Arcane Knight'),
    COALESCE((p_data->>'active')::boolean, true), COALESCE(p_data->>'joined_date', to_char(now(), 'YYYY-MM-DD')),
    COALESCE(p_data->>'enrolled_realm_ids', '[]'), v_has_pin
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, username = EXCLUDED.username, student_code = EXCLUDED.student_code,
    dungeon_id = EXCLUDED.dungeon_id, avatar = EXCLUDED.avatar, hero_class = EXCLUDED.hero_class,
    active = EXCLUDED.active, enrolled_realm_ids = EXCLUDED.enrolled_realm_ids, has_pin = v_has_pin;

  IF v_pin IS NOT NULL THEN
    v_salt := gen_random_uuid()::text;
    INSERT INTO public.private_auth (id, role, username, salt, secret_hash, updated_at)
    VALUES ('hero:' || v_hero_id, 'hero', v_hero_id, v_salt, public._pqa_hash_secret(v_salt, v_pin), now())
    ON CONFLICT (id) DO UPDATE SET salt = EXCLUDED.salt, secret_hash = EXCLUDED.secret_hash, updated_at = now();
  ELSIF v_clear_pin THEN
    DELETE FROM public.private_auth WHERE id = 'hero:' || v_hero_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'has_pin', v_has_pin);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_delete_hero(p_gm_user TEXT, p_gm_pass TEXT, p_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  DELETE FROM public.private_auth WHERE id = 'hero:' || p_id;
  DELETE FROM public.grades WHERE hero_id = p_id;
  DELETE FROM public.heroes WHERE id = p_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_upsert_notice(p_gm_user TEXT, p_gm_pass TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  INSERT INTO public.notices (id, title, description, link_url, priority, target_dungeon_id, release_date, author)
  VALUES (
    p_data->>'id', p_data->>'title', p_data->>'description', COALESCE(p_data->>'link_url', ''),
    COALESCE(p_data->>'priority', 'Medium'), COALESCE(p_data->>'target_dungeon_id', 'all'),
    COALESCE(p_data->>'release_date', to_char(now(), 'YYYY-MM-DD')), COALESCE(p_data->>'author', 'Guild Master')
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, description = EXCLUDED.description, link_url = EXCLUDED.link_url,
    priority = EXCLUDED.priority, target_dungeon_id = EXCLUDED.target_dungeon_id,
    release_date = EXCLUDED.release_date, author = EXCLUDED.author;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_delete_notice(p_gm_user TEXT, p_gm_pass TEXT, p_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  DELETE FROM public.notices WHERE id = p_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_upsert_realm(p_gm_user TEXT, p_gm_pass TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  INSERT INTO public.realms (id, name, code, icon, accent_color, description)
  VALUES (
    p_data->>'id', p_data->>'name', p_data->>'code',
    COALESCE(p_data->>'icon', 'flask'), COALESCE(p_data->>'accent_color', '#38B764'),
    COALESCE(p_data->>'description', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, code = EXCLUDED.code, icon = EXCLUDED.icon,
    accent_color = EXCLUDED.accent_color, description = EXCLUDED.description;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_delete_realm(p_gm_user TEXT, p_gm_pass TEXT, p_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  DELETE FROM public.grades WHERE realm_id = p_id;
  DELETE FROM public.tomes WHERE realm_id = p_id;
  DELETE FROM public.quests WHERE realm_id = p_id;
  DELETE FROM public.realms WHERE id = p_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_upsert_tome(p_gm_user TEXT, p_gm_pass TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  INSERT INTO public.tomes (id, realm_id, title, chapter, read_minutes, summary, content, link_url, published_date)
  VALUES (
    p_data->>'id', NULLIF(TRIM(COALESCE(p_data->>'realm_id', '')), ''),
    p_data->>'title', COALESCE((p_data->>'chapter')::int, 1),
    COALESCE((p_data->>'read_minutes')::int, 8), COALESCE(p_data->>'summary', ''),
    COALESCE(p_data->>'content', ''), COALESCE(p_data->>'link_url', ''),
    COALESCE(p_data->>'published_date', to_char(now(), 'YYYY-MM-DD'))
  )
  ON CONFLICT (id) DO UPDATE SET
    realm_id = EXCLUDED.realm_id, title = EXCLUDED.title, chapter = EXCLUDED.chapter,
    read_minutes = EXCLUDED.read_minutes, summary = EXCLUDED.summary, content = EXCLUDED.content,
    link_url = EXCLUDED.link_url, published_date = EXCLUDED.published_date;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_delete_tome(p_gm_user TEXT, p_gm_pass TEXT, p_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  DELETE FROM public.tomes WHERE id = p_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_upsert_quest(p_gm_user TEXT, p_gm_pass TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  INSERT INTO public.quests (id, realm_id, dungeon_id, title, instructions, link_url, deadline, max_exp, difficulty)
  VALUES (
    p_data->>'id', NULLIF(TRIM(COALESCE(p_data->>'realm_id', '')), ''),
    COALESCE(p_data->>'dungeon_id', 'all'), p_data->>'title',
    COALESCE(p_data->>'instructions', ''), COALESCE(p_data->>'link_url', ''),
    COALESCE(p_data->>'deadline', to_char(now(), 'YYYY-MM-DD')),
    COALESCE((p_data->>'max_exp')::int, 200), COALESCE(p_data->>'difficulty', 'Normal')
  )
  ON CONFLICT (id) DO UPDATE SET
    realm_id = EXCLUDED.realm_id, dungeon_id = EXCLUDED.dungeon_id, title = EXCLUDED.title,
    instructions = EXCLUDED.instructions, link_url = EXCLUDED.link_url, deadline = EXCLUDED.deadline,
    max_exp = EXCLUDED.max_exp, difficulty = EXCLUDED.difficulty;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_delete_quest(p_gm_user TEXT, p_gm_pass TEXT, p_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  DELETE FROM public.grades WHERE quest_id = p_id;
  DELETE FROM public.quests WHERE id = p_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_upsert_grade(p_gm_user TEXT, p_gm_pass TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak.');
  END IF;
  INSERT INTO public.grades (id, hero_id, quest_id, realm_id, score, exp_earned, status, feedback, graded_date)
  VALUES (
    p_data->>'id', p_data->>'hero_id', p_data->>'quest_id', p_data->>'realm_id',
    COALESCE((p_data->>'score')::int, 0), COALESCE((p_data->>'exp_earned')::int, 0),
    COALESCE(p_data->>'status', 'tuntas'), COALESCE(p_data->>'feedback', ''),
    COALESCE(p_data->>'graded_date', to_char(now(), 'YYYY-MM-DD'))
  )
  ON CONFLICT (id) DO UPDATE SET
    score = EXCLUDED.score, exp_earned = EXCLUDED.exp_earned, status = EXCLUDED.status,
    feedback = EXCLUDED.feedback, graded_date = EXCLUDED.graded_date;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_update_settings(p_gm_user TEXT, p_gm_pass TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE
  v_new_user TEXT := NULLIF(TRIM(COALESCE(p_data->>'gm_username', '')), '');
  v_new_pass TEXT := NULLIF(COALESCE(p_data->>'gm_password', ''), '');
  v_salt TEXT;
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak: Kredensial GM tidak valid.');
  END IF;

  INSERT INTO public.settings (
    id, theme, crt_scanlines, sound_enabled, academic_term,
    gm_name, gm_title, gm_specialty, gm_avatar, gm_username, gm_password, gm_require_password
  ) VALUES (
    'global',
    COALESCE(p_data->>'theme', 'sunny_quest'),
    COALESCE((p_data->>'crt_scanlines')::boolean, false),
    COALESCE((p_data->>'sound_enabled')::boolean, true),
    COALESCE(p_data->>'academic_term', 'Semester Ganjil 2026/2027'),
    COALESCE(p_data->>'gm_name', 'Pak Budi Santoso'),
    COALESCE(p_data->>'gm_title', 'Guild Master of Science'),
    COALESCE(p_data->>'gm_specialty', 'Guru IPA & Pembina Sains'),
    COALESCE(p_data->>'gm_avatar', 'guild_master'),
    COALESCE(v_new_user, p_gm_user),
    '[PROTECTED]',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    theme = EXCLUDED.theme,
    crt_scanlines = EXCLUDED.crt_scanlines,
    sound_enabled = EXCLUDED.sound_enabled,
    academic_term = EXCLUDED.academic_term,
    gm_name = EXCLUDED.gm_name,
    gm_title = EXCLUDED.gm_title,
    gm_specialty = EXCLUDED.gm_specialty,
    gm_avatar = EXCLUDED.gm_avatar,
    gm_username = EXCLUDED.gm_username,
    gm_password = '[PROTECTED]',
    gm_require_password = true;

  IF v_new_pass IS NOT NULL AND v_new_pass <> '[PROTECTED]' THEN
    v_salt := gen_random_uuid()::text;
    INSERT INTO public.private_auth (id, role, username, salt, secret_hash, updated_at)
    VALUES ('gm', 'gm', COALESCE(v_new_user, p_gm_user), v_salt, public._pqa_hash_secret(v_salt, v_new_pass), now())
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      salt = EXCLUDED.salt,
      secret_hash = EXCLUDED.secret_hash,
      updated_at = now();
  ELSIF v_new_user IS NOT NULL THEN
    UPDATE public.private_auth SET username = v_new_user, updated_at = now() WHERE id = 'gm';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.gm_bulk_sync(p_gm_user TEXT, p_gm_pass TEXT, p_payload JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE
  v_item JSONB;
  v_res JSONB;
BEGIN
  IF NOT public._pqa_is_gm(p_gm_user, p_gm_pass) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Akses ditolak: Kredensial GM tidak valid.');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'dungeons', '[]'::jsonb)) LOOP
    PERFORM public.gm_upsert_dungeon(p_gm_user, p_gm_pass, v_item);
  END LOOP;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'realms', '[]'::jsonb)) LOOP
    PERFORM public.gm_upsert_realm(p_gm_user, p_gm_pass, v_item);
  END LOOP;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'heroes', '[]'::jsonb)) LOOP
    PERFORM public.gm_upsert_hero(p_gm_user, p_gm_pass, v_item);
  END LOOP;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'tomes', '[]'::jsonb)) LOOP
    PERFORM public.gm_upsert_tome(p_gm_user, p_gm_pass, v_item);
  END LOOP;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'quests', '[]'::jsonb)) LOOP
    PERFORM public.gm_upsert_quest(p_gm_user, p_gm_pass, v_item);
  END LOOP;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'notices', '[]'::jsonb)) LOOP
    PERFORM public.gm_upsert_notice(p_gm_user, p_gm_pass, v_item);
  END LOOP;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'grades', '[]'::jsonb)) LOOP
    PERFORM public.gm_upsert_grade(p_gm_user, p_gm_pass, v_item);
  END LOOP;
  IF p_payload ? 'settings' THEN
    v_res := public.gm_update_settings(p_gm_user, p_gm_pass, p_payload->'settings');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Beri hak eksekusi RPC ke anon & authenticated
GRANT EXECUTE ON FUNCTION public.verify_gm_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_gm_credentials(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_hero_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_own_hero_pin(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_hero_avatar(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_hero_username(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_hero_grade_statuses(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_gm_grades(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_upsert_dungeon(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_delete_dungeon(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_upsert_hero(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_delete_hero(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_upsert_notice(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_delete_notice(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_upsert_realm(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_delete_realm(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_upsert_tome(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_delete_tome(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_upsert_quest(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_delete_quest(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_upsert_grade(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_update_settings(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gm_bulk_sync(TEXT, TEXT, JSONB) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 13. Initial Seed Data & Migrasi Otomatis Password Lama ke Private Vault
-- ----------------------------------------------------------------------------
INSERT INTO public.dungeons (id, name, tier, guild_code, capacity, description, realm_ids) VALUES
('dng-x-ipa-1', 'Crimson Citadel', 'Kelas X', 'X-IPA-1', 32, 'Rombel sains dasar berfokus pada eksplorasi alchemical chemistry dan biologi terapan.', '["rlm-chem","rlm-math","rlm-bio"]'),
('dng-x-ipa-2', 'Emerald Bastion', 'Kelas X', 'X-IPA-2', 30, 'Skuadron petualang kelas X dengan penekanan logika matematika dan riset lapangan.', '["rlm-math","rlm-bio"]'),
('dng-xi-ipa-1', 'Arcane Spire', 'Kelas XI', 'XI-IPA-1', 28, 'Menara pembelajaran tingkat lanjut untuk eksperimen reaksi kimia dan genetika.', '["rlm-chem","rlm-math"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.heroes (id, name, username, student_code, dungeon_id, avatar, hero_class, active, joined_date, enrolled_realm_ids) VALUES
('hr-rian', 'Rian Pratama', 'rian_x1', '261001', 'dng-x-ipa-1', 'knight', 'Arcane Knight', true, '2026-07-14', '["rlm-chem","rlm-math","rlm-bio"]'),
('hr-sari', 'Sari Wulandari', 'sari_x1', '261002', 'dng-x-ipa-1', 'alchemist', 'Potion Alchemist', true, '2026-07-14', '["rlm-chem","rlm-bio"]'),
('hr-dimas', 'Dimas Nugroho', 'dimas_x1', '261003', 'dng-x-ipa-1', 'mage', 'Rune Mage', true, '2026-07-15', '["rlm-chem","rlm-math"]'),
('hr-nadia', 'Nadia Kusuma', 'nadia_x1', '261004', 'dng-x-ipa-1', 'ranger', 'Forest Ranger', true, '2026-07-15', '["rlm-bio","rlm-math"]'),
('hr-bagas', 'Bagas Aditya', 'bagas_x2', '261015', 'dng-x-ipa-2', 'scholar', 'Scroll Scholar', true, '2026-07-16', '["rlm-math","rlm-bio"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.realms (id, name, code, icon, accent_color, description) VALUES
('rlm-chem', 'Alchemic Chemistry', 'CHEM-101', 'flask', '#38B764', 'Struktur atom, ikatan kovalen, reaksi redoks, dan stoikiometri larutan.'),
('rlm-math', 'Arcane Mathematics', 'MATH-102', 'compass', '#3B5DC9', 'Persamaan kuadrat, logaritma, trigonometri dasar, dan matriks vektor.'),
('rlm-bio', 'Nature Biology', 'BIO-103', 'leaf', '#FEAE34', 'Klasifikasi makhluk hidup, sel eukariotik, serta dinamika rantai ekosistem.'),
('rlm-phys', 'Mystic Physics', 'PHYS-104', 'bolt', '#EF7D57', 'Kinematika gerak lurus, hukum Newton, usaha, dan kekekalan energi.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tomes (id, realm_id, title, chapter, read_minutes, summary, content, published_date) VALUES
('tm-1', 'rlm-chem', 'Struktur Atom & Konfigurasi Elektron', 1, 8, 'Memahami inti atom, proton, neutron, dan aturan Aufbau pada kulit elektron.', '1. PARTIKEL PENYUSUN ATOM: Proton (+), Neutron (0), Elektron (-).\n2. PRINSIP AUFBAU: Pengisian orbital dimulai dari tingkat energi terendah.\n3. ELEKTRON VALENSI: Elektron pada kulit terluar menentukan reaktivitas unsur.', '2026-11-02'),
('tm-2', 'rlm-chem', 'Ikatan Ionik vs Ikatan Kovalen', 2, 10, 'Perbedaan serah-terima elektron pada logam-nonlogam dan pemakaian bersama elektron.', '1. ATURAN OKTET: Mencapai 8 elektron valensi untuk stabil.\n2. IKATAN IONIK: Terjadi serah-terima elektron (contoh: NaCl).\n3. IKATAN KOVALEN: Pemakaian pasangan elektron bersama (contoh: H2O, CO2).', '2026-11-08'),
('tm-3', 'rlm-math', 'Sifat Dasar Logaritma & Eksponen', 1, 7, 'Invers dari fungsi pangkat dan hukum perkalian/pembagian logaritma.', '1. DEFINISI: a^c = b <=> a_log(b) = c.\n2. HUKUM: a_log(xy) = a_log(x) + a_log(y), a_log(x/y) = a_log(x) - a_log(y).\n3. BASIS: Gunakan faktor prima terkecil saat menyederhanakan ekspresi.', '2026-11-04'),
('tm-4', 'rlm-bio', 'Organel Sel Tumbuhan & Hewan', 1, 9, 'Perbandingan fungsi mitokondria, kloroplas, ribosom, dan dinding sel.', '1. NUKLEUS: Pusat kendali sel dan penyimpanan DNA.\n2. MITOKONDRIA: Pembangkit energi seluler (ATP).\n3. SEL TUMBUHAN: Memiliki dinding sel selulosa, kloroplas untuk fotosintesis, dan vakuola besar.', '2026-11-06')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quests (id, realm_id, dungeon_id, title, instructions, deadline, max_exp, difficulty) VALUES
('qst-1', 'rlm-chem', 'dng-x-ipa-1', 'Quest 01: Peta Konfigurasi 10 Unsur', 'Tuliskan konfigurasi elektron kulit dan subkulit untuk unsur nomor atom 6, 11, 17, dan 20. Tentukan letak golongan serta periodenya.', '2026-11-18', 200, 'Normal'),
('qst-2', 'rlm-chem', 'dng-x-ipa-1', 'Boss Quest: Struktur Lewis Senyawa Kovalen', 'Gambarkan struktur dot Lewis untuk molekul NH3, CO2, dan H2SO4. Identifikasi ikatan kovalen tunggal, rangkap, dan koordinasi.', '2026-11-22', 300, 'Boss'),
('qst-3', 'rlm-math', 'all', 'Quest 02: Pembuktian Identitas Logaritma', 'Selesaikan 8 soal penyederhanaan logaritma berbasis 2, 3, dan 5 dengan menuliskan langkah substitusi secara berurutan.', '2026-11-20', 250, 'Elite'),
('qst-4', 'rlm-bio', 'dng-x-ipa-1', 'Quest 03: Diagram Komparasi Sel Mikroskop', 'Buat tabel perbandingan minimal 6 organel antara sel epitel hewan dan sel daun Elodea berdasarkan hasil pengamatan praktikum.', '2026-11-25', 200, 'Normal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notices (id, title, description, priority, target_dungeon_id, release_date, author) VALUES
('ntc-1', 'Ujian Boss Dungeon: Ikatan Kimia & Stoikiometri', 'Perhatian seluruh Hero Crimson Citadel! Evaluasi tengah semester akan dilaksanakan hari Jumat pukul 08.00 WIB. Pelajari Scroll Bab 1 dan 2.', 'Critical', 'dng-x-ipa-1', '2026-11-11', 'Pak Budi Santoso'),
('ntc-2', 'Pembukaan Guild Praktikum Lab Ekosistem', 'Perlengkapan praktikum mikroskop dan preparat sel tumbuhan sudah tersedia di Lab Biologi Lantai 2.', 'Medium', 'all', '2026-11-09', 'Pak Budi Santoso'),
('ntc-3', 'Bonus EXP +50 untuk Ringkasan Ancient Tome', 'Hero yang menyelesaikan ringkasan mandiri gulungan Arcane Mathematics Bab 1 minggu ini berhak mendapat bonus EXP +50.', 'Low', 'all', '2026-11-05', 'Pak Budi Santoso')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.grades (id, hero_id, quest_id, realm_id, score, exp_earned, feedback, graded_date) VALUES
('grd-1', 'hr-rian', 'qst-1', 'rlm-chem', 94, 188, 'Konfigurasi Aufbau sangat rapi dan penentuan periode tepat semua.', '2026-11-06'),
('grd-2', 'hr-rian', 'qst-2', 'rlm-chem', 86, 258, 'Struktur H2SO4 sudah tepat, perhatikan pasangan elektron bebas pada oksigen.', '2026-11-10'),
('grd-3', 'hr-rian', 'qst-3', 'rlm-math', 88, 220, 'Langkah penyederhanaan logaritma runtut dan jelas.', '2026-11-09'),
('grd-4', 'hr-rian', 'qst-4', 'rlm-bio', 92, 184, 'Sketsa organel lengkap beserta penjelasan fungsi mitokondria dan kloroplas.', '2026-11-11'),
('grd-5', 'hr-sari', 'qst-1', 'rlm-chem', 96, 192, 'Nilai sempurna pada penyusunan konfigurasi ion bermuatan.', '2026-11-06'),
('grd-6', 'hr-sari', 'qst-3', 'rlm-math', 84, 210, 'Cek ulang soal nomor 7 pada perubahan basis pangkat pecahan.', '2026-11-09'),
('grd-7', 'hr-dimas', 'qst-1', 'rlm-chem', 78, 156, 'Sudah cukup baik, perlu teliti pada pengisian subkulit 3d.', '2026-11-06'),
('grd-8', 'hr-nadia', 'qst-4', 'rlm-bio', 90, 180, 'Tabel komparasi sel sangat informatif.', '2026-11-11'),
('grd-9', 'hr-bagas', 'qst-3', 'rlm-math', 85, 213, 'Konsisten dan teliti dalam pembuktian identitas.', '2026-11-09')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (id, theme, crt_scanlines, sound_enabled, academic_term, gm_name, gm_title, gm_specialty, gm_avatar, gm_username, gm_password, gm_require_password) VALUES
('global', 'sunny_quest', false, true, 'Semester Ganjil 2026/2027', 'Pak Budi Santoso', 'Guild Master of Science', 'Guru IPA & Pembina Sains', 'guild_master', 'admin', '[PROTECTED]', true)
ON CONFLICT (id) DO NOTHING;

-- Migrasi otomatis password admin dari settings lama ke private_auth + bersihkan password polos di settings
DO $$
DECLARE
  v_set RECORD;
  v_salt TEXT;
  v_user TEXT;
  v_pass TEXT;
BEGIN
  SELECT * INTO v_set FROM public.settings WHERE id = 'global' LIMIT 1;
  v_user := COALESCE(NULLIF(TRIM(v_set.gm_username), ''), 'admin');
  v_pass := CASE
    WHEN v_set.gm_password IS NULL OR v_set.gm_password = '' OR v_set.gm_password = '[PROTECTED]' THEN NULL
    ELSE v_set.gm_password
  END;

  IF NOT EXISTS (SELECT 1 FROM public.private_auth WHERE id = 'gm') THEN
    v_salt := gen_random_uuid()::text;
    INSERT INTO public.private_auth (id, role, username, salt, secret_hash)
    VALUES ('gm', 'gm', v_user, v_salt, public._pqa_hash_secret(v_salt, COALESCE(v_pass, 'admin')));
  ELSIF v_pass IS NOT NULL THEN
    -- Jika user baru saja mengubah password di settings sebelum upgrade SQL ini, sinkronkan ke private_auth
    v_salt := gen_random_uuid()::text;
    UPDATE public.private_auth
    SET username = v_user, salt = v_salt, secret_hash = public._pqa_hash_secret(v_salt, v_pass), updated_at = now()
    WHERE id = 'gm';
  END IF;

  UPDATE public.settings
  SET gm_password = '[PROTECTED]', gm_require_password = true
  WHERE id = 'global';
END $$;

-- ----------------------------------------------------------------------------
-- 14. Enable Supabase Realtime
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['dungeons','heroes','realms','tomes','quests','notices','settings'] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    WHEN undefined_object THEN
      NULL;
    END;
  END LOOP;
END $$;
