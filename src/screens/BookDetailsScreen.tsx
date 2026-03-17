import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { ChevronLeft, Edit3, Trash2, Calendar, Book as BookIcon, Hash, Building2, User, Printer, Star, QrCode, MessageCircle } from 'lucide-react-native';
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
                        <ChevronLeft color={activeColors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: activeColors.text }]}>تفاصيل الكتاب</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {book.coverImage && (
                    <View style={styles.coverContainer}>
                        <Image source={{ uri: book.coverImage }} style={styles.coverImage} resizeMode="contain" />
                    </View>
                )}
                <View style={[styles.card, { backgroundColor: activeColors.surface }]}>
                    <View style={styles.infoRow}>
                        <BookIcon color={activeColors.primary} size={24} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>العنوان</Text>
                            <Text style={[styles.value, { color: activeColors.text }]}>{book.title}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <User color={activeColors.primary} size={24} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>المؤلف</Text>
                            <Text style={[styles.value, { color: activeColors.text }]}>{book.author}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Building2 color={activeColors.primary} size={24} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>دار النشر</Text>
                            <Text style={[styles.value, { color: activeColors.text }]}>{book.publisher || 'غير محدد'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <QrCode color={activeColors.primary} size={24} />
                        <View style={styles.infoText}>
                            <View style={styles.rowBetween}>
                                <Text style={[styles.label, { color: activeColors.textSecondary }]}>رمز QR</Text>
                                <TouchableOpacity onPress={handlePrintBarcode} style={[styles.printIconBtn, { backgroundColor: isDarkMode ? activeColors.background : COLORS.primaryLight }]}>
                                    <Printer color={activeColors.primary} size={18} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.barcodeDisplay, { backgroundColor: isDarkMode ? activeColors.background : '#f9f9f9' }]}>
                                {book.barcode ? (
                                    <>
                                        <View style={{ backgroundColor: 'white', padding: 5, borderRadius: 5 }}>
                                            <QRCode value={book.barcode} size={100} />
                                        </View>
                                        <Text style={[styles.value, { color: activeColors.text }]}>{book.barcode}</Text>
                                    </>
                                ) : (
                                    <Text style={[styles.value, { color: activeColors.textTertiary, fontSize: 14 }]}>
                                        لا يوجد رمز QR متاح
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Star color={activeColors.warning} size={24} fill={activeColors.warning} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>التقييم</Text>
                            <Text style={[styles.value, { color: activeColors.text }]}>{book.rating || 0} / 10</Text>
                        </View>
                    </View>

                    <View style={[styles.statsRow, { borderColor: activeColors.border }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>إجمالي النسخ</Text>
                            <Text style={[styles.statValue, { color: activeColors.text }]}>{book.copiesTotal}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>المتاح</Text>
                            <Text style={[styles.statValue, { color: book.copiesAvailable > 0 ? activeColors.primary : activeColors.danger }]}>
                                {book.copiesAvailable}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Calendar color={activeColors.primary} size={24} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>الفئة العمرية</Text>
                            <Text style={[styles.value, { color: activeColors.text }]}>{book.ageCategory}</Text>
                        </View>
                    </View>

                    <Text style={[styles.descriptionLabel, { color: activeColors.text }]}>الوصف</Text>
                    <Text style={[styles.descriptionText, { color: activeColors.textSecondary }]}>{book.description || 'لا يوجد وصف متاح'}</Text>
                </View>


                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.editButton, { backgroundColor: activeColors.primary }]}
                            onPress={() => navigation.navigate('AddBook', { bookId: book.id })}
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
                )}
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
        flexDirection: 'row-reverse',
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
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        padding: SPACING.l,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    coverContainer: {
        width: '100%',
        height: 300,
        marginBottom: SPACING.l,
        borderRadius: RADIUS.l,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    coverImage: {
        width: '100%',
        height: '100%',
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
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: SPACING.m,
        paddingVertical: SPACING.m,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    rowBetween: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    printIconBtn: {
        padding: 4,
        backgroundColor: COLORS.primaryLight,
        borderRadius: RADIUS.s,
    },
    barcodeDisplay: {
        alignItems: 'center',
        marginTop: SPACING.s,
        backgroundColor: '#f9f9f9',
        padding: SPACING.s,
        borderRadius: RADIUS.m,
    },
    statLabel: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    statValue: {
        fontFamily: FONTS.bold,
        fontSize: 20,
        color: COLORS.text,
        marginTop: 4,
    },
    descriptionLabel: {
        fontFamily: FONTS.bold,
        fontSize: 14,
        color: COLORS.text,
        textAlign: 'right',
        marginTop: SPACING.m,
        marginBottom: SPACING.s,
    },
    descriptionText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'right',
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row-reverse',
        gap: SPACING.m,
        marginBottom: SPACING.xl,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        gap: SPACING.s,
    },
    chatButton: {
        width: '100%',
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
});
