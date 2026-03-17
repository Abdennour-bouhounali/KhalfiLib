import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Book, Users, BookOpen, Settings, Layers, LayoutGrid, ShieldCheck as Shield, MessageCircle } from 'lucide-react-native';

import { RootStackParamList, MainTabParamList, SuperAdminTabParamList, StudentTabParamList } from './types';
import { COLORS, DARK_COLORS, FONTS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

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

// Auth & New Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PublicCatalogScreen from '../screens/PublicCatalogScreen';
import BookChatScreen from '../screens/BookChatScreen';
import LibraryChatScreen from '../screens/LibraryChatScreen';
import SuperAdminDashboard from '../screens/SuperAdminDashboard';
import StudentHomeScreen from '../screens/StudentHomeScreen';
import AccountStatusScreen from '../screens/AccountStatusScreen';
import ManageSubscriptionScreen from '../screens/ManageSubscriptionScreen';
import AdminManagementScreen from '../screens/AdminManagementScreen';
import CatalogHubScreen from '../screens/CatalogHubScreen';
import NotificationScreen from '../screens/NotificationScreen';
import FloatingTabBar from '../components/FloatingTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();
const SuperAdminTab = createBottomTabNavigator<SuperAdminTabParamList>();
const StudentTab = createBottomTabNavigator<StudentTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MainTabNavigator() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    return (
        <Tab.Navigator
            tabBar={(props) => <FloatingTabBar {...props} />}
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarLabel: 'الرئيسية' }}
            />
            <Tab.Screen
                name="LibraryChat"
                component={LibraryChatScreen}
                options={{ tabBarLabel: 'نقاش المكتبة', tabBarStyle: { display: 'none' } }}
            />
            <Tab.Screen
                name="Library"
                component={CatalogHubScreen}
                options={{ tabBarLabel: 'المكتبة' }}
            />
            <Tab.Screen
                name="Security"
                component={StudentsScreen}
                options={{ tabBarLabel: 'الطلاب' }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarLabel: 'الإعدادات' }}
            />
            {/* Hidden Management Screens */}
            <Tab.Screen name="Books" component={BooksScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
            <Tab.Screen name="Fields" component={FieldsScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
            <Tab.Screen name="BorrowReturn" component={BorrowReturnScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
            <Tab.Screen name="PublicCatalog" component={PublicCatalogScreen} options={{ tabBarItemStyle: { display: 'none' } }} />
        </Tab.Navigator>
    );
}

function SuperAdminTabNavigator() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    return (
        <SuperAdminTab.Navigator
            tabBar={(props) => <FloatingTabBar {...props} />}
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
            }}
        >
            <SuperAdminTab.Screen
                name="Home"
                component={SuperAdminDashboard}
                options={{ tabBarLabel: 'الرئيسية' }}
            />
            <SuperAdminTab.Screen
                name="PublicCatalog"
                component={PublicCatalogScreen}
                options={{ tabBarLabel: 'الكتب' }}
            />
            <SuperAdminTab.Screen
                name="LibraryChat"
                component={LibraryChatScreen}
                options={{ tabBarLabel: 'نقاش المكتبة', tabBarStyle: { display: 'none' } }}
            />
            <SuperAdminTab.Screen
                name="Security"
                component={AdminManagementScreen}
                options={{ tabBarLabel: 'المسؤولين' }}
            />
            <SuperAdminTab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarLabel: 'الإعدادات' }}
            />
        </SuperAdminTab.Navigator>
    );
}

function StudentTabNavigator() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    return (
        <StudentTab.Navigator
            tabBar={(props) => <FloatingTabBar {...props} />}
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
            }}
        >
            <StudentTab.Screen
                name="Home"
                component={StudentHomeScreen}
                options={{ tabBarLabel: 'الرئيسية' }}
            />
            <StudentTab.Screen
                name="LibraryChat"
                component={LibraryChatScreen}
                options={{ tabBarLabel: 'نقاش المكتبة', tabBarStyle: { display: 'none' } }}
            />
            <StudentTab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ tabBarLabel: 'الإعدادات' }}
            />

            <StudentTab.Screen
                name="PublicCatalog"
                component={PublicCatalogScreen}
                options={{ tabBarItemStyle: { display: 'none' } }}
            />
        </StudentTab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useAuth();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: activeColors.background }}>
                <ActivityIndicator size="large" color={activeColors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right',
            }}
        >
            {user === null ? (
                // Guest / Unauthenticated Stack
                <>
                    <Stack.Screen name="PublicCatalog" component={PublicCatalogScreen} />
                    <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="Notifications" component={NotificationScreen} />
                </>
            ) : user.status !== 'active' ? (
                // Pending / Rejected / Inactive Stack
                <Stack.Screen name="PendingAccount" component={AccountStatusScreen} />
            ) : user.role === 'super_admin' ? (
                // Super Admin Stack
                <>
                    <Stack.Screen name="SuperAdminTabs" component={SuperAdminTabNavigator} />
                    <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} />
                    <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen} />
                    <Stack.Screen name="AdminManagement" component={AdminManagementScreen} />
                    <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
                    <Stack.Screen name="BookChat" component={BookChatScreen} />
                    <Stack.Screen name="AddStudent" component={AddStudentScreen} />
                    <Stack.Screen name="Notifications" component={NotificationScreen} />
                </>
            ) : user.role === 'student' ? (
                // Student Stack
                <>
                    <Stack.Screen name="StudentTabs" component={StudentTabNavigator} />
                    <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
                    <Stack.Screen name="BookChat" component={BookChatScreen} />
                    <Stack.Screen name="AddStudent" component={AddStudentScreen} />
                    <Stack.Screen name="Notifications" component={NotificationScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                    <Stack.Screen name="AddBook" component={AddBookScreen} />
                    <Stack.Screen name="AddStudent" component={AddStudentScreen} />
                    <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
                    <Stack.Screen name="BookChat" component={BookChatScreen} />
                    <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} />
                    <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen} />
                    <Stack.Screen name="Notifications" component={NotificationScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}
