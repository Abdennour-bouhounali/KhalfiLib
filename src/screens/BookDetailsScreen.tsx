import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Animated } from 'react-native';
import { ChevronLeft, Edit3, Trash2, Calendar, Book as BookIcon, Hash, Building2, User, Printer, Star, QrCode, MessageCircle, Layers, ChevronRight } from 'lucide-react-native';
import * as Print from 'expo-print';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { BooksAPI, Book } from '../services/database';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { formatNumber } from '../utils/format';

export default function BookDetailsScreen() {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const isFocused = useIsFocused();
    const { bookId } = route.params as { bookId: string };

    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (!loading && book) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        }
    }, [loading, book]);

    useEffect(() => {
        if (isFocused) {
            loadBook();
        }
    }, [isFocused, bookId]);

    const loadBook = async () => {
        try {
            setLoading(true);
            const books = await BooksAPI.getAll();
            const found = books.find(b => b.id === bookId);
            if (found) {
                setBook(found);
            } else {
                Alert.alert('خطأ', 'لم يتم العثور على الكتاب');
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل تحميل بيانات الكتاب');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintBarcode = async () => {
        if (!book) return;

        // Use a simple QR code API for the print template to ensure it renders in HTML
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${book.barcode}`;

        const html = `
            <html>
                <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center;">
                    <h2 style="margin-bottom: 10px;">${book.title}</h2>
                    <p style="margin-bottom: 20px; font-size: 18px;">${book.author}</p>
                    <img src="${qrCodeUrl}" style="width: 200px; height: 200px; margin-bottom: 10px;" />
                    <p style="font-size: 24px; font-weight: bold; margin-top: 10px;">${book.barcode}</p>
                    <p style="margin-top: 30px; border-top: 1px solid #ccc; pt: 10px;">مكتبة عشيرة آل خلفي</p>
                </body>
            </html>
        `;
        try {
            await Print.printAsync({ html });
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل فتح نافذة الطباعة');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'حذف الكتاب',
            'هل أنت متأكد من رغبتك في حذف هذا الكتاب؟ لا يمكن التراجع عن هذا الإجراء.',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await BooksAPI.delete(bookId);
                            Alert.alert('نجاح', 'تم حذف الكتاب بنجاح');
                            navigation.goBack();
                        } catch (e) {
                            Alert.alert('خطأ', 'فشل حذف الكتاب');
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

    if (!book) return null;

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronRight color={activeColors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: activeColors.text }]}>تفاصيل الكتاب</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    {/* Top Section: Cover & Title */}
                    <View style={styles.topSection}>
                        <View style={[styles.coverContainer, { shadowColor: activeColors.text }]}>
                            {book.coverImage ? (
                                <Image source={{ uri: book.coverImage }} style={styles.coverImage} resizeMode="cover" />
                            ) : (
                                <View style={[styles.coverPlaceholder, { backgroundColor: isDarkMode ? activeColors.background : '#F0F0F0' }]}>
                                    <BookIcon size={80} color={activeColors.textTertiary} />
                                </View>
                            )}
                        </View>

                        <View style={styles.titleSection}>
                            <Text style={[styles.bookTitle, { color: activeColors.text }]}>{book.title}</Text>
                            <View style={styles.authorRow}>
                                <User color={activeColors.primary} size={18} />
                                <Text style={[styles.authorName, { color: activeColors.textSecondary }]}>{book.author}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Status & Quick Actions Card */}
                    <Card style={styles.statusCard}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusBadge, { backgroundColor: book.copiesAvailable > 0 ? activeColors.success + '20' : activeColors.danger + '20' }]}>
                                <View style={[styles.statusDot, { backgroundColor: book.copiesAvailable > 0 ? activeColors.success : activeColors.danger }]} />
                                <Text style={[styles.statusText, { color: book.copiesAvailable > 0 ? activeColors.success : activeColors.danger }]}>
                                    {book.copiesAvailable > 0 ? 'متاح للاستعارة' : 'غير متاح حالياً'}
                                </Text>
                            </View>
                            <View style={styles.copiesInfo}>
                                <Layers size={18} color={activeColors.textTertiary} />
                                <Text style={[styles.copiesText, { color: activeColors.textSecondary }]}>
                                    {formatNumber(book.copiesAvailable)} من {formatNumber(book.copiesTotal)} نسخة
                                </Text>
                            </View>
                        </View>

                        <View style={styles.primaryActions}>


                            <TouchableOpacity
                                style={[styles.discussButton, { borderColor: activeColors.primary }]}
                                onPress={() => navigation.navigate('BookChat', { bookId: book.id! })}
                            >
                                <MessageCircle color={activeColors.primary} size={20} />
                                <Text style={[styles.discussButtonText, { color: activeColors.primary }]}>نقاش الكتاب</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Info Grid Section */}
                    <View style={styles.infoGrid}>
                        <Card style={styles.gridCard}>
                            <Building2 color={activeColors.primary} size={22} />
                            <Text style={[styles.gridLabel, { color: activeColors.textTertiary }]}>دار النشر</Text>
                            <Text style={[styles.gridValue, { color: activeColors.text }]} numberOfLines={1}>
                                {book.publisher || 'غير محدد'}
                            </Text>
                        </Card>

                        <Card style={styles.gridCard}>
                            <Calendar color={activeColors.primary} size={22} />
                            <Text style={[styles.gridLabel, { color: activeColors.textTertiary }]}>الفئة العمرية</Text>
                            <Text style={[styles.gridValue, { color: activeColors.text }]}>{book.ageCategory}</Text>
                        </Card>
                    </View>

                    {/* Description Section */}
                    <Card style={styles.descriptionCard}>
                        <View style={styles.sectionHeader}>
                            <Hash color={activeColors.primary} size={20} />
                            <Text style={[styles.sectionTitle, { color: activeColors.text }]}>وصف الكتاب</Text>
                        </View>
                        <Text style={[styles.bookDescription, { color: activeColors.textSecondary }]}>
                            {book.description || 'لا يوجد وصف متاح لهذا الكتاب حالياً.'}
                        </Text>
                    </Card>

                    {/* Barcode / QR Section */}
                    <Card style={styles.qrCard}>
                        <View style={styles.sectionHeader}>
                            <QrCode color={activeColors.primary} size={20} />
                            <Text style={[styles.sectionTitle, { color: activeColors.text }]}>رمز الاستعارة السريع</Text>
                        </View>
                        <View style={styles.qrContent}>
                            {book.barcode ? (
                                <>
                                    <View style={styles.qrWrapper}>
                                        <QRCode value={book.barcode} size={140} />
                                    </View>
                                    <Text style={[styles.barcodeText, { color: activeColors.text }]}>{formatNumber(book.barcode)}</Text>
                                    <TouchableOpacity
                                        style={[styles.printIconButton, { backgroundColor: activeColors.background }]}
                                        onPress={handlePrintBarcode}
                                    >
                                        <Printer color={activeColors.primary} size={20} />
                                        <Text style={[styles.printBtnText, { color: activeColors.primary }]}>طباعة الرمز</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <Text style={[styles.emptyText, { color: activeColors.textTertiary }]}>لا يوجد رمز متاح</Text>
                            )}
                        </View>
                    </Card>

                    {/* Admin Actions */}
                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <View style={styles.adminSection}>
                            <Text style={[styles.adminTitle, { color: activeColors.textTertiary }]}>خيارات الإدارة</Text>
                            <View style={styles.adminButtons}>
                                <TouchableOpacity
                                    style={[styles.adminBtn, { backgroundColor: activeColors.primary + '10' }]}
                                    onPress={() => navigation.navigate('AddBook', { bookId: book.id })}
                                >
                                    <Edit3 color={activeColors.primary} size={20} />
                                    <Text style={[styles.adminBtnText, { color: activeColors.primary }]}>تعديل البيانات</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.adminBtn, { backgroundColor: activeColors.danger + '10' }]}
                                    onPress={handleDelete}
                                >
                                    <Trash2 color={activeColors.danger} size={20} />
                                    <Text style={[styles.adminBtnText, { color: activeColors.danger }]}>حذف الكتاب</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </Animated.View>
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
    header: {
        flexDirection: 'row', // Use row for RTL naturally
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
    },
    topBackground: {
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
    },
    content: {
        padding: SPACING.m,
        paddingBottom: 40,
    },
    topSection: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    coverContainer: {
        width: 180,
        height: 260,
        borderRadius: RADIUS.l,
        overflow: 'hidden',
        elevation: 10,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        backgroundColor: '#FFF',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleSection: {
        alignItems: 'center',
        marginTop: SPACING.l,
        paddingHorizontal: SPACING.m,
    },
    bookTitle: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 8,
    },
    authorRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    authorName: {
        fontFamily: FONTS.medium,
        fontSize: 16,
    },
    statusCard: {
        padding: SPACING.l,
        marginBottom: SPACING.m,
    },
    statusRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    statusBadge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.round,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    copiesInfo: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
    },
    copiesText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
    },
    primaryActions: {
        flexDirection: 'column',
        gap: SPACING.m,
    },
    mainActionButton: {
        height: 52,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    mainActionText: {
        fontFamily: FONTS.bold,
        color: '#FFF',
        fontSize: 16,
    },
    discussButton: {
        height: 52,
        borderRadius: RADIUS.m,
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        gap: 10,
    },
    discussButtonText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    infoGrid: {
        flexDirection: 'row-reverse',
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    gridCard: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.m,
    },
    gridLabel: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        marginTop: 6,
        marginBottom: 2,
    },
    gridValue: {
        fontFamily: FONTS.bold,
        fontSize: 14,
        textAlign: 'center',
    },
    descriptionCard: {
        padding: SPACING.l,
        marginBottom: SPACING.m,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: SPACING.m,
        gap: 8,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 17,
    },
    bookDescription: {
        fontFamily: FONTS.regular,
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'right',
    },
    qrCard: {
        padding: SPACING.l,
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    qrContent: {
        alignItems: 'center',
        width: '100%',
    },
    qrWrapper: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.m,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    barcodeText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        letterSpacing: 2,
        marginBottom: SPACING.l,
    },
    printIconButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: RADIUS.round,
        gap: 8,
    },
    printBtnText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    adminSection: {
        marginTop: SPACING.l,
    },
    adminTitle: {
        fontFamily: FONTS.bold,
        fontSize: 14,
        marginBottom: SPACING.m,
        textAlign: 'right',
        marginRight: 4,
    },
    adminButtons: {
        flexDirection: 'row-reverse',
        gap: SPACING.m,
    },
    adminBtn: {
        flex: 1,
        height: 50,
        borderRadius: RADIUS.m,
        flexDirection: 'row-reverse',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    adminBtnText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    emptyText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
    }
});
