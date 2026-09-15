-- ============================================================
-- デジタルアトリエ — DBスキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 拡張: UUID生成
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- profiles: Supabase Auth の auth.users を参照するユーザープロフィール
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '名無し',
  bio          TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- threads: 掲示板スレッド（管理者が作成）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.threads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  category_type TEXT NOT NULL DEFAULT '雑談',
  description   TEXT,
  author_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_pinned     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- デフォルトスレッドを挿入
INSERT INTO public.threads (title, category_type, description) VALUES
  ('【落書き供養】とりあえず置いていく', '落書き供養', '完成してなくていい。描いたら置く。'),
  ('【塗り絵】線画に色を塗ろう', '塗り絵', '誰かの線画に色を乗せてみよう。'),
  ('【背景練習】キャラに背景をつけよう', '背景練習', 'キャラクターに背景を足す練習スレ。'),
  ('【5分落書き】時間制限チャレンジ', '5分落書き', '5分で描いた絵を投稿しよう。クオリティ不問。'),
  ('【WIP】制作途中を晒す', 'WIP', '未完成の絵を公開して続きのモチベにしよう。')
ON CONFLICT DO NOTHING;

-- ============================================================
-- artworks: 投稿作品
-- ============================================================
CREATE TABLE IF NOT EXISTS public.artworks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id         UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url         TEXT NOT NULL,
  comment           TEXT CHECK (char_length(comment) <= 1000),
  fork_permission   TEXT NOT NULL DEFAULT 'ANY'
                    CHECK (fork_permission IN ('ANY', 'COLOR_ONLY', 'BACKGROUND_ONLY', 'LOCKED')),
  parent_artwork_id UUID REFERENCES public.artworks(id) ON DELETE SET NULL,
  is_blinded        BOOLEAN NOT NULL DEFAULT false,
  tags              TEXT[] DEFAULT '{}',
  progress_images   TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- artwork_lineage: 閉包表 (Closure Table) — 系譜管理
-- ============================================================
CREATE TABLE IF NOT EXISTS public.artwork_lineage (
  ancestor_id   UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  descendant_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  depth         INT NOT NULL CHECK (depth >= 0 AND depth <= 10),
  PRIMARY KEY (ancestor_id, descendant_id)
);

-- ============================================================
-- reactions: リアクション（認証ユーザーのみ・1人1種類1回）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id    UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reaction_type TEXT NOT NULL
                CHECK (reaction_type IN ('供養', '味がある', '続き描きたい', '完璧', '好き')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (artwork_id, author_id, reaction_type)
);

-- ============================================================
-- reports: 通報
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id  UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason      TEXT CHECK (char_length(reason) <= 500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- follows: フォロー関係
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- ============================================================
-- bookmarks: ブックマーク
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, artwork_id)
);

-- ============================================================
-- artwork_comments: 作品へのコメント
-- ============================================================
CREATE TABLE IF NOT EXISTS public.artwork_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id   UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL DEFAULT '' CHECK (char_length(content) <= 1000),
  preset_stamp TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- thread_messages: スレッドチャット
-- ============================================================
CREATE TABLE IF NOT EXISTS public.thread_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL DEFAULT '' CHECK (char_length(content) <= 500),
  preset_stamp TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- notifications: 通知
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type       TEXT NOT NULL CHECK (type IN ('FORK', 'COMMENT', 'FOLLOW', 'MENTION')),
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. inquiries (お問い合わせ)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  category   TEXT NOT NULL,
  message    TEXT NOT NULL,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- 1. 新規ユーザー登録時にprofilesを自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '名無し')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. artwork挿入時に artwork_lineage を自動更新
CREATE OR REPLACE FUNCTION public.handle_artwork_lineage()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 自己参照 (depth=0)
  INSERT INTO public.artwork_lineage (ancestor_id, descendant_id, depth)
  VALUES (NEW.id, NEW.id, 0)
  ON CONFLICT DO NOTHING;

  -- 親が存在する場合: 親の全祖先 → 新作品 の関係を追加
  IF NEW.parent_artwork_id IS NOT NULL THEN
    INSERT INTO public.artwork_lineage (ancestor_id, descendant_id, depth)
    SELECT ancestor_id, NEW.id, depth + 1
    FROM public.artwork_lineage
    WHERE descendant_id = NEW.parent_artwork_id
      AND depth < 10  -- 深度上限
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_artwork_created ON public.artworks;
CREATE TRIGGER on_artwork_created
  AFTER INSERT ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.handle_artwork_lineage();

-- 3. 通報数が閾値(5)を超えたら自動ブラインド
CREATE OR REPLACE FUNCTION public.handle_report_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_count INT;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM public.reports
  WHERE artwork_id = NEW.artwork_id;

  IF report_count >= 5 THEN
    UPDATE public.artworks
    SET is_blinded = true
    WHERE id = NEW.artwork_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_report_created ON public.reports;
