-- =============================================================================
-- Migration: add_baseline_to_analysis_results
-- Description: analysis_results テーブルに baseline_scores, self_mbti カラムを追加
--
-- Changes:
--   1. self_mbti カラムを追加 (VARCHAR(10), nullable)
--   2. baseline_* カラムを追加 (INT, NOT NULL, DEFAULT 50)
--
-- Rollback手順:
--   ALTER TABLE analysis_results DROP COLUMN IF EXISTS self_mbti;
--   ALTER TABLE analysis_results DROP COLUMN IF EXISTS baseline_caution;
--   ALTER TABLE analysis_results DROP COLUMN IF EXISTS baseline_calmness;
--   ALTER TABLE analysis_results DROP COLUMN IF EXISTS baseline_logic;
--   ALTER TABLE analysis_results DROP COLUMN IF EXISTS baseline_coop;
--   ALTER TABLE analysis_results DROP COLUMN IF EXISTS baseline_positive;
-- =============================================================================

-- self_mbti: ユーザーの自己申告MBTIタイプ
ALTER TABLE analysis_results
  ADD COLUMN self_mbti VARCHAR(10);

-- baseline_scores: ベースライン診断スコア（既存行はデフォルト50）
ALTER TABLE analysis_results
  ADD COLUMN baseline_caution INT NOT NULL DEFAULT 50 CHECK (baseline_caution BETWEEN 0 AND 100);

ALTER TABLE analysis_results
  ADD COLUMN baseline_calmness INT NOT NULL DEFAULT 50 CHECK (baseline_calmness BETWEEN 0 AND 100);

ALTER TABLE analysis_results
  ADD COLUMN baseline_logic INT NOT NULL DEFAULT 50 CHECK (baseline_logic BETWEEN 0 AND 100);

ALTER TABLE analysis_results
  ADD COLUMN baseline_coop INT NOT NULL DEFAULT 50 CHECK (baseline_coop BETWEEN 0 AND 100);

ALTER TABLE analysis_results
  ADD COLUMN baseline_positive INT NOT NULL DEFAULT 50 CHECK (baseline_positive BETWEEN 0 AND 100);
