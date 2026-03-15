import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowRight, Check, User, Phone, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { StudentsAPI } from '../services/database';
import { RootStackParamList } from '../navigation/types';

export default function AddStudentScreen() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'AddStudent'>>();
    const { studentId } = route.params || {};
    const isEditing = !!studentId;

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Custom style overrides for this specific screen accent (teal)
    const ACCENT = isDarkMode ? activeColors.border : COLORS.primaryLight;
    const ACCENT_DARK = activeColors.primary;

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('فشل', 'نحتاج لإذن الوصول للكاميرا لالتقاط الصورة');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3,
            base64: true,
        });

        if (!result.canceled) {
            setProfilePicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3,
            base64: true,
        });

        if (!result.canceled) {
            setProfilePicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    useEffect(() => {
        if (studentId) {
            loadStudentData();
        }
    }, [studentId]);

    const loadStudentData = async () => {
        if (!studentId) return;
        try {
            const students = await StudentsAPI.getAll();
            const student = students.find(s => s.id === studentId);
            if (student) {
                setFirstName(student.firstName);
                setLastName(student.lastName);
                setPhone(student.phone);
                setBirthdate(student.birthdate);
                setProfilePicture(student.profilePicture || null);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل تحميل بيانات الطالب');
        }
    };

    const handleSave = async () => {
        if (!firstName || !lastName || !phone) {
            Alert.alert('خطأ', 'الرجاء تعبئة جميع الحقول المطلوبة (الاسم الأول، العائلة، ورقم الهاتف)');
            return;
        }

        try {
            setIsSubmitting(true);
            const studentPayload = {
                firstName,
                lastName,
                phone,
                birthdate,
                profilePicture,
                borrowedBookId: null,
            };

            // Timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            );

            // Race the save operation
            if (isEditing && studentId) {
                await Promise.race([
                    StudentsAPI.update(studentId, { ...studentPayload, profilePicture: profilePicture || undefined }),
                    timeoutPromise
                ]);
            } else {
                await Promise.race([
                    StudentsAPI.create({ ...studentPayload, profilePicture: profilePicture || undefined }),
                    timeoutPromise
                ]);
            }

            Alert.alert('نجاح', isEditing ? 'تم تحديث البيانات بنجاح' : 'تم إضافة الطالب بنجاح', [
                { text: 'حسناً', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error(error);
            if (error.message === 'TIMEOUT') {
                Alert.alert('خطأ في الاتصال', 'فشل حفظ بيانات الطالب بسبب بطء الاتصال. يرجى المحاولة مرة أخرى.');
            } else {
                Alert.alert('خطأ', 'حدث خطأ أثناء حفظ بيانات الطالب');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: activeColors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <View style={[styles.header, { paddingTop: insets.top + SPACING.s }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowRight color={activeColors.text} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isDarkMode ? activeColors.primary : activeColors.text }]}>مكتبة عشيرة آل خلفي</Text>
                    <View style={{ width: 24 }} /> {/* Spacer */}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.pageTitle, { color: activeColors.text }]}>{isEditing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</Text>

                {/* Profile Picture Section */}
                <View style={styles.profilePickerSection}>
                    <TouchableOpacity onPress={pickImage} style={[styles.profilePreview, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                        {profilePicture ? (
                            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profilePlaceholder}>
                                <User color={activeColors.textTertiary} size={40} />
                            </View>
                        )}
                        <View style={styles.cameraIconContainer}>
                            <TouchableOpacity onPress={takePhoto} style={[styles.cameraIconBadge, { backgroundColor: activeColors.primary, borderColor: activeColors.surface }]}>
                                <User color={activeColors.surface} size={14} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.pickerButtons}>
                        <TouchableOpacity style={[styles.miniPickerBtn, { backgroundColor: activeColors.surface, borderColor: ACCENT }]} onPress={takePhoto}>
                            <Text style={[styles.miniPickerText, { color: ACCENT_DARK }]}>التقاط صورة</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.miniPickerBtn, { backgroundColor: activeColors.surface, borderColor: ACCENT }]} onPress={pickImage}>
                            <Text style={[styles.miniPickerText, { color: ACCENT_DARK }]}>من المعرض</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Form Fields */}
                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="الاسم الأول"
                            placeholderTextColor={activeColors.textTertiary}
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                        <User color={ACCENT_DARK} size={20} style={styles.iconStyle} />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="الاسم الأخير"
                            placeholderTextColor={activeColors.textTertiary}
                            value={lastName}
                            onChangeText={setLastName}
                        />
                        <User color={ACCENT_DARK} size={20} style={styles.iconStyle} />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="رقم الهاتف (أو هاتف ولي الأمر)"
                            keyboardType="phone-pad"
                            placeholderTextColor={activeColors.textTertiary}
                            value={phone}
                            onChangeText={setPhone}
                        />
                        <Phone color={ACCENT_DARK} size={20} style={styles.iconStyle} />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, { borderColor: ACCENT, backgroundColor: activeColors.surface }]}>
                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="تاريخ الميلاد"
                            placeholderTextColor={activeColors.textTertiary}
                            value={birthdate}
                            onChangeText={setBirthdate}
                        />
                        <Calendar color={ACCENT_DARK} size={20} style={styles.iconStyle} />
                    </View>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && { opacity: 0.7 }, { backgroundColor: activeColors.primary }]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={activeColors.surface} />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Check color={activeColors.surface} size={20} style={{ marginRight: 8 }} />
                            <Text style={[styles.submitText, { color: activeColors.surface }]}>حفظ بيانات الطالب</Text>
                        </View>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
    },
    topBackground: {
        backgroundColor: COLORS.primaryLight,
        paddingBottom: 0,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.primary,
    },
    pageTitle: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        textAlign: 'center',
        marginVertical: SPACING.l,
    },
    scrollContent: {
        paddingHorizontal: SPACING.m,
        paddingBottom: 40,
    },
    formGroup: {
        marginBottom: SPACING.m,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderRadius: RADIUS.round,
        paddingHorizontal: SPACING.l,
        height: 52,
    },
    input: {
        flex: 1,
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'right',
    },
    iconStyle: {
        marginLeft: SPACING.s,
    },
    submitButton: {
        backgroundColor: COLORS.primaryDark,
        paddingVertical: 16,
        borderRadius: RADIUS.xl,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    submitText: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.surface,
    },
    // Profile Picture Styles
    profilePickerSection: {
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    profilePreview: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profilePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
    cameraIconBadge: {
        backgroundColor: COLORS.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    pickerButtons: {
        flexDirection: 'row',
        marginTop: SPACING.m,
        gap: SPACING.m,
    },
    miniPickerBtn: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.m,
        paddingVertical: 6,
        borderRadius: RADIUS.round,
        borderWidth: 1,
        borderColor: COLORS.primaryLight,
    },
    miniPickerText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.primary,
    }
});
