import { NextResponse } from 'next/server';
import { getQuizUser } from '@/lib/quizAuth';
import { QUIZ_COUNT, SECONDS_PER_Q, shuffle } from '@/lib/quiz';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const q = await getQuizUser();
  if (!q) return NextResponse.json({ error: 'Login required' }, { status: 401 });
  const { user, svc } = q;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const level = ['easy', 'medium', 'hard', 'global'].includes(body.level) ? body.level : 'medium';

  // 24-Hour Rule for Global Level
  if (level === 'global') {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: pastGlobal } = await svc
      .from('quiz_attempts')
      .select('id, started_at')
      .eq('user_id', user.id)
      .eq('counted', true)
      .gte('started_at', twentyFourHoursAgo)
      .limit(1);

    if (pastGlobal && pastGlobal.length > 0) {
      return NextResponse.json(
        { error: 'Global Challenge aap 24 ghante me sirf 1 baar de sakte hain! Agle attempt ke liye pratiksha karein ya Practice Quiz khelein.' },
        { status: 429 }
      );
    }
  }

  // Filter pool by difficulty if not global
  let query = svc.from('quiz_questions').select('id, subject, difficulty').eq('status', 'approved');
  if (level !== 'global') {
    query = query.eq('difficulty', level);
  }

  const { data: pool, error } = await query.limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!pool || pool.length < 5) {
    return NextResponse.json({ error: 'Is level me abhi questions kam hain. Dusra level chunein!' }, { status: 503 });
  }

  // Avoid recently used questions
  const { data: recent } = await svc
    .from('quiz_attempts')
    .select('question_ids')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(3);

  const used = new Set((recent || []).flatMap((r: any) => r.question_ids as string[]));
  let candidates = pool.filter((p: any) => !used.has(p.id));
  if (candidates.length < QUIZ_COUNT) candidates = pool;

  // Round-robin shuffle for subject diversity
  const bySubject = new Map<string, string[]>();
  for (const p of shuffle(candidates)) {
    const a = bySubject.get(p.subject) || [];
    a.push(p.id);
    bySubject.set(p.subject, a);
  }

  const lists = shuffle(Array.from(bySubject.values()));
  const ids: string[] = [];
  while (ids.length < Math.min(QUIZ_COUNT, candidates.length) && lists.some((l) => l.length)) {
    for (const l of lists) {
      if (l.length && ids.length < QUIZ_COUNT) ids.push(l.pop()!);
    }
  }

  const order = shuffle(ids);
  const { data: rows, error: e2 } = await svc
    .from('quiz_questions')
    .select('id, question, options, subject, difficulty')
    .in('id', order);

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const map = new Map((rows || []).map((r: any) => [r.id, r]));
  const questions = order.map((id) => map.get(id)).filter(Boolean);

  const { data: attempt, error: e3 } = await svc
    .from('quiz_attempts')
    .insert({ user_id: user.id, question_ids: order })
    .select('id')
    .single();

  if (e3 || !attempt) return NextResponse.json({ error: e3?.message || 'Attempt create fail' }, { status: 500 });

  // Correct answer is NEVER sent to client (Anti-cheat)
  return NextResponse.json({
    attempt_id: attempt.id,
    time_limit_sec: questions.length * SECONDS_PER_Q,
    questions,
    level,
  });
}