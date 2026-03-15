import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Book, Users, BookOpen, Settings, Layers } from 'lucide-react-native';

import { RootStackParamList, MainTabParamList } from './types';
import { COLORS, DARK_COLORS, FONTS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import BooksScreen from '../screens/BooksScreen';
import StudentsScreen from '../screens/StudentsScreen';
import BorrowReturnScreen from '../screens/BorrowReturnScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddBookScreen from '../screens/AddBookScreen';
import AddStudentScreen from '../screens/AddStudentScreen';
import FieldsScreen from '../screens/FieldsScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import StudentDetailsScreen from '../screens/StudentDetailsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MainTabNavigator() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: activeColors.primary,
                tabBarInactiveTintColor: activeColors.textTertiary,
                tabBarLabelStyle: {
                    fontFamily: FONTS.medium,
                    fontSize: 12,
                },
                tabBarStyle: {
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 10,
                    paddingTop: 10,
                    backgroundColor: activeColors.surface,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    position: 'absolute',
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: activeColors.shadow,
                    shadowOpacity: 0.1,
                    shadowOffset: { width: 0, height: -2 },
                    shadowRadius: 10,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'الرئيسية',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Books"
                component={BooksScreen}
                options={{
                    tabBarLabel: 'الكتب',
                    tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Fields"
                component={FieldsScreen}
                options={{
                    tabBarLabel: 'المجالات',
                    tabBarIcon: ({ color, size }) => <Layers color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Students"
                component={StudentsScreen}
                options={{
                    tabBarLabel: 'الطلاب',
                    tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="BorrowReturn"
                component={BorrowReturnScreen}
                options={{
                    tabBarLabel: 'الاستعارة',
                    tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'الإعدادات',
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="AddBook" component={AddBookScreen} />
            <Stack.Screen name="AddStudent" component={AddStudentScreen} />
            <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
            <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} />
        </Stack.Navigator>
    );
}
