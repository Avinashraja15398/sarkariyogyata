import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SarkariYogyata - Apni Yogyata Ke Hisab Se Sarkari Naukri, Admit Card & Result',
  description: '100% Verified Government Jobs, Admit Cards, and Exam Results filtered by your age and qualification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi">
      <body className="bg-[#F8FAFC] text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}