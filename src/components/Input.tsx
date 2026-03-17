import React from 'react';
import { View, TextInput, StyleSheet, Text, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps {
    label?: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
    icon?: React.ReactNode;
    style?: ViewStyle;
    error?: string;
}

export default function Input({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType = 'default',
    icon,
    style,
    error,
}: InputProps) {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const isSecure = secureTextEntry && !isPasswordVisible;

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={[styles.label, { color: activeColors.textSecondary }]}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                {
                    backgroundColor: activeColors.surface,
                    borderColor: error ? activeColors.danger : activeColors.border,
                }
            ]}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={[styles.input, { color: activeColors.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={activeColors.textTertiary}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={isSecure}
                    keyboardType={keyboardType}
                    textAlign="right"
                />
                {secureTextEntry && (
                    <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                        {isPasswordVisible ? (
                            <EyeOff size={20} color={activeColors.textTertiary} />
                        ) : (
                            <Eye size={20} color={activeColors.textTertiary} />
                        )}
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={[styles.errorText, { color: activeColors.danger }]}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: SPACING.m,
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        marginBottom: SPACING.xs,
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        height: 56,
    },
    iconContainer: {
        marginLeft: SPACING.s,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 16,
        paddingVertical: 0,
        textAlign: 'right',
    },
    eyeIcon: {
        padding: SPACING.xs,
    },
    errorText: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        marginTop: SPACING.xs,
        textAlign: 'right',
    },
});
