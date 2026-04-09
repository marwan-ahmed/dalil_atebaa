import type {Metadata, Viewport} from 'next';
import { Tajawal } from 'next/font/google';
import Navbar from '@/components/Navbar';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-tajawal',
});

export const viewport: Viewport = {
  themeColor: '#0a0f1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'دليل الأطباء | نخبة الرعاية الصحية',
  description: 'دليل الأطباء الفاخر للبحث عن أفضل الأطباء',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'دليل الأطباء',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} dark`}>
      <body className="bg-[#0a0f1a] text-gray-100 font-sans antialiased selection:bg-[#d4af37] selection:text-black min-h-screen flex flex-col" suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
