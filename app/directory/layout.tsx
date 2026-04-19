import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تصفح الدليل الطبي',
  description: 'تصفح دليل أطباء سامراء واكتشف نخبة الرعاية الصحية. ابحث عن الأطباء، الصيدليات، والمختبرات بحسب التخصص والموقع.',
  openGraph: {
    title: 'تصفح الدليل الطبي | دليل أطباء سامراء',
    description: 'تصفح دليل أطباء سامراء واكتشف نخبة الرعاية الصحية. ابحث عن الأطباء، الصيدليات، والمختبرات بحسب التخصص والموقع.',
    url: 'https://samarra-doctors.com/directory',
  },
};

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
