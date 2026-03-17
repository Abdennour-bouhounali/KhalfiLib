import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Camera, Image as ImageIcon, Smile, Send, X, HelpCircle, Lightbulb, BookOpen, User as UserIcon, MessageCircle, Flag, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LibraryChatAPI, UsersAPI, LibraryChatMessage, User } from '../services/database';
import ChatMessageItem from '../components/ChatMessageItem';
import MessageOptionsSheet from '../components/MessageOptionsSheet';

const TYPE_CONFIG = {
    question: { label: 'سؤال', color: '#3B82F6', icon: HelpCircle },
    idea: { label: 'فكرة', color: '#6366F1', icon: Lightbulb },
    book_suggestion: { label: 'اقتراح كتاب', color: '#F43F5E', icon: BookOpen },
    author_suggestion: { label: 'اقتراح كاتب', color: '#F97316', icon: UserIcon },
    thought: { label: 'خاطرة', color: '#A855F7', icon: MessageCircle },
};

export default function LibraryChatScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const insets = useSafeAreaInsets();

    const [messages, setMessages] = useState<LibraryChatMessage[]>([]);
    const [usersMap, setUsersMap] = useState<Record<string, User>>({});
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [participantCount, setParticipantCount] = useState(0);
    const [showEmojis, setShowEmojis] = useState(false);
    const [replyTo, setReplyTo] = useState<LibraryChatMessage | null>(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [msgType, setMsgType] = useState<keyof typeof TYPE_CONFIG | 'normal'>('normal');
    const [selectedMessage, setSelectedMessage] = useState<LibraryChatMessage | null>(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const usersMapRef = useRef<Record<string, User>>({});
    const QUICK_EMOJIS = ['😂', '❤️', '😍', '👍', '🙏', '🔥', '🥰', '😊', '🤔', '📚', '🎉', '💪'];

    useEffect(() => {
        const unsubscribe = LibraryChatAPI.listenToMessages((msgs) => {
            setMessages(msgs);
            setLoading(false);

            const uids = new Set<string>();
            msgs.forEach(m => uids.add(m.userId));
            setParticipantCount(uids.size);

            uids.forEach(uid => {
                if (!usersMapRef.current[uid]) {
                    UsersAPI.getById(uid).then(u => {
                        if (u) {
                            const newMap = { ...usersMapRef.current, [uid]: u };
                            usersMapRef.current = newMap;
                            setUsersMap(newMap);
                        }
                    });
                }
            });

            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            unsubscribe();
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const handleSend = async (imageUrl?: string) => {
        if (!user) return;
        if (!inputText.trim() && !imageUrl) return;

        try {
            await LibraryChatAPI.sendMessage({
                userId: user.id!,
                text: inputText.trim(),
                type: msgType as any,
                imageUrl: imageUrl,
                replyToId: replyTo?.id,
            });
            setInputText('');
            setReplyTo(null);
            setMsgType('normal');
        } catch (error) {
            Alert.alert('خطأ', 'فشل إرسال الرسالة');
        }
    };

    const handleImagePick = async (fromCamera: boolean) => {
        try {
            let result;
            if (fromCamera) {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('تنبيه', 'نحتاج إلى صلاحية الكاميرا لالتقاط صورة');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.5,
                    base64: true,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.5,
                    base64: true,
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
                handleSend(base64Img);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = (msgId: string) => {
        Alert.alert(
            'حذف الرسالة',
            'هل أنت متأكد من حذف هذه الرسالة؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: () => LibraryChatAPI.deleteMessage(msgId)
                }
            ]
        );
    };

    const handleReaction = (msgId: string, emoji: string) => {
        if (!user) return;
        LibraryChatAPI.toggleReaction(msgId, emoji, user.id!);
    };

    const handleMessageOptions = (item: LibraryChatMessage) => {
        setSelectedMessage(item);
        setIsOptionsVisible(true);
    };

    const handleCopyText = (text: string) => {
        Alert.alert('تم النسخ', 'تم نسخ نص الرسالة إلى الحافظة');
    };

    const handleReport = (item: LibraryChatMessage) => {
        Alert.alert('إبلاغ', 'شكرًا لإبلاغنا. سنقوم بمراجعة الرسالة.', [{ text: 'تم' }]);
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: LibraryChatMessage }) => {
        const isSelf = item.userId === user?.id;
        const msgUser = usersMap[item.userId];
        const replyToMessage = item.replyToId ? messages.find(m => m.id === item.replyToId) : undefined;
        const replyToUser = replyToMessage ? usersMap[replyToMessage.userId] : undefined;

        return (
            <ChatMessageItem
                message={item}
                isSelf={isSelf}
                user={msgUser}
                activeColors={activeColors}
                onReaction={(emoji) => handleReaction(item.id!, emoji)}
                onOptions={() => handleMessageOptions(item)}
                replyToMessage={replyToMessage}
                replyToUser={replyToUser}
            />
        );
    };

    const renderContent = () => (
        <>
            <View style={[styles.header, { backgroundColor: activeColors.surface, paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
                <View style={styles.backButton} /> {/* Spacer for symmetry */}

                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: activeColors.text }]} >النقاش العام</Text>
                    <Text style={[styles.headerCount, { color: activeColors.primary }]}>
                        مساحة لكل القرّاء
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.bookCoverContainer, { backgroundColor: '#E6F4EA', justifyContent: 'center', alignItems: 'center' }]}
                >
                    <ChevronRight size={24} color={activeColors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={activeColors.primary} />
                </View>
            ) : (
                <FlatList
                    style={{ flex: 1 }}
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id!}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {showEmojis && (
                <View style={[styles.emojiContainer, { backgroundColor: activeColors.surface }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.m }}>
                        {QUICK_EMOJIS.map(emoji => (
                            <TouchableOpacity key={emoji} onPress={() => setInputText(prev => prev + emoji)} style={{ padding: 10 }}>
                                <Text style={{ fontSize: 24 }}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {replyTo && (() => {
                const originalUser = usersMap[replyTo.userId];
                return (
                    <View style={[styles.replyPreviewBar, { backgroundColor: isDarkMode ? '#222' : '#f5f5f5' }]}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={[styles.replyPreviewName, { color: activeColors.primary }]} numberOfLines={1}>
                                قيد الرد على {originalUser?.name || 'مستخدم'}
                            </Text>
                            <Text style={[styles.replyPreviewText, { color: activeColors.textSecondary }]} numberOfLines={1}>
                                {replyTo.text || 'صورة'}
                            </Text>
                        </View>
                        <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => setReplyTo(null)}>
                            <X size={20} color={activeColors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                );
            })()}

            <View style={[styles.inputWrapper, { paddingBottom: insets.bottom + (isKeyboardVisible ? 260 : 5) }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.richToolsScroll} contentContainerStyle={styles.richToolsRow}>
                    {(Object.entries(TYPE_CONFIG) as [keyof typeof TYPE_CONFIG, typeof TYPE_CONFIG['question']][]).map(([type, cfg]) => {
                        const isSelected = msgType === type;
                        const Icon = cfg.icon;
                        return (
                            <TouchableOpacity
                                key={type}
                                style={[styles.toolBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }, isSelected && { backgroundColor: cfg.color }]}
                                onPress={() => setMsgType(isSelected ? 'normal' : type)}
                            >
                                <Icon size={18} color={isSelected ? '#FFF' : activeColors.textSecondary} />
                                <Text style={[styles.toolText, { color: isSelected ? '#FFF' : activeColors.textSecondary }]}>{cfg.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.inputContainer}>
                    <View style={[styles.innerInputBox, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF' }]}>
                        <TouchableOpacity onPress={() => setShowEmojis(!showEmojis)} style={styles.iconBtn}>
                            <Smile size={24} color={activeColors.textSecondary} />
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.input, { color: activeColors.text }]}
                            placeholder="شارك أفكارك..."
                            placeholderTextColor={activeColors.textTertiary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            textAlign="right"
                        />

                        <TouchableOpacity onPress={() => handleImagePick(false)} style={styles.iconBtn}>
                            <ImageIcon size={22} color={activeColors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => handleImagePick(true)} style={styles.iconBtn}>
                            <Camera size={22} color={activeColors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.sendButtonContainer}>
                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: activeColors.primary }]}
                            onPress={() => handleSend()}
                            disabled={!inputText.trim()}
                        >
                            <Send size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {selectedMessage && (
                <MessageOptionsSheet
                    isVisible={isOptionsVisible}
                    onClose={() => setIsOptionsVisible(false)}
                    isOwnMessage={selectedMessage.userId === user?.id}
                    onReply={() => {
                        if (selectedMessage) {
                            if (!usersMap[selectedMessage.userId]) {
                                UsersAPI.getById(selectedMessage.userId).then(u => {
                                    if (u) {
                                        const newMap = { ...usersMapRef.current, [selectedMessage.userId]: u };
                                        usersMapRef.current = newMap;
                                        setUsersMap(newMap);
                                    }
                                });
                            }
                            setReplyTo(selectedMessage);
                        }
                    }}
                    onCopy={() => handleCopyText(selectedMessage.text)}
                    onDelete={() => handleDelete(selectedMessage.id!)}
                    onReport={() => handleReport(selectedMessage)}
                />
            )}
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.background }]}>
            {Platform.OS === 'ios' ? (
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior="padding"
                    keyboardVerticalOffset={0}
                >
                    {renderContent()}
                </KeyboardAvoidingView>
            ) : (
                <View style={styles.container}>
                    {renderContent()}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
    },
    backButton: {
        padding: 8,
        marginLeft: 8,
    },
    headerInfo: {
        flex: 1,
        alignItems: 'flex-start',
        paddingRight: SPACING.l,
        marginLeft: SPACING.l,
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
    },
    headerCount: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        marginTop: 2,
    },
    bookCoverContainer: {
        width: 45,
        height: 65,
        borderRadius: RADIUS.s,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inputWrapper: {
        backgroundColor: 'transparent',
    },
    richToolsScroll: {
        paddingVertical: 12,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    richToolsRow: {
        flexDirection: 'row-reverse',
        paddingHorizontal: SPACING.m,
        gap: 12,
        alignItems: 'center',
    },
    toolBtn: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 8,
    },
    toolText: {
        fontSize: 13,
        fontFamily: FONTS.bold,
    },
    listContent: {
        padding: SPACING.m,
        paddingBottom: 40,
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
        backgroundColor: 'transparent',
    },
    innerInputBox: {
        flex: 1,
        flexDirection: 'row-reverse',
        alignItems: 'flex-end',
        borderRadius: 24,
        marginHorizontal: 4,
        paddingHorizontal: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 1 },
    },
    iconBtn: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 4,
        fontFamily: FONTS.medium,
        fontSize: 16,
    },
    sendButtonContainer: {
        justifyContent: 'flex-end',
        marginBottom: 4,
        marginLeft: 4,
    },
    sendButton: {
        width: 38,
        height: 38,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    emojiContainer: {
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingVertical: 5,
    },
    replyPreviewBar: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    replyPreviewName: {
        fontFamily: FONTS.bold,
        fontSize: 12,
        textAlign: 'right',
        marginBottom: 2,
    },
    replyPreviewText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        textAlign: 'right',
    },
});
