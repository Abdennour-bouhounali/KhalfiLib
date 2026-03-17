import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ChevronRight, UserCheck, UserX, Trash2, ShieldCheck, Mail, Phone, ArrowLeft } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { UsersAPI, User } from '../services/database';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';

export default function AdminManagementScreen() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [admins, setAdmins] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAdmins = async () => {
        try {
            setLoading(true);
            const allAdmins = await UsersAPI.getAll('admin');
            setAdmins(allAdmins);
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل تحميل قائمة المسؤولين');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdmins();
    }, []);

    const handleStatusChange = async (uid: string, name: string, newStatus: 'active' | 'inactive') => {
        const actionText = newStatus === 'active' ? 'تفعيل' : 'تعطيل';
        Alert.alert(
            'تأكيد العملية',
            `هل أنت متأكد من ${actionText} حساب المسؤول "${name}"؟`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: actionText,
                    onPress: async () => {
                        try {
                            await UsersAPI.update(uid, { status: newStatus });
                            Alert.alert('نجاح', `تم ${actionText} الحساب بنجاح`);
                            loadAdmins();
                        } catch (error) {
                            Alert.alert('خطأ', 'فشل تحديث حالة الحساب');
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = async (uid: string, name: string) => {
        Alert.alert(
            'حذف الحساب',
            `هل أنت متأكد من حذف حساب المسؤول "${name}" نهائياً؟ لا يمكن التراجع عن هذه العملية.`,
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await UsersAPI.delete(uid);
                            Alert.alert('نجاح', 'تم حذف الحساب بنجاح');
                            loadAdmins();
                        } catch (error) {
                            Alert.alert('خطأ', 'فشل حذف الحساب');
                        }
                    }
                }
            ]
        );
    };

    const renderAdminItem = ({ item }: { item: User }) => (
        <Card style={[styles.card, { backgroundColor: activeColors.surface }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'active' ? activeColors.success + '20' :
                        item.status === 'pending' ? '#FFF3E0' : '#FFEBEE'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'active' ? activeColors.success :
                            item.status === 'pending' ? '#EF6C00' : activeColors.danger
                    }]}>
                        {item.status === 'active' ? 'نشط' : item.status === 'pending' ? 'قيد الانتظار' : 'معطل'}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: activeColors.text }]}>{item.name}</Text>
                    <View style={styles.phoneRow}>
                        <Text style={[styles.userPhone, { color: activeColors.textSecondary }]}>{item.phone}</Text>
                        <Phone size={14} color={activeColors.textTertiary} style={{ marginLeft: 4 }} />
                    </View>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn, { borderColor: activeColors.danger }]}
                    onPress={() => handleDelete(item.id!, item.name)}
                >
                    <Trash2 size={18} color={activeColors.danger} />
                    <Text style={[styles.actionText, { color: activeColors.danger }]}>حذف</Text>
                </TouchableOpacity>

                {item.status === 'active' ? (
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: '#EF6C00' }]}
                        onPress={() => handleStatusChange(item.id!, item.name, 'inactive')}
                    >
                        <UserX size={18} color="#EF6C00" />
                        <Text style={[styles.actionText, { color: '#EF6C00' }]}>تعطيل</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: activeColors.success }]}
                        onPress={() => handleStatusChange(item.id!, item.name, 'active')}
                    >
                        <UserCheck size={18} color={activeColors.success} />
                        <Text style={[styles.actionText, { color: activeColors.success }]}>تفعيل</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight, paddingTop: insets.top + SPACING.s }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft color={activeColors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: activeColors.text }]}>إدارة المسؤولين</Text>
                    <View style={{ width: 24 }} />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={activeColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={admins}
                    renderItem={renderAdminItem}
                    keyExtractor={(item) => item.id!}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <ShieldCheck size={48} color={activeColors.textTertiary} />
                            <Text style={[styles.emptyText, { color: activeColors.textTertiary }]}>لا يوجد مسؤولين حالياً</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
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
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
        paddingBottom: SPACING.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: SPACING.m,
        paddingBottom: 40,
    },
    card: {
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderRadius: RADIUS.l,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    userInfo: {
        alignItems: 'flex-end',
        flex: 1,
    },
    userName: {
        fontFamily: FONTS.bold,
        fontSize: 17,
        marginBottom: 4,
    },
    userPhone: {
        fontFamily: FONTS.regular,
        fontSize: 14,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.s,
    },
    statusText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: SPACING.m,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.s,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        gap: 6,
    },
    deleteBtn: {
        marginRight: 'auto', // Push delete to the left
    },
    actionText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        gap: SPACING.m,
    },
    emptyText: {
        fontFamily: FONTS.medium,
        fontSize: 16,
    },
});

