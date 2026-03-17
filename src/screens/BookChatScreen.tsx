import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, Keyboard } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Camera, Image as ImageIcon, Smile, Send, Trash2, Reply, MoreVertical, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ChatAPI, BooksAPI, UsersAPI, ChatMessage, Book, User } from '../services/database';

export default function BookChatScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { bookId } = route.params;
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const activeColors = isDarkMode ? DARK_COLORS : COLORS;
    const insets = useSafeAreaInsets();

    const [book, setBook] = useState<Book | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [usersMap, setUsersMap] = useState<Record<string, User>>({});
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [participantCount, setParticipantCount] = useState(0);
    const [showEmojis, setShowEmojis] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const usersMapRef = useRef<Record<string, User>>({});
    const QUICK_EMOJIS = ['😂', '❤️', '😍', '👍', '🙏', '🔥', '🥰', '😊', '🤔', '📚', '🎉', '💪'];

    useEffect(() => {
        loadData();
        const unsubscribe = ChatAPI.listenToMessages(bookId, (msgs) => {
            setMessages(msgs);

            // Extract unique users to show count and fetch their info
            const uids = new Set<string>();
            msgs.forEach(m => uids.add(m.userId));
            setParticipantCount(uids.size);

            // Fetch users info dynamically if not in map
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

            // Scroll to bottom
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
    }, [bookId]);

    const loadData = async () => {
        try {
            const b = await BooksAPI.getById(bookId);
            setBook(b);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (imageUrl?: string) => {
        if (!user) return;
        if (!inputText.trim() && !imageUrl) return;

        try {
            await ChatAPI.sendMessage({
                bookId,
                userId: user.id!,
                text: inputText.trim(),
                imageUrl: imageUrl,
                replyToId: replyTo?.id,
            });
            setInputText('');
            setReplyTo(null);
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
                handleSend(base64Img); // Send directly for simplicity or keep it in a preview
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
                    onPress: () => ChatAPI.deleteMessage(bookId, msgId)
                }
            ]
        );
    };

    const handleReaction = (msgId: string, emoji: string) => {
        if (!user) return;
        ChatAPI.toggleReaction(bookId, msgId, emoji, user.id!);
    };

    const handleMessageOptions = (item: ChatMessage) => {
        const isSelf = item.userId === user?.id;
        const options: any = [
            {
                text: 'رد',
                onPress: () => {
                    // Pre-fetch sender if missing in map
                    if (!usersMap[item.userId]) {
                        UsersAPI.getById(item.userId).then(u => {
                            if (u) {
                                const newMap = { ...usersMapRef.current, [item.userId]: u };
                                usersMapRef.current = newMap;
                                setUsersMap(newMap);
                            }
                        });
                    }
                    setReplyTo(item);
                }
            }
        ];

        if (isSelf) {
            options.push({ text: 'حذف', style: 'destructive', onPress: () => handleDelete(item.id!) });
        }
        options.push({ text: 'إلغاء', style: 'cancel' });

        Alert.alert('خيارات الرسالة', '', options);
    };

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isSelf = item.userId === user?.id;
        const msgUser = usersMap[item.userId];
        const bubbleColor = isSelf ? '#cde7d6' : (isDarkMode ? '#333' : '#f0f0f0'); // Soft green for self, light gray for others
        const textColor = isSelf ? '#1E3A2F' : activeColors.text;

        return (
            <View style={[styles.messageWrapper, isSelf ? styles.messageWrapperSelf : styles.messageWrapperOther]}>

                {/* Profile Image for Others (Placed before content so row direction puts it on the left) */}
                {!isSelf && (
                    <View style={styles.avatarContainer}>
                        {msgUser?.profileImage ? (
                            <Image source={{ uri: msgUser.profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: activeColors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: activeColors.textTertiary }}>
                                    {msgUser?.name?.charAt(0) || '?'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Profile Image for Self (Placed before content so row-reverse puts it on the right) */}
                {isSelf && (
                    <View style={styles.avatarContainer}>
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: activeColors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ fontSize: 18, fontFamily: FONTS.bold, color: activeColors.textTertiary }}>
                                    {user?.name?.charAt(0) || '?'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={[styles.messageContent, isSelf ? styles.messageContentSelf : styles.messageContentOther]}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.messageBubble, { backgroundColor: bubbleColor }]}
                    >
                        {/* Name (Always visible for others) */}
                        {!isSelf && msgUser && (
                            <View style={styles.senderNameRow}>
                                <Text style={[styles.senderName, { color: activeColors.primary }]}>
                                    {msgUser.name || 'مستخدم'}
                                    {msgUser.phone ? ` ~ ${msgUser.phone}` : ''}
                                </Text>
                            </View>
                        )}

                        {/* Reply Snippet if any */}
                        {item.replyToId && (() => {
                            const originalMsg = messages.find(m => m.id === item.replyToId);
                            const originalUser = usersMap[originalMsg?.userId || ''];
                            return (
                                <View style={[styles.replySnippetInside, { borderRightColor: activeColors.primary }]}>
                                    <View style={{ flexShrink: 1, paddingRight: 6 }}>
                                        <Text style={[styles.replySnippetName, { color: activeColors.primary }]} numberOfLines={1}>
                                            {originalUser?.name || 'مستخدم'}
                                        </Text>
                                        <Text style={styles.replySnippetText} numberOfLines={2}>
                                            {originalMsg?.text || 'صورة'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })()}

                        {/* Image Attachment */}
                        {item.imageUrl && (
                            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
                        )}

                        {/* Text */}
                        {item.text ? (
                            <Text style={[styles.messageText, { color: textColor }]}>{item.text}</Text>
                        ) : null}
                    </TouchableOpacity>

                    {/* Reactions array */}
                    {item.reactions && Object.keys(item.reactions).length > 0 && (
                        <View style={[styles.reactionsContainer, isSelf ? { alignSelf: 'flex-start' } : { alignSelf: 'flex-end' }]}>
                            {Object.entries(item.reactions).map(([emoji, count]) => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={styles.reactionPill}
                                    onPress={() => handleReaction(item.id!, emoji)}
                                >
                                    <Text style={styles.reactionText}>{emoji} {count}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Action Buttons (Below bubble) */}
                    <View style={[styles.messageActions, isSelf ? { alignSelf: 'flex-start' } : { alignSelf: 'flex-end' }]}>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                            <TouchableOpacity onPress={() => handleReaction(item.id!, '👍')}><Text>👍</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleReaction(item.id!, '❤️')}><Text>❤️</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleReaction(item.id!, '📚')}><Text>📚</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Time & Options (Outside Bubble) */}
                <View style={{ flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 32, marginHorizontal: 4 }}>
                    <TouchableOpacity style={{ marginBottom: 4, padding: 4 }} onPress={() => handleMessageOptions(item)}>
                        <MoreVertical size={16} color={activeColors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 10, color: activeColors.textTertiary, fontFamily: FONTS.regular }}>
                        {formatTime(item.timestamp)}
                    </Text>
                </View>
            </View>
        );
    };

    const renderContent = () => (
        <>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: activeColors.surface, paddingTop: Platform.OS === 'android' ? insets.top + 10 : 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={activeColors.text} />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: activeColors.text }]} >مناقشة كتاب {book?.title || 'جاري التحميل...'}</Text>

                    <Text style={[styles.headerCount, { color: activeColors.primary }]}>
                        {participantCount} مشارك في النقاش
                    </Text>
                </View>

                <View style={styles.bookCoverContainer}>
                    {book?.coverImage ? (
                        <Image source={{ uri: book.coverImage }} style={styles.bookCover} />
                    ) : (
                        <View style={[styles.bookCover, { backgroundColor: activeColors.border }]} />
                    )}
                </View>
            </View>

            {/* Chat List */}
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

            {/* Quick Emojis */}
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

            {/* Input Area */}
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
                        {originalUser?.profileImage ? (
                            <Image source={{ uri: originalUser.profileImage }} style={styles.replyPreviewAvatar} />
                        ) : (
                            <View style={[styles.replyPreviewAvatar, { backgroundColor: activeColors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ fontSize: 14, fontFamily: FONTS.bold, color: activeColors.textTertiary }}>
                                    {originalUser?.name?.charAt(0) || '?'}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => setReplyTo(null)}>
                            <X size={20} color={activeColors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                );
            })()}

            <View style={[styles.inputContainer, { marginBottom: isKeyboardVisible ? insets.bottom + 260 : (15 + insets.bottom), paddingTop: 6 }]}>

                {/* The rounded text input area */}
                <View style={[styles.innerInputBox, { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF' }]}>
                    <TouchableOpacity onPress={() => setShowEmojis(!showEmojis)} style={styles.iconBtn}>
                        <Smile size={24} color={activeColors.textSecondary} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.input, { color: activeColors.text }]}
                        placeholder="اكتب رسالة..."
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

                {/* Send Button outside */}
                <View style={styles.sendButtonContainer}>
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: '#008b8b' }]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim() && !replyTo}
                    >
                        <Send size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
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
    headerSubtitle: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        marginTop: 2,
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
    bookCover: {
        width: '100%',
        height: '100%',
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
    messageWrapper: {
        marginBottom: 8,
        width: '100%',
    },
    messageWrapperSelf: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-start',
    },
    messageWrapperOther: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    messageContent: {
        maxWidth: '70%',
    },
    messageContentSelf: {
        alignItems: 'flex-end', // left aligned in RTL
    },
    messageContentOther: {
        alignItems: 'flex-start', // right aligned in RTL
    },
    messageBubble: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: RADIUS.l,
    },
    senderNameRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: 4,
    },
    senderName: {
        fontFamily: FONTS.bold,
        fontSize: 12,
        textAlign: 'right',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: RADIUS.m,
        marginBottom: 8,
    },
    messageText: {
        fontFamily: FONTS.medium,
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'right',

    },
    messageTime: {
        fontSize: 10,
        fontFamily: FONTS.regular,
        textAlign: 'left',
        marginTop: 4,
    },
    messageActions: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
    },
    reactionsContainer: {
        flexDirection: 'row-reverse',
        marginTop: -10,
        marginBottom: 4,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        zIndex: 10,
    },
    reactionPill: {
        paddingHorizontal: 4,
    },
    reactionText: {
        fontSize: 12,
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
        marginBottom: 4,     // align with bottom of input box
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
        borderLeftWidth: 4,
        borderLeftColor: '#388E3C', // Accent color
    },
    replyPreviewAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginLeft: 10,
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
    replySnippetInside: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        padding: 8,
        borderRadius: RADIUS.s,
        borderRightWidth: 4,
        marginBottom: 8,
        alignSelf: 'stretch', // ensures it spans horizontally
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    replySnippetName: {
        fontFamily: FONTS.bold,
        fontSize: 13,
        textAlign: 'right',
        marginBottom: 2,
    },
    replySnippetText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: '#555',
        textAlign: 'right',
    }
});
