import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Phone, Lock } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/AuthService';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const { login } = useAuth();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('تنبيه', 'يرجى إدخال رقم الهاتف وكلمة المرور');
            return;
        }

        setLoading(true);
        try {
            const user = await AuthService.login(phone, password);
            // Let the AuthContext update. AppNavigator will automatically 
            // switch to the appropriate stack based on user status (active/pending).
            await login(user);
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: activeColors.text }]}>تسجيل الدخول</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            placeholder="رقم الهاتف"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            icon={<Phone size={20} color={activeColors.primary} />}
                        />

                        <Input
                            placeholder="كلمة المرور"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            icon={<Lock size={20} color={activeColors.primary} />}
                        />

                        <Button
                            title="تسجيل الدخول"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.loginButton}
                        />

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            style={styles.registerLink}
                        >
                            <Text style={[styles.registerText, { color: activeColors.textSecondary }]}>
                                ليس لديك حساب؟ <Text style={{ color: activeColors.primary, fontFamily: FONTS.bold }}>إنشاء حساب</Text>
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('PublicCatalog')}
                            style={styles.guestLink}
                        >
                            <Text style={[styles.guestText, { color: activeColors.textTertiary }]}>
                                الدخول كزائر
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 32,
        marginBottom: SPACING.s,
    },
    form: {
        width: '100%',
    },
    loginButton: {
        marginTop: SPACING.m,
        height: 56,
    },
    registerLink: {
        marginTop: SPACING.xl,
        alignItems: 'center',
    },
    registerText: {
        fontFamily: FONTS.regular,
        fontSize: 16,
    },
    guestLink: {
        marginTop: SPACING.l,
        alignItems: 'center',
    },
    guestText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
