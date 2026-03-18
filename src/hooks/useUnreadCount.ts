import { useState, useEffect } from 'react';
import { NotificationsAPI } from '../services/database';
import { useAuth } from '../context/AuthContext';
import appConfig from '../../app.json';

export function useUnreadCount() {
    const { user } = useAuth();
    const [count, setCount] = useState(0);
    const currentVersion = appConfig.expo.version;

    const isVersionNewer = (notifVersion?: string) => {
        if (!notifVersion) return false;
        const current = currentVersion.split('.').map(Number);
        const notif = notifVersion.split('.').map(Number);
        for (let i = 0; i < Math.max(current.length, notif.length); i++) {
            const v1 = current[i] || 0;
            const v2 = notif[i] || 0;
            if (v2 > v1) return true;
            if (v2 < v1) return false;
        }
        return false;
    };

    useEffect(() => {
        if (!user?.id) return;

        const loadCount = async () => {
            try {
                const [data, deletedIds, seenIds] = await Promise.all([
                    NotificationsAPI.getAll(),
                    NotificationsAPI.getDeletedIds(user.id!),
                    NotificationsAPI.getSeenIds(user.id!)
                ]);

                const unread = data.filter(n => {
                    // 1. Not deleted
                    if (deletedIds.includes(n.id!)) return false;
                    // 2. Not seen
                    if (seenIds.includes(n.id!)) return false;
                    // 3. Target match
                    if (n.target && n.target !== 'all') {
                        if (user.role === 'student' && n.target !== 'students') return false;
                        if ((user.role === 'admin' || user.role === 'super_admin') && n.target !== 'admins') return false;
                    }
                    // 4. Version check for updates
                    if (n.type === 'update' && !isVersionNewer(n.version)) return false;

                    return true;
                });

                setCount(unread.length);
            } catch (error) {
                console.error('[useUnreadCount] Failed to load count:', error);
            }
        };

        loadCount();

        // Listen for new notifications to update count
        const unsubscribe = NotificationsAPI.listenToLatest((notif) => {
            if (notif) loadCount();
        });

        return () => unsubscribe();
    }, [user?.id]);

    return count;
}
