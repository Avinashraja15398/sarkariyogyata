import type { Metadata } from 'next';
import QuizClient from './QuizClient';

export const metadata: Metadata = {
  title: 'Daily Govt Job Quiz & Leaderboard | SarkariYogyata',
  description: 'Free Daily Mock Test for SSC, Railway, Banking & State Exams. Earn Verified Merit Certificate.',
};

export default function QuizPage() {
  return <QuizClient />;
}