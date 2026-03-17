import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, MessageCircle, Shield, Settings, LucideIcon, Library } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DARK_COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const insets = useSafeAreaInsets();

    // Map of route names to icons
    const iconMap: Record<string, LucideIcon> = {
        Home: Home,
        Security: Shield,
        LibraryChat: MessageCircle,
        Library: Library,
        Settings: Settings,
        // Fallbacks for specific role navigators
        Dashboard: Home,
        Admins: Shield,
        Students: Shield,
        PublicCatalog: Library

    };

    // Filter out hidden tabs (where display: 'none' is set)
    const routes = state.routes.filter(route => {
        const { options } = descriptors[route.key];
        return (options.tabBarItemStyle as any)?.display !== 'none';
    });

    return (
        <View style={[
            styles.container,
            {
                bottom: Math.max(insets.bottom, SPACING.m),
                backgroundColor: isDarkMode ? activeColors.surface : '#F5F5F7',
                borderColor: isDarkMode ? activeColors.border : 'rgba(0,0,0,0.05)',
            }
        ]}>
            <View style={styles.tabContent}>
                {routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const Icon = iconMap[route.name] || Home;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.8}
                        >
                            {isFocused ? (
                                <View style={styles.activeContainer}>
                                    <View style={[styles.activeCircle, { backgroundColor: activeColors.success }]}>
                                        <Icon size={24} color="#000000" strokeWidth={2.5} />
                                    </View>
                                    <Text style={[styles.activeLabel, { color: activeColors.text, fontFamily: FONTS.bold }]}>
                                        {label as string}
                                    </Text>
                                </View>
                            ) : (
                                <Icon
                                    size={24}
                                    color={activeColors.textTertiary}
                                    strokeWidth={1.5}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        width: width * 0.9,
        height: 75,
        borderRadius: 40,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
        }),
        zIndex: 1000,
    },
    tabContent: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-evenly', // Use space-evenly for 5 items
        paddingHorizontal: SPACING.xs,
    },
    tabItem: {
        minWidth: 50, // Ensure minimum width for touch targets
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -15, // Lift the active item slightly
    },
    activeCircle: {
        width: 44,
        height: 44,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    activeLabel: {
        fontSize: 10,
        textAlign: 'center',
    },
});
