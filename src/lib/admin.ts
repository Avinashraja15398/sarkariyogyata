import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
export async function sessionClient() {
  const c = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => c.getAll(), setAll: (l) => { try { l.forEach(({ name, value, options }) => c.set(name, value, options)); } catch {} } },
  });
}
export const serviceClient = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
export async function getStaff() {
  const { data: { user } } = await (await sessionClient()).auth.getUser();
  if (!user) return null;
  const svc = serviceClient();
  const { data } = await svc.from('profiles').select('role').eq('id', user.id).single();
  return data && ['admin', 'editor'].includes(data.role) ? { user, svc, role: data.role as string } : null;
}
