export const STANDARD_SPECIALTIES = [
  'باطنية',
  'نسائية وتوليد',
  'أطفال',
  'جراحة عامة',
  'عيون',
  'أسنان',
  'جملة عصبية',
  'جلدية',
  'أنف وأذن وحنجرة',
  'سونار وأشعة',
  'عظام ومفاصل (كسور)',
  'مسالك بولية',
  'أمراض دم',
  'أورام وغدد',
  'تغذية',
  'نفسية',
  'عام'
];

export function normalizeSpecialty(raw: string): string {
  if (!raw) return 'عام';
  
  // Normalize Arabic letters for matching
  const normalized = raw
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ي/g, 'ى')
    .replace(/\s+/g, ''); // Remove all spaces for aggressive matching

  if (normalized.includes('نسائ') || normalized.includes('توليد')) return 'نسائية وتوليد';
  if (normalized.includes('جملهعصب') || normalized.includes('عصبى') || normalized.includes('عصبي')) return 'جملة عصبية';
  if (normalized.includes('انف') || normalized.includes('اذن') || normalized.includes('حنجر')) return 'أنف وأذن وحنجرة';
  if (normalized.includes('كسور') || normalized.includes('مفاصل') || normalized.includes('عظام')) return 'عظام ومفاصل (كسور)';
  if (normalized.includes('سونار') || normalized.includes('اشعه') || normalized.includes('اشعة')) return 'سونار وأشعة';
  if (normalized.includes('جراح')) return 'جراحة عامة';
  if (normalized.includes('بولي') || normalized.includes('كلى')) return 'مسالك بولية';
  if (normalized.includes('دم')) return 'أمراض دم';
  if (normalized.includes('اورام') || normalized.includes('غدد')) return 'أورام وغدد';
  if (normalized.includes('نفس')) return 'نفسية';
  if (normalized.includes('تغذي')) return 'تغذية';
  if (normalized.includes('اسنان') || normalized.includes('سن')) return 'أسنان';
  if (normalized.includes('اطفال') || normalized.includes('طفل')) return 'أطفال';
  if (normalized.includes('باطن')) return 'باطنية';
  if (normalized.includes('جلد')) return 'جلدية';
  if (normalized.includes('عيون') || normalized.includes('عين')) return 'عيون';

  // If no match found, return the original but trimmed
  return raw.trim();
}
