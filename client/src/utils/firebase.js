import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBtw_JRlIuxON2XCWaP51xuEihpxQ1rY5s",
  authDomain: "jss-college-project.firebaseapp.com",
  projectId: "jss-college-project",
  storageBucket: "jss-college-project.firebasestorage.app",
  messagingSenderId: "338998399623",
  appId: "1:338998399623:web:852f817378f279d77a5e22",
  measurementId: "G-QNXG38EXQW"
};

const app = initializeApp(firebaseConfig);
const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export const requestFirebaseNotificationPermission = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BKJGuGBVttJ0tPVvtIMl0sX0MEaElru2PuDwfHCt351E8OLxPj5J_ebaIQp7r4r1FJ9XrZ9oalysqLPzWBWgGDA'
      });
      return token;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
  return null;
};
