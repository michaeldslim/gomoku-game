import { supabase } from '../lib/supabase';

/*
 * Run this SQL in your Supabase SQL editor to create the required table:
 *
 * CREATE TABLE public.gomoku_leaderboard (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 *   display_name text NOT NULL,
 *   email text NOT NULL,
 *   score integer NOT NULL DEFAULT 0,
 *   updated_at timestamptz DEFAULT now(),
 *   UNIQUE(user_id)
 * );
 *
 * ALTER TABLE public.gomoku_leaderboard ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Anyone can read leaderboard"
 *   ON public.gomoku_leaderboard FOR SELECT USING (true);
 *
 * CREATE POLICY "Users can insert own record"
 *   ON public.gomoku_leaderboard FOR INSERT TO authenticated
 *   WITH CHECK (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can update own record"
 *   ON public.gomoku_leaderboard FOR UPDATE TO authenticated
 *   USING (auth.uid() = user_id);
 */

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  score: number;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('gomoku_leaderboard')
    .select('user_id, display_name, score')
    .order('score', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data.map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function fetchUserScore(userId: string): Promise<number> {
  const { data } = await supabase
    .from('gomoku_leaderboard')
    .select('score')
    .eq('user_id', userId)
    .single();
  return data?.score ?? 0;
}

export async function upsertScore(
  userId: string,
  displayName: string,
  email: string,
  score: number
): Promise<void> {
  await supabase.from('gomoku_leaderboard').upsert(
    {
      user_id: userId,
      display_name: displayName,
      email,
      score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}
