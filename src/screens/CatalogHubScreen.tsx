import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Book, Layers, BookOpen, Library } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';

export default function CatalogHubScreen() {
    const navigation = useNavigation<any>();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    const hubItems = [
        {
            id: 'catalog',
            title: 'الفهرس العام',
            description: 'تصفح جميع كتب المكتبة المتاحة للجمهور',
            icon: Book,
            screen: 'PublicCatalog',
            color: '#3B827A'
        },
        {
            id: 'borrow',
            title: 'الاستعارة والإرجاع',
            description: 'إدارة عمليات استعارة الكتب وإعادتها للطلاب',
            icon: BookOpen,
            screen: 'BorrowReturn',
            color: '#CBA276'
        },
        {
            id: 'fields',
            title: 'إدارة المجالات',
            description: 'إدارة وتصنيف مجالات الكتب في المكتبة',
            icon: Layers,
            screen: 'Fields',
            color: '#666666'
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <Header title="مركز الإدارة" />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.hubHeader}>
                    <Library color={activeColors.primary} size={48} />
                    <Text style={[styles.hubTitle, { color: activeColors.text }]}>إدارة المكتبة</Text>
                    <Text style={[styles.hubSubtitle, { color: activeColors.textSecondary }]}>
                        الوصول السريع إلى أدوات إدارة الكتب والعمليات
                    </Text>
                </View>

                <View style={styles.grid}>
                    {hubItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.hubCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                                <item.icon color={item.color} size={32} />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: activeColors.text }]}>{item.title}</Text>
                                <Text style={[styles.cardDescription, { color: activeColors.textSecondary }]}>
                                    {item.description}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBackground: {
        paddingBottom: 0,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    scrollContent: {
        paddingTop: SPACING.xl,
    },
    hubHeader: {
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        marginBottom: SPACING.xxl,
    },
    hubTitle: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        marginTop: SPACING.m,
        textAlign: 'center',
    },
    hubSubtitle: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        textAlign: 'center',
        marginTop: SPACING.s,
        lineHeight: 20,
    },
    grid: {
        paddingHorizontal: SPACING.m,
    },
    hubCard: {
        flexDirection: 'row-reverse',
        borderRadius: RADIUS.l,
        padding: SPACING.l,
        marginBottom: SPACING.m,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        marginRight: SPACING.m,
        alignItems: 'flex-end',
    },
    cardTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        marginBottom: 4,
    },
    cardDescription: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        textAlign: 'right',
        lineHeight: 18,
    },
});
