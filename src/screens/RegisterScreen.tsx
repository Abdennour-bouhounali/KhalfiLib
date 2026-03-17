import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Phone, Lock, User as UserIcon, Calendar, ArrowRight } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/AuthService';
import { UserRole } from '../services/database';

export default function RegisterScreen() {
    const navigation = useNavigation<any>();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    const [role, setRole] = useState<UserRole>('student');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!firstName || !lastName || !phone || !password) {
            Alert.alert('تنبيه', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setLoading(true);
        try {
            const fullName = `${firstName} ${lastName}`;
            await AuthService.register(fullName, phone, password, role, { firstName, lastName });
            Alert.alert(
                'تم إرسال الطلب',
                'تم إنشاء حسابك بنجاح وهو الآن قيد المراجعة من قبل الإدارة.',
                [{ text: 'حسنًا', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل إنشاء الحساب');
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
                <View style={[styles.topBar, { backgroundColor: activeColors.background }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowRight size={24} color={activeColors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: activeColors.text }]}>
                            {role === 'student' ? 'إنشاء حساب طالب' : 'طلب حساب مسؤول'}
                        </Text>
                    </View>

                    {/* Role Selector */}
                    <View style={[styles.roleSelector, { backgroundColor: activeColors.surface }]}>
                        <TouchableOpacity
                            style={[
                                styles.roleOption,
                                role === 'student' && { backgroundColor: activeColors.primary }
                            ]}
                            onPress={() => setRole('student')}
                        >
                            <Text style={[
                                styles.roleText,
                                { color: role === 'student' ? activeColors.surface : activeColors.textSecondary }
                            ]}>طالب</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.roleOption,
                                role === 'admin' && { backgroundColor: activeColors.primary }
                            ]}
                            onPress={() => setRole('admin')}
                        >
                            <Text style={[
                                styles.roleText,
                                { color: role === 'admin' ? activeColors.surface : activeColors.textSecondary }
                            ]}>مسؤول</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Input
                            placeholder="الاسم"
                            value={firstName}
                            onChangeText={setFirstName}
                            icon={<UserIcon size={20} color={activeColors.primary} />}
                        />

                        <Input
                            placeholder="اللقب "
                            value={lastName}
                            onChangeText={setLastName}
                            icon={<UserIcon size={20} color={activeColors.primary} />}
                        />

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

                        {role === 'student' && (
                            <Text style={[styles.hint, { color: activeColors.textTertiary }]}>سيتم تفعيل الحساب بعد موافقة المسؤول</Text>
                        )}

                        {role === 'admin' && (
                            <Text style={[styles.hint, { color: activeColors.textTertiary }]}>ستتم مراجعة الطلب من قبل المشرف العام</Text>
                        )}

                        <Button
                            title="إرسال الطلب"
                            onPress={handleRegister}
                            loading={loading}
                            style={styles.registerButton}
                        />

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            style={styles.loginLink}
                        >
                            <Text style={[styles.loginText, { color: activeColors.textSecondary }]}>لديك حساب بالفعل؟ <Text style={{ color: activeColors.primary, fontFamily: FONTS.bold }}>تسجيل الدخول</Text></Text>
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
    topBar: {
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: SPACING.m,
    },
    backButton: {
        padding: SPACING.s,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.xl,
        paddingTop: 0,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 28,
        textAlign: 'center',
    },
    roleSelector: {
        flexDirection: 'row',
        borderRadius: RADIUS.m,
        padding: 4,
        marginBottom: SPACING.xl,
    },
    roleOption: {
        flex: 1,
        paddingVertical: SPACING.s,
        alignItems: 'center',
        borderRadius: RADIUS.s,
    },
    roleText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
    },
    form: {
        width: '100%',
    },
    hint: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: SPACING.m,
    },
    registerButton: {
        marginTop: SPACING.s,
        height: 56,
    },
    loginLink: {
        marginTop: SPACING.xl,
        alignItems: 'center',
    },
    loginText: {
        fontFamily: FONTS.regular,
        fontSize: 16,
    },
});
