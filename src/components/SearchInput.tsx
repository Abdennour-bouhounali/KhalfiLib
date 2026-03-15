import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface SearchInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    style?: ViewStyle;
}

export default function SearchInput({
    value,
    onChangeText,
    placeholder = 'ابحث عن كتب، مؤلفين، تصنيفات...',
    style,
}: SearchInputProps) {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: activeColors.surface,
                borderColor: activeColors.border,
                shadowColor: activeColors.shadow,
            },
            style
        ]}>
            <Search color={activeColors.textTertiary} size={20} style={styles.icon} />
            <TextInput
                style={[styles.input, { color: activeColors.text }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={activeColors.textTertiary}
                textAlign="right"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.round,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        marginHorizontal: SPACING.m,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    icon: {
        marginRight: SPACING.s,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.text,
        paddingVertical: 8, // Adjust for font centering
    },
});
