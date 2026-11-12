-- ============================================================================
-- Pixel Quest Academy — Supabase Database Migration & Schema
-- Generated for Pixel Quest Academy (Retro 8-Bit Mobile LMS)
-- Paste this script into your Supabase project's SQL Editor (Dashboard > SQL Editor)
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
    realm_ids TEXT, -- JSON array of realm IDs (mata pelajaran yang diajarkan)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure column exists if table was created previously
ALTER TABLE public.dungeons ADD COLUMN IF NOT EXISTS realm_ids TEXT;

-- ----------------------------------------------------------------------------
-- 2. Heroes table (Siswa / Petualang Terdaftar)
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
    enrolled_realm_ids TEXT, -- JSON array of enrolled realm IDs (mata pelajaran yang diikuti)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure column exists if table was created previously
ALTER TABLE public.heroes ADD COLUMN IF NOT EXISTS enrolled_realm_ids TEXT;

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
-- 4. Ancient Tomes table (Materi Pembelajaran / Gulungan Pengetahuan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tomes (
    id TEXT PRIMARY KEY,
    realm_id TEXT REFERENCES public.realms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    chapter INTEGER NOT NULL DEFAULT 1,
    read_minutes INTEGER NOT NULL DEFAULT 8,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    published_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 5. Active Quests table (Tugas & Misi Petualangan)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quests (
    id TEXT PRIMARY KEY,
    realm_id TEXT REFERENCES public.realms(id) ON DELETE CASCADE,
    dungeon_id TEXT NOT NULL DEFAULT 'all',
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    deadline TEXT NOT NULL,
    max_exp INTEGER NOT NULL DEFAULT 200,
    difficulty TEXT NOT NULL DEFAULT 'Normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. Quest Notices table (Papan Pengumuman / Guild Bulletin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    target_dungeon_id TEXT NOT NULL DEFAULT 'all',
    release_date TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Guild Master',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 7. EXP & Loot Grades table (Buku Nilai & Reward Petualang)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grades (
    id TEXT PRIMARY KEY,
    hero_id TEXT REFERENCES public.heroes(id) ON DELETE CASCADE,
    quest_id TEXT REFERENCES public.quests(id) ON DELETE CASCADE,
    realm_id TEXT REFERENCES public.realms(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 80,
    exp_earned INTEGER NOT NULL DEFAULT 160,
    feedback TEXT DEFAULT '',
    graded_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 8. System Settings table (Konfigurasi Tema, CRT Scanlines, Profil GM)
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
    gm_avatar TEXT NOT NULL DEFAULT 'guild_master'
);

-- ----------------------------------------------------------------------------
-- 9. Row Level Security (RLS) Configuration
-- ----------------------------------------------------------------------------
ALTER TABLE public.dungeons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
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

-- Public Read Policies (Allows Hero View to fetch notices, tomes, classmates without auth block)
CREATE POLICY "Allow public read dungeons" ON public.dungeons FOR SELECT USING (true);
CREATE POLICY "Allow public read heroes" ON public.heroes FOR SELECT USING (true);
CREATE POLICY "Allow public read realms" ON public.realms FOR SELECT USING (true);
CREATE POLICY "Allow public read tomes" ON public.tomes FOR SELECT USING (true);
CREATE POLICY "Allow public read quests" ON public.quests FOR SELECT USING (true);
CREATE POLICY "Allow public read notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Allow public read grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);

-- Full Access Policy for App Server and Development Key
CREATE POLICY "Allow all on dungeons" ON public.dungeons FOR ALL USING (true);
CREATE POLICY "Allow all on heroes" ON public.heroes FOR ALL USING (true);
CREATE POLICY "Allow all on realms" ON public.realms FOR ALL USING (true);
CREATE POLICY "Allow all on tomes" ON public.tomes FOR ALL USING (true);
CREATE POLICY "Allow all on quests" ON public.quests FOR ALL USING (true);
CREATE POLICY "Allow all on notices" ON public.notices FOR ALL USING (true);
CREATE POLICY "Allow all on grades" ON public.grades FOR ALL USING (true);
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 10. Initial Seed Data (Pre-populates sample data for testing)
-- ----------------------------------------------------------------------------

-- Dungeons
INSERT INTO public.dungeons (id, name, tier, guild_code, capacity, description, realm_ids) VALUES
('dng-x-ipa-1', 'Crimson Citadel', 'Kelas X', 'X-IPA-1', 32, 'Rombel sains dasar berfokus pada eksplorasi alchemical chemistry dan biologi terapan.', '["rlm-chem","rlm-math","rlm-bio"]'),
('dng-x-ipa-2', 'Emerald Bastion', 'Kelas X', 'X-IPA-2', 30, 'Skuadron petualang kelas X dengan penekanan logika matematika dan riset lapangan.', '["rlm-math","rlm-bio"]'),
('dng-xi-ipa-1', 'Arcane Spire', 'Kelas XI', 'XI-IPA-1', 28, 'Menara pembelajaran tingkat lanjut untuk eksperimen reaksi kimia dan genetika.', '["rlm-chem","rlm-math"]')
ON CONFLICT (id) DO NOTHING;

-- Heroes
INSERT INTO public.heroes (id, name, username, student_code, dungeon_id, avatar, hero_class, active, joined_date, enrolled_realm_ids) VALUES
('hr-rian', 'Rian Pratama', 'rian_x1', '261001', 'dng-x-ipa-1', 'knight', 'Arcane Knight', true, '2026-07-14', '["rlm-chem","rlm-math","rlm-bio"]'),
('hr-sari', 'Sari Wulandari', 'sari_x1', '261002', 'dng-x-ipa-1', 'alchemist', 'Potion Alchemist', true, '2026-07-14', '["rlm-chem","rlm-bio"]'),
('hr-dimas', 'Dimas Nugroho', 'dimas_x1', '261003', 'dng-x-ipa-1', 'mage', 'Rune Mage', true, '2026-07-15', '["rlm-chem","rlm-math"]'),
('hr-nadia', 'Nadia Kusuma', 'nadia_x1', '261004', 'dng-x-ipa-1', 'ranger', 'Forest Ranger', true, '2026-07-15', '["rlm-bio","rlm-math"]'),
('hr-bagas', 'Bagas Aditya', 'bagas_x2', '261015', 'dng-x-ipa-2', 'scholar', 'Scroll Scholar', true, '2026-07-16', '["rlm-math","rlm-bio"]')
ON CONFLICT (id) DO NOTHING;

-- Realms
INSERT INTO public.realms (id, name, code, icon, accent_color, description) VALUES
('rlm-chem', 'Alchemic Chemistry', 'CHEM-101', 'flask', '#38B764', 'Struktur atom, ikatan kovalen, reaksi redoks, dan stoikiometri larutan.'),
('rlm-math', 'Arcane Mathematics', 'MATH-102', 'compass', '#3B5DC9', 'Persamaan kuadrat, logaritma, trigonometri dasar, dan matriks vektor.'),
('rlm-bio', 'Nature Biology', 'BIO-103', 'leaf', '#FEAE34', 'Klasifikasi makhluk hidup, sel eukariotik, serta dinamika rantai ekosistem.'),
('rlm-phys', 'Mystic Physics', 'PHYS-104', 'bolt', '#EF7D57', 'Kinematika gerak lurus, hukum Newton, usaha, dan kekekalan energi.')
ON CONFLICT (id) DO NOTHING;

-- Tomes
INSERT INTO public.tomes (id, realm_id, title, chapter, read_minutes, summary, content, published_date) VALUES
('tm-1', 'rlm-chem', 'Struktur Atom & Konfigurasi Elektron', 1, 8, 'Memahami inti atom, proton, neutron, dan aturan Aufbau pada kulit elektron.', '1. PARTIKEL PENYUSUN ATOM: Proton (+), Neutron (0), Elektron (-).\n2. PRINSIP AUFBAU: Pengisian orbital dimulai dari tingkat energi terendah.\n3. ELEKTRON VALENSI: Elektron pada kulit terluar menentukan reaktivitas unsur.', '2026-11-02'),
('tm-2', 'rlm-chem', 'Ikatan Ionik vs Ikatan Kovalen', 2, 10, 'Perbedaan serah-terima elektron pada logam-nonlogam dan pemakaian bersama elektron.', '1. ATURAN OKTET: Mencapai 8 elektron valensi untuk stabil.\n2. IKATAN IONIK: Terjadi serah-terima elektron (contoh: NaCl).\n3. IKATAN KOVALEN: Pemakaian pasangan elektron bersama (contoh: H2O, CO2).', '2026-11-08'),
('tm-3', 'rlm-math', 'Sifat Dasar Logaritma & Eksponen', 1, 7, 'Invers dari fungsi pangkat dan hukum perkalian/pembagian logaritma.', '1. DEFINISI: a^c = b <=> a_log(b) = c.\n2. HUKUM: a_log(xy) = a_log(x) + a_log(y), a_log(x/y) = a_log(x) - a_log(y).\n3. BASIS: Gunakan faktor prima terkecil saat menyederhanakan ekspresi.', '2026-11-04'),
('tm-4', 'rlm-bio', 'Organel Sel Tumbuhan & Hewan', 1, 9, 'Perbandingan fungsi mitokondria, kloroplas, ribosom, dan dinding sel.', '1. NUKLEUS: Pusat kendali sel dan penyimpanan DNA.\n2. MITOKONDRIA: Pembangkit energi seluler (ATP).\n3. SEL TUMBUHAN: Memiliki dinding sel selulosa, kloroplas untuk fotosintesis, dan vakuola besar.', '2026-11-06')
ON CONFLICT (id) DO NOTHING;

-- Quests
INSERT INTO public.quests (id, realm_id, dungeon_id, title, instructions, deadline, max_exp, difficulty) VALUES
('qst-1', 'rlm-chem', 'dng-x-ipa-1', 'Quest 01: Peta Konfigurasi 10 Unsur', 'Tuliskan konfigurasi elektron kulit dan subkulit untuk unsur nomor atom 6, 11, 17, dan 20. Tentukan letak golongan serta periodenya.', '2026-11-18', 200, 'Normal'),
('qst-2', 'rlm-chem', 'dng-x-ipa-1', 'Boss Quest: Struktur Lewis Senyawa Kovalen', 'Gambarkan struktur dot Lewis untuk molekul NH3, CO2, dan H2SO4. Identifikasi ikatan kovalen tunggal, rangkap, dan koordinasi.', '2026-11-22', 300, 'Boss'),
('qst-3', 'rlm-math', 'all', 'Quest 02: Pembuktian Identitas Logaritma', 'Selesaikan 8 soal penyederhanaan logaritma berbasis 2, 3, dan 5 dengan menuliskan langkah substitusi secara berurutan.', '2026-11-20', 250, 'Elite'),
('qst-4', 'rlm-bio', 'dng-x-ipa-1', 'Quest 03: Diagram Komparasi Sel Mikroskop', 'Buat tabel perbandingan minimal 6 organel antara sel epitel hewan dan sel daun Elodea berdasarkan hasil pengamatan praktikum.', '2026-11-25', 200, 'Normal')
ON CONFLICT (id) DO NOTHING;

-- Notices
INSERT INTO public.notices (id, title, description, priority, target_dungeon_id, release_date, author) VALUES
('ntc-1', 'Ujian Boss Dungeon: Ikatan Kimia & Stoikiometri', 'Perhatian seluruh Hero Crimson Citadel! Evaluasi tengah semester akan dilaksanakan hari Jumat pukul 08.00 WIB. Pelajari Scroll Bab 1 dan 2.', 'Critical', 'dng-x-ipa-1', '2026-11-11', 'Pak Budi Santoso'),
('ntc-2', 'Pembukaan Guild Praktikum Lab Ekosistem', 'Perlengkapan praktikum mikroskop dan preparat sel tumbuhan sudah tersedia di Lab Biologi Lantai 2.', 'Medium', 'all', '2026-11-09', 'Pak Budi Santoso'),
('ntc-3', 'Bonus EXP +50 untuk Ringkasan Ancient Tome', 'Hero yang menyelesaikan ringkasan mandiri gulungan Arcane Mathematics Bab 1 minggu ini berhak mendapat bonus EXP +50.', 'Low', 'all', '2026-11-05', 'Pak Budi Santoso')
ON CONFLICT (id) DO NOTHING;

-- Grades
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

-- Settings
INSERT INTO public.settings (id, theme, crt_scanlines, sound_enabled, academic_term, gm_name, gm_title, gm_specialty, gm_avatar) VALUES
('global', 'sunny_quest', false, true, 'Semester Ganjil 2026/2027', 'Pak Budi Santoso', 'Guild Master of Science', 'Guru IPA & Pembina Sains', 'guild_master')
ON CONFLICT (id) DO NOTHING;
