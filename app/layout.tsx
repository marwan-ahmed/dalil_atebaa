import type {Metadata} from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'دليل الأطباء | نخبة الرعاية الصحية',
  description: 'دليل الأطباء الفاخر للبحث عن أفضل الأطباء',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} dark`}>
      <body className="bg-[#0a0f1a] text-gray-100 font-sans antialiased selection:bg-[#d4af37] selection:text-black min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
