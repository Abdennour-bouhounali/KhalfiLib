import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';
import { BooksAPI, BorrowingAPI, UsersAPI } from '../services/database';
import { useAuth } from '../context/AuthContext';

export default function BorrowReturnScreen() {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const { user: currentUser } = useAuth();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [mode, setMode] = useState<'borrow' | 'return'>('borrow');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getCameraPermissions();
    }, []);

    const processBorrowScan = async (barcodeData: string) => {
        try {
            setIsProcessing(true);
            const book = await BooksAPI.getByBarcode(barcodeData);

            if (!book) {
                Alert.alert('غير موجود', 'لم يتم العثور على كتاب بهذا الرمز (QR)');
                return;
            }
            if (book.copiesAvailable <= 0) {
                Alert.alert('غير متاح', 'جميع النسخ من هذا الكتاب مستعارة حالياً');
                return;
            }

            // Fetch all active users (students/admins) who can borrow
            const allUsers = await UsersAPI.getAll();
            const activeUsers = allUsers.filter(u => u.status === 'active');

            if (activeUsers.length === 0) {
                Alert.alert('خطأ', 'يرجى إضافة مستخدم أولاً لإجراء عملية الاستعارة');
                return;
            }

            // In a real app, show a picker. For now, we use a placeholder select or the current user if they are a student
            const selectedUser = currentUser?.role === 'student' ? currentUser : activeUsers[0];

            Alert.alert(
                'تأكيد الاستعارة',
                `هل تريد استعارة "${book.title}" للمستخدم "${selectedUser.firstName || selectedUser.name}"؟`,
                [
                    { text: 'إلغاء', style: 'cancel' },
                    {
                        text: 'تأكيد',
                        onPress: async () => {
                            try {
                                setIsProcessing(true);
                                await BorrowingAPI.borrowBook(selectedUser.id!, book.id!, 14); // 14 days
                                Alert.alert('نجاح', 'تم تسجيل استعارة الكتاب بنجاح');
                            } catch (e) {
                                console.error(e);
                                Alert.alert('خطأ', 'فشلت عملية الاستعارة');
                            } finally {
                                setIsProcessing(false);
                            }
                        }
                    }
                ]
            );
        } catch (e) {
            console.error(e);
            Alert.alert('خطأ', 'حدث خطأ أثناء الاتصال بقاعدة البيانات');
        } finally {
            setIsProcessing(false);
        }
    };

    const processReturnScan = async (barcodeData: string) => {
        try {
            setIsProcessing(true);
            const book = await BooksAPI.getByBarcode(barcodeData);

            if (!book) {
                Alert.alert('غير موجود', 'لم يتم العثور على كتاب بهذا الرمز (QR)');
                return;
            }

            // Find the active borrow record for this book (using userId)
            const recordsRef = ref(db, 'borrowRecords');
            const snapshot = await get(recordsRef);
            let activeRecord: any = null;
            let userId: string = '';

            if (snapshot.exists()) {
                const records = snapshot.val();
                activeRecord = Object.keys(records).find(key =>
                    records[key].bookId === book.id && !records[key].returnDate
                );
                if (activeRecord) {
                    userId = records[activeRecord].userId;
                }
            }

            if (!activeRecord) {
                Alert.alert('خطأ', 'هذا الكتاب ليس مسجلاً ككتاب مستعار حالياً');
                return;
            }

            Alert.alert(
                'تأكيد الإرجاع',
                `هل تريد إرجاع كتاب "${book.title}" للمكتبة؟`,
                [
                    { text: 'إلغاء', style: 'cancel' },
                    {
                        text: 'تأكيد الإرجاع',
                        onPress: async () => {
                            try {
                                setIsProcessing(true);
                                // Pass current user ID as the one processing the return
                                await BorrowingAPI.returnBook(userId, book.id!, activeRecord, currentUser?.id);
                                Alert.alert('نجاح', 'تم تسجيل إرجاع الكتاب واستلامه. شكراً!');
                            } catch (e) {
                                console.error(e);
                                Alert.alert('خطأ', 'فشل سجل إرجاع الكتاب');
                            } finally {
                                setIsProcessing(false);
                            }
                        }
                    }
                ]
            );
        } catch (e) {
            console.error(e);
            Alert.alert('خطأ', 'حدث خطأ أثناء الاتصال بقاعدة البيانات');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);

        if (mode === 'borrow') {
            processBorrowScan(data);
        } else {
            processReturnScan(data);
        }

        setTimeout(() => {
            setScanned(false);
        }, 3000);
    };

    if (hasPermission === null) {
        return <View style={styles.container}><Text style={styles.centerText}>جاري طلب صلاحيات الكاميرا...</Text></View>;
    }
    if (hasPermission === false) {
        return <View style={styles.container}><Text style={styles.centerText}>لا يوجد وصول للكاميرا</Text></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <Header title="الاستعارة والإرجاع" showSearch={false} showNotification={false} showBack={true} />
            </View>

            {/* Mode Selector */}
            <View style={[styles.tabContainer, { backgroundColor: activeColors.surface }]}>
                <TouchableOpacity
                    style={[styles.tab, mode === 'borrow' ? [styles.activeTab, { backgroundColor: activeColors.primary }] : {}]}
                    onPress={() => setMode('borrow')}
                >
                    <Text style={[styles.tabText, { color: activeColors.textSecondary }, mode === 'borrow' ? styles.activeTabText : {}]}>استعارة کتاب</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, mode === 'return' ? [styles.activeTab, { backgroundColor: activeColors.primary }] : {}]}
                    onPress={() => setMode('return')}
                >
                    <Text style={[styles.tabText, { color: activeColors.textSecondary }, mode === 'return' ? styles.activeTabText : {}]}>إرجاع کتاب</Text>
                </TouchableOpacity>
            </View>

            {/* Camera View */}
            <View style={[styles.cameraWrapper, { backgroundColor: isDarkMode ? activeColors.surface : '#000' }]}>
                {isProcessing ? (
                    <View style={[styles.processingOverlay, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.text }]}>
                        <ActivityIndicator size="large" color={activeColors.primary} />
                        <Text style={styles.overlayText}>جاري معالجة البيانات...</Text>
                    </View>
                ) : (
                    <CameraView
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
                        }}
                        style={styles.camera}
                    />
                )}
                {!isProcessing && (
                    <View style={styles.overlay}>
                        <View style={[styles.scanBox, { borderColor: activeColors.primary }]} />
                        <Text style={styles.overlayText}>
                            {mode === 'borrow' ? 'قم بمسح رمز QR الخاص بالكتاب لاستعارته' : 'قم بمسح رمز QR الخاص بالكتاب لإرجاعه'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBackground: {
        backgroundColor: COLORS.primaryLight,
        paddingBottom: 0,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    centerText: {
        fontFamily: FONTS.medium,
        textAlign: 'center',
        marginTop: 100,
        fontSize: 16,
    },
    tabContainer: {
        flexDirection: 'row-reverse',
        marginHorizontal: SPACING.m,
        marginTop: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.round,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.s,
        alignItems: 'center',
        borderRadius: RADIUS.round,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    activeTabText: {
        color: COLORS.surface,
    },
    cameraWrapper: {
        flex: 1,
        marginVertical: SPACING.l,
        marginHorizontal: SPACING.m,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        backgroundColor: '#000',
        marginBottom: 100, // accommodate bottom tab
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    scanBox: {
        width: 250,
        height: 150,
        borderWidth: 2,
        borderColor: COLORS.primaryLight,
        borderRadius: RADIUS.m,
        backgroundColor: 'transparent',
    },
    overlayText: {
        fontFamily: FONTS.bold,
        color: COLORS.surface,
        fontSize: 16,
        marginTop: SPACING.l,
        textAlign: 'center',
    },
    processingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.text, // dark backdrop
    }
});
