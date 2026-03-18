import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MoreVertical, Quote as QuoteIcon, Star, AlertCircle, HelpCircle, MessageCircle, Lightbulb, BookOpen, User as UserIcon, MessageSquare, Clock, Check, CheckCheck } from 'lucide-react-native';
import { COLORS, DARK_COLORS, FONTS, SPACING, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';
import { ChatMessage, LibraryChatMessage, User } from '../services/database';

interface ChatMessageItemProps {
    message: ChatMessage | LibraryChatMessage;
    isSelf: boolean;
    user?: User;
    currentUserId?: string;
    activeColors: any;
    onReaction: (emoji: string) => void;
    onOptions: () => void;
    replyToMessage?: ChatMessage | LibraryChatMessage;
    replyToUser?: User;
}

const TYPE_COLORS = {
    normal: null,
    quote: '#22C55E',
    review: '#EAB308',
    thought: '#A855F7',
    question: '#3B82F6',
    idea: '#6366F1',
    book_suggestion: '#F43F5E',
    author_suggestion: '#F97316',
    critique: '#EF4444',
};

export default function ChatMessageItem({
    message,
    isSelf,
    user,
    currentUserId,
    activeColors,
    onReaction,
    onOptions,
    replyToMessage,
    replyToUser
}: ChatMessageItemProps) {
    const { isDarkMode } = useTheme();

    const wrapperStyle = isSelf ? styles.wrapperSelf : styles.wrapperOther;
    const contentStyle = isSelf ? styles.contentSelf : styles.contentOther;
    const bubbleColor = isSelf ? (isDarkMode ? '#1E3A2F' : '#E6F4EA') : (isDarkMode ? '#2C2C2C' : '#F5F5F5');
    const textColor = isSelf ? (isDarkMode ? '#E6F4EA' : '#1E3A2F') : activeColors.text;

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    };

    const reactionCounts = useMemo(() => {
        if (!message.reactions) return {};
        return Object.values(message.reactions).reduce((acc: Record<string, number>, emoji) => {
            acc[emoji] = (acc[emoji] || 0) + 1;
            return acc;
        }, {});
    }, [message.reactions]);

    const myReaction = message.reactions && currentUserId ? message.reactions[currentUserId] : null;

    const renderQuote = (msg: ChatMessage) => (
        <View style={[styles.quoteContainer, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)', borderColor: TYPE_COLORS.quote }]}>
            <View style={styles.quoteHeader}>
                <QuoteIcon size={14} color={TYPE_COLORS.quote} />
                <Text style={[styles.quoteLabel, { color: TYPE_COLORS.quote }]}>اقتباس</Text>
            </View>
            <Text style={[styles.quoteText, { color: textColor }]}>❝ {msg.text} ❞</Text>
            {msg.pageNumber && (
                <Text style={[styles.pageNumber, { color: activeColors.textTertiary }]}>— صفحة {msg.pageNumber}</Text>
            )}
        </View>
    );

    const renderReview = (msg: ChatMessage) => (
        <View style={styles.reviewContainer}>
            <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={18}
                        fill={star <= (msg.rating || 0) / 2 ? TYPE_COLORS.review : 'transparent'}
                        color={star <= (msg.rating || 0) / 2 ? TYPE_COLORS.review : activeColors.textTertiary}
                    />
                ))}
                <Text style={[styles.ratingValue, { color: TYPE_COLORS.review }]}>({msg.rating}/10)</Text>
            </View>
            {msg.text ? (
                <Text style={[styles.messageText, { color: textColor }]}>{msg.text}</Text>
            ) : null}
        </View>
    );

    const renderSpecialType = (msg: any, type: keyof typeof TYPE_COLORS) => {
        const color = TYPE_COLORS[type];
        return (
            <View style={[styles.specialContainer, { backgroundColor: isDarkMode ? `${color}15` : `${color}08`, borderColor: color || activeColors.border }]}>
                <Text style={[styles.messageText, { color: textColor, fontFamily: type === 'critique' || type === 'question' ? FONTS.bold : FONTS.regular }]}>
                    {msg.text}
                </Text>
            </View>
        );
    };

    const renderBadge = () => {
        const type = message.type;
        if (!type || type === 'normal') return null;

        const config: Record<string, { label: string; icon: any }> = {
            question: { label: 'سؤال', icon: <HelpCircle size={12} color="#FFF" /> },
            review: { label: 'مراجعة', icon: <Star size={12} color="#FFF" fill="#FFF" /> },
            idea: { label: 'فكرة', icon: <Lightbulb size={12} color="#FFF" /> },
            quote: { label: 'اقتباس', icon: <QuoteIcon size={12} color="#FFF" /> },
            thought: { label: 'خاطرة', icon: <MessageCircle size={12} color="#FFF" /> },
            book_suggestion: { label: 'اقتراح كتاب', icon: <BookOpen size={12} color="#FFF" /> },
            author_suggestion: { label: 'اقتراح كاتب', icon: <UserIcon size={12} color="#FFF" /> },
            critique: { label: 'نقد', icon: <MessageSquare size={12} color="#FFF" /> },
        };

        const item = config[type];
        if (!item) return null;
        const color = TYPE_COLORS[type as keyof typeof TYPE_COLORS] || activeColors.primary;

        return (
            <View style={[styles.badge, { backgroundColor: color || activeColors.primary }]}>
                {item.icon}
                <Text style={styles.badgeText}>{item.label}</Text>
            </View>
        );
    };

    const renderContent = () => {
        const type = message.type;
        switch (type) {
            case 'quote': return renderQuote(message as ChatMessage);
            case 'review': return renderReview(message as ChatMessage);
            case 'thought': return renderSpecialType(message, 'thought');
            case 'question': return renderSpecialType(message, 'question');
            case 'idea': return renderSpecialType(message, 'idea');
            case 'book_suggestion': return renderSpecialType(message, 'book_suggestion');
            case 'author_suggestion': return renderSpecialType(message, 'author_suggestion');
            case 'critique': return renderSpecialType(message, 'critique');
            default: return <Text style={[styles.messageText, { color: textColor }]}>{message.text}</Text>;
        }
    };

    return (
        <View style={[styles.wrapper, wrapperStyle]}>
            {!isSelf && (
                <View style={styles.avatarWrapper}>
                    {user?.profileImage ? (
                        <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: activeColors.border }]}>
                            <Text style={styles.avatarInitial}>{user?.name?.charAt(0) || '?'}</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={[styles.content, contentStyle]}>
                <View style={[styles.bubble, { backgroundColor: bubbleColor }]}>
                    {renderBadge()}

                    {!isSelf && user && (
                        <Text style={[styles.senderName, { color: activeColors.primary }]}>{user.name}</Text>
                    )}

                    {replyToMessage && (
                        <View style={[styles.replySnippet, { borderRightColor: activeColors.primary }]}>
                            <Text style={[styles.replyName, { color: activeColors.primary }]} numberOfLines={1}>
                                {replyToUser?.name || 'مستخدم'}
                            </Text>
                            <Text style={[styles.replyText, { color: activeColors.textSecondary }]} numberOfLines={1}>
                                {replyToMessage.text || 'رسالة'}
                            </Text>
                        </View>
                    )}

                    {message.imageUrl && (
                        <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
                    )}

                    {renderContent()}

                    <View style={styles.metaRow}>
                        <Text style={[styles.time, { color: activeColors.textTertiary }]}>
                            {formatTime(message.timestamp)}
                        </Text>
                        {isSelf && (
                            <View style={styles.statusIcon}>
                                {message.status === 'sending' ? (
                                    <Clock size={10} color={activeColors.textTertiary} />
                                ) : (
                                    <Check size={12} color={activeColors.primary} />
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {Object.keys(reactionCounts).length > 0 && (
                    <View style={[styles.reactions, isSelf ? { alignSelf: 'flex-start' } : { alignSelf: 'flex-end' }]}>
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <TouchableOpacity
                                key={emoji}
                                style={[
                                    styles.reactionPill,
                                    { backgroundColor: activeColors.surface, borderColor: activeColors.border },
                                    myReaction === emoji && { borderColor: activeColors.primary, backgroundColor: isDarkMode ? '#1E3A2F' : '#E6F4EA' }
                                ]}
                                onPress={() => onReaction(emoji)}
                            >
                                <Text style={styles.reactionText}>{emoji} {count}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.optionsBtn} onPress={onOptions}>
                <MoreVertical size={16} color={activeColors.textTertiary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        marginBottom: SPACING.m,
        alignItems: 'flex-end',
        paddingHorizontal: SPACING.s,
    },
    wrapperSelf: {
        justifyContent: 'flex-start',
    },
    wrapperOther: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-start',
    },
    avatarWrapper: {
        width: 36,
        height: 36,
        marginHorizontal: 8,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: '#999',
    },
    content: {
        maxWidth: '75%',
    },
    contentSelf: {
        alignItems: 'flex-end',
    },
    contentOther: {
        alignItems: 'flex-start',
    },
    bubble: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: RADIUS.l,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    senderName: {
        fontFamily: FONTS.bold,
        fontSize: 12,
        marginBottom: 4,
        textAlign: 'right',
    },
    messageText: {
        fontFamily: FONTS.regular,
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'right',
    },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: RADIUS.m,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    statusIcon: {
        marginLeft: 2,
    },
    time: {
        fontSize: 10,
        fontFamily: FONTS.regular,
    },
    optionsBtn: {
        padding: 8,
    },
    replySnippet: {
        borderRightWidth: 3,
        paddingRight: 8,
        paddingVertical: 4,
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: RADIUS.s,
    },
    replyName: {
        fontFamily: FONTS.bold,
        fontSize: 11,
        textAlign: 'right',
    },
    replyText: {
        fontSize: 12,
        textAlign: 'right',
    },
    quoteContainer: {
        padding: 10,
        borderRadius: RADIUS.m,
        marginBottom: 4,
        borderStyle: 'dashed',
        borderWidth: 1,
    },
    quoteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
        justifyContent: 'flex-end',
    },
    quoteLabel: {
        fontFamily: FONTS.bold,
        fontSize: 11,
    },
    quoteText: {
        fontFamily: FONTS.regular,
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'right',
        fontStyle: 'italic',
    },
    pageNumber: {
        fontSize: 11,
        textAlign: 'right',
        marginTop: 4,
    },
    reviewContainer: {
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
        justifyContent: 'flex-end',
    },
    ratingValue: {
        fontSize: 12,
        fontFamily: FONTS.bold,
        marginLeft: 8,
    },
    specialContainer: {
        padding: 10,
        borderRadius: RADIUS.m,
        marginBottom: 4,
        borderRightWidth: 4,
    },
    badge: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginBottom: 6,
        gap: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: FONTS.bold,
    },
    reactions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: -10,
        zIndex: 10,
        gap: 4,
    },
    reactionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
    },
    reactionText: {
        fontSize: 12,
    },
});
