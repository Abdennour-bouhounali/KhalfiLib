const admin = require('firebase-admin');

async function sendNotification() {
    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!serviceAccountJson) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not defined');
        }

        const serviceAccount = JSON.parse(serviceAccountJson);
        const versionName = process.env.VERSION_NAME || '1.0.0';
        const buildNumber = process.env.BUILD_NUMBER || '1';
        const apkUrl = process.env.APK_URL;

        if (!apkUrl) {
            throw new Error('APK_URL environment variable is not defined');
        }

        console.log(`[Notification Script] Initializing for version: ${versionName}-${buildNumber}`);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://khalfilib-default-rtdb.europe-west1.firebasedatabase.app"
        });

        const db = admin.database();
        const notifId = `notif_${versionName.replace(/\./g, '_')}_${buildNumber}`;
        const notifRef = db.ref(`notifications/${notifId}`);

        const notificationData = {
            title: "تحديث جديد متوفر",
            message: `اضغط لتحميل الإصدار الجديد من التطبيق (v${versionName}). تم تحسين الأداء وإضافة مميزات جديدة لخدمتكم.`,
            link: apkUrl,
            type: "update",
            version: versionName,
            createdAt: new Date().toISOString(),
            createdBy: "super_admin_system"
        };

        console.log(`[Notification Script] Sending notification to path: notifications/${notifId}`);
        await notifRef.set(notificationData);
        console.log('[Notification Script] Notification sent successfully! 🚀');

        process.exit(0);
    } catch (error) {
        console.error('[Notification Script] Failed to send notification:', error);
        process.exit(1);
    }
}

sendNotification();
