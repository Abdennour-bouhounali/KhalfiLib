import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Clock, Ban, UserX, LogOut } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

export default function AccountStatusScreen() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const { user, logout } = useAuth();

    const getStatusInfo = () => {
        switch (user?.status) {
            case 'pending':
                return {
                    icon: <Clock size={80} color={activeColors.warning} />,
                    title: 'الحساب قيد المراجعة',
                    message: 'تم استلام طلبك وهو حالياً قيد المراجعة من قبل الإدارة. يرجى الانتظار حتى يتم تفعيل حسابك.',
                    color: activeColors.warning
                };
            case 'rejected':
                return {
                    icon: <UserX size={80} color={activeColors.danger} />,
                    title: 'تم رفض الطلب',
                    message: 'نعتذر، لقد تم رفض طلب إنشاء الحساب الخاص بك. يرجى التواصل مع الإدارة لمزيد من التفاصيل.',
                    color: activeColors.danger
                };
            case 'inactive':
                return {
                    icon: <Ban size={80} color={activeColors.danger} />,
                    title: 'الحساب معطل',
                    message: 'تم تعطيل هذا الحساب من قبل الإدارة. يرجى التواصل مع الإدارة لإعادة التفعيل.',
                    color: activeColors.danger
                };
            default:
                return {
                    icon: <Clock size={80} color={activeColors.primary} />,
                    title: 'حالة غير معروفة',
                    message: 'يرجى تسجيل الدخول مرة أخرى أو التواصل مع الدعم.',
                    color: activeColors.primary
                };
        }
    };

    const info = getStatusInfo();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={styles.content}>
                <View style={[styles.iconBox, { backgroundColor: info.color + '20' }]}>
                    {info.icon}
                </View>

                <Text style={[styles.title, { color: activeColors.text }]}>{info.title}</Text>
                <Text style={[styles.message, { color: activeColors.textSecondary }]}>{info.message}</Text>

                <Button
                    title="تسجيل الخروج"
                    onPress={logout}
                    variant="danger"
                    style={styles.button}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    iconBox: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        marginBottom: SPACING.m,
        textAlign: 'center',
    },
    message: {
        fontFamily: FONTS.regular,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xxl,
    },
    button: {
        width: '100%',
        height: 56,
    }
});
