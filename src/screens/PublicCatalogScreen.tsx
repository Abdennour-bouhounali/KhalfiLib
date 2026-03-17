import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, SafeAreaView, Platform, Image, ScrollView } from 'react-native';
import { LogIn, UserPlus, BookOpen } from 'lucide-react-native';
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

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const loadData = async () => {
        try {
            setLoading(true);
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
        }
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

        return fieldMatch && (
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
                        <View style={styles.iconContainer}>
                            <BookOpen color={activeColors.primary} size={20} />
                        </View>
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

                {/* Field Filter Bar */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                    style={styles.filterWrapper}
                >
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            selectedField === 'all' ? { backgroundColor: activeColors.primary } : { backgroundColor: activeColors.surface }
                        ]}
                        onPress={() => setSelectedField('all')}
                    >
                        <Text style={[
                            styles.filterChipText,
                            selectedField === 'all' ? { color: activeColors.surface } : { color: activeColors.textSecondary }
                        ]}>الكل</Text>
                    </TouchableOpacity>

                    {fields.map(field => (
                        <TouchableOpacity
                            key={field.id}
                            style={[
                                styles.filterChip,
                                selectedField === field.id ? { backgroundColor: activeColors.primary } : { backgroundColor: activeColors.surface }
                            ]}
                            onPress={() => setSelectedField(field.id!)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                selectedField === field.id ? { color: activeColors.surface } : { color: activeColors.textSecondary }
                            ]}>{field.title}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={[styles.listContent, { alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={activeColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredBooks}
                    keyExtractor={(item, index) => item.id || index.toString()}
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
        marginBottom: SPACING.s,
    },
    filterContainer: {
        paddingHorizontal: SPACING.m,
        gap: SPACING.s,
        paddingBottom: SPACING.s,
        flexDirection: 'row-reverse',
    },
    filterChip: {
        paddingHorizontal: SPACING.m,
        paddingVertical: 8,
        borderRadius: RADIUS.round,
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    filterChipText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
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
