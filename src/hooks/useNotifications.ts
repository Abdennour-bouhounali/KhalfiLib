import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { UsersAPI } from '../services/database';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function useNotifications() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const notificationListener = useRef<Notifications.Subscription>(undefined);
    const responseListener = useRef<Notifications.Subscription>(undefined);

    useEffect(() => {
        if (!user?.id) return;

        const isExpoGo = Constants.appOwnership === 'expo';
        if (isExpoGo) {
            console.warn('[Notifications] Remote notifications are not supported in Expo Go for SDK 53+. Please use a Development Build.');
            return;
        }

        registerForPushNotificationsAsync().then(token => {
            if (token) {
                UsersAPI.updateFCMToken(user.id!, token);
            }
        });

        // Listen for notifications while the app is open
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('[Notifications] Received:', notification);
        });

        // Listen for user interaction (clikcing on notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log('[Notifications] Response:', data);

            if (data?.screen) {
                navigation.navigate(data.screen, data.params || {});
            }
        });

        return () => {
            if (notificationListener.current) notificationListener.current.remove();
            if (responseListener.current) responseListener.current.remove();
        };
    }, [user?.id]);

    async function registerForPushNotificationsAsync() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.warn('Failed to get push token for push notification!');
                return;
            }

            // Learn more about projectId here: https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
            // try to get projectId from extra or config
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;

            try {
                token = (await Notifications.getDevicePushTokenAsync()).data;
                // Alternatively, use Expo Push Token if not strictly using FCM but Expo's service
                // token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
                console.log('[Notifications] Token:', token);
            } catch (e) {
                console.error('[Notifications] Error getting token:', e);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }
}
