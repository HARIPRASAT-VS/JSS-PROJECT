// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing config
firebase.initializeApp({
  apiKey: "AIzaSyBtw_JRlIuxON2XCWaP51xuEihpxQ1rY5s",
  authDomain: "jss-college-project.firebaseapp.com",
  projectId: "jss-college-project",
  storageBucket: "jss-college-project.firebasestorage.app",
  messagingSenderId: "338998399623",
  appId: "1:338998399623:web:852f817378f279d77a5e22"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
