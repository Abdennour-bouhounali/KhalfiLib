import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { User, Phone, BookOpen, Layers } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Card from './Card';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

export interface StudentProps {
    id: string;
    name: string;
    phone: string;
    currentBook: string | null;
    previousBooksCount: number;
    avatarUri?: string;
}

interface StudentCardProps {
    student: StudentProps;
    onPress?: () => void;
}

export default function StudentCard({ student, onPress }: StudentCardProps) {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            navigation.navigate('StudentDetails', { studentId: student.id });
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <Card style={styles.container}>
                {/* Right side information (avatar and basic info) */}
                <View style={styles.headerRow}>
                    <View style={[styles.avatarContainer, { backgroundColor: isDarkMode ? activeColors.border : activeColors.textTertiary }]}>
                        {student.avatarUri ? (
                            <Image source={{ uri: student.avatarUri }} style={styles.avatar} />
                        ) : (
                            <User color={activeColors.surface} size={24} />
                        )}
                    </View>

                    <View style={styles.nameContainer}>
                        <Text style={[styles.name, { color: activeColors.text }]}>{student.name}</Text>
                        <View style={styles.phoneRow}>
                            <Text style={[styles.phone, { color: activeColors.textSecondary }]}>{student.phone}</Text>
                            <Phone color={activeColors.textSecondary} size={14} style={styles.icon} />
                        </View>
                    </View>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

                {/* Details section */}
                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailText, { color: activeColors.text }]}>
                            الكتاب المستعار حالياً: {student.currentBook ? student.currentBook : 'لا يوجد'}
                        </Text>
                        <BookOpen color={activeColors.textSecondary} size={14} style={styles.icon} />
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailText, { color: activeColors.text }]}>عدد الكتب السابقة: {student.previousBooksCount.toString()}</Text>
                        <Layers color={activeColors.textSecondary} size={14} style={styles.icon} />
                    </View>
                </View>

            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: SPACING.m,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.textTertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m, // Space after avatar in LTR/RTL correctly
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    nameContainer: {
        flex: 1,
        alignItems: 'flex-start', // Use flex-start as forceRtl will handle it
    },
    name: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.text,
        marginBottom: 4,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    phone: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginRight: 4, // Note: Flex-end means this applies on the left side of icon basically
    },
    icon: {
        marginLeft: SPACING.xs,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: SPACING.s,
        marginHorizontal: SPACING.m,
    },
    detailsContainer: {
        alignItems: 'flex-start',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        textAlign: 'right',
    },
});
