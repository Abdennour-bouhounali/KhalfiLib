import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Check, Calendar, CreditCard, AlertCircle, RefreshCw, XCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { UsersAPI, User as DatabaseUser, SubscriptionsAPI, Subscription } from '../services/database';
import { RootStackParamList } from '../navigation/types';

export default function ManageSubscriptionScreen() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'ManageSubscription'>>();
    const { studentId: userId } = route.params;

    const [student, setStudent] = useState<DatabaseUser | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<'active' | 'expired' | 'suspended'>('active');

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [user, sub] = await Promise.all([
                UsersAPI.getById(userId),
                SubscriptionsAPI.getByUserId(userId)
            ]);

            if (user) {
                setStudent(user);
            }

            if (sub) {
                setSubscription(sub);
                setStartDate(sub.startDate.split('T')[0]);
                setEndDate(sub.endDate.split('T')[0]);
                setStatus(sub.status);
            } else {
                // Default end date: 1 year from now
                const oneYearLater = new Date();
                oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                setEndDate(oneYearLater.toISOString().split('T')[0]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!startDate || !endDate) {
            Alert.alert('خطأ', 'الرجاء إدخال تاريخ البدء والانتهاء');
            return;
        }

        try {
            setIsSubmitting(true);
            const subData: Omit<Subscription, 'id'> = {
                userId,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                status: status,
            };

            if (subscription?.id) {
                await SubscriptionsAPI.update(subscription.id, subData);
            } else {
                await SubscriptionsAPI.create(subData);
            }

            Alert.alert('نجاح', 'تم حفظ بيانات الاشتراك بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل حفظ بيانات الاشتراك');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAction = async (newStatus: 'active' | 'suspended') => {
        if (!subscription?.id) {
            Alert.alert('تنبيه', 'يجب إنشاء اشتراك أولاً');
            return;
        }

        try {
            setIsSubmitting(true);
            await SubscriptionsAPI.update(subscription.id, { status: newStatus });
            setStatus(newStatus);
            Alert.alert('نجاح', `تم ${newStatus === 'active' ? 'تفعيل' : 'تعليق'} الاشتراك`);
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل تحديث حالة الاشتراك');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: activeColors.background }]}>
                <ActivityIndicator size="large" color={activeColors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft color={activeColors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: activeColors.text }]}>إدارة الاشتراك</Text>
                    <View style={{ width: 24 }} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.studentCard}>
                    <Text style={[styles.studentName, { color: activeColors.text }]}>{student?.firstName} {student?.lastName}</Text>
                    <Text style={[styles.studentPhone, { color: activeColors.textSecondary }]}>{student?.phone}</Text>
                </View>

                <View style={[styles.statusBanner, {
                    backgroundColor: status === 'active' ? '#E8F5E9' : status === 'suspended' ? '#FFF3E0' : '#FFEBEE',
                    borderColor: status === 'active' ? '#4CAF50' : status === 'suspended' ? '#FF9800' : '#F44336'
                }]}>
                    <Text style={[styles.statusText, {
                        color: status === 'active' ? '#2E7D32' : status === 'suspended' ? '#EF6C00' : '#C62828'
                    }]}>
                        الحالة الحالية: {status === 'active' ? 'نشط' : status === 'suspended' ? 'معلق' : 'منتهي'}
                    </Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={[styles.sectionTitle, { color: activeColors.text }]}>تفاصيل الفترة</Text>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: activeColors.textSecondary }]}>تاريخ البدء</Text>
                        <View style={[styles.inputContainer, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                            <TextInput
                                style={[styles.input, { color: activeColors.text }]}
                                value={startDate}
                                onChangeText={setStartDate}
                                placeholder="YYYY-MM-DD"
                            />
                            <Calendar color={activeColors.primary} size={20} />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: activeColors.textSecondary }]}>تاريخ الانتهاء</Text>
                        <View style={[styles.inputContainer, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                            <TextInput
                                style={[styles.input, { color: activeColors.text }]}
                                value={endDate}
                                onChangeText={setEndDate}
                                placeholder="YYYY-MM-DD"
                            />
                            <Calendar color={activeColors.primary} size={20} />
                        </View>
                    </View>
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: activeColors.primary }]}
                        onPress={() => handleAction('active')}
                        disabled={isSubmitting || status === 'active'}
                    >
                        <RefreshCw size={20} color={activeColors.primary} />
                        <Text style={[styles.actionBtnText, { color: activeColors.primary }]}>تفعيل / تجديد</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: activeColors.danger }]}
                        onPress={() => handleAction('suspended')}
                        disabled={isSubmitting || status === 'suspended'}
                    >
                        <XCircle size={20} color={activeColors.danger} />
                        <Text style={[styles.actionBtnText, { color: activeColors.danger }]}>تعليق الاشتراك</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: activeColors.primary }]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={activeColors.surface} />
                    ) : (
                        <View style={styles.submitRow}>
                            <Check color={activeColors.surface} size={20} />
                            <Text style={[styles.submitText, { color: activeColors.surface }]}>حفظ التغييرات</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBackground: {
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
    },
    scrollContent: {
        padding: SPACING.m,
    },
    studentCard: {
        alignItems: 'center',
        marginVertical: SPACING.l,
    },
    studentName: {
        fontFamily: FONTS.bold,
        fontSize: 22,
    },
    studentPhone: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        marginTop: 4,
    },
    statusBanner: {
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    statusText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    formSection: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        marginBottom: SPACING.m,
        textAlign: 'right',
    },
    formGroup: {
        marginBottom: SPACING.m,
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        height: 50,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 16,
        textAlign: 'right',
        paddingRight: SPACING.s,
    },
    quickActions: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginBottom: SPACING.xl,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        gap: SPACING.s,
    },
    actionBtnText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: RADIUS.xl,
        alignItems: 'center',
    },
    submitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    submitText: {
        fontFamily: FONTS.bold,
        fontSize: 18,
    },
});
