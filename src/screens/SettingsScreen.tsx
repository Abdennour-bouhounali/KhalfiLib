import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import {
    Settings, Globe, Cloud, Download, ShieldAlert,
    Printer, QrCode, LogOut, Info, Shield,
    ChevronLeft, Palette, Bell, Moon, Sun,
    Edit3, Trash2
} from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import Card from '../components/Card';
import { BooksAPI, UsersAPI } from '../services/database';
import * as Print from 'expo-print';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { User as UserIcon, LogIn } from 'lucide-react-native';

export default function SettingsScreen() {
    const { isDarkMode, toggleTheme } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const { user, logout } = useAuth();
    const navigation = useNavigation<any>();
    const [autoBackup, setAutoBackup] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [notifications, setNotifications] = useState(true);

    const showAbout = () => {
        Alert.alert(
            'عن مكتبة عشيرة آل خلفي',
            'يهدف هذا التطبيق إلى الارتقاء بمكتبة عشيرة آل خلفي إلى المستوى التالي، وتشجيع الطلاب على القراءة والتركيز على تعليمهم والتحكم في التكنولوجيا بشكل إيجابي.',
            [{ text: 'حسناً' }]
        );
    };

    const showPrivacy = () => {
        Alert.alert(
            'سياسة الخصوصية',
            'بيانات المكتبة تُستخدم داخلياً فقط لخدمة المستفيدين ولا تُشارك مع أي جهة خارجية.',
            [{ text: 'حسناً' }]
        );
    };

    const showPenaltySettings = () => {
        Alert.alert(
            'إعدادات الغرامات',
            'يتم احتساب الغرامات تلقائياً عند التأخر في إرجاع الكتب (يتم تسجيل عدد أيام التأخير في سجل الاستعارة).',
            [{ text: 'حسناً' }]
        );
    };

    const generateMissingQRs = async () => {
        try {
            setIsGenerating(true);
            const books = await BooksAPI.getAll();
            const missing = books.filter(b => !b.barcode);

            if (missing.length === 0) {
                Alert.alert('مكتمل', 'جميع الكتب تحتوي على رموز QR بالفعل');
                return;
            }

            Alert.alert(
                'توليد الرموز',
                `سيتم توليد ${missing.length} رمز QR جديد للكتب التي تفتقدها. هل تريد المتابعة؟`,
                [
                    { text: 'إلغاء', style: 'cancel' },
                    {
                        text: 'متابعة',
                        onPress: async () => {
                            try {
                                for (const book of missing) {
                                    const newBarcode = Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
                                    await BooksAPI.update(book.id!, { barcode: newBarcode });
                                }
                                Alert.alert('نجاح', `تم توليد ${missing.length} رمز QR بنجاح`);
                            } catch (e) {
                                console.error(e);
                                Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الكتب');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل تحميل قائمة الكتب');
        } finally {
            setIsGenerating(false);
        }
    };

    const printAllQRs = async () => {
        try {
            setIsPrinting(true);
            const books = await BooksAPI.getAll();

            if (books.length === 0) {
                Alert.alert('خطأ', 'لا توجد كتب لطباعتها');
                return;
            }

            const rows = [];
            for (let i = 0; i < books.length; i += 3) {
                const chunk = books.slice(i, i + 3);
                const cols = chunk.map(book => `
                    <div style="flex: 1; border: 1px solid #eee; padding: 10px; margin: 5px; text-align: center; border-radius: 8px;">
                        <p style="font-weight: bold; font-size: 14px; margin-bottom: 5px; height: 40px; overflow: hidden;">${book.title}</p>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${book.barcode || 'NO_QR'}" style="width: 100px; height: 100px;" />
                        <p style="font-size: 10px; color: #666; margin-top: 5px;">${book.barcode || 'لم يولد بعد'}</p>
                    </div>
                `).join('');
                rows.push(`<div style="display: flex; flex-direction: row;">${cols}</div>`);
            }

            const html = `
                <html>
                    <body style="font-family: sans-serif; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B827A; padding-bottom: 10px;">
                            <h1 style="color: #3B827A;">مكتبة عشيرة آل خلفي</h1>
                            <p>قائمة رموز QR لجميع الكتب</p>
                        </div>
                        ${rows.join('')}
                    </body>
                </html>
            `;

            await Print.printAsync({ html });
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل فتح نافذة الطباعة');
        } finally {
            setIsPrinting(false);
        }
    };

    const handleDeleteAccount = () => {
        if (!user) return;
        Alert.alert(
            'حذف الحساب',
            'هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع بياناتك.',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await UsersAPI.delete(user.id!);
                            logout();
                        } catch (error) {
                            Alert.alert('خطأ', 'فشل حذف الحساب. يرجى المحاولة لاحقاً.');
                        }
                    }
                }
            ]
        );
    };

    const renderSettingItem = (icon: any, label: string, color: string, action?: () => void, rightElement?: React.ReactNode) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={action}
            disabled={!action}
        >
            <View style={styles.settingLeft}>
                {rightElement || <ChevronLeft color={activeColors.textTertiary} size={20} />}
            </View>
            <View style={styles.settingRight}>
                <Text style={[styles.settingLabel, { color: activeColors.text }]}>{label}</Text>
                <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                    {icon}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <Header title="الإعدادات" showSearch={true} showNotification={false} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.profileHeader}>
                    <View style={[styles.logoCircle, { backgroundColor: activeColors.surface, borderColor: activeColors.border, overflow: 'hidden' }]}>
                        {user ? (
                            user.profileImage ? (
                                <Image source={{ uri: user.profileImage }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <UserIcon color={activeColors.primary} size={50} />
                            )
                        ) : (
                            <UserIcon color={activeColors.primary} size={50} />
                        )}
                    </View>
                    <Text style={[styles.userName, { color: activeColors.text }]}>
                        {user ? user.name : 'زائر المكتبة'}
                    </Text>
                    <Text style={[styles.userRole, { backgroundColor: activeColors.primary + '20', color: activeColors.textSecondary }]}>
                        {user ? (user.role === 'super_admin' ? 'المشرف العام' : user.role === 'admin' ? 'مسؤول' : 'طالب') : 'مرحباً بك'}
                    </Text>
                </View>

                {/* Profile Settings (Logged in users only) */}
                {user && (
                    <>
                        <Text style={[styles.sectionTitle, { color: activeColors.textTertiary }]}>إعدادات الحساب</Text>
                        <Card style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                            {renderSettingItem(
                                <Edit3 color={activeColors.primary} size={22} />,
                                'تعديل الملف الشخصي',
                                activeColors.primary,
                                () => navigation.navigate('AddStudent', { studentId: user.id })
                            )}
                            <View style={[styles.divider, { backgroundColor: activeColors.border }]} />
                            {renderSettingItem(
                                <Trash2 color={activeColors.danger} size={22} />,
                                'حذف الحساب',
                                activeColors.danger,
                                handleDeleteAccount
                            )}
                        </Card>
                    </>
                )}

                {/* Guest Login */}
                {!user && (
                    <TouchableOpacity
                        style={[styles.loginBtn, { backgroundColor: activeColors.primary }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <LogIn color={activeColors.surface} size={20} />
                        <Text style={[styles.loginBtnText, { color: activeColors.surface }]}>تسجيل الدخول / إنشاء حساب</Text>
                    </TouchableOpacity>
                )}

                {/* App Settings Group */}
                <Text style={[styles.sectionTitle, { color: activeColors.textTertiary }]}>إعدادات التطبيق</Text>
                <Card style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                    {renderSettingItem(
                        isDarkMode ? <Sun color="#f1c40f" size={22} /> : <Moon color="#34495e" size={22} />,
                        isDarkMode ? 'الوضع الفاتح' : 'الوضع الليلي',
                        isDarkMode ? '#f1c40f' : '#34495e',
                        () => toggleTheme(),
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: activeColors.border, true: activeColors.primary + '50' }}
                            thumbColor={isDarkMode ? activeColors.primary : COLORS.surface}
                        />
                    )}
                    <View style={[styles.divider, { backgroundColor: activeColors.border }]} />
                    {renderSettingItem(
                        <Bell color="#e67e22" size={22} />,
                        'التنبيهات الذكية',
                        '#e67e22',
                        () => setNotifications(!notifications),
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: activeColors.border, true: activeColors.primary + '50' }}
                            thumbColor={notifications ? activeColors.primary : COLORS.surface}
                        />
                    )}
                </Card>

                {/* Maintenance Section Group - Admin Only */}
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <>
                        <Text style={[styles.sectionTitle, { color: activeColors.textTertiary }]}>أدوات الصيانة والإدارة</Text>
                        <Card style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                            {renderSettingItem(
                                <QrCode color={activeColors.primary} size={22} />,
                                isGenerating ? 'جاري التوليد...' : 'توليد رموز QR المفقودة',
                                activeColors.primary,
                                generateMissingQRs
                            )}
                            <View style={[styles.divider, { backgroundColor: activeColors.border }]} />
                            {renderSettingItem(
                                <Printer color="#27ae60" size={22} />,
                                isPrinting ? 'جاري التحضير...' : 'طباعة ملصقات QR المجمعة',
                                '#27ae60',
                                printAllQRs
                            )}
                            <View style={[styles.divider, { backgroundColor: activeColors.border }]} />
                            {renderSettingItem(
                                <Cloud color="#2980b9" size={22} />,
                                'نسخ احتياطي تلقائي',
                                '#2980b9',
                                () => setAutoBackup(!autoBackup),
                                <Switch
                                    value={autoBackup}
                                    onValueChange={setAutoBackup}
                                    trackColor={{ false: activeColors.border, true: activeColors.primary + '50' }}
                                    thumbColor={autoBackup ? activeColors.primary : COLORS.surface}
                                />
                            )}
                        </Card>
                    </>
                )}

                {/* Rules Section Group */}
                <Text style={[styles.sectionTitle, { color: activeColors.textTertiary }]}>القواعد والخصوصية</Text>
                <Card style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                    {renderSettingItem(
                        <ShieldAlert color={activeColors.warning} size={22} />,
                        'إعدادات الغرامات والتأخير',
                        activeColors.warning,
                        showPenaltySettings
                    )}
                    <View style={[styles.divider, { backgroundColor: activeColors.border }]} />
                    {renderSettingItem(
                        <Shield color="#34495e" size={22} />,
                        'سياسة خصوصية البيانات',
                        '#34495e',
                        showPrivacy
                    )}
                </Card>

                {/* Info Group */}
                <Text style={[styles.sectionTitle, { color: activeColors.textTertiary }]}>حول المكتبة</Text>
                <Card style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                    {renderSettingItem(
                        <Info color="#7f8c8d" size={22} />,
                        'عن تطبيق المكتبة',
                        '#7f8c8d',
                        showAbout
                    )}
                </Card>

                {user && (
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <LogOut color={COLORS.danger} size={20} />
                        <Text style={styles.logoutText}>تسجيل الخروج</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    topBackground: {
        backgroundColor: COLORS.primaryLight,
        paddingBottom: 0,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    scrollContent: {
        paddingTop: SPACING.m,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
        paddingTop: SPACING.m,
    },
    logoCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1.5,
        borderColor: COLORS.primaryLight + '40',
    },
    headerLogo: {
        width: 80,
        height: 80,
    },
    userName: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
    },
    textWhite: {
        color: COLORS.surface,
    },
    userRole: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
        backgroundColor: COLORS.primaryLight + '20',
        paddingHorizontal: SPACING.m,
        paddingVertical: 2,
        borderRadius: RADIUS.round,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 14,
        color: COLORS.textTertiary,
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.s,
        textAlign: 'right',
        marginTop: SPACING.xl,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        marginHorizontal: SPACING.m,
        padding: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border + '50',
    },
    cardDark: {
        backgroundColor: '#1E1E1E',
        borderColor: '#333',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        height: 64,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    settingLeft: {
        minWidth: 50,
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.m,
    },
    settingLabel: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border + '80',
        marginLeft: SPACING.m,
        marginRight: 64,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xl * 1.5,
        gap: SPACING.s,
        paddingVertical: SPACING.m,
    },
    logoutText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.danger,
    },
    loginBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: SPACING.m,
        height: 50,
        borderRadius: RADIUS.m,
        gap: SPACING.s,
        marginTop: SPACING.m,
    },
    loginBtnText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
});
