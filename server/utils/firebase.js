const admin = require('firebase-admin');

let isFirebaseInitialized = false;

try {
    let serviceAccount;
    
    // Support for both a file (local) and a raw JSON string (production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
        serviceAccount = require('../firebase-service-account.json');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    isFirebaseInitialized = true;
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
}

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    if (!isFirebaseInitialized || !fcmToken) return false;
    
    try {
        const message = {
            notification: { title, body },
            data,
            token: fcmToken
        };
        await admin.messaging().send(message);
        return true;
    } catch (error) {
        console.error('Error sending FCM:', error);
        return false;
    }
};

module.exports = { admin, sendPushNotification, isFirebaseInitialized };
