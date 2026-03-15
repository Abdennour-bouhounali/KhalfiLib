import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Filter, Plus } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import BookCard, { BookProps } from '../components/BookCard';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { BooksAPI, Book, FieldsAPI, Field } from '../services/database';

export default function BooksScreen() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [searchQuery, setSearchQuery] = useState('');
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

        return (
            title.toLowerCase().includes(query.toLowerCase()) ||
            author.toLowerCase().includes(query.toLowerCase()) ||
            fieldId.toLowerCase().includes(query.toLowerCase()) ||
            fieldTitle.toLowerCase().includes(query.toLowerCase())
        );
    });



    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            {/* Based on the 3rd mockup, the header uses the primary light background */}
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <Header
                    showSearch={false}
                    showNotification={false}
                    showSearchInput={true}
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="ابحث عن كتاب..."
                />
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
                            <Text style={{ fontFamily: FONTS.medium, color: activeColors.textSecondary }}>لا يوجد كتب هنا</Text>
                        </View>
                    }
                />
            )}

            {/* FAB - Circular plus icon as requested */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: activeColors.primary }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('AddBook' as never)}
            >
                <Plus color={activeColors.surface} size={30} />
            </TouchableOpacity>
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
        paddingBottom: 0, // Set to 0 as requested by user
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    listHeader: {
        paddingHorizontal: SPACING.m,
        paddingBottom: 0,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginBottom: SPACING.m, // Add consistency
    },
    search: {
        flex: 1,
        marginHorizontal: 0,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.round,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    listContent: {
        paddingVertical: SPACING.m,
        paddingBottom: 100, // accommodate fab and nav bar
    },
    fab: {
        position: 'absolute',
        bottom: 110, // Above bottom nav, moved slightly higher as requested
        right: SPACING.m,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabIcon: {
        marginRight: SPACING.s,
    },
    fabText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.surface,
    },
});
