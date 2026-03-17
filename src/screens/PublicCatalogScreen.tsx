import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, SafeAreaView, Platform, Image, ScrollView, Modal, TextInput, RefreshControl } from 'react-native';
import { LogIn, UserPlus, BookOpen, ArrowRight, Plus, Search, Filter, X, Check, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import BookCard from '../components/BookCard';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { BooksAPI, Book, FieldsAPI, Field } from '../services/database';
import { useAuth } from '../context/AuthContext';

export default function PublicCatalogScreen() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedField, setSelectedField] = useState<string>('all');
    const [books, setBooks] = useState<Book[]>([]);
    const [fields, setFields] = useState<Field[]>([]);
    const [loading, setLoading] = useState(true);
    const [fieldModalVisible, setFieldModalVisible] = useState(false);
    const [fieldSearchQuery, setFieldSearchQuery] = useState('');
    const [selectedAgeCategory, setSelectedAgeCategory] = useState<string>('all');
    const [ageModalVisible, setAgeModalVisible] = useState(false);

    const AGE_CATEGORIES = ['أطفال', 'إبتدائي', 'متوسط', 'ثانوي', 'جامعي', 'بحث علمي'];

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);

            const [booksData, fieldsData] = await Promise.all([
                BooksAPI.getAll(),
                FieldsAPI.getAll()
            ]);
            setBooks(booksData);
            setFields(fieldsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        loadData(true);
    };

    const getFieldTitle = (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId);
        return field ? field.title : fieldId;
    };

    const filteredBooks = books.filter(b => {
        const title = b.title || '';
        const author = b.author || '';
        const fieldId = b.fieldId || '';
        const fieldTitle = getFieldTitle(fieldId);
        const query = searchQuery || '';

        const fieldMatch = selectedField === 'all' || fieldId === selectedField;
        const ageMatch = selectedAgeCategory === 'all' || b.ageCategory === selectedAgeCategory;

        return fieldMatch && ageMatch && (
            title.toLowerCase().includes(query.toLowerCase()) ||
            author.toLowerCase().includes(query.toLowerCase()) ||
            fieldTitle.toLowerCase().includes(query.toLowerCase())
        );
    });

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight, paddingTop: insets.top + SPACING.s }]}>
                <View style={styles.logoTitleContainer}>
                    <View style={styles.sideIconAbsoluteRight}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={[styles.headerTitle, { color: activeColors.text }]}>مكتبة عشيرة آل خلفي</Text>
                    <View style={styles.sideIconAbsoluteLeft}>
                        {user ? (
                            <TouchableOpacity
                                style={styles.iconContainer}
                                onPress={() => navigation.navigate('Library')}
                            >
                                <ArrowRight color={activeColors.primary} size={20} />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.iconContainer}>
                                <BookOpen color={activeColors.primary} size={20} />
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.headerComponentWrapper}>
                    <Header
                        showSearch={false}
                        showNotification={false}
                        showSearchInput={true}
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="ابحث عن كتاب، مؤلف، تصنيف..."
                    />
                </View>

                {/* Filters Buttons */}
                <View style={[styles.filterWrapper, { flexDirection: 'row-reverse', gap: SPACING.s }]}>
                    <TouchableOpacity
                        style={[styles.filterButton, { flex: 1, backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
                        onPress={() => setFieldModalVisible(true)}
                    >
                        <View style={styles.filterBtnContent}>
                            <ChevronDown color={activeColors.textSecondary} size={16} />
                            <Text style={[styles.filterBtnText, { color: activeColors.text }]} numberOfLines={1}>
                                {selectedField === 'all' ? 'المجال' : getFieldTitle(selectedField)}
                            </Text>
                        </View>
                        <Filter color={selectedField !== 'all' ? activeColors.primary : activeColors.textTertiary} size={18} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterButton, { flex: 1, backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
                        onPress={() => setAgeModalVisible(true)}
                    >
                        <View style={styles.filterBtnContent}>
                            <ChevronDown color={activeColors.textSecondary} size={16} />
                            <Text style={[styles.filterBtnText, { color: activeColors.text }]} numberOfLines={1}>
                                {selectedAgeCategory === 'all' ? 'الفئة' : selectedAgeCategory}
                            </Text>
                        </View>
                        <Filter color={selectedAgeCategory !== 'all' ? activeColors.primary : activeColors.textTertiary} size={18} />
                    </TouchableOpacity>
                </View>
            </View>

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
                            <TouchableOpacity onPress={() => setFieldModalVisible(false)} style={styles.closeBtn}>
                                <X color={activeColors.text} size={24} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: activeColors.text }]}>اختر المجال</Text>
                        </View>

                        <View style={[styles.modalSearchContainer, { backgroundColor: isDarkMode ? activeColors.background : '#F5F5F5' }]}>
                            <Search color={activeColors.textTertiary} size={20} />
                            <TextInput
                                style={[styles.modalSearchInput, { color: activeColors.text }]}
                                placeholder="بحث عن مجال..."
                                placeholderTextColor={activeColors.textTertiary}
                                value={fieldSearchQuery}
                                onChangeText={setFieldSearchQuery}
                                textAlign="right"
                            />
                        </View>

                        <ScrollView contentContainerStyle={styles.fieldsList}>
                            <TouchableOpacity
                                style={[styles.fieldItem, selectedField === 'all' && { backgroundColor: activeColors.primary + '15' }]}
                                onPress={() => { setSelectedField('all'); setFieldModalVisible(false); }}
                            >
                                {selectedField === 'all' && <Check color={activeColors.primary} size={20} />}
                                <Text style={[styles.fieldItemText, { color: selectedField === 'all' ? activeColors.primary : activeColors.text }]}>الكل (جميع المجالات)</Text>
                            </TouchableOpacity>

                            {fields
                                .filter(f => f.title.toLowerCase().includes(fieldSearchQuery.toLowerCase()))
                                .map(field => (
                                    <TouchableOpacity
                                        key={field.id}
                                        style={[styles.fieldItem, selectedField === field.id && { backgroundColor: activeColors.primary + '15' }]}
                                        onPress={() => { setSelectedField(field.id!); setFieldModalVisible(false); }}
                                    >
                                        {selectedField === field.id && <Check color={activeColors.primary} size={20} />}
                                        <Text style={[styles.fieldItemText, { color: selectedField === field.id ? activeColors.primary : activeColors.text }]}>{field.title}</Text>
                                    </TouchableOpacity>
                                ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Age Category Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={ageModalVisible}
                onRequestClose={() => setAgeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.surface }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setAgeModalVisible(false)} style={styles.closeBtn}>
                                <X color={activeColors.text} size={24} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: activeColors.text }]}>اختر الفئة العمرية</Text>
                        </View>

                        <ScrollView contentContainerStyle={styles.fieldsList}>
                            <TouchableOpacity
                                style={[styles.fieldItem, selectedAgeCategory === 'all' && { backgroundColor: activeColors.primary + '15' }]}
                                onPress={() => { setSelectedAgeCategory('all'); setAgeModalVisible(false); }}
                            >
                                {selectedAgeCategory === 'all' && <Check color={activeColors.primary} size={20} />}
                                <Text style={[styles.fieldItemText, { color: selectedAgeCategory === 'all' ? activeColors.primary : activeColors.text }]}>الكل (جميع الفئات)</Text>
                            </TouchableOpacity>

                            {AGE_CATEGORIES.map(category => (
                                <TouchableOpacity
                                    key={category}
                                    style={[styles.fieldItem, selectedAgeCategory === category && { backgroundColor: activeColors.primary + '15' }]}
                                    onPress={() => { setSelectedAgeCategory(category); setAgeModalVisible(false); }}
                                >
                                    {selectedAgeCategory === category && <Check color={activeColors.primary} size={20} />}
                                    <Text style={[styles.fieldItemText, { color: selectedAgeCategory === category ? activeColors.primary : activeColors.text }]}>{category}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {loading ? (
                <View style={[styles.listContent, { alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={activeColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredBooks}
                    keyExtractor={item => item.id || ''}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeColors.primary]} />
                    }
                    renderItem={({ item }) => <BookCard book={{
                        id: !!item.id ? item.id : '',
                        title: item.title,
                        author: item.author,
                        field: getFieldTitle(item.fieldId),
                        copiesAvailable: item.copiesAvailable,
                        ageCategory: item.ageCategory,
                        rating: item.rating,
                        status: item.status,
                        coverImage: item.coverImage,
                    }} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ fontFamily: FONTS.medium, color: activeColors.textSecondary }}>لا يوجد كتب حالياً</Text>
                        </View>
                    }
                />
            )}

            {/* Add Book FAB for Admins */}
            {user && (user.role === 'admin' || user.role === 'super_admin') && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: activeColors.primary }]}
                    onPress={() => navigation.navigate('AddBook')}
                    activeOpacity={0.8}
                >
                    <Plus color={activeColors.surface} size={32} />
                </TouchableOpacity>
            )}

            {/* Bottom Auth Bar for Guests */}
            {user === null && (
                <View style={[
                    styles.authBar,
                    {
                        backgroundColor: activeColors.surface,
                        borderTopColor: activeColors.border,
                        paddingBottom: Math.max(insets.bottom, SPACING.m) + SPACING.s,
                    }
                ]}>
                    <TouchableOpacity
                        style={[styles.authButton, { backgroundColor: activeColors.primary }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <LogIn size={20} color={activeColors.surface} />
                        <Text style={[styles.authButtonText, { color: activeColors.surface }]}>تسجيل الدخول</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.authButtonSecondary, { borderColor: activeColors.primary }]}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <UserPlus size={20} color={activeColors.primary} />
                        <Text style={[styles.authButtonTextSecondary, { color: activeColors.primary }]}>إنشاء حساب</Text>
                    </TouchableOpacity>
                </View>
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
    },
    logoTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.m,
        height: 50,
        position: 'relative',
    },
    sideIconAbsoluteRight: {
        position: 'absolute',
        right: 16,
    },
    sideIconAbsoluteLeft: {
        position: 'absolute',
        left: 16,
    },
    logoImage: {
        width: 45,
        height: 45,
        marginLeft: 45
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 19,
        textAlign: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E6EEEB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerComponentWrapper: {
        marginTop: -SPACING.xxl,
    },
    filterWrapper: {
        marginTop: SPACING.m,
        marginBottom: SPACING.m,
        paddingHorizontal: SPACING.m,
    },
    filterButton: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: 10,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        justifyContent: 'space-between',
    },
    filterBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    filterBtnText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.l,
        maxHeight: '80%',
        minHeight: '40%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    modalTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
    },
    closeBtn: {
        padding: 4,
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        borderRadius: RADIUS.m,
        height: 48,
        marginBottom: SPACING.m,
    },
    modalSearchInput: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 15,
        marginHorizontal: 8,
    },
    fieldsList: {
        paddingBottom: SPACING.xxl,
    },
    fieldItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: SPACING.m,
        borderRadius: RADIUS.m,
        marginBottom: 4,
        gap: 12,
    },
    fieldItemText: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        textAlign: 'right',
        flex: 1,
    },
    listContent: {
        paddingTop: SPACING.xs,
        paddingHorizontal: SPACING.m,
        paddingBottom: 150,
    },
    authBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row-reverse',
        padding: SPACING.m,
        borderTopWidth: 1,
        gap: SPACING.m,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    fab: {
        position: 'absolute',
        bottom: 150,
        left: SPACING.m,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        zIndex: 100,
    },
    authButton: {
        flex: 1,
        flexDirection: 'row-reverse',
        height: 50,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.s,
    },
    authButtonSecondary: {
        flex: 1,
        flexDirection: 'row-reverse',
        height: 50,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        gap: SPACING.s,
    },
    authButtonText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    authButtonTextSecondary: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
});
