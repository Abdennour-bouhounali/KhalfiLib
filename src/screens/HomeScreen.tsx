import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Book, Users, BookOpen, AlertTriangle, FileText, QrCode, Download, LayoutDashboard } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import Header from '../components/Header';
import Card from '../components/Card';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { BooksAPI, StudentsAPI, BorrowingAPI } from '../services/database';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const [stats, setStats] = useState({
        books: 0,
        students: 0,
        borrowed: 0,
        overdue: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = async () => {
        try {
            const [books, students, borrowed, overdue] = await Promise.all([
                BooksAPI.getAll(),
                StudentsAPI.getAll(),
                BorrowingAPI.getActiveCount(),
                BorrowingAPI.getOverdueCount()
            ]);

            setStats({
                books: books.length,
                students: students.length,
                borrowed,
                overdue
            });
        } catch (error) {
            console.error('[HomeScreen] Failed to load stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            loadStats();
        }
    }, [isFocused]);

    const onRefresh = () => {
        setRefreshing(true);
        loadStats();
    };

    const downloadAllQRs = async () => {
        try {
            setLoading(true);
            const books = await BooksAPI.getAll();

            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica'; direction: rtl; padding: 20px; }
                        h1 { text-align: center; color: #3B827A; }
                        .grid { display: flex; flex-wrap: wrap; justify-content: center; }
                        .qr-item { 
                            margin: 15px; 
                            text-align: center; 
                            border: 1px solid #eee; 
                            padding: 10px; 
                            border-radius: 8px;
                            width: 140px;
                        }
                        .title { font-size: 10px; font-weight: bold; margin-bottom: 5px; height: 30px; overflow: hidden; }
                        .barcode { font-size: 12px; color: #666; margin-top: 5px; }
                        .qr-placeholder { width: 100px; height: 100px; background: #f0f0f0; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 8px; }
                    </style>
                </head>
                <body>
                    <h1>ملصقات رموز الاستجابة السريعة (QR Codes)</h1>
                    <div class="grid">
                        ${books.map(book => `
                            <div class="qr-item">
                                <div class="title">${book.title}</div>
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${book.barcode}" width="100" height="100" />
                                <div class="barcode">${book.barcode}</div>
                            </div>
                        `).join('')}
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('خطأ', 'فشل إنشاء ملف الرموز');
        } finally {
            setLoading(false);
        }
    };

    const downloadDetailedStats = async () => {
        try {
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica'; direction: rtl; padding: 40px; color: #333; }
                        h1 { color: #3B827A; border-bottom: 2px solid #3B827A; padding-bottom: 10px; }
                        .date { color: #666; margin-bottom: 30px; }
                        .stat-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee; font-size: 18px; }
                        .label { font-weight: bold; }
                        .value { color: #3B827A; }
                    </style>
                </head>
                <body>
                    <h1>تقرير الإحصائيات التفصيلي</h1>
                    <div class="date">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
                    
                    <div class="stat-row">
                        <div class="label">إجمالي الكتب في المكتبة:</div>
                        <div class="value">${stats.books}</div>
                    </div>
                    <div class="stat-row">
                        <div class="label">إجمالي الطلاب المسجلين:</div>
                        <div class="value">${stats.students}</div>
                    </div>
                    <div class="stat-row">
                        <div class="label">الكتب المستعارة حالياً:</div>
                        <div class="value">${stats.borrowed}</div>
                    </div>
                    <div class="stat-row">
                        <div class="label">الكتب المتأخرة عن الإرجاع:</div>
                        <div class="value">${stats.overdue}</div>
                    </div>
                    
                    <div style="margin-top: 50px; text-align: center; color: #999; font-size: 12px;">
                        تم إنشاء هذا التقرير آلياً بواسطة تطبيق مكتبة آل خلفي
                    </div>
                </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert('خطأ', 'فشل إنشاء تقرير الإحصائيات');
        }
    };

    const downloadBooksList = async () => {
        try {
            setLoading(true);
            const books = await BooksAPI.getAll();
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica'; direction: rtl; padding: 20px; }
                        h1 { color: #3B827A; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
                        th { background-color: #3B827A; color: white; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                    </style>
                </head>
                <body>
                    <h1>قائمة كتب المكتبة</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>اسم الكتاب</th>
                                <th>المؤلف</th>
                                <th>رقم الباركود</th>
                                <th>التصنيف</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${books.map(b => `
                                <tr>
                                    <td>${b.title}</td>
                                    <td>${b.author}</td>
                                    <td>${b.barcode}</td>
                                    <td>${b.fieldName}</td>
                                    <td>${b.isBorrowed ? 'مستعار' : 'متوفر'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert('خطأ', 'فشل إنشاء قائمة الكتب');
        } finally {
            setLoading(false);
        }
    };

    const downloadStudentsList = async () => {
        try {
            setLoading(true);
            const students = await StudentsAPI.getAll();
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica'; direction: rtl; padding: 20px; }
                        h1 { color: #3B827A; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
                        th { background-color: #3B827A; color: white; }
                    </style>
                </head>
                <body>
                    <h1>سجل الطلاب المسجلين</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>اسم الطالب</th>
                                <th>المستوى الدراسي</th>
                                <th>رقم الهاتف</th>
                                <th>عدد الاستعارات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(s => `
                                <tr>
                                    <td>${s.name}</td>
                                    <td>${s.level}</td>
                                    <td>${s.phone}</td>
                                    <td>${s.borrowCount || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert('خطأ', 'فشل إنشاء سجل الطلاب');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            <View style={[styles.topBackground, { backgroundColor: isDarkMode ? activeColors.surface : COLORS.primaryLight }]}>
                <Header showLogo />
            </View>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[activeColors.primary]}
                        tintColor={activeColors.primary}
                    />
                }
            >

                <Text style={[styles.sectionTitle, { color: activeColors.text }]}>الإحصائيات العامة</Text>

                {/* Stat Widgets */}
                <View style={styles.statsGrid}>
                    <Card style={[styles.statCard, { backgroundColor: activeColors.surface, borderColor: isDarkMode ? activeColors.border : 'transparent' }]}>
                        <Book color={activeColors.primary} size={32} />
                        {loading ? <ActivityIndicator size="small" color={activeColors.primary} style={{ marginTop: 8 }} /> : (
                            <Text style={[styles.statNumber, { color: activeColors.text }]}>{stats.books}</Text>
                        )}
                        <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>إجمالي الكتب</Text>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: activeColors.surface, borderColor: isDarkMode ? activeColors.border : 'transparent' }]}>
                        <Users color={activeColors.primary} size={32} />
                        {loading ? <ActivityIndicator size="small" color={activeColors.primary} style={{ marginTop: 8 }} /> : (
                            <Text style={[styles.statNumber, { color: activeColors.text }]}>{stats.students}</Text>
                        )}
                        <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>إجمالي الطلاب</Text>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: activeColors.surface, borderColor: isDarkMode ? activeColors.border : 'transparent' }]}>
                        <BookOpen color={activeColors.primary} size={32} />
                        {loading ? <ActivityIndicator size="small" color={activeColors.primary} style={{ marginTop: 8 }} /> : (
                            <Text style={[styles.statNumber, { color: activeColors.text }]}>{stats.borrowed}</Text>
                        )}
                        <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>الكتب المستعارة</Text>
                    </Card>

                    <Card style={[
                        styles.statCard,
                        { backgroundColor: activeColors.surface, borderColor: isDarkMode ? activeColors.border : 'transparent' },
                        stats.overdue > 0 ? (isDarkMode ? { backgroundColor: '#3D1C1C', borderColor: '#B71C1C' } : styles.warningCard) : {}
                    ]}>
                        <AlertTriangle color={stats.overdue > 0 ? activeColors.danger : activeColors.textTertiary} size={32} />
                        {loading ? <ActivityIndicator size="small" color={activeColors.primary} style={{ marginTop: 8 }} /> : (
                            <Text style={[styles.statNumber, { color: stats.overdue > 0 ? activeColors.danger : activeColors.text }]}>
                                {stats.overdue}
                            </Text>
                        )}
                        <Text style={[styles.statLabel, { color: activeColors.textSecondary }]}>الكتب المتأخرة</Text>
                    </Card>
                </View>

                {/* Reports & Downloads */}
                <Text style={[styles.sectionTitle, { color: activeColors.text }]}>التقارير والتحميلات</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={[styles.reportButton, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
                        onPress={downloadAllQRs}
                    >
                        <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#0D47A1' : '#E3F2FD' }]}>
                            <QrCode color={isDarkMode ? '#E3F2FD' : '#1976D2'} size={24} />
                        </View>
                        <Text style={[styles.reportText, { color: activeColors.text }]}>تحميل جميع QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.reportButton, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
                        onPress={downloadDetailedStats}
                    >
                        <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#4A148C' : '#F3E5F5' }]}>
                            <LayoutDashboard color={isDarkMode ? '#F3E5F5' : '#7B1FA2'} size={24} />
                        </View>
                        <Text style={[styles.reportText, { color: activeColors.text }]}>إحصائيات مفصلة</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.reportButton, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
                        onPress={downloadBooksList}
                    >
                        <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9' }]}>
                            <Book color={isDarkMode ? '#E8F5E9' : '#388E3C'} size={24} />
                        </View>
                        <Text style={[styles.reportText, { color: activeColors.text }]}>قائمة الكتب</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.reportButton, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
                        onPress={downloadStudentsList}
                    >
                        <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#E65100' : '#FFF3E0' }]}>
                            <Users color={isDarkMode ? '#FFF3E0' : '#F57C00'} size={24} />
                        </View>
                        <Text style={[styles.reportText, { color: activeColors.text }]}>سجل الطلاب</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} /> {/* Bottom padding for tab bar */}
            </ScrollView>
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
    scrollContent: {
        paddingTop: SPACING.s,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.text,
        marginHorizontal: SPACING.m,
        marginBottom: SPACING.m,
        textAlign: 'right',
        marginTop: SPACING.m,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SPACING.m,
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        alignItems: 'center',
        marginHorizontal: 0,
        marginBottom: SPACING.m,
        paddingVertical: SPACING.l,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    warningCard: {
        backgroundColor: COLORS.dangerLight,
        borderColor: '#FFCDD2',
    },
    statNumber: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: COLORS.text,
        marginTop: SPACING.s,
    },
    statLabel: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        textAlign: 'right',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SPACING.m,
        justifyContent: 'space-between',
        marginTop: SPACING.s,
    },
    reportButton: {
        width: '48%',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.l,
        padding: SPACING.m,
        alignItems: 'center',
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    reportText: {
        fontFamily: FONTS.bold,
        fontSize: 15,
        color: COLORS.text,
        textAlign: 'center',
    },
});