CREATE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_report_threshold();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- profiles: 全員閲覧可、自分のみ更新可
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "profiles: public read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: self update" ON public.profiles;
CREATE POLICY "profiles: public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles: self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ----------------------------------------------------------------
-- threads: 全員閲覧可、認証済みのみ作成、作成者のみ更新・削除
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "threads: public read" ON public.threads;
DROP POLICY IF EXISTS "threads: auth insert" ON public.threads;
DROP POLICY IF EXISTS "threads: self update" ON public.threads;
DROP POLICY IF EXISTS "threads: self delete" ON public.threads;
CREATE POLICY "threads: public read"  ON public.threads FOR SELECT USING (true);
CREATE POLICY "threads: auth insert"  ON public.threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "threads: self update"  ON public.threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "threads: self delete"  ON public.threads FOR DELETE USING (auth.uid() = author_id);

-- ----------------------------------------------------------------
-- artworks: ブラインドでなければ全員閲覧可、投稿は認証済みユーザー、削除は自分のみ
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "artworks: public read" ON public.artworks;
DROP POLICY IF EXISTS "artworks: auth insert" ON public.artworks;
DROP POLICY IF EXISTS "artworks: self delete" ON public.artworks;
CREATE POLICY "artworks: public read" ON public.artworks
  FOR SELECT USING (is_blinded = false OR auth.uid() = author_id);
CREATE POLICY "artworks: auth insert" ON public.artworks
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "artworks: self delete" ON public.artworks
  FOR DELETE USING (auth.uid() = author_id);

-- ----------------------------------------------------------------
-- artwork_lineage: 全員閲覧可、認証済みのみ挿入可（トリガーで制御）
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "lineage: public read" ON public.artwork_lineage;
DROP POLICY IF EXISTS "lineage: auth insert" ON public.artwork_lineage;
CREATE POLICY "lineage: public read" ON public.artwork_lineage FOR SELECT USING (true);
CREATE POLICY "lineage: auth insert" ON public.artwork_lineage
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------
-- reactions: 全員閲覧可、認証済みのみ追加可（1人1種1回: UNIQUE制約で保証）
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "reactions: public read" ON public.reactions;
DROP POLICY IF EXISTS "reactions: public insert" ON public.reactions;
DROP POLICY IF EXISTS "reactions: auth insert" ON public.reactions;
CREATE POLICY "reactions: public read"  ON public.reactions FOR SELECT USING (true);
CREATE POLICY "reactions: auth insert"  ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

-- ----------------------------------------------------------------
-- reports: 認証済みのみ
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "reports: auth insert" ON public.reports;
CREATE POLICY "reports: auth insert" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ----------------------------------------------------------------
-- follows
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "follows: public read" ON public.follows;
DROP POLICY IF EXISTS "follows: auth insert" ON public.follows;
DROP POLICY IF EXISTS "follows: self delete" ON public.follows;
CREATE POLICY "follows: public read"  ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows: auth insert"  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows: self delete"  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ----------------------------------------------------------------
-- bookmarks
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "bookmarks: self read" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks: self insert" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks: self delete" ON public.bookmarks;
CREATE POLICY "bookmarks: self read"   ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks: self insert" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks: self delete" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- artwork_comments
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "artwork_comments: public read" ON public.artwork_comments;
DROP POLICY IF EXISTS "artwork_comments: auth insert" ON public.artwork_comments;
DROP POLICY IF EXISTS "artwork_comments: self delete" ON public.artwork_comments;
CREATE POLICY "artwork_comments: public read"  ON public.artwork_comments FOR SELECT USING (true);
CREATE POLICY "artwork_comments: auth insert"  ON public.artwork_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "artwork_comments: self delete"  ON public.artwork_comments
  FOR DELETE USING (auth.uid() = author_id);

-- ----------------------------------------------------------------
-- thread_messages
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "thread_messages: public read" ON public.thread_messages;
DROP POLICY IF EXISTS "thread_messages: auth insert" ON public.thread_messages;
DROP POLICY IF EXISTS "thread_messages: self delete" ON public.thread_messages;
CREATE POLICY "thread_messages: public read"  ON public.thread_messages FOR SELECT USING (true);
CREATE POLICY "thread_messages: auth insert"  ON public.thread_messages
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "thread_messages: self delete"  ON public.thread_messages
  FOR DELETE USING (auth.uid() = author_id);

-- ----------------------------------------------------------------
-- notifications: 自分宛てのみ閲覧・更新可
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "notifications: self read" ON public.notifications;
DROP POLICY IF EXISTS "notifications: self update" ON public.notifications;
DROP POLICY IF EXISTS "notifications: system insert" ON public.notifications;
CREATE POLICY "notifications: self read"   ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications: self update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications: system insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------
-- inquiries: 誰でも送信可能、閲覧は管理者（または不可）
-- ----------------------------------------------------------------
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inquiries: anyone insert" ON public.inquiries;
CREATE POLICY "inquiries: anyone insert" ON public.inquiries FOR INSERT WITH CHECK (true);

-- ============================================================
-- Storage Policies (artworks bucket)
-- ============================================================
DROP POLICY IF EXISTS "artworks_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "artworks_bucket_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "artworks_bucket_self_delete" ON storage.objects;

CREATE POLICY "artworks_bucket_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');

CREATE POLICY "artworks_bucket_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'artworks' AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "artworks_bucket_self_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'artworks' AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text);
