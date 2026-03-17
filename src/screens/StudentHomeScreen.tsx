import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { BookOpen, LogOut, ArrowLeft, Search } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { BooksAPI, Book, User, SubscriptionsAPI, Subscription } from '../services/database';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Header from '../components/Header';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { CreditCard, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react-native';

export default function StudentHomeScreen() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const { logout, user: currentUser } = useAuth();
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    const [borrowedBook, setBorrowedBook] = useState<Book | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isFocused) {
            loadStudentData();
        }
    }, [isFocused]);

    const loadStudentData = async () => {
        if (!currentUser?.id) return;
        try {
            setLoading(true);
            const [sub, book] = await Promise.all([
                SubscriptionsAPI.getByUserId(currentUser.id),
                currentUser.borrowedBookId ? BooksAPI.getAll().then(books => books.find(b => b.id === currentUser.borrowedBookId) || null) : Promise.resolve(null)
            ]);
            setSubscription(sub);
            setBorrowedBook(book);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.welcomeRow}>
                    <View>
                        <Text style={[styles.welcomeText, { color: activeColors.text }]}>سلام الله عليك {currentUser?.firstName}</Text>
                        <Text style={[styles.roleLabel, { color: activeColors.primary }]}>ركن المطالعة الخاص بك</Text>
                    </View>
                </View>

                <Card style={[styles.statusCard, { backgroundColor: activeColors.surface }]}>
                    <View style={[styles.statusIcon, { backgroundColor: activeColors.primaryLight + '30' }]}>
                        <BookOpen size={40} color={activeColors.primary} />
                    </View>
                    <Text style={[styles.statusTitle, { color: activeColors.text }]}>حالة الاستعارة</Text>
                    <Text style={[styles.statusSub, { color: activeColors.textSecondary }]}>
                        {borrowedBook ? `أنت تستعير حالياً: ${borrowedBook.title}` : 'ليس لديك أي كتب مستعارة حالياً'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: activeColors.primary }]}
                        onPress={() => navigation.navigate('PublicCatalog')}
                    >
                        <Search size={20} color={activeColors.surface} />
                        <Text style={[styles.actionBtnText, { color: activeColors.surface }]}>تصفح المكتبة</Text>
                    </TouchableOpacity>
                </Card>

                {/* Subscription Status Card */}
                <Card style={[styles.subscriptionCard, { backgroundColor: activeColors.surface }]}>
                    <View style={styles.subHeader}>
                        <CreditCard size={24} color={activeColors.primary} />
                        <Text style={[styles.subTitle, { color: activeColors.text }]}>حالة الاشتراك</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="small" color={activeColors.primary} />
                    ) : subscription ? (
                        <View style={styles.subContent}>
                            <View style={[styles.statusBadge, {
                                backgroundColor: subscription.status === 'active' ? activeColors.success + '20' : '#FFEBEE'
                            }]}>
                                <Text style={[styles.statusBadgeText, {
                                    color: subscription.status === 'active' ? activeColors.success : activeColors.danger
                                }]}>
                                    {subscription.status === 'active' ? 'نشط' : subscription.status === 'suspended' ? 'معلق' : 'منتهي'}
                                </Text>
                            </View>

                            <View style={styles.subInfoRow}>
                                <Text style={[styles.subInfoValue, { color: activeColors.text }]}>
                                    {new Date(subscription.endDate).toLocaleDateString('en-UK')}
                                </Text>
                                <View style={styles.subLabelRow}>
                                    <Text style={[styles.subInfoLabel, { color: activeColors.textSecondary }]}>تاريخ الانتهاء</Text>
                                    <CalendarIcon size={16} color={activeColors.textTertiary} style={{ marginLeft: 6 }} />
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.noSubContent}>
                            <AlertTriangle size={20} color="#FF9800" />
                            <Text style={[styles.noSubText, { color: activeColors.textSecondary }]}>لا يوجد اشتراك نشط حالياً</Text>
                        </View>
                    )}
                </Card>

                <View style={[styles.infoSection, { backgroundColor: activeColors.surface }]}>
                    <Text style={[styles.infoTitle, { color: activeColors.text }]}>تعليمات هامة</Text>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoText, { color: activeColors.textSecondary }]}>• مدة الاستعارة القصوى هي 15 يوماً.</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoText, { color: activeColors.textSecondary }]}>• يرجى المحافظة على سلامة الكتب.</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={[styles.infoText, { color: activeColors.textSecondary }]}>• في حال الضياع يرجى مراجعة الإدارة.</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} /> {/* Bottom padding for tab bar */}
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
    scrollContent: {
        padding: SPACING.m,
        paddingBottom: 40,
    },
    welcomeRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        textAlign: 'center',

        paddingHorizontal: SPACING.s,
    },
    welcomeText: {
        fontFamily: FONTS.bold,
        fontSize: 22,
        textAlign: 'center',
        marginRight: SPACING.xxl,
    },
    roleLabel: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        textAlign: 'center',
        marginRight: SPACING.xxl,

    },
    logoutButton: {
        padding: SPACING.s,
    },
    statusCard: {
        alignItems: 'center',
        padding: SPACING.xl,
        marginBottom: SPACING.l,
    },
    statusIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    statusTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        marginBottom: SPACING.xs,
    },
    statusSub: {
        fontFamily: FONTS.regular,
        fontSize: 16,
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    actionBtn: {
        flexDirection: 'row-reverse',
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.m,
        alignItems: 'center',
        gap: SPACING.s,
    },
    actionBtnText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    infoSection: {
        padding: SPACING.m,
        borderRadius: RADIUS.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        marginBottom: SPACING.s,
        textAlign: 'left'
    },
    infoItem: {
        marginBottom: SPACING.xs,
    },
    infoText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        textAlign: 'left'
    },
    subscriptionCard: {
        padding: SPACING.m,
        marginBottom: SPACING.l,
    },
    subHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: SPACING.m,
        gap: SPACING.s,
    },
    subTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
    },
    subContent: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.m,
    },
    statusBadgeText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    subInfoRow: {
        alignItems: 'flex-end',
    },
    subLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subInfoLabel: {
        fontFamily: FONTS.regular,
        fontSize: 12,
    },
    subInfoValue: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    noSubContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: SPACING.m,
        gap: SPACING.s,
        backgroundColor: '#FFF3E020',
        borderRadius: RADIUS.m,
    },
    noSubText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
    }
});
