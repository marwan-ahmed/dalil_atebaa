import type {Metadata, Viewport} from 'next';
import { Tajawal } from 'next/font/google';
import Navbar from '@/components/Navbar';
import FloatingShareButton from '@/components/FloatingShareButton';
import InstallPrompt from '@/components/InstallPrompt';
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
  metadataBase: new URL('https://samarra-doctors.com'), // Adjust this to the actual domain when custom domain is set
  title: {
    default: 'دليل أطباء سامراء | نخبة الرعاية الصحية',
    template: '%s | دليل أطباء سامراء'
  },
  description: 'الدليل الطبي الأول لمدينة سامراء. ابحث عن أفضل الأطباء، العيادات، الصيدليات، والمختبرات الطبية بسهولة. احصل على أرقام الحجوزات وأوقات الدوام والمواقع.',
  keywords: ['دليل اطباء سامراء', 'اطباء سامراء', 'عيادات سامراء', 'مستشفى سامراء', 'دكتور في سامراء', 'طبيب سامراء', 'حجز اطباء سامراء', 'دليل سامراء الطبي', 'صيدليات سامراء', 'مختبرات سامراء'],
  authors: [{ name: 'مروان أحمد' }],
  creator: 'مروان أحمد',
  publisher: 'دليل أطباء سامراء',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'دليل أطباء سامراء | نخبة الرعاية الصحية',
    description: 'الدليل الطبي الأول لمدينة سامراء. احجز موعدك مع أفضل الأطباء بسهولة.',
    url: 'https://samarra-doctors.com',
    siteName: 'دليل أطباء سامراء',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1576091160550-2173ff9e5c18?q=80&w=1200&h=630&auto=format&fit=crop', // Provide a highly thematic placeholder for OG
        width: 1200,
        height: 630,
        alt: 'دليل أطباء سامراء',
      },
    ],
    locale: 'ar_IQ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دليل أطباء سامراء',
    description: 'الدليل الطبي الأول لمدينة سامراء. ابحث عن أفضل الأطباء بسهولة.',
    creator: '@abualror', // Replace with actual Twitter if needed
    images: ['https://images.unsplash.com/photo-1576091160550-2173ff9e5c18?q=80&w=1200&h=630&auto=format&fit=crop'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'أطباء سامراء',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} dark`}>
      <body className="bg-[#0a0f1a] text-gray-100 font-sans antialiased selection:bg-[#d4af37] selection:text-black min-h-screen flex flex-col" suppressHydrationWarning>
        <Navbar />
        {children}
        <FloatingShareButton />
        <InstallPrompt />
      </body>
    </html>
  );
}
