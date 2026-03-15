import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Filter, Plus } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import StudentCard, { StudentProps } from '../components/StudentCard';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StudentsAPI, Student } from '../services/database';

export default function StudentsScreen() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isFocused) {
            loadStudents();
        }
    }, [isFocused]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const data = await StudentsAPI.getAll();
            setStudents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const first = s.firstName || '';
        const last = s.lastName || '';
        const phone = s.phone || '';
        const query = searchQuery || '';

        return (
            first.toLowerCase().includes(query.toLowerCase()) ||
            last.toLowerCase().includes(query.toLowerCase()) ||
            phone.toLowerCase().includes(query.toLowerCase())
        );
    });



    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            {/* Soft teal background in header area */}
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight, paddingBottom: 0 }]}>
                <Header
                    showSearch={false}
                    showNotification={false}
                    showSearchInput={true}
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="ابحث عن طالب..."
                />
            </View>

            {loading ? (
                <View style={[styles.listContent, { alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={activeColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredStudents}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    renderItem={({ item }) => <StudentCard student={{
                        id: item.id!,
                        name: `${item.firstName} ${item.lastName}`,
                        phone: item.phone,
                        currentBook: item.borrowedBookId || null,
                        previousBooksCount: item.previousBooksCount,
                        avatarUri: item.profilePicture,
                    }} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ fontFamily: FONTS.medium, color: activeColors.textSecondary }}>لا يوجد طلاب هنا</Text>
                        </View>
                    }
                />
            )}

            {/* FAB - Circular plus icon as requested */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: activeColors.primary }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('AddStudent' as never)}
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
        backgroundColor: COLORS.primaryLight, // #DDEEEB equivalent logic
        paddingBottom: SPACING.l,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    listHeader: {
        paddingHorizontal: SPACING.m,
    },
    pageTitle: {
        fontFamily: FONTS.bold,
        fontSize: 28,
        color: '#000',
        textAlign: 'center',
        marginBottom: SPACING.m,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
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
        paddingBottom: 100, // padding for bottom tabs & fab
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
});
