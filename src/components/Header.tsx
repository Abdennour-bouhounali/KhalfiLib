import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Search, Bell, BookOpen, LogOut, ArrowRight } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
    showSearch?: boolean;
    showNotification?: boolean;
    title?: string;
    onSearchPress?: () => void;
    onNotificationPress?: () => void;
    showSearchInput?: boolean;
    searchValue?: string;
    onSearchChange?: (text: string) => void;
    searchPlaceholder?: string;
    showLogo?: boolean;
    showLogout?: boolean;
    onLogout?: () => void;
    showBack?: boolean;
    onBackPress?: () => void;
}

export default function Header({
    showSearch = false,
    showNotification = true,
    title = 'مكتبة عشيرة آل خلفي',
    onSearchPress,
    onNotificationPress,
    showSearchInput = false,
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'ابحث هنا...',
    showLogo = false,
    showLogout = false,
    onLogout,
    showBack = false,
    onBackPress
}: HeaderProps) {
    const navigation = useNavigation<any>();
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    const handleNotificationPress = () => {
        if (onNotificationPress) {
            onNotificationPress();
        } else {
            navigation.navigate('Notifications');
        }
    };

    return (
        <View style={[
            styles.container,
            { paddingTop: insets.top + SPACING.s },
            showSearchInput && styles.containerSearch
        ]}>
            {showSearchInput ? (
                <View style={[styles.searchInputContainer, isDarkMode && { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                    <Search color={activeColors.textTertiary} size={20} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: activeColors.text }]}
                        value={searchValue}
                        onChangeText={onSearchChange}
                        placeholder={searchPlaceholder}
                        placeholderTextColor={activeColors.textTertiary}
                        textAlign="right"
                        autoFocus
                    />
                </View>
            ) : (
                <>
                    {/* Logout / Back Button (TOP RIGHT in RTL) */}
                    <View style={styles.rightCorner}>
                        {showBack ? (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={onBackPress || (() => navigation.goBack())}
                            >
                                <ArrowRight color={activeColors.text} size={24} />
                            </TouchableOpacity>
                        ) : showLogout ? (
                            <TouchableOpacity
                                style={[styles.logoutButton, isDarkMode && { backgroundColor: '#3D1C1C' }]}
                                onPress={onLogout}
                            >
                                <LogOut color={isDarkMode ? '#FF5252' : COLORS.danger} size={20} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Branding Group (Center/Title) */}
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: activeColors.text }]} numberOfLines={1}>{title}</Text>
                        {showNotification && (
                            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
                                <Bell color={activeColors.text} size={20} />
                                <View style={[styles.badge, { backgroundColor: activeColors.primaryLight }]} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Logo (TOP LEFT in RTL) */}
                    <View style={styles.leftCorner}>
                        {showLogo ? (
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={[styles.logoContainer, isDarkMode && { backgroundColor: '#1A3A37' }]}>
                                <BookOpen color={activeColors.primary} size={24} />
                            </View>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
        backgroundColor: 'transparent',
    },
    brandingGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    rightCorner: {
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 42,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        // This ensures the title group stays relatively close to the logo
        // while the whole brandingGroup can expand if needed.
    },
    leftCorner: {
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 42,
    },
    iconButton: {
        padding: SPACING.xs,
        position: 'relative',
    },
    backButton: {
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: COLORS.primaryLight,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 17,
        color: COLORS.text,
        textAlign: 'right',
    },
    logoContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#E6EEEB', // Soft greyish green
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerSearch: {
        paddingBottom: SPACING.m,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.round,
        paddingHorizontal: SPACING.m,
        height: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: SPACING.s,
    },
    searchInput: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.text,
    },
    logoImage: {
        width: 55,
        height: 40,
    },
    notificationButton: {
        padding: 4,
        position: 'relative',
    },
    logoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
