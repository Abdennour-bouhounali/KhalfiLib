import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, Image, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ArrowRight, ChevronDown, Check, Printer, Box, X, Star, QrCode, Camera, Image as ImageIcon, Book as BookIcon, PenTool, Building2, Layers, AlignLeft } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { BooksAPI, FieldsAPI, Field, Book } from '../services/database';
import Card from '../components/Card';

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
    const [ageCategory, setAgeCategory] = useState<string | null>(null);
    const [selectedField, setSelectedField] = useState<Field | null>(null);
    const [rating, setRating] = useState('7');
    const [barcode, setBarcode] = useState('');
    const [coverImage, setCoverImage] = useState<string | null>(null);

    const [fields, setFields] = useState<Field[]>([]);
    const [loadingFields, setLoadingFields] = useState(true);
    const [fieldModalVisible, setFieldModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    // Custom style overrides for this specific screen accent (beige/brown)
    const ACCENT = isDarkMode ? '#8D6E63' : COLORS.secondary;
    const ACCENT_DARK = isDarkMode ? '#D7CCC8' : '#A7805A';
    const ACCENT_LIGHT = isDarkMode ? '#4E342E' : '#F7EFE5';

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('فشل', 'نحتاج لإذن الوصول للكاميرا لالتقاط الصورة');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [2, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setCoverImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [2, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setCoverImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

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
                setCoverImage(book.coverImage || null);
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
                coverImage: coverImage || undefined,
            };

            // Handle available copies logic
            const totalCopiesCount = parseInt(copiesTotal, 10);

            if (isEditing) {
                // When editing, we don't automatically set available = total 
                // but we must validate that current available doesn't exceed new total
                // The API will handle the validation and status update
                bookPayload.copiesTotal = totalCopiesCount;
            } else {
                // New book scenario
                bookPayload.copiesTotal = totalCopiesCount;
                bookPayload.copiesAvailable = totalCopiesCount;
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
            } else if (error.message.includes('copies')) {
                Alert.alert('خطأ في البيانات', 'يرجى التأكد من صحة أعداد النسخ (المتاحة لا تتجاوز الكلية)');
            } else {
                Alert.alert('خطأ', 'حدث خطأ أثناء حفظ الكتاب');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateQR = () => {
        if (barcode) {
            Alert.alert(
                'تجديد رمز QR',
                'هل أنت متأكد من رغبتك في تغيير رمز QR الحالي؟ هذا الإجراء قد يجعل الرموز المطبوعة سابقاً غير صالحة.',
                [
                    { text: 'إلغاء', style: 'cancel' },
                    {
                        text: 'تغيير الرمز',
                        style: 'destructive',
                        onPress: () => setBarcode(Math.floor(Math.random() * 9000000000000 + 1000000000000).toString())
                    }
                ]
            );
        } else {
            setBarcode(Math.floor(Math.random() * 9000000000000 + 1000000000000).toString());
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: activeColors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                {/* Header */}
                <View style={[styles.headerGradient, { backgroundColor: activeColors.primary, paddingTop: insets.top + SPACING.s }]}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <ArrowRight color={activeColors.surface} size={24} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: activeColors.surface }]}>
                            {isEditing ? 'تعديل كتاب' : 'إضافة كتاب جديد'}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Float Cover Picker */}
                    <View style={styles.coverFloatContainer}>
                        <TouchableOpacity onPress={pickImage} style={[styles.coverCard, { backgroundColor: activeColors.surface }]}>
                            {coverImage ? (
                                <Image source={{ uri: coverImage }} style={styles.coverImage} />
                            ) : (
                                <View style={styles.coverPlaceholder}>
                                    <ImageIcon color={activeColors.textTertiary} size={40} />
                                    <Text style={[styles.placeholderText, { color: activeColors.textTertiary }]}>أضف غلاف</Text>
                                </View>
                            )}
                            <TouchableOpacity onPress={takePhoto} style={[styles.cameraBadge, { backgroundColor: activeColors.primary }]}>
                                <Camera color={activeColors.surface} size={16} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </View>
                </View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <View style={styles.contentBody}>

                        {/* Section 1: Basic Info */}
                        <Text style={[styles.sectionTitle, { color: activeColors.textSecondary }]}>المعلومات الأساسية</Text>
                        <Card style={styles.formCard}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: activeColors.textSecondary }]}>عنوان الكتاب</Text>
                                <View style={[styles.inputWrapper, { borderColor: activeColors.border, backgroundColor: isDarkMode ? activeColors.background : '#F9F9F9' }]}>
                                    <TextInput
                                        style={[styles.textInput, { color: activeColors.text }]}
                                        placeholder="مثال: لغات البرمجة"
                                        placeholderTextColor={activeColors.textTertiary}
                                        value={title}
                                        onChangeText={setTitle}
                                    />
                                    <BookIcon color={activeColors.primary} size={20} />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: activeColors.textSecondary }]}>المجال / التصنيف</Text>
                                <TouchableOpacity
                                    style={[styles.inputWrapper, { borderColor: activeColors.border, backgroundColor: isDarkMode ? activeColors.background : '#F9F9F9' }]}
                                    onPress={() => setFieldModalVisible(true)}
                                >
                                    <ChevronDown color={activeColors.textTertiary} size={20} />
                                    <Text style={[styles.selectorText, { color: selectedField ? activeColors.text : activeColors.textTertiary }]}>
                                        {selectedField ? selectedField.title : 'اختر المجال'}
                                    </Text>
                                    <Box color={activeColors.primary} size={20} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: activeColors.textSecondary }]}>المؤلف</Text>
                                <View style={[styles.inputWrapper, { borderColor: activeColors.border, backgroundColor: isDarkMode ? activeColors.background : '#F9F9F9' }]}>
                                    <TextInput
                                        style={[styles.textInput, { color: activeColors.text }]}
                                        placeholder="اسم المؤلف"
                                        placeholderTextColor={activeColors.textTertiary}
                                        value={author}
                                        onChangeText={setAuthor}
                                    />
                                    <PenTool color={activeColors.primary} size={20} />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: activeColors.textSecondary }]}>الوصف</Text>
                                <View style={[styles.inputWrapper, styles.textArea, { borderColor: activeColors.border, backgroundColor: isDarkMode ? activeColors.background : '#F9F9F9' }]}>
                                    <TextInput
                                        style={[styles.textInput, { color: activeColors.text, height: 80 }]}
                                        placeholder="نبذة عن الكتاب..."
                                        placeholderTextColor={activeColors.textTertiary}
                                        value={description}
                                        onChangeText={setDescription}
                                        multiline
                                        numberOfLines={4}
                                    />
                                    <AlignLeft color={activeColors.primary} size={20} style={{ alignSelf: 'flex-start', marginTop: 12 }} />
                                </View>
                            </View>
                        </Card>

                        {/* Section 2: Cataloging */}
                        <Text style={[styles.sectionTitle, { color: activeColors.textSecondary }]}>تفاصيل الفهرسة</Text>
                        <Card style={styles.formCard}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: activeColors.textSecondary }]}>دار النشر</Text>
                                <View style={[styles.inputWrapper, { borderColor: activeColors.border, backgroundColor: isDarkMode ? activeColors.background : '#F9F9F9' }]}>
                                    <TextInput
                                        style={[styles.textInput, { color: activeColors.text }]}
                                        placeholder="اسم دار النشر"
                                        placeholderTextColor={activeColors.textTertiary}
                                        value={publisher}
                                        onChangeText={setPublisher}
                                    />
                                    <Building2 color={activeColors.primary} size={20} />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: activeColors.textSecondary }]}>الفئة العمرية</Text>
                                <View style={styles.ageChipsContainer}>
                                    {['أطفال', 'إبتدائي', 'متوسط', 'ثانوي', 'جامعي', 'بحث علمي'].map((cat) => {
                                        const isSelected = ageCategory === cat;
                                        return (
                                            <TouchableOpacity
                                                key={cat}
                                                onPress={() => setAgeCategory(cat)}
                                                style={[
                                                    styles.ageChip,
                                                    { borderColor: activeColors.border },
                                                    isSelected && { backgroundColor: activeColors.primary, borderColor: activeColors.primary }
                                                ]}
                                            >
                                                <Text style={[styles.ageChipText, { color: activeColors.textSecondary }, isSelected && { color: activeColors.surface, fontFamily: FONTS.bold }]}>
                                                    {cat}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: activeColors.textSecondary }]}>التقييم (من 10)</Text>
                                <View style={styles.ratingRow}>
                                    <Star color={activeColors.warning} size={24} fill={activeColors.warning} />
                                    <View style={[styles.ratingInputBox, { backgroundColor: isDarkMode ? activeColors.background : '#F5F5F5' }]}>
                                        <TextInput
                                            style={[styles.ratingValue, { color: activeColors.primary }]}
                                            value={rating}
                                            onChangeText={setRating}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                        />
                                        <Text style={{ color: activeColors.textTertiary, fontSize: 18 }}>/ 10</Text>
                                    </View>
                                </View>
                            </View>
                        </Card>

                        {/* Section 3: Inventory & QR */}
                        <Text style={[styles.sectionTitle, { color: activeColors.textSecondary }]}>المخزون والباركود</Text>
                        <Card style={styles.formCard}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: activeColors.textSecondary }]}>عدد النسخ الكلية</Text>
                                <View style={[styles.inputWrapper, { borderColor: activeColors.border, backgroundColor: isDarkMode ? activeColors.background : '#F9F9F9' }]}>
                                    <TextInput
                                        style={[styles.textInput, { color: activeColors.text }]}
                                        placeholder="0"
                                        keyboardType="number-pad"
                                        placeholderTextColor={activeColors.textTertiary}
                                        value={copiesTotal}
                                        onChangeText={setCopiesTotal}
                                    />
                                    <Layers color={activeColors.primary} size={20} />
                                </View>
                            </View>

                            <View style={styles.qrSection}>
                                <View style={[styles.qrPreview, { backgroundColor: 'white' }]}>
                                    {barcode ? (
                                        <QRCode value={barcode} size={140} />
                                    ) : (
                                        <View style={styles.qrEmpty}>
                                            <QrCode size={48} color={activeColors.border} />
                                            <Text style={{ color: activeColors.textTertiary, marginTop: 8 }}>سيتم توليد الرمز تلقائياً</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.qrActions}>
                                    <TouchableOpacity
                                        style={[styles.qrActionBtn, { backgroundColor: barcode ? activeColors.danger + '15' : activeColors.primary + '15' }]}
                                        onPress={handleGenerateQR}
                                    >
                                        <QrCode size={18} color={barcode ? activeColors.danger : activeColors.primary} />
                                        <Text style={[styles.qrActionText, { color: barcode ? activeColors.danger : activeColors.primary }]}>
                                            {barcode ? 'تغيير الرمز' : 'توليد باركود'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.qrActionBtn, { backgroundColor: activeColors.textTertiary + '15' }]}>
                                        <Printer size={18} color={activeColors.textSecondary} />
                                        <Text style={[styles.qrActionText, { color: activeColors.textSecondary }]}>طباعة</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }, { backgroundColor: activeColors.primary }]}
                            onPress={handleSave}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={activeColors.surface} />
                            ) : (
                                <View style={styles.btnContent}>
                                    <Check color={activeColors.surface} size={22} />
                                    <Text style={styles.submitText}>{isEditing ? 'تحديث البيانات' : 'حفظ الكتاب'}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Field Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={fieldModalVisible}
                onRequestClose={() => setFieldModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setFieldModalVisible(false)}>
                                <X color={activeColors.text} size={24} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: activeColors.text }]}>اختر المجال</Text>
                        </View>

                        {loadingFields ? (
                            <ActivityIndicator size="large" color={activeColors.primary} />
                        ) : (
                            <ScrollView contentContainerStyle={styles.fieldsList}>
                                {fields.map((field) => (
                                    <TouchableOpacity
                                        key={field.id}
                                        style={[
                                            styles.fieldItem,
                                            { backgroundColor: activeColors.surface },
                                            selectedField?.id === field.id && { backgroundColor: isDarkMode ? activeColors.background : '#F5F5F5' }
                                        ]}
                                        onPress={() => {
                                            setSelectedField(field);
                                            setFieldModalVisible(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.fieldItemText,
                                            { color: activeColors.text },
                                            selectedField?.id === field.id && { color: activeColors.primary, fontFamily: FONTS.bold }
                                        ]}>
                                            {field.title}
                                        </Text>
                                        {selectedField?.id === field.id && <Check color={activeColors.primary} size={20} />}
                                    </TouchableOpacity>
                                ))}
                                {fields.length === 0 && (
                                    <Text style={[styles.placeholderText, { color: activeColors.textSecondary, textAlign: 'center', marginTop: 20 }]}>لا يوجد مجالات مضافة. يرجى إضافتها من شاشة المجالات.</Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    headerGradient: {
        height: 220,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
        paddingHorizontal: SPACING.m,
        zIndex: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.s,
    },
    backButton: {
        padding: SPACING.s,
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 20,
    },
    coverFloatContainer: {
        position: 'absolute',
        bottom: -50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    coverCard: {
        width: 120,
        height: 180,
        borderRadius: RADIUS.m,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverPlaceholder: {
        alignItems: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    contentBody: {
        paddingTop: 70, // Space for the floating cover
        paddingHorizontal: SPACING.m,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 14,
        marginTop: SPACING.l,
        marginBottom: SPACING.s,
        marginHorizontal: SPACING.s,
        textAlign: 'right',
    },
    formCard: {
        marginHorizontal: 0, // Fill the body padding correctly
        padding: SPACING.l,
        gap: SPACING.m,
    },
    inputGroup: {
        marginBottom: SPACING.s,
    },
    inputLabel: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        marginBottom: 6,
        textAlign: 'right',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        height: 54,
    },
    textArea: {
        height: 'auto',
        alignItems: 'flex-start',
        paddingVertical: SPACING.s,
    },
    textInput: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 16,
        textAlign: 'right',
        marginRight: SPACING.s,
    },
    selectorText: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 16,
        textAlign: 'right',
        marginRight: SPACING.s,
    },
    ageChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: 8,
    },
    ageChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: RADIUS.round,
        borderWidth: 1.5,
    },
    ageChipText: {
        fontSize: 13,
        fontFamily: FONTS.medium,
    },
    ratingRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: SPACING.m,
    },
    ratingInputBox: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        borderRadius: RADIUS.m,
        height: 50,
        gap: 4,
    },
    ratingValue: {
        fontFamily: FONTS.bold,
        fontSize: 22,
        width: 35,
        textAlign: 'center',
    },
    qrSection: {
        alignItems: 'center',
        paddingTop: SPACING.s,
    },
    qrPreview: {
        padding: SPACING.m,
        borderRadius: RADIUS.l,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    qrEmpty: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
        borderStyle: 'dashed',
        borderRadius: RADIUS.l,
    },
    qrActions: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginTop: SPACING.l,
    },
    qrActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: RADIUS.m,
        gap: 8,
    },
    qrActionText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    submitButton: {
        height: 60,
        borderRadius: RADIUS.round,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.xl,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    submitText: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: '#FFF',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl,
        maxHeight: '70%',
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
    },
    fieldsList: {
        gap: SPACING.s,
    },
    fieldItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.m,
        borderRadius: RADIUS.m,
    },
    fieldItemText: {
        fontFamily: FONTS.medium,
        fontSize: 16,
    },
    placeholderText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        marginTop: 4,
    },
});
