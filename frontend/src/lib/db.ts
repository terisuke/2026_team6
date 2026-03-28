import { getSupabase } from './supabase';
import type { BaselineScores, MouseGameData, AnalysisResult } from '@/features/game/types';

// ---- users ----

export async function registerUser(params: {
  mbti: string | null;
  baselineScores: BaselineScores;
}): Promise<string> {
  const id = crypto.randomUUID();
  const { error } = await getSupabase().from('users').insert({
    id,
    self_mbti: params.mbti,
    baseline_caution: params.baselineScores.caution,
    baseline_calmness: params.baselineScores.calmness,
    baseline_logic: params.baselineScores.logic,
    baseline_coop: params.baselineScores.cooperativeness,
    baseline_positive: params.baselineScores.positivity,
  });
  if (error) throw new Error(error.message);
  return id;
}

// ---- game_logs ----

export async function submitGameData(
  userId: string,
  data: MouseGameData,
): Promise<void> {
  const { error } = await getSupabase().from('game_logs').upsert(
    { user_id: userId, game_type: 1, raw_data: data },
    { onConflict: 'user_id,game_type' },
  );
  if (error) throw new Error(error.message);
}

export async function getGameLog(userId: string) {
  const { data, error } = await getSupabase()
    .from('game_logs')
    .select('raw_data')
    .eq('user_id', userId)
    .eq('game_type', 1)
    .single();
  if (error) throw new Error(error.message);
  return data?.raw_data as MouseGameData | null;
}

// ---- users (read) ----

export async function getUser(userId: string) {
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id as string,
    selfMbti: data.self_mbti as string | null,
    baseline: {
      caution: data.baseline_caution as number,
      calmness: data.baseline_calmness as number,
      logic: data.baseline_logic as number,
      cooperativeness: data.baseline_coop as number,
      positivity: data.baseline_positive as number,
    } satisfies BaselineScores,
  };
}

// ---- analysis_results ----

export async function getAnalysisResult(userId: string): Promise<AnalysisResult | null> {
  const { data, error } = await getSupabase()
    .from('analysis_results')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return data as unknown as AnalysisResult;
}

export async function saveAnalysisResult(result: AnalysisResult): Promise<void> {
  const { error } = await getSupabase()
    .from('analysis_results')
    .upsert(result, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}
