import { NextResponse } from 'next/server';
import { sendBroadcastNotification } from '@/app/actions/notify';

const DAILY_NOTIFICATIONS = [
  { title: 'تذكير طبي مهم 🩺', body: 'شرب كميات كافية من الماء يومياً يعزز مناعتك ويحافظ على صحتك.' },
  { title: 'صحتك في سامراء 🏥', body: 'ابحث عن أقرب طبيب أو صيدلية لك في ثوانٍ عبر دليل سامراء الطبي.' },
  { title: 'نصيحة اليوم 💡', body: 'النوم الكافي مفتاح لصحة العقل والجسد. هل نمت جيداً البارحة؟' },
  { title: 'هل قمت بزيارة طبيبك؟ 👨‍⚕️', body: 'لا تنسَ المراجعات الدورية للاطمئنان على صحتك وصحة من تحب.' },
  { title: 'دليل سامراء الطبي 💊', body: 'شارك تجربتك وتقييمك للأطباء لمساعدة الآخرين في العثور على أفضل رعاية.' },
  { title: 'معلومة سريعة 📝', body: 'المشي لمدة 30 دقيقة يومياً يحميك من أمراض القلب ويجدد نشاطك.' }
];

export async function GET(request: Request) {
  try {
    // Basic authorization for the CRON job using a Bearer token
    // Example: Authorization: Bearer MY_CRON_SECRET
    const authHeader = request.headers.get('authorization');
    
    // In production, ensure process.env.CRON_SECRET is set in the AI Studio environment
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pick a random notification from our daily list
    const randomIndex = Math.floor(Math.random() * DAILY_NOTIFICATIONS.length);
    const notification = DAILY_NOTIFICATIONS[randomIndex];

    const result = await sendBroadcastNotification(notification.title, notification.body);

    if (result.success) {
      return NextResponse.json({ 
        message: 'Daily notification broadcasted successfully',
        notification,
        stats: {
          successCount: result.successCount,
          failureCount: result.failureCount,
          totalTokens: result.totalTokens
        }
      });
    } else {
      return NextResponse.json({ 
        message: 'Failed to broadcast', 
        details: result.message || result.error 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
