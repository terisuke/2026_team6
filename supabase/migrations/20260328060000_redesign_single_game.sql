-- =============================================================================
-- Migration: redesign_single_game
-- Description: リデザインに伴い、3ゲーム構成から画像選択×マウス軌跡の1ゲーム構成へ移行
--
-- Changes:
--   1. game_logs.game_type 制約を game_type=1 のみに変更
--   2. baseline_answers の構造変更をコメントで記録（カラム削除なし）
--   3. RLS (Row Level Security) ポリシーを全テーブルに追加
--   4. パフォーマンス用インデックスを追加
--
-- Rollback手順:
--   1. game_type制約を元に戻す:
--      ALTER TABLE game_logs DROP CONSTRAINT game_logs_game_type_single;
--      ALTER TABLE game_logs ADD CONSTRAINT game_logs_game_type_check CHECK (game_type BETWEEN 1 AND 3);
--   2. RLSポリシーを削除:
--      DROP POLICY IF EXISTS "Allow anonymous insert" ON users;
--      DROP POLICY IF EXISTS "Allow anonymous select own" ON users;
--      DROP POLICY IF EXISTS "Allow anonymous insert game_logs" ON game_logs;
--      DROP POLICY IF EXISTS "Allow anonymous select game_logs" ON game_logs;
--      DROP POLICY IF EXISTS "Allow anonymous insert analysis_results" ON analysis_results;
--      DROP POLICY IF EXISTS "Allow anonymous select analysis_results" ON analysis_results;
--   3. ALTER TABLE users DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE game_logs DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE analysis_results DISABLE ROW LEVEL SECURITY;
--   4. DROP INDEX IF EXISTS idx_analysis_results_user_id;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. game_logs.game_type 制約の変更: 1-3 → 1のみ
--    リデザインでゲームは画像選択（game_type=1）のみとなるため
-- ---------------------------------------------------------------------------

-- 既存のCHECK制約を削除
ALTER TABLE game_logs DROP CONSTRAINT IF EXISTS game_logs_game_type_check;

-- 新しいCHECK制約を追加（game_type = 1 のみ許可）
ALTER TABLE game_logs ADD CONSTRAINT game_logs_game_type_single CHECK (game_type = 1);

-- ---------------------------------------------------------------------------
-- 2. baseline構造の変更メモ
--    リデザインではベースライン質問が5問→3問に変更:
--      - 残存: baseline_caution, baseline_coop, baseline_positive
--      - 廃止対象: baseline_calmness, baseline_logic
--    ただしカラムは削除しない（既存データ保護・後方互換性のため）
--    フロントエンドで使用しない値にはデフォルト値（50）を挿入する運用とする
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN users.baseline_calmness IS 'DEPRECATED: リデザインで廃止。新規ユーザーにはデフォルト値50を設定';
COMMENT ON COLUMN users.baseline_logic IS 'DEPRECATED: リデザインで廃止。新規ユーザーにはデフォルト値50を設定';

-- ---------------------------------------------------------------------------
-- 3. RLS (Row Level Security) ポリシーの追加
--    匿名アクセス（anon key）でのINSERT/SELECTを許可
-- ---------------------------------------------------------------------------

-- users テーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON users
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select own" ON users
  FOR SELECT TO anon USING (true);

-- game_logs テーブル
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert game_logs" ON game_logs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select game_logs" ON game_logs
  FOR SELECT TO anon USING (true);

-- analysis_results テーブル
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert analysis_results" ON analysis_results
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select analysis_results" ON analysis_results
  FOR SELECT TO anon USING (true);

-- ---------------------------------------------------------------------------
-- 4. パフォーマンス用インデックスの追加
--    idx_game_logs_user_id は初期マイグレーションで作成済みのためスキップ
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);

-- ---------------------------------------------------------------------------
-- 5. 旧ゲームデータのクリーンアップ（必要に応じてコメント解除）
--    WARNING: 実行前にバックアップを取得すること
-- ---------------------------------------------------------------------------
-- DELETE FROM game_logs WHERE game_type IN (2, 3);
