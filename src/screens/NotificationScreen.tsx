import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform, Linking, ActivityIndicator, Alert } from 'react-native';
import { Bell, Info, AlertTriangle, ExternalLink, Calendar, ChevronRight, X } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import Card from '../components/Card';
import { NotificationsAPI, AppNotification } from '../services/database';
import { useAuth } from '../context/AuthContext';
import appConfig from '../../app.json';

export default function NotificationScreen() {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const [notifications, setNotifications] = useState<(AppNotification & { isRead?: boolean })[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    const loadNotifications = async () => {
        try {
            const [data, deletedIds, seenIds] = await Promise.all([
                NotificationsAPI.getAll(),
                user?.id ? NotificationsAPI.getDeletedIds(user.id) : Promise.resolve([]),
                user?.id ? NotificationsAPI.getSeenIds(user.id) : Promise.resolve([])
            ]);

            // 1. Filter out deleted ones locally for the user
            const nonDeleted = data.filter(n => !deletedIds.includes(n.id!));

            // 2. Filter by target (Role-based filtering)
            const roleFiltered = nonDeleted.filter(n => {
                if (!n.target || n.target === 'all') return true;
                if (user?.role === 'student' && n.target === 'students') return true;
                if ((user?.role === 'admin' || user?.role === 'super_admin') && n.target === 'admins') return true;
                return false;
            });

            // 3. Filter out update notifications that are older or equal to current version
            const versionFiltered = roleFiltered.filter(n =>
                n.type !== 'update' || isVersionNewer(n.version)
            );

            // 3. Remove duplicates (same title and message)
            const uniqueData = versionFiltered.filter((n, idx, self) =>
                idx === self.findIndex(t => (
                    t.title === n.title && t.message === n.message && t.version === n.version
                ))
            );

            // 4. Map with read status
            const withReadStatus = uniqueData.map(n => ({
                ...n,
                isRead: seenIds.includes(n.id!)
            }));

            setNotifications(withReadStatus);

            // Mark fetched notifications as seen in background
            if (user?.id && uniqueData.length > 0) {
                const unseenIds = uniqueData.filter(n => !seenIds.includes(n.id!)).map(n => n.id!);
                if (unseenIds.length > 0) {
                    NotificationsAPI.markMultipleAsSeen(user.id, unseenIds);
                }
            }
        } catch (error) {
            console.error('[NotificationScreen] Failed to load notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const handleDelete = async (notifId: string) => {
        if (!user?.id || !notifId) return;

        try {
            if (user.role === 'admin' || user.role === 'super_admin') {
                Alert.alert(
                    'حذف الإشعار',
                    'هل أنت متأكد من حذف هذا الإشعار نهائياً للجميع؟',
                    [
                        { text: 'إلغاء', style: 'cancel' },
                        {
                            text: 'حذف',
                            style: 'destructive',
                            onPress: async () => {
                                await NotificationsAPI.deleteGlobally(notifId);
                                setNotifications(prev => prev.filter(n => n.id !== notifId));
                            }
                        }
                    ]
                );
            } else {
                // For students, just hide it locally
                await NotificationsAPI.markAsDeleted(user.id, notifId);
                setNotifications(prev => prev.filter(n => n.id !== notifId));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleLink = async (link?: string) => {
        if (!link) return;
        try {
            const supported = await Linking.canOpenURL(link);
            if (supported) {
                await Linking.openURL(link);
            }
        } catch (error) {
            console.error('Error opening link:', error);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const d = date.getDate().toString().padStart(2, '0');
            const mo = (date.getMonth() + 1).toString().padStart(2, '0');
            const y = date.getFullYear();
            const h = date.getHours().toString().padStart(2, '0');
            const mi = date.getMinutes().toString().padStart(2, '0');
            return `${d}/${mo}/${y} ${h}:${mi}`;
        } catch (e) {
            return dateString;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'update': return <ExternalLink color="#2196F3" size={24} />;
            case 'alert': return <AlertTriangle color="#F44336" size={24} />;
            default: return <Info color="#4CAF50" size={24} />;
        }
    };

    const renderItem = ({ item }: { item: AppNotification & { isRead?: boolean } }) => (
        <Card style={[
            styles.notifCard,
            { backgroundColor: activeColors.surface, borderColor: activeColors.border },
            !item.isRead && styles.unreadCard
        ]}>
            {!item.isRead && <View style={styles.unreadDot} />}

            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id!)}
            >
                <X size={16} color={activeColors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F5F5F7' }]}>
                    {getIcon(item.type)}
                </View>
                <View style={styles.headerText}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.notifTitle, { color: activeColors.text }]}>{item.title}</Text>
                        {!item.isRead && (
                            <View style={[styles.newBadge, { backgroundColor: activeColors.primary }]}>
                                <Text style={styles.newBadgeText}>جديد</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.dateBox}>
                        <Calendar size={12} color={activeColors.textTertiary} />
                        <Text style={[styles.notifDate, { color: activeColors.textTertiary }]}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>
            </View>

            <Text style={[styles.notifMessage, { color: activeColors.textSecondary }]}>{item.message}</Text>

            {item.link && (
                <TouchableOpacity
                    style={[styles.linkButton, { backgroundColor: isDarkMode ? '#1A3A37' : '#E8F5E9' }]}
                    onPress={() => handleLink(item.link)}
                >
                    <Text style={[styles.linkText, { color: activeColors.primary }]}>
                        {item.type === 'update' ? 'تحميل التحديث' : 'فتح الرابط'}
                    </Text>
                    <ChevronRight size={18} color={activeColors.primary} />
                </TouchableOpacity>
            )}
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <Header title="الإشعارات" />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={activeColors.primary} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Bell size={64} color={activeColors.textTertiary} style={{ opacity: 0.3 }} />
                    <Text style={[styles.emptyText, { color: activeColors.textTertiary }]}>لا توجد إشعارات حالياً</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id!}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[activeColors.primary]}
                            tintColor={activeColors.primary}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBackground: {
        paddingBottom: 0,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    listContent: {
        padding: SPACING.m,
        paddingBottom: 100,
    },
    notifCard: {
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        position: 'relative',
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    unreadDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3B82F6',
        zIndex: 10,
    },
    deleteBtn: {
        position: 'absolute',
        top: 8,
        left: 8,
        padding: 4,
        zIndex: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    newBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: RADIUS.s,
    },
    newBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: FONTS.bold,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    headerText: {
        flex: 1,
        alignItems: 'flex-start',
    },
    notifTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        marginBottom: 2,
        textAlign: 'right',
    },
    dateBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notifDate: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        marginLeft: 4,
    },
    notifMessage: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'right',
        marginVertical: SPACING.s,
    },
    linkButton: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderRadius: RADIUS.s,
        marginTop: SPACING.s,
        gap: SPACING.s,
    },
    linkText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    emptyText: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        marginTop: SPACING.m,
    },
});
