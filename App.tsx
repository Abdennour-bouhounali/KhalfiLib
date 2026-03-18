import React, { useEffect } from 'react';
import { I18nManager, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold } from '@expo-google-fonts/tajawal';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SeedService } from './src/services/SeedService';
import { CacheSyncService } from './src/services/CacheSyncService';
import NotificationHandler from './src/components/NotificationHandler';
import { useNotifications } from './src/hooks/useNotifications';

function AppContent() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    // Initialize real-time cache sync
    const stopSync = CacheSyncService.startSync();
    return () => stopSync();
  }, []);

  useEffect(() => {
    if (user?.id) {
      const stopUserSync = CacheSyncService.syncUserMetadata(user.id);
      return () => stopUserSync();
    }
  }, [user?.id]);

  useNotifications();

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <NotificationHandler />
    </>
  );
}

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
      Updates.reloadAsync();
    }
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      SeedService.seedSuperAdmin();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
