'use server';

import { adminDb, adminMessaging } from '@/lib/firebase-admin';

export async function sendNotificationToUser(userId: string, title: string, body: string) {
  if (!userId) return { success: false, message: 'No userId provided' };
  
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.log('User document not found for notifications.');
      return { success: false, message: 'User not found' };
    }
    
    const data = userDoc.data();
    const tokens = data?.fcmTokens || [];
    
    if (tokens.length > 0) {
      const message = {
        notification: {
          title,
          body,
        },
        tokens: tokens,
      };
      
      const response = await adminMessaging.sendEachForMulticast(message);
      console.log(response.successCount + ' messages were sent successfully to ' + userId);
      
      return { success: true, count: response.successCount };
    } else {
       console.log('No FCM tokens found for user: ' + userId);
       return { success: false, message: 'No tokens found' };
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
}

export async function sendBroadcastNotification(title: string, body: string) {
  try {
    const usersSnapshot = await adminDb.collection('users').get();
    let allTokens: string[] = [];

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
        allTokens.push(...data.fcmTokens);
      }
    });

    // Also get tokens from anonymous_tokens collection
    const anonTokensSnapshot = await adminDb.collection('anonymous_tokens').get();
    anonTokensSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.token) {
        allTokens.push(data.token);
      }
    });

    // Remove duplicates
    allTokens = Array.from(new Set(allTokens));

    if (allTokens.length === 0) {
      return { success: false, message: 'No devices registered for notifications.' };
    }

    // FCM allows max 500 tokens per multicast message
    const chunkSize = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < allTokens.length; i += chunkSize) {
      const chunk = allTokens.slice(i, i + chunkSize);
      
      const message = {
        notification: { title, body },
        tokens: chunk,
      };

      const response = await adminMessaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;
    }

    return { success: true, successCount, failureCount, totalTokens: allTokens.length };
  } catch (error) {
    console.error('Error in broadcast:', error);
    return { success: false, error: String(error) };
  }
}

export async function saveAnonymousToken(token: string) {
  if (!token) return { success: false, message: 'No token' };
  try {
    // Save token as a document ID to avoid duplicates inherently
    await adminDb.collection('anonymous_tokens').doc(token).set({
      token,
      createdAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error saving anonymous token', error);
    return { success: false, error };
  }
}
