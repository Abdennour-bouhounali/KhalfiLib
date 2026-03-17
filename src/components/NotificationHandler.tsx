import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertTriangle, Download, X } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { NotificationsAPI, AppNotification } from '../services/database';

const LAST_SEEN_KEY = '@last_seen_notification';

export default function NotificationHandler() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const [modalVisible, setModalVisible] = useState(false);
    const [latestNotif, setLatestNotif] = useState<AppNotification | null>(null);

    useEffect(() => {
        const unsubscribe = NotificationsAPI.listenToLatest(async (notif) => {
            if (!notif || notif.type !== 'update') return;

            const lastSeenId = await AsyncStorage.getItem(LAST_SEEN_KEY);
            if (lastSeenId !== notif.id) {
                setLatestNotif(notif);
                setModalVisible(true);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleAction = async () => {
        if (latestNotif?.link) {
            await Linking.openURL(latestNotif.link);
        }
        await dismiss();
    };

    const dismiss = async () => {
        if (latestNotif?.id) {
            await AsyncStorage.setItem(LAST_SEEN_KEY, latestNotif.id);
        }
        setModalVisible(false);
    };

    if (!latestNotif) return null;

    return (
        <Modal
            transparent
            visible={modalVisible}
            animationType="fade"
            onRequestClose={dismiss}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={dismiss}>
                        <X size={20} color={activeColors.textSecondary} />
                    </TouchableOpacity>

                    <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#3D1B1B' : '#FFEBEB' }]}>
                        <AlertTriangle color="#F44336" size={40} />
                    </View>

                    <Text style={[styles.title, { color: activeColors.text }]}>{latestNotif.title}</Text>
                    <Text style={[styles.message, { color: activeColors.textSecondary }]}>{latestNotif.message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: activeColors.primary }]}
                            onPress={handleAction}
                        >
                            <Download size={20} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.primaryButtonText}>تحميل الآن</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={dismiss}>
                            <Text style={[styles.secondaryButtonText, { color: activeColors.textSecondary }]}>لاحقاً</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        width: '100%',
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 15,
            },
            android: {
                elevation: 20,
            },
        }),
    },
    closeButton: {
        position: 'absolute',
        top: SPACING.m,
        right: SPACING.m,
        padding: SPACING.xs,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 20,
        textAlign: 'center',
        marginBottom: SPACING.s,
    },
    message: {
        fontFamily: FONTS.regular,
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    buttonContainer: {
        width: '100%',
        gap: SPACING.m,
    },
    primaryButton: {
        width: '100%',
        height: 52,
        borderRadius: RADIUS.m,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: '#FFFFFF',
        marginRight: SPACING.s,
    },
    secondaryButton: {
        width: '100%',
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontFamily: FONTS.medium,
        fontSize: 15,
    },
});
