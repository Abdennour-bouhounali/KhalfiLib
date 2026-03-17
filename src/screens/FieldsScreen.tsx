import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Settings, Plus, Edit, Trash2, X } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { FieldsAPI, Field } from '../services/database';

export default function FieldsScreen() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const navigation = useNavigation();
    const [fields, setFields] = useState<Field[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        try {
            setLoading(true);
            const data = await FieldsAPI.getAll();
            setFields(data);
        } catch (error) {
            console.error(error);
            Alert.alert('خطأ', 'فشل تحميل المجالات');
        } finally {
            setLoading(false);
        }
    };

    const filteredFields = fields.filter(f =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setEditingId(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (field: Field) => {
        setTitle(field.title);
        setDescription(field.description);
        setEditingId(field.id || null);
        setModalVisible(true);
    };

    const handleSaveField = async () => {
        if (!title.trim()) {
            Alert.alert('خطأ', 'يرجى إدخال اسم المجال');
            return;
        }

        try {
            // Diagnostic: Check if we can even reach Google
            console.log('[Firebase] Running network reachability test...');
            try {
                const response = await fetch('https://www.google.com', { method: 'HEAD' });
                console.log(`[Firebase] Network test result: ${response.status}`);
            } catch (e: any) {
                console.warn('[Firebase] Network test FAILED. Device may not have internet or is blocked:', e.message);
            }

            setIsSaving(true);

            // Create a timeout promise to prevent infinite waiting
            // Increased to 30s as initial connection after DB creation can be slow
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 30000)
            );

            // Wrap the database call
            const dbOperation = editingId
                ? FieldsAPI.update(editingId, { title, description })
                : FieldsAPI.create({ title, description });

            // Race the operation against the timeout
            await Promise.race([dbOperation, timeoutPromise]);

            setModalVisible(false);
            loadFields();
            Alert.alert('نجاح', 'تم حفظ المجال بنجاح');
        } catch (error: any) {
            console.error('[FieldsScreen] Detailed Save error:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });

            let errorMessage = 'حدث خطأ أثناء حفظ المجال';

            if (error.message === 'TIMEOUT') {
                errorMessage = 'فشل الاتصال بـ Firebase (انتهت المهلة). قد يكون بسبب ضعف الإنترنت أو حجب الاتصال.';
            } else if (error.code === 'permission-denied') {
                errorMessage = 'تم رفض الوصول (Permission Denied). يرجى التأكد من قواعد الحماية في Firebase Console.';
            } else if (error.code === 'unavailable') {
                errorMessage = 'خدمة Firebase غير متوفرة حالياً. تأكد من اتصال الإنترنت.';
            } else {
                errorMessage = `خطأ: ${error.code || error.message}`;
            }

            Alert.alert('خطأ', errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string, title: string) => {
        Alert.alert(
            "تأكيد الحذف",
            `هل أنت متأكد من حذف قسم "${title}"؟`,
            [
                { text: "إلغاء", style: "cancel" },
                {
                    text: "حذف",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await FieldsAPI.delete(id);
                            loadFields();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('خطأ', 'فشل حذف المجال');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <Header
                    showSearch={false}
                    showNotification={false}
                    showSearchInput={true}
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="ابحث عن تصنيف..."
                    showBack={true}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={activeColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredFields}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <Card style={styles.card}>
                            <View style={styles.cardRow}>
                                <View style={styles.actions}>
                                    <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(item)}>
                                        <Edit color={activeColors.primary} size={20} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item.id!, item.title)} style={styles.iconBtn}>
                                        <Trash2 color={activeColors.danger} size={20} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.info}>
                                    <Text style={[styles.title, { color: activeColors.text }]}>{item.title}</Text>
                                    {item.description ? <Text style={[styles.desc, { color: activeColors.textSecondary }]}>{item.description}</Text> : null}
                                </View>
                            </View>
                        </Card>
                    )}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.emptyText, { color: activeColors.textSecondary }]}>لا يوجد مجالات حالياً</Text>
                        </View>
                    }
                />
            )}

            {/* FAB - Circular plus icon as requested */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: activeColors.primary }]}
                activeOpacity={0.9}
                onPress={openAddModal}
            >
                <Plus color={activeColors.surface} size={30} />
            </TouchableOpacity>

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalView, { backgroundColor: activeColors.surface }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color={activeColors.text} size={24} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: activeColors.text }]}>
                                {editingId ? 'تعديل مجال' : 'إضافة مجال جديد'}
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>اسم المجال</Text>
                            <TextInput
                                style={[styles.input, { borderColor: activeColors.border, color: activeColors.text, backgroundColor: isDarkMode ? activeColors.background : '#FAFAFA' }]}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="مثلاً: التاريخ الإسلامي"
                                placeholderTextColor={activeColors.textTertiary}
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: activeColors.textSecondary }]}>الوصف</Text>
                            <TextInput
                                style={[styles.input, { height: 80, borderColor: activeColors.border, color: activeColors.text, backgroundColor: isDarkMode ? activeColors.background : '#FAFAFA' }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="وصف موجز للمجال..."
                                placeholderTextColor={activeColors.textTertiary}
                                multiline
                                textAlign="right"
                            />
                        </View>

                        <Button
                            title={isSaving ? 'جاري الحفظ...' : 'حفظ'}
                            onPress={handleSaveField}
                            disabled={isSaving}
                            loading={isSaving}
                            style={styles.saveBtn}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    topBackground: {
        backgroundColor: COLORS.primaryLight,
        paddingBottom: 0,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    listContent: {
        padding: SPACING.m,
        paddingBottom: 100,
    },
    card: {
        padding: SPACING.m,
        marginBottom: SPACING.s,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        alignItems: 'flex-start', // RTL handled by forceRtl
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.text,
        textAlign: 'right',
    },
    desc: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'right',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    iconBtn: {
        padding: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontFamily: FONTS.medium,
        color: COLORS.textSecondary,
    },
    fab: {
        position: 'absolute',
        bottom: 110, // Above bottom nav, moved slightly higher as requested
        right: SPACING.m,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalView: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    modalTitle: {
        fontFamily: FONTS.bold,
        fontSize: 20,
        color: COLORS.text,
    },
    inputGroup: {
        marginBottom: SPACING.m,
    },
    label: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: SPACING.s,
        textAlign: 'right',
    },
    input: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: RADIUS.m,
        padding: SPACING.m,
        fontFamily: FONTS.regular,
        fontSize: 16,
        color: COLORS.text,
        backgroundColor: '#FAFAFA',
    },
    saveBtn: {
        marginTop: SPACING.l,
    }
});
