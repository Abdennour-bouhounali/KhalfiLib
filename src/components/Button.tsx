import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    loading?: boolean;
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    disabled = false,
    loading = false,
}: ButtonProps) {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary': return activeColors.primary;
            case 'secondary': return activeColors.secondary;
            case 'danger': return activeColors.danger;
            case 'success': return activeColors.success;
            default: return activeColors.primary;
        }
    };

    const backgroundColor = getBackgroundColor();

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor },
                (disabled || loading) ? styles.disabled : {},
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={activeColors.surface} />
            ) : (
                <Text style={[styles.text, { color: activeColors.surface }, textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderRadius: RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    text: {
        color: COLORS.surface,
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    disabled: {
        opacity: 0.6,
    },
});
