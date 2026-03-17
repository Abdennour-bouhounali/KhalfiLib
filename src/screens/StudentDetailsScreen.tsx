import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { ChevronRight, Edit3, Trash2, Phone, Calendar, User, BookOpen, Clock, UserCheck } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BooksAPI, Book, SubscriptionsAPI, Subscription, UsersAPI, User as DatabaseUser } from '../services/database';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { CreditCard, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { formatNumber, formatDate } from '../utils/format';

export default function StudentDetailsScreen() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const { studentId: userId } = route.params as { studentId: string };

    const [student, setStudent] = useState<DatabaseUser | null>(null);
    const [borrowedBook, setBorrowedBook] = useState<Book | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const user = await UsersAPI.getById(userId);
            if (user) {
                setStudent(user);
                const [sub, books] = await Promise.all([
                    SubscriptionsAPI.getByUserId(userId),
                    user.borrowedBookId ? BooksAPI.getAll() : Promise.resolve([])
                ]);

                setSubscription(sub);
                if (user.borrowedBookId) {
                    const book = books.find(b => b.id === user.borrowedBookId);
                    if (book) setBorrowedBook(book);
                }
            } else {
                Alert.alert('خطأ', 'لم يتم العثور على المستخدم');
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل تحميل بيانات المستخدم');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            setLoading(true);
            await UsersAPI.update(userId, { status: 'active' });
            Alert.alert('نجاح', 'تم تفعيل حساب الطالب بنجاح');
            loadData();
        } catch (e) {
            Alert.alert('خطأ', 'فشل تفعيل الحساب');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'حذف المستخدم',
            'هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await UsersAPI.delete(userId);
                            Alert.alert('نجاح', 'تم حذف المستخدم بنجاح');
                            navigation.goBack();
                        } catch (e) {
                            Alert.alert('خطأ', 'فشل حذف المستخدم');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={activeColors.primary} />
            </View>
        );
    }

    if (!student) return null;

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronRight color={activeColors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: activeColors.text }]}>تفاصيل المستخدم</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileCard}>
                    <View style={[styles.avatar, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                        {student.profileImage ? (
                            <Image source={{ uri: student.profileImage }} style={styles.avatarImage} />
                        ) : (
                            <User color={activeColors.primary} size={40} />
                        )}
                    </View>
                    <Text style={[styles.studentName, { color: activeColors.text }]}>{student.firstName ? `${student.firstName} ${student.lastName}` : student.name}</Text>
                    <Text style={[styles.studentId, { color: activeColors.textSecondary }]}>رقم التعريف: {student.id?.slice(-6).toUpperCase()}</Text>

                    {/* Account Status Badge */}
                    <View style={[styles.accountStatusRow, { marginTop: SPACING.s }]}>
                        <View style={[styles.statusBadge, {
                            backgroundColor: student.status === 'active' ? activeColors.success + '20' : activeColors.warning + '20'
                        }]}>
                            <Text style={[styles.statusBadgeText, {
                                color: student.status === 'active' ? activeColors.success : activeColors.warning
                            }]}>
                                {student.status === 'active' ? 'حساب نشط' : 'حساب معلق'}
                            </Text>
                        </View>
                    </View>

                    {student.status !== 'active' && (
                        <TouchableOpacity
                            style={[styles.approveButton, { backgroundColor: activeColors.success, marginTop: SPACING.m }]}
                            onPress={handleApprove}
                        >
                            <UserCheck color={activeColors.surface} size={20} />
                            <Text style={[styles.approveButtonText, { color: activeColors.surface }]}>تفعيل الحساب الآن</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.infoSection, { backgroundColor: activeColors.surface }]}>
                    <View style={styles.infoRow}>
                        <Phone color={activeColors.primary} size={20} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>رقم الهاتف</Text>
                            <Text style={[styles.value, { color: activeColors.text }]}>{formatNumber(student.phone)}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Calendar color={activeColors.primary} size={20} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>تاريخ الميلاد</Text>
                            <Text style={[styles.value, { color: activeColors.text }]}>{student.birthdate ? formatNumber(student.birthdate) : 'غير متوفر'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Clock color={activeColors.primary} size={20} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>تاريخ التسجيل</Text>
                            <Text style={[styles.value, { color: activeColors.text }]}>{student.createdAt ? formatDate(student.createdAt) : 'غير متوفر'}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.statsSection, { backgroundColor: activeColors.surface }]}>
                    <View style={[styles.statBox, { borderRightColor: activeColors.border }]}>
                        <Text style={[styles.statNumber, { color: activeColors.text }]}>{formatNumber(student.previousBooksCount || 0)}</Text>
                        <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>كتب سابقة</Text>
                    </View>
                    <View style={[styles.statBox, { borderRightWidth: 0 }]}>
                        <Text style={[styles.statNumber, { color: student.borrowedBookId ? activeColors.primary : activeColors.textTertiary }]}>
                            {formatNumber(student.borrowedBookId ? 1 : 0)}
                        </Text>
                        <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>مستعار حالياً</Text>
                    </View>
                </View>

                {/* Subscription Section */}
                <View style={[styles.subscriptionSection, { backgroundColor: activeColors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <CreditCard color={activeColors.primary} size={20} />
                        <Text style={[styles.sectionTitle, { color: activeColors.text }]}>حالة الاشتراك</Text>
                    </View>

                    {subscription ? (
                        <View style={styles.subDetail}>
                            <View style={[styles.statusBadge, {
                                backgroundColor: subscription.status === 'active' ? activeColors.success + '20' : '#FFEBEE'
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: subscription.status === 'active' ? activeColors.success : activeColors.danger
                                }]}>
                                    {subscription.status === 'active' ? 'نشط' : subscription.status === 'suspended' ? 'معلق' : 'منتهي'}
                                </Text>
                            </View>
                            <Text style={[styles.subDate, { color: activeColors.textSecondary }]}>
                                ينتهي في: {formatDate(subscription.endDate)}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.noSubDetail}>
                            <AlertCircle color={activeColors.textTertiary} size={20} />
                            <Text style={[styles.noSubText, { color: activeColors.textTertiary }]}>لا يوجد اشتراك مسجل</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.manageSubBtn, { borderColor: activeColors.primary }]}
                        onPress={() => navigation.navigate('ManageSubscription', { studentId: student.id! })}
                    >
                        <ShieldCheck color={activeColors.primary} size={18} />
                        <Text style={[styles.manageSubText, { color: activeColors.primary }]}>إدارة الاشتراك</Text>
                    </TouchableOpacity>
                </View>

                {borrowedBook && (
                    <View style={[styles.borrowCard, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight, borderColor: activeColors.primary }]}>
                        <Text style={[styles.borrowTitle, { color: isDarkMode ? activeColors.text : COLORS.primaryDark }]}>الكتاب المستعار حالياً</Text>
                        <View style={styles.bookInfo}>
                            <BookOpen color={activeColors.primary} size={24} />
                            <Text style={[styles.bookTitle, { color: activeColors.text }]}>{borrowedBook.title}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton, { backgroundColor: activeColors.primary }]}
                        onPress={() => navigation.navigate('AddStudent', { studentId: student.id })}
                    >
                        <Edit3 color={activeColors.surface} size={20} />
                        <Text style={[styles.actionButtonText, { color: activeColors.surface }]}>تعديل</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDelete}
                    >
                        <Trash2 color={activeColors.surface} size={20} />
                        <Text style={[styles.actionButtonText, { color: activeColors.surface }]}>حذف</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
    },
    topBackground: {
        backgroundColor: COLORS.primaryLight,
        paddingBottom: 0,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.text,
    },
    content: {
        padding: SPACING.m,
        paddingBottom: 100,
    },
    profileCard: {
        alignItems: 'center',
        marginVertical: SPACING.l,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    studentName: {
        fontFamily: FONTS.bold,
        fontSize: 22,
        color: COLORS.text,
    },
    studentId: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    infoSection: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        padding: SPACING.l,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    infoText: {
        marginRight: SPACING.m,
        flex: 1,
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'right',
    },
    value: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'right',
        marginTop: 2,
    },
    statsSection: {
        flexDirection: 'row',
        marginTop: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        overflow: 'hidden',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.l,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },
    statNumber: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
    },
    statLabel: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    borrowCard: {
        marginTop: SPACING.m,
        backgroundColor: COLORS.primaryLight,
        borderRadius: RADIUS.l,
        padding: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    borrowTitle: {
        fontFamily: FONTS.bold,
        fontSize: 14,
        color: COLORS.primaryDark,
        textAlign: 'right',
        marginBottom: SPACING.s,
    },
    bookInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    bookTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.text,
    },
    actions: {
        flexDirection: 'row',
        marginTop: SPACING.xl,
        gap: SPACING.m,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        height: 50,
        borderRadius: RADIUS.round,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.s,
    },
    editButton: {
        backgroundColor: COLORS.primary,
    },
    deleteButton: {
        backgroundColor: COLORS.danger,
    },
    actionButtonText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.surface,
    },
    subscriptionSection: {
        marginTop: SPACING.m,
        borderRadius: RADIUS.l,
        padding: SPACING.l,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: SPACING.m,
        gap: SPACING.s,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    subDetail: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.m,
    },
    statusText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    subDate: {
        fontFamily: FONTS.medium,
        fontSize: 14,
    },
    noSubDetail: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: SPACING.m,
        gap: SPACING.s,
        marginBottom: SPACING.m,
    },
    noSubText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
    },
    manageSubBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        gap: SPACING.s,
    },
    manageSubText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    accountStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadgeText: {
        fontFamily: FONTS.bold,
        fontSize: 12,
    },
    approveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.l,
        paddingVertical: 10,
        borderRadius: RADIUS.round,
        gap: SPACING.s,
    },
    approveButtonText: {
        fontFamily: FONTS.bold,
        fontSize: 15,
    },
});
