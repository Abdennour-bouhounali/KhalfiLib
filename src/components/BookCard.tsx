import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Star, Clock, User, Layers, BookOpen } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Card from './Card';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export interface BookProps {
    id: string;
    title: string;
    author: string;
    field: string;
    copiesAvailable: number;
    ageCategory: string;
    rating: number;
    status: 'available' | 'low' | 'unavailable';
    imageUri?: string;
}

interface BookCardProps {
    book: BookProps;
    onPress?: () => void;
}

export default function BookCard({ book, onPress }: BookCardProps) {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    const getStatusColor = () => {
        switch (book.status) {
            case 'available': return activeColors.success;
            case 'low': return activeColors.warning;
            case 'unavailable': return activeColors.danger;
            default: return activeColors.textTertiary;
        }
    };

    const getStatusText = () => {
        switch (book.status) {
            case 'available': return 'متاح';
            case 'low': return 'نسخ قليلة';
            case 'unavailable': return 'غير متاح';
            default: return '';
        }
    };

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            navigation.navigate('BookDetails', { bookId: book.id });
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <Card style={styles.container}>
                {/* Right side information (RTL naturally rendered) */}
                <View style={styles.infoContainer}>
                    <Text style={[styles.title, { color: activeColors.text }]} numberOfLines={1}>{book.title}</Text>

                    <View style={styles.row}>
                        <View style={styles.iconRow}>
                            <Text style={[styles.author, { color: activeColors.textSecondary }]} numberOfLines={1}>{book.author}</Text>
                            <User color={activeColors.textSecondary} size={14} style={styles.icon} />
                        </View>
                    </View>

                    <View style={styles.detailsGrid}>
                        <View style={styles.iconRow}>
                            <Text style={[styles.detailText, { color: activeColors.textSecondary }]}>{book.copiesAvailable} نسخة باقي</Text>
                            <Layers color={activeColors.textSecondary} size={14} style={styles.icon} />
                        </View>
                        <View style={styles.iconRow}>
                            <Text style={[styles.detailText, { color: activeColors.textSecondary }]}>{book.field}</Text>
                            <BookOpen color={activeColors.textSecondary} size={14} style={styles.icon} />
                        </View>
                        <View style={styles.iconRow}>
                            <Text style={[styles.detailText, { color: activeColors.textSecondary }]}>{book.ageCategory}</Text>
                            <User color={activeColors.textSecondary} size={14} style={styles.icon} />
                        </View>
                    </View>

                    <View style={styles.bottomRow}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                            <Text style={styles.statusText}>{getStatusText()}</Text>
                        </View>

                        <View style={styles.ratingContainer}>
                            <Text style={[styles.ratingText, { color: activeColors.text }]}>{book.rating}</Text>
                            <Star color={activeColors.warning} size={14} fill={activeColors.warning} />
                        </View>
                    </View>
                </View>

                {/* Left side Image */}
                <View style={[styles.imageContainer, { backgroundColor: activeColors.background }]}>
                    {book.imageUri ? (
                        <Image source={{ uri: book.imageUri }} style={styles.image} />
                    ) : (
                        <View style={[styles.imagePlaceholder, { backgroundColor: isDarkMode ? '#2A2A2A' : '#EBEBEB' }]}>
                            <BookOpen color={activeColors.textTertiary} size={32} />
                        </View>
                    )}
                </View>

            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.s,
    },
    imageContainer: {
        width: 80,
        height: 120,
        borderRadius: RADIUS.s,
        overflow: 'hidden',
        backgroundColor: COLORS.background,
        marginLeft: SPACING.m, // This is fine, but in infoContainer we should be consistent
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EBEBEB',
    },
    infoContainer: {
        flex: 1,
        paddingVertical: SPACING.xs,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.text,
        marginBottom: SPACING.xs,
        textAlign: 'right',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: SPACING.s,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: '48%', // Fit two columns
        marginBottom: SPACING.xs,
    },
    icon: {
        marginLeft: SPACING.xs,
    },
    author: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'right',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    detailText: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'right',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    statusBadge: {
        paddingHorizontal: SPACING.m,
        paddingVertical: 4,
        borderRadius: RADIUS.round,
    },
    statusText: {
        fontFamily: FONTS.bold,
        fontSize: 12,
        color: COLORS.surface,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        marginRight: 4,
        textAlign: 'right',
    },
});
