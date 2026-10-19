import { pub, todayIST } from '@/lib/public';
import JobDirectory from './JobDirectory';

export const revalidate = 10;

export default async function Home() {
  const supabase = pub();
  const today = todayIST();

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Supabase fetch error:', error.message);
  }

  return <JobDirectory jobs={jobs || []} today={today} />;
}