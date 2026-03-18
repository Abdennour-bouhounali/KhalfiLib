import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Bell, Shield, Users, Info, AlertTriangle, Send, ChevronLeft, Eye } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import Card from '../components/Card';
import { NotificationsAPI, AppNotification } from '../services/database';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

type Target = 'all' | 'admins' | 'students';
type NotifType = 'info' | 'alert' | 'update';

export default function SendNotificationScreen() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const { user } = useAuth();
    const navigation = useNavigation();

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState<Target>('all');
    const [type, setType] = useState<NotifType>('info');
    const [link, setLink] = useState('');
    const [sending, setSending] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('خطأ', 'يرجى إدخال العنوان والرسالة');
            return;
        }

        try {
            setSending(true);
            const notification: Omit<AppNotification, 'id'> = {
                title: title.trim(),
                message: message.trim(),
                type,
                target,
                link: link.trim() || undefined,
                createdAt: new Date().toISOString(),
                createdBy: user?.name || 'Super Admin',
            };

            await NotificationsAPI.create(notification);

            Alert.alert('نجاح', 'تم إرسال الإشعار بنجاح إلى الجميع المستهدفين', [
                { text: 'حسناً', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Failed to send notification:', error);
            Alert.alert('خطأ', 'فشل إرسال الإشعار. يرجى المحاولة مرة أخرى.');
        } finally {
            setSending(false);
        }
    };

    const renderTargetBtn = (id: Target, label: string, Icon: any) => (
        <TouchableOpacity
            style={[
                styles.targetBtn,
                { borderColor: activeColors.border },
                target === id && { backgroundColor: activeColors.primary, borderColor: activeColors.primary }
            ]}
            onPress={() => setTarget(id)}
        >
            <Icon size={20} color={target === id ? '#FFF' : activeColors.textSecondary} />
            <Text style={[styles.targetLabel, { color: target === id ? '#FFF' : activeColors.textSecondary }]}>{label}</Text>
        </TouchableOpacity>
    );

    const renderTypeBtn = (id: NotifType, label: string, color: string) => (
        <TouchableOpacity
            style={[
                styles.typeBtn,
                { borderColor: activeColors.border },
                type === id && { backgroundColor: color + '20', borderColor: color }
            ]}
            onPress={() => setType(id)}
        >
            <Text style={[styles.typeLabel, { color: type === id ? color : activeColors.textSecondary }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: activeColors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Header
                title="إرسال إشعار"
                showBack
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: activeColors.textSecondary }]}>الجمهور المستهدف</Text>
                    <View style={styles.targetRow}>
                        {renderTargetBtn('all', 'الجميع', Bell)}
                        {renderTargetBtn('admins', 'المسؤولين', Shield)}
                        {renderTargetBtn('students', 'الطلاب', Users)}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: activeColors.textSecondary }]}>نوع الإشعار</Text>
                    <View style={styles.targetRow}>
                        {renderTypeBtn('info', 'معلومة', '#4CAF50')}
                        {renderTypeBtn('alert', 'تحذير', '#F44336')}
                        {renderTypeBtn('update', 'تحديث', '#2196F3')}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: activeColors.textSecondary }]}>محتوى الإشعار</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: activeColors.surface, color: activeColors.text, borderColor: activeColors.border }]}
                        placeholder="عنوان الإشعار..."
                        placeholderTextColor={activeColors.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                        textAlign="right"
                    />
                    <TextInput
                        style={[styles.textArea, { backgroundColor: activeColors.surface, color: activeColors.text, borderColor: activeColors.border }]}
                        placeholder="اكتب نص الإشعار هنا..."
                        placeholderTextColor={activeColors.textTertiary}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={4}
                        textAlign="right"
                    />
                    <TextInput
                        style={[styles.input, { backgroundColor: activeColors.surface, color: activeColors.text, borderColor: activeColors.border }]}
                        placeholder="رابط إضافي (اختياري)..."
                        placeholderTextColor={activeColors.textTertiary}
                        value={link}
                        onChangeText={setLink}
                        textAlign="right"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.previewToggle, { borderColor: activeColors.primary }]}
                    onPress={() => setShowPreview(!showPreview)}
                >
                    <Eye size={18} color={activeColors.primary} />
                    <Text style={[styles.previewToggleText, { color: activeColors.primary }]}>
                        {showPreview ? 'إخفاء المعاينة' : 'عرض المعاينة'}
                    </Text>
                </TouchableOpacity>

                {showPreview && (
                    <View style={styles.previewContainer}>
                        <Text style={[styles.sectionTitle, { color: activeColors.textSecondary }]}>معاينة</Text>
                        <Card style={[styles.previewCard, { backgroundColor: activeColors.surface }]}>
                            <View style={styles.previewHeader}>
                                <View style={[styles.iconBox, { backgroundColor: type === 'info' ? '#E8F5E9' : type === 'alert' ? '#FFEBEB' : '#E3F2FD' }]}>
                                    {type === 'info' ? <Info color="#4CAF50" size={24} /> : type === 'alert' ? <AlertTriangle color="#F44336" size={24} /> : <Send color="#2196F3" size={24} />}
                                </View>
                                <View style={styles.previewHeaderText}>
                                    <Text style={[styles.previewTitle, { color: activeColors.text }]}>{title || 'عنوان الإشعار'}</Text>
                                    <Text style={[styles.previewMeta, { color: activeColors.textTertiary }]}>الآن • {target === 'all' ? 'للجميع' : target === 'admins' ? 'للمسؤولين' : 'للطلاب'}</Text>
                                </View>
                            </View>
                            <Text style={[styles.previewMessage, { color: activeColors.textSecondary }]}>{message || 'هنا سيظهر نص الإشعار الذي ستقوم بكتابته...'}</Text>
                        </Card>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: activeColors.primary }]}
                    onPress={handleSend}
                    disabled={sending}
                >
                    {sending ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Send size={20} color="#FFF" style={{ transform: [{ rotate: '180deg' }] }} />
                            <Text style={styles.sendBtnText}>إرسال الإشعار</Text>
                        </>
                    )}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.l,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 14,
        marginBottom: SPACING.m,
        textAlign: 'right',
    },
    targetRow: {
        flexDirection: 'row-reverse',
        gap: SPACING.s,
    },
    targetBtn: {
        flex: 1,
        height: 80,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    targetLabel: {
        fontFamily: FONTS.medium,
        fontSize: 13,
    },
    typeBtn: {
        flex: 1,
        height: 44,
        borderRadius: RADIUS.s,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeLabel: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    input: {
        height: 52,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        paddingHorizontal: SPACING.m,
        fontFamily: FONTS.medium,
        fontSize: 15,
        marginBottom: SPACING.m,
    },
    textArea: {
        height: 120,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        paddingHorizontal: SPACING.m,
        paddingTop: SPACING.m,
        fontFamily: FONTS.regular,
        fontSize: 15,
        marginBottom: SPACING.m,
    },
    previewToggle: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        paddingVertical: SPACING.m,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: RADIUS.m,
        marginBottom: SPACING.xl,
    },
    previewToggleText: {
        fontFamily: FONTS.bold,
        fontSize: 14,
    },
    previewContainer: {
        marginBottom: SPACING.xl,
    },
    previewCard: {
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    previewHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.m,
    },
    previewHeaderText: {
        flex: 1,
        alignItems: 'flex-end',
    },
    previewTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        marginBottom: 2,
    },
    previewMeta: {
        fontFamily: FONTS.regular,
        fontSize: 12,
    },
    previewMessage: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'right',
    },
    sendBtn: {
        height: 56,
        borderRadius: RADIUS.l,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
    },
    sendBtnText: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: '#FFF',
    },
});
