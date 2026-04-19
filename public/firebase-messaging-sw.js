importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAKotlA5okUkqDUyWeFuNobzop08jgi1q0",
  authDomain: "doctors-directory-web.firebaseapp.com",
  projectId: "doctors-directory-web",
  storageBucket: "doctors-directory-web.firebasestorage.app",
  messagingSenderId: "223393422079",
  appId: "1:223393422079:web:736e3275aa2d7532998aca"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    dir: 'rtl'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
