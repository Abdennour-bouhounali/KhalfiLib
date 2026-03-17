import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform, Linking, ActivityIndicator } from 'react-native';
import { Bell, Info, AlertTriangle, ExternalLink, Calendar, ChevronRight } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import Card from '../components/Card';
import { NotificationsAPI, AppNotification } from '../services/database';
import { useAuth } from '../context/AuthContext';

export default function NotificationScreen() {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async () => {
        try {
            const data = await NotificationsAPI.getAll();
            setNotifications(data);

            // Mark all fetched notifications as seen if they have an ID
            if (user?.id && data.length > 0) {
                const unseen = data.filter((n): n is AppNotification & { id: string } => !!n.id);
                await Promise.all(unseen.map(n => NotificationsAPI.markAsSeen(user.id, n.id)));
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
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
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

    const renderItem = ({ item }: { item: AppNotification }) => (
        <Card style={[styles.notifCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F5F5F7' }]}>
                    {getIcon(item.type)}
                </View>
                <View style={styles.headerText}>
                    <Text style={[styles.notifTitle, { color: activeColors.text }]}>{item.title}</Text>
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
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.m,
    },
    headerText: {
        flex: 1,
        alignItems: 'flex-end',
    },
    notifTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        marginBottom: 2,
        textAlign: 'right',
    },
    dateBox: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    notifDate: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        marginRight: 4,
    },
    notifMessage: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'right',
        marginVertical: SPACING.s,
    },
    linkButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: RADIUS.s,
        marginTop: SPACING.s,
    },
    linkText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
        marginLeft: SPACING.s,
    },
    emptyText: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        marginTop: SPACING.m,
    },
});
