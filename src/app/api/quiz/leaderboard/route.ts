import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const sp = new URL(req.url).searchParams;
    const period = sp.get('period') || 'day';
    const scope = sp.get('scope') || 'india';
    const state = sp.get('state') || null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('quiz_attempts')
      .select('id, user_id, score, total, submitted_at, quiz_players!inner(display_name, state)')
      .order('score', { ascending: false })
      .order('submitted_at', { ascending: false })
      .limit(20);

    // Filter by State if requested
    if (scope === 'state' && state) {
      query = query.eq('quiz_players.state', state);
    }

    // Filter by Timeframe (Day, Week)
    const now = new Date();
    if (period === 'day') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte('submitted_at', todayStart);
    } else if (period === 'week') {
      const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();
      query = query.gte('submitted_at', weekStart);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ rows: [] });
    }

    const rows = (data || []).map((item: any, idx: number) => ({
      rank: idx + 1,
      name: item.quiz_players?.display_name || 'Candidate',
      state: item.quiz_players?.state || 'India',
      points: item.score * 10,
      user_id: item.user_id,
    }));

    return NextResponse.json({ rows });
  } catch (err: any) {
    return NextResponse.json({ rows: [] });
  }
}