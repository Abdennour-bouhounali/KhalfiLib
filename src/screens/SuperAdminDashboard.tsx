import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';
import { UserCheck, UserX, LogOut, ShieldCheck, BookOpen, RefreshCw, ChevronLeft } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { UsersAPI, User, BooksAPI } from '../services/database';
import { MigrationService } from '../services/MigrationService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';

export default function SuperAdminDashboard() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const { logout, user: currentUser } = useAuth();
    const navigation = useNavigation<any>();

    const [pendingAdmins, setPendingAdmins] = useState<User[]>([]);
    const [stats, setStats] = useState({ admins: 0, students: 0, books: 0 });
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);
    const [showMigration, setShowMigration] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pending, allAdmins, allStudents, allBooks] = await Promise.all([
                UsersAPI.getPending('admin'),
                UsersAPI.getAll('admin'),
                UsersAPI.getAll('student'),
                BooksAPI.getAll()
            ]);

            setPendingAdmins(pending);
            setStats({
                admins: allAdmins.length,
                students: allStudents.length,
                books: allBooks.length
            });

            // Check if legacy students table exists
            const legacySnapshot = await get(ref(db, 'students'));
            setShowMigration(legacySnapshot.exists());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMigration = async () => {
        Alert.alert(
            'بدء عملية الهجرة',
            'سيتم تحويل بيانات الطلاب إلى نظام المستخدمين الموحد. هل تود الاستمرار؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'بدء',
                    onPress: async () => {
                        try {
                            setMigrating(true);
                            await MigrationService.migrateStudentsToUsers();
                            Alert.alert('نجاح', 'تمت عملية الهجرة بنجاح. سيتم الآن تنظيف البيانات القديمة.', [
                                {
                                    text: 'تنظيف وتحديث',
                                    onPress: async () => {
                                        await MigrationService.cleanupStudentsTable();
                                        loadData();
                                    }
                                }
                            ]);
                        } catch (error) {
                            Alert.alert('خطأ', 'فشلت عملية الهجرة');
                        } finally {
                            setMigrating(false);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAction = async (uid: string, status: 'active' | 'rejected') => {
        try {
            await UsersAPI.update(uid, { status });
            Alert.alert('نجاح', status === 'active' ? 'تم تفعيل الحساب' : 'تم رفض الحساب');
            loadData();
        } catch (error) {
            Alert.alert('خطأ', 'فشل تحديث حالة الحساب');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <Header
                    showLogo
                    showLogout
                    onLogout={() => {
                        Alert.alert('تسجيل الخروج', 'هل أنت متأكد من رغبتك في تسجيل الخروج؟', [
                            { text: 'إلغاء', style: 'cancel' },
                            { text: 'تسجيل الخروج', onPress: logout, style: 'destructive' }
                        ]);
                    }}
                />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.welcomeRow}>
                    <View>
                        <Text style={[styles.welcomeText, { color: activeColors.text }]}>مرحباً، {currentUser?.name}</Text>
                        <Text style={[styles.roleLabel, { color: activeColors.primary }]}>المشرف العام</Text>
                    </View>
                </View>

                {/* Statistics Cards */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: activeColors.surface }]}>
                        <ShieldCheck color={activeColors.primary} size={24} />
                        <Text style={[styles.statValue, { color: activeColors.text }]}>{stats.admins}</Text>
                        <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>المسؤولين</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: activeColors.surface }]}>
                        <UserCheck color={activeColors.success} size={24} />
                        <Text style={[styles.statValue, { color: activeColors.text }]}>{stats.students}</Text>
                        <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>الطلاب</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: activeColors.surface }]}>
                        <BookOpen color={'#0288D1'} size={24} />
                        <Text style={[styles.statValue, { color: activeColors.text }]}>{stats.books}</Text>
                        <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>الكتب</Text>
                    </View>
                </View>

                {/* Management Navigation */}
                <TouchableOpacity
                    style={[styles.manageAdminsBtn, { backgroundColor: activeColors.primary }]}
                    onPress={() => navigation.navigate('AdminManagement')}
                >
                    <ShieldCheck color={activeColors.surface} size={20} />
                    <Text style={[styles.manageAdminsText, { color: activeColors.surface }]}>إدارة المسؤولين</Text>
                </TouchableOpacity>

                {showMigration && (
                    <TouchableOpacity
                        style={[styles.migrationBtn, { backgroundColor: activeColors.warning || '#FFA000' }]}
                        onPress={handleMigration}
                        disabled={migrating}
                    >
                        {migrating ? (
                            <ActivityIndicator color={activeColors.surface} />
                        ) : (
                            <>
                                <RefreshCw color={activeColors.surface} size={20} />
                                <Text style={[styles.migrationText, { color: activeColors.surface }]}>هجرة بيانات الطلاب (نظام جديد)</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: activeColors.text }]}>طلبات انضمام المسؤولين</Text>
                    <TouchableOpacity onPress={loadData}>
                        <RefreshCw size={20} color={activeColors.primary} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={activeColors.primary} style={{ marginTop: 30 }} />
                ) : (
                    <View>
                        {pendingAdmins.map((item) => (
                            <Card key={item.id} style={[styles.userCard, { backgroundColor: activeColors.surface }]}>
                                <View style={styles.userInfo}>
                                    <View style={[styles.iconBox, { backgroundColor: activeColors.primaryLight + '20' }]}>
                                        <ShieldCheck size={24} color={activeColors.primary} />
                                    </View>
                                    <View style={styles.userText}>
                                        <Text style={[styles.userName, { color: activeColors.text }]}>{item.name}</Text>
                                        <Text style={[styles.userPhone, { color: activeColors.textSecondary }]}>{item.phone}</Text>
                                    </View>
                                </View>
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { borderColor: activeColors.success }]}
                                        onPress={() => handleAction(item.id!, 'active')}
                                    >
                                        <UserCheck size={20} color={activeColors.success} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { borderColor: activeColors.danger }]}
                                        onPress={() => handleAction(item.id!, 'rejected')}
                                    >
                                        <UserX size={20} color={activeColors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </Card>
                        ))}
                        {pendingAdmins.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: activeColors.textTertiary }]}>لا توجد طلبات معلقة حالياً</Text>
                            </View>
                        )}
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
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
    },
    content: {
        flex: 1,
        padding: SPACING.m,
    },
    welcomeRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
        paddingHorizontal: SPACING.s,
    },
    welcomeText: {
        fontFamily: FONTS.bold,
        fontSize: 20,
    },
    roleLabel: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        textAlign: 'right',
    },
    logoutButton: {
        padding: SPACING.s,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        marginBottom: SPACING.m,
        textAlign: 'right',
    },
    listContent: {
        paddingBottom: SPACING.xl,
    },
    userCard: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    userInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.m,
    },
    userText: {
        alignItems: 'flex-end',
    },
    userName: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    userPhone: {
        fontFamily: FONTS.regular,
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.s,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontFamily: FONTS.medium,
        fontSize: 16,
    },
    statsGrid: {
        flexDirection: 'row-reverse',
        gap: SPACING.s,
        marginBottom: SPACING.l,
    },
    statCard: {
        flex: 1,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        marginTop: 4,
    },
    statLabel: {
        fontFamily: FONTS.medium,
        fontSize: 12,
    },
    manageAdminsBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: RADIUS.m,
        gap: SPACING.s,
        marginBottom: SPACING.xl,
    },
    manageAdminsText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    migrationBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: RADIUS.m,
        gap: SPACING.s,
        marginBottom: SPACING.xl,
    },
    migrationText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
});
