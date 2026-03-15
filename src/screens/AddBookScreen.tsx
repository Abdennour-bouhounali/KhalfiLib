import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ArrowRight, ChevronDown, Check, Printer, Box, X, Star, QrCode } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { BooksAPI, FieldsAPI, Field, Book } from '../services/database';

export default function AddBookScreen() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'AddBook'>>();
    const { bookId } = route.params || {};
    const isEditing = !!bookId;

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('');
    const [publisher, setPublisher] = useState('');
    const [copiesTotal, setCopiesTotal] = useState('');
    const [ageCategory, setAgeCategory] = useState<'الأطفال' | 'الشباب' | 'الكبار' | null>(null);
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [rating, setRating] = useState('7');
    const [barcode, setBarcode] = useState('');

    const [fields, setFields] = useState<Field[]>([]);
    const [loadingFields, setLoadingFields] = useState(true);
    const [fieldModalVisible, setFieldModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Custom style overrides for this specific screen accent (beige/brown)
    const ACCENT = isDarkMode ? '#8D6E63' : COLORS.secondary;
    const ACCENT_DARK = isDarkMode ? '#D7CCC8' : '#A7805A';
    const ACCENT_LIGHT = isDarkMode ? '#4E342E' : '#F7EFE5';

    useEffect(() => {
        loadFields();
        if (isEditing) {
            loadBookData();
        }
    }, [bookId]);

    const loadBookData = async () => {
        if (!bookId) return;
        try {
            const books = await BooksAPI.getAll();
            const book = books.find(b => b.id === bookId);
            if (book) {
                setTitle(book.title);
                setDescription(book.description || '');
                setAuthor(book.author);
                setPublisher(book.publisher || '');
                setCopiesTotal(book.copiesTotal.toString());
                setAgeCategory(book.ageCategory as any);
                setRating(book.rating?.toString() || '7');
                setBarcode(book.barcode || '');
                // We'll need to set the selectedField once fields are loaded
                if (fields.length > 0) {
                    const field = fields.find(f => f.id === book.fieldId);
                    if (field) setSelectedField(field);
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل تحميل بيانات الكتاب');
        }
    };

    // Also need to set field when fields load if editing
    useEffect(() => {
        if (isEditing && fields.length > 0 && !selectedField && bookId) {
            const fetchAndSet = async () => {
                const books = await BooksAPI.getAll();
                const book = books.find(b => b.id === bookId);
                if (book) {
                    const field = fields.find(f => f.id === book.fieldId);
                    if (field) setSelectedField(field);
                }
            };
            fetchAndSet();
        }
    }, [fields]);

    const loadFields = async () => {
        try {
            const data = await FieldsAPI.getAll();
            setFields(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingFields(false);
        }
    };

    const handleSave = async () => {
        if (!title || !author || !copiesTotal || !ageCategory || !selectedField) {
            Alert.alert('خطأ', 'الرجاء تعبئة جميع الحقول المطلوبة (العنوان، المؤلف، عدد النسخ، الفئة العمرية، والمجال)');
            return;
        }

        try {
            setIsSubmitting(true);

            const bookPayload: any = {
                title,
                description,
                author,
                publisher,
                copiesTotal: parseInt(copiesTotal, 10),
                ageCategory,
                fieldId: selectedField.id || '',
                rating: parseInt(rating, 10) || 0,
                barcode: barcode || Math.floor(Math.random() * 9000000000000 + 1000000000000).toString(),
            };

            // Only set available and status on new books
            if (!isEditing) {
                bookPayload.copiesAvailable = parseInt(copiesTotal, 10);
                bookPayload.status = 'available';
            }

            // Timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            );

            // Race the save operation
            if (isEditing && bookId) {
                await Promise.race([
                    BooksAPI.update(bookId, bookPayload),
                    timeoutPromise
                ]);
            } else {
                await Promise.race([
                    BooksAPI.create(bookPayload),
                    timeoutPromise
                ]);
            }

            Alert.alert('نجاح', isEditing ? 'تم تحديث الكتاب بنجاح' : 'تم إضافة الكتاب بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error(error);
            if (error.message === 'TIMEOUT') {
                Alert.alert('خطأ في الاتصال', 'فشل حفظ الكتاب بسبب بطء الاتصال. يرجى المحاولة مرة أخرى.');
            } else {
                Alert.alert('خطأ', 'حدث خطأ أثناء حفظ الكتاب');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: activeColors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowRight color={activeColors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isDarkMode ? activeColors.primary : activeColors.text }]}>مكتبة عشيرة آل خلفي</Text>
                    <View style={{ width: 24 }} /> {/* Spacer */}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.pageTitle, { color: activeColors.text }]}>{isEditing ? 'تعديل الكتاب' : 'إضافة كتاب جديد'}</Text>

                {/* Field Selector */}
                <View style={styles.formGroup}>
                    <TouchableOpacity
                        style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}
                        onPress={() => setFieldModalVisible(true)}
                    >
                        <View style={styles.rowReverse}>
                            <Text style={[styles.placeholderText, selectedField && { color: activeColors.text }]}>
                                {selectedField ? selectedField.title : 'اختر المجال'}
                            </Text>
                            <Box color={ACCENT_DARK} size={20} style={styles.iconStyle} />
                        </View>
                        <ChevronDown color={activeColors.textTertiary} size={20} />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="عنوان الكتاب"
                            placeholderTextColor={activeColors.textTertiary}
                            value={title}
                            onChangeText={setTitle}
                        />
                        <BookIcon />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="الوصف"
                            placeholderTextColor={activeColors.textTertiary}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="المؤلف"
                            placeholderTextColor={activeColors.textTertiary}
                            value={author}
                            onChangeText={setAuthor}
                        />
                        <PenIcon />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="دار النشر"
                            placeholderTextColor={activeColors.textTertiary}
                            value={publisher}
                            onChangeText={setPublisher}
                        />
                        <BuildingIcon />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="عدد النسخ الكلية"
                            keyboardType="number-pad"
                            placeholderTextColor={activeColors.textTertiary}
                            value={copiesTotal}
                            onChangeText={setCopiesTotal}
                        />
                        <LayersIcon />
                    </View>
                </View>

                {/* Age Category Selector */}
                <View style={styles.formGroup}>
                    <View style={styles.ageSelectorContainer}>
                        <Text style={[styles.label, { color: activeColors.textSecondary }]}>الفئة العمرية</Text>
                        <View style={styles.ageButtons}>
                            {['الكبار', 'الشباب', 'الأطفال'].map((category) => {
                                const isSelected = ageCategory === category;
                                return (
                                    <TouchableOpacity
                                        key={category}
                                        style={[
                                            styles.ageButton,
                                            { borderColor: ACCENT, backgroundColor: activeColors.surface },
                                            isSelected ? { backgroundColor: ACCENT_LIGHT } : {}
                                        ]}
                                        onPress={() => setAgeCategory(category as any)}
                                    >
                                        <Text style={[
                                            styles.ageButtonText,
                                            { color: activeColors.textSecondary },
                                            isSelected ? { color: ACCENT_DARK, fontFamily: FONTS.bold } : {}
                                        ]}>
                                            {category}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Rating */}
                <View style={[styles.ratingContainer, { backgroundColor: isDarkMode ? activeColors.surface : '#F7EFE5' }]}>
                    <View style={[styles.ratingInputWrapper, { backgroundColor: isDarkMode ? activeColors.background : '#F5F5F5' }]}>
                        <Text style={[styles.ratingMax, { color: activeColors.textTertiary }]}>/ 10</Text>
                        <TextInput
                            style={[styles.ratingInput, { color: activeColors.primary }]}
                            value={rating}
                            onChangeText={setRating}
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                    </View>
                    <View style={styles.ratingLabelRow}>
                        <Text style={[styles.ratingLabel, { color: activeColors.text }]}>التقييم (من 10)</Text>
                        <Star color={activeColors.warning} size={20} fill={activeColors.warning} />
                    </View>
                </View>

                {/* QR Code Section */}
                <View style={styles.barcodeSection}>
                    <Text style={[styles.barcodeTitle, { color: activeColors.text }]}>معاينة رمز QR</Text>
                    {barcode ? (
                        <View style={[styles.barcodeWrapper, { backgroundColor: 'white' }]}>
                            <QRCode value={barcode} size={120} />
                            <Text style={[styles.barcodeNumber, { color: COLORS.text }]}>{barcode}</Text>
                        </View>
                    ) : (
                        <View style={[styles.barcodePlaceholder, { borderColor: activeColors.border }]}>
                            <QrCode color={activeColors.textTertiary} size={40} />
                            <Text style={[styles.barcodeInfo, { color: activeColors.textTertiary }]}>توليد رمز QR لحفظ الكتاب</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.barcodeButton, { backgroundColor: ACCENT_DARK }]}
                        onPress={() => setBarcode(Math.floor(Math.random() * 9000000000000 + 1000000000000).toString())}
                    >
                        <Text style={styles.barcodeButtonText}>{barcode ? 'تغيير رمز QR' : 'توليد رمز QR'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.barcodeButtonOutline, { borderColor: ACCENT_DARK }]}>
                        <Printer color={ACCENT_DARK} size={20} style={{ marginRight: 8 }} />
                        <Text style={[styles.barcodeButtonText, { color: ACCENT_DARK }]}>طباعة الباركود</Text>
                    </TouchableOpacity>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && { opacity: 0.7 }, { backgroundColor: isDarkMode ? activeColors.primary : '#4E342E' }]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={activeColors.surface} />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Check color={activeColors.surface} size={20} style={{ marginRight: 8 }} />
                            <Text style={[styles.submitText, { color: activeColors.surface }]}>حفظ الكتاب</Text>
                        </View>
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* Field Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={fieldModalVisible}
                onRequestClose={() => setFieldModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalView, { backgroundColor: activeColors.surface }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setFieldModalVisible(false)}>
                                <X color={activeColors.text} size={24} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: activeColors.text }]}>اختر المجال</Text>
                        </View>

                        {loadingFields ? (
                            <ActivityIndicator size="large" color={activeColors.primary} />
                        ) : (
                            <ScrollView>
                                {fields.map((field) => (
                                    <TouchableOpacity
                                        key={field.id}
                                        style={[
                                            styles.fieldItem,
                                            { borderBottomColor: activeColors.border },
                                            selectedField?.id === field.id && [styles.selectedFieldItem, { backgroundColor: isDarkMode ? activeColors.background : '#F5F5F5' }]
                                        ]}
                                        onPress={() => {
                                            setSelectedField(field);
                                            setFieldModalVisible(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.fieldText,
                                            { color: activeColors.text },
                                            selectedField?.id === field.id && [styles.selectedFieldText, { color: activeColors.primary }]
                                        ]}>
                                            {field.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {fields.length === 0 && (
                                    <Text style={[styles.emptyText, { color: activeColors.textSecondary }]}>لا يوجد مجالات مضافة. يرجى إضافتها من شاشة المجالات.</Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

// Custom simple Icons to simulate the design
const BookIcon = () => <View style={styles.iconSimulated}><Text style={styles.iconSimText}>📖</Text></View>;
const PenIcon = () => <View style={styles.iconSimulated}><Text style={styles.iconSimText}>🖋</Text></View>;
const BuildingIcon = () => <View style={styles.iconSimulated}><Text style={styles.iconSimText}>🏛</Text></View>;
const LayersIcon = () => <View style={styles.iconSimulated}><Text style={styles.iconSimText}>📚</Text></View>;
const StarIcon = () => <View style={styles.iconSimulated}><Text style={styles.iconSimText}>⭐</Text></View>;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF5EF', // Very light soft primary tint
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
    },
    topBackground: {
        backgroundColor: COLORS.primaryLight,
        paddingBottom: 0,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: '#3B827A',
    },
    pageTitle: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        textAlign: 'center',
        marginVertical: SPACING.l,
    },
    scrollContent: {
        paddingHorizontal: SPACING.m,
        paddingBottom: 40,
    },
    formGroup: {
        marginBottom: SPACING.m,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderRadius: RADIUS.round,
        paddingHorizontal: SPACING.l,
        height: 52,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'right',
    },
    rowReverse: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    placeholderText: {
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.textTertiary,
        marginRight: SPACING.s,
        textAlign: 'right',
    },
    iconStyle: {
        marginLeft: SPACING.xs,
    },
    iconSimulated: {
        marginLeft: SPACING.s,
    },
    iconSimText: {
        fontSize: 18,
    },
    ageSelectorContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.textSecondary,
        marginRight: SPACING.m,
        textAlign: 'right',
    },
    ageButtons: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'flex-start',
        gap: SPACING.s,
    },
    ageButton: {
        borderWidth: 1.5,
        borderRadius: RADIUS.round,
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: COLORS.surface,
    },
    ageButtonText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F7EFE5',
        padding: SPACING.m,
        borderRadius: RADIUS.l,
        marginBottom: SPACING.l,
    },
    ratingInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: SPACING.m,
        borderRadius: RADIUS.m,
        height: 48,
    },
    ratingInput: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.primary,
        width: 40,
        textAlign: 'center',
    },
    ratingMax: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.textTertiary,
        marginLeft: 4,
    },
    ratingLabelRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    ratingLabel: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.text,
    },
    barcodeSection: {
        alignItems: 'center',
        marginVertical: SPACING.l,
    },
    barcodeTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    barcodeWrapper: {
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.l,
    },
    barcodePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: COLORS.border,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.l,
        width: '100%',
    },
    barcodeInfo: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textTertiary,
        marginTop: SPACING.s,
    },
    barcodeNumber: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        letterSpacing: 2,
    },
    barcodeButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: RADIUS.round,
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    barcodeButtonOutline: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: RADIUS.round,
        alignItems: 'center',
        borderWidth: 1.5,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    barcodeButtonText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.surface,
    },
    submitButton: {
        backgroundColor: '#4E342E', // Dark brown
        paddingVertical: 16,
        borderRadius: RADIUS.xl,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.l,
    },
    submitText: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.surface,
    },
    // Modal & Selection Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalView: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    modalTitle: {
        fontFamily: FONTS.bold,
        fontSize: 20,
        color: COLORS.text,
    },
    fieldItem: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        alignItems: 'flex-end',
    },
    selectedFieldItem: {
        backgroundColor: '#F5F5F5',
    },
    fieldText: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.text,
    },
    selectedFieldText: {
        color: COLORS.primary,
        fontFamily: FONTS.bold,
    },
    emptyText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.xl,
    }
});
