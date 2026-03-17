import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { Reply, Copy, Trash2, Flag, X } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface MessageOptionsSheetProps {
    isVisible: boolean;
    onClose: () => void;
    onReply: () => void;
    onCopy: () => void;
    onDelete?: () => void;
    onReport: () => void;
    isOwnMessage: boolean;
}

export default function MessageOptionsSheet({
    isVisible,
    onClose,
    onReply,
    onCopy,
    onDelete,
    onReport,
    isOwnMessage
}: MessageOptionsSheetProps) {
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;

    const OptionItem = ({ icon: Icon, label, onPress, destructive = false }: any) => (
        <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
                onPress();
                onClose();
            }}
        >
            <View style={[styles.iconContainer, { backgroundColor: destructive ? 'rgba(239, 68, 68, 0.1)' : activeColors.border }]}>
                <Icon size={20} color={destructive ? COLORS.danger : activeColors.text} />
            </View>
            <Text style={[styles.optionLabel, { color: destructive ? COLORS.danger : activeColors.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <View style={[styles.sheet, { backgroundColor: activeColors.surface }]}>
                    <View style={[styles.handle, { backgroundColor: activeColors.border }]} />

                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: activeColors.text }]}>خيارات الرسالة</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color={activeColors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsContainer}>
                        <OptionItem icon={Reply} label="رد" onPress={onReply} />
                        <OptionItem icon={Copy} label="نسخ النص" onPress={onCopy} />
                        <OptionItem icon={Flag} label="إبلاغ" onPress={onReport} />

                        {isOwnMessage && onDelete && (
                            <OptionItem icon={Trash2} label="حذف الرسالة" onPress={onDelete} destructive={true} />
                        )}
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingHorizontal: SPACING.m,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        textAlign: 'right',
    },
    closeBtn: {
        padding: 4,
    },
    optionsContainer: {
        gap: 8,
    },
    optionItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: RADIUS.m,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    optionLabel: {
        fontFamily: FONTS.medium,
        fontSize: 15,
        textAlign: 'right',
    },
});
