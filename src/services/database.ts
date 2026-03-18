import { ref, get, push, update, remove, query, orderByChild, equalTo, set, onValue, off, limitToLast, onChildAdded, onChildChanged, endBefore } from 'firebase/database';
import { db } from './firebase';
import { StorageService } from './StorageService';
import { SQLiteService } from './SQLiteService';

// ==========================================
// MODELS (TypeScript Interfaces)
// ==========================================

export interface Field {
    id?: string;
    title: string;
    description: string;
}

export interface Book {
    id?: string;
    title: string;
    fieldId: string;
    description: string;
    author: string;
    publisher: string;
    copiesTotal: number;
    copiesAvailable: number;
    ageCategory: string; // 'الأطفال', 'الشباب', 'الكبار'
    rating: number; // 0-10
    barcode: string;
    coverImage?: string; // Base64 or URI
    status: 'available' | 'unavailable';
    createdAt?: string; // Stored as ISO string in RTDB
}

export type UserRole = 'super_admin' | 'admin' | 'student';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'rejected';

export interface User {
    id?: string;
    firstName?: string;
    lastName?: string;
    name: string; // Used as display name
    phone: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    profileImage?: string;
    birthdate?: string;
    borrowedBookId?: string | null;
    previousBooksCount?: number;
    createdAt?: string;
}

// Keeping Student interface for migration reference
export interface Student {
    id?: string;
    firstName: string;
    lastName: string;
    birthdate: string;
    phone: string;
    profilePicture?: string;
    borrowedBookId?: string | null;
    previousBooksCount: number;
    createdAt?: string;
}

export interface BorrowRecord {
    id?: string;
    userId: string; // Linked to users.id
    bookId: string;
    borrowDate: string; // ISO string
    returnDate?: string | null; // ISO string
    dueDate: string; // ISO string
    penaltyDays: number;
    returnedBy?: string; // UID of admin who processed return
}

export interface Subscription {
    id?: string;
    userId: string; // Linked to users.id
    startDate: string; // ISO string
    endDate: string; // ISO string
    status: 'active' | 'expired' | 'suspended';
    createdAt?: string;
}

export interface ChatMessage {
    id?: string;
    bookId: string;
    userId: string;
    text: string;
    type: 'normal' | 'quote' | 'review' | 'thought' | 'question' | 'idea' | 'book_suggestion' | 'author_suggestion' | 'critique';
    quoteText?: string;
    pageNumber?: string;
    rating?: number;
    imageUrl?: string;
    reactions?: Record<string, string>; // userId -> emoji
    status?: 'sending' | 'sent' | 'failed';
    replyToId?: string;
    createdAt: string;
    timestamp: number;
}

export interface LibraryChatMessage {
    id?: string;
    userId: string;
    text: string;
    type: 'normal' | 'quote' | 'review' | 'thought' | 'question' | 'idea' | 'book_suggestion' | 'author_suggestion';
    tags?: string[];
    imageUrl?: string;
    reactions?: Record<string, string>; // userId -> emoji
    status?: 'sending' | 'sent' | 'failed';
    replyToId?: string;
    createdAt: string;
    timestamp: number;
}

export interface AppNotification {
    id?: string;
    title: string;
    message: string;
    link?: string;
    type: 'info' | 'update' | 'alert';
    version?: string; // For update notifications
    createdAt: string;
    createdBy: string;
}

// Helper to convert RTDB Object to Array
const objectToArray = <T>(obj: Record<string, any> | null): T[] => {
    if (!obj) return [];
    return Object.keys(obj).map(key => ({
        id: key,
        ...obj[key]
    })) as T[];
};

// ==========================================
// BUSINESS LOGIC HELPERS
// ==========================================
export const BookLogic = {
    computeStatus: (available: number): 'available' | 'unavailable' => {
        return available > 0 ? 'available' : 'unavailable';
    },
    validate: (total: number, available: number) => {
        if (total < 0) throw new Error('Total copies cannot be negative');
        if (available < 0) throw new Error('Available copies cannot be negative');
        if (available > total) throw new Error('Available copies cannot exceed total copies');
    }
};

// ==========================================
// FIELDS (CATEGORIES) API
// ==========================================
export const FieldsAPI = {
    getAll: async (): Promise<Field[]> => {
        try {
            // 1. Get from SQLite first (Instant load)
            const cached = await StorageService.getCollection<Field>('fields');

            // 2. Fetch from Firebase in background handled by CacheSyncService
            return cached;
        } catch (error) {
            console.error(`[FieldsAPI] getAll failed:`, error);
            return []; // Return empty instead of throwing to avoid UI crash
        }
    },

    create: async (field: Field): Promise<string> => {
        try {
            const fieldsRef = ref(db, 'fields');
            const newRef = await push(fieldsRef, field);
            return newRef.key as string;
        } catch (error) {
            console.error(`[FieldsAPI] create failed:`, error);
            throw error;
        }
    },

    update: async (id: string, field: Partial<Field>) => {
        try {
            const fieldRef = ref(db, `fields/${id}`);
            await update(fieldRef, field);
        } catch (error) {
            console.error(`[FieldsAPI] update failed:`, error);
            throw error;
        }
    },

    delete: async (id: string) => {
        try {
            const fieldRef = ref(db, `fields/${id}`);
            await remove(fieldRef);
        } catch (error) {
            console.error(`[FieldsAPI] delete failed:`, error);
            throw error;
        }
    }
};

// ==========================================
// BOOKS API
// ==========================================
export const BooksAPI = {
    getAll: async (): Promise<Book[]> => {
        try {
            // 1. Get from SQLite first (Instant load)
            const cached = await StorageService.getCollection<Book>('books');
            return cached;
        } catch (error) {
            console.error(`[BooksAPI] getAll failed:`, error);
            return [];
        }
    },

    getByBarcode: async (barcode: string): Promise<Book | null> => {
        const booksRef = ref(db, 'books');
        const barcodeQuery = query(booksRef, orderByChild('barcode'), equalTo(barcode));
        const snapshot = await get(barcodeQuery);

        if (snapshot.exists()) {
            const data = snapshot.val();
            const keys = Object.keys(data);
            if (keys.length > 0) {
                return { id: keys[0], ...data[keys[0]] } as Book;
            }
        }
        return null;
    },

    getById: async (id: string): Promise<Book | null> => {
        try {
            const bookRef = ref(db, `books/${id}`);
            const snapshot = await get(bookRef);
            if (snapshot.exists()) {
                return { id, ...snapshot.val() } as Book;
            }
            return null;
        } catch (error) {
            console.error(`[BooksAPI] getById failed:`, error);
            throw error;
        }
    },

    create: async (book: Omit<Book, 'id'>): Promise<string> => {
        try {
            BookLogic.validate(book.copiesTotal, book.copiesAvailable);
            book.createdAt = new Date().toISOString();
            book.status = BookLogic.computeStatus(book.copiesAvailable);

            const booksRef = ref(db, 'books');
            const newRef = await push(booksRef, book);
            return newRef.key as string;
        } catch (error) {
            console.error(`[BooksAPI] create failed:`, error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<Book>) => {
        try {
            const bookRef = ref(db, `books/${id}`);
            const snapshot = await get(bookRef);
            if (!snapshot.exists()) throw new Error('Book not found');

            const currentBook = snapshot.val() as Book;
            const newTotal = updates.copiesTotal !== undefined ? updates.copiesTotal : currentBook.copiesTotal;
            const newAvailable = updates.copiesAvailable !== undefined ? updates.copiesAvailable : currentBook.copiesAvailable;

            // Validate & Force Status
            BookLogic.validate(newTotal, newAvailable);
            updates.status = BookLogic.computeStatus(newAvailable);

            await update(bookRef, updates);
        } catch (error) {
            console.error(`[BooksAPI] update failed:`, error);
            throw error;
        }
    },

    delete: async (id: string) => {
        const bookRef = ref(db, `books/${id}`);
        await remove(bookRef);
    }
};

// ==========================================
// USERS API (Unified Admin & Students)
// ==========================================
export const UsersAPI = {
    getById: async (uid: string): Promise<User | null> => {
        try {
            const userRef = ref(db, `users/${uid}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                return { id: snapshot.key, ...snapshot.val() } as User;
            }
            return null;
        } catch (error) {
            console.error(`[UsersAPI] getById failed:`, error);
            throw error;
        }
    },

    getByPhone: async (phone: string): Promise<User | null> => {
        try {
            const usersRef = ref(db, 'users');
            const phoneQuery = query(usersRef, orderByChild('phone'), equalTo(phone));
            const snapshot = await get(phoneQuery);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const keys = Object.keys(data);
                return { id: keys[0], ...data[keys[0]] } as User;
            }
            return null;
        } catch (error) {
            console.error(`[UsersAPI] getByPhone failed:`, error);
            throw error;
        }
    },

    create: async (user: Omit<User, 'id'>): Promise<string> => {
        try {
            user.createdAt = new Date().toISOString();
            if (user.role === 'student') {
                user.previousBooksCount = user.previousBooksCount || 0;
            }
            // Remove undefined values (Firebase doesn't allow them)
            const cleanUser: any = {};
            Object.keys(user).forEach(key => {
                const val = (user as any)[key];
                if (val !== undefined) {
                    cleanUser[key] = val;
                }
            });

            const usersRef = ref(db, 'users');
            const newRef = await push(usersRef, cleanUser);
            return newRef.key as string;
        } catch (error) {
            console.error(`[UsersAPI] create failed:`, error);
            throw error;
        }
    },

    update: async (id: string, user: Partial<User>) => {
        try {
            const userRef = ref(db, `users/${id}`);
            // Remove undefined values
            const cleanUser: any = {};
            Object.keys(user).forEach(key => {
                const val = (user as any)[key];
                if (val !== undefined) {
                    cleanUser[key] = val;
                }
            });

            await update(userRef, cleanUser);
        } catch (error) {
            console.error(`[UsersAPI] update failed:`, error);
            throw error;
        }
    },

    getAll: async (role?: UserRole): Promise<User[]> => {
        try {
            // 1. Get from SQLite first (Instant load)
            const cached = await StorageService.getCollection<User>('users');
            const filteredCache = role ? cached.filter(u => u.role === role) : cached;
            return filteredCache;
        } catch (error) {
            console.error(`[UsersAPI] getAll failed:`, error);
            return [];
        }
    },

    getPending: async (role?: UserRole): Promise<User[]> => {
        try {
            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);
            if (snapshot.exists()) {
                const users = objectToArray<User>(snapshot.val());
                return users.filter(u => u.status === 'pending' && (!role || u.role === role));
            }
            return [];
        } catch (error) {
            console.error(`[UsersAPI] getPending failed:`, error);
            throw error;
        }
    },

    delete: async (id: string) => {
        try {
            const userRef = ref(db, `users/${id}`);
            await remove(userRef);
        } catch (error) {
            console.error(`[UsersAPI] delete failed:`, error);
            throw error;
        }
    }
};

// ==========================================
// BORROW/RETURN LOGIC
// ==========================================
export const BorrowingAPI = {
    borrowBook: async (userId: string, bookId: string, daysToBorrow: number) => {
        const borrowDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysToBorrow);

        const borrowRecord: Omit<BorrowRecord, 'id'> = {
            userId,
            bookId,
            borrowDate: borrowDate.toISOString(),
            dueDate: dueDate.toISOString(),
            penaltyDays: 0,
        };

        // 1. Create Record
        const recordsRef = ref(db, 'borrowRecords');
        await push(recordsRef, borrowRecord);

        // 2. Update User
        const userRef = ref(db, `users/${userId}`);
        await update(userRef, { borrowedBookId: bookId });

        // 3. Update Book
        const bookRef = ref(db, `books/${bookId}`);
        const bookSnapshot = await get(bookRef);
        if (bookSnapshot.exists()) {
            const currentBook = bookSnapshot.val() as Book;
            const currentCopies = currentBook.copiesAvailable || 0;
            const newCopies = currentCopies - 1;

            // Safety check
            if (newCopies < 0) throw new Error('No copies available to borrow');

            await update(bookRef, {
                copiesAvailable: newCopies,
                status: BookLogic.computeStatus(newCopies)
            });
        }
    },

    returnBook: async (userId: string, bookId: string, borrowRecordId: string, returnerId?: string) => {
        const recordRef = ref(db, `borrowRecords/${borrowRecordId}`);
        const recordSnapshot = await get(recordRef);

        let penaltyDays = 0;
        if (recordSnapshot.exists()) {
            const record = recordSnapshot.val();
            const dueDate = new Date(record.dueDate);
            const returnDate = new Date();

            if (returnDate > dueDate) {
                const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
                penaltyDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }

        // 1. Mark Record returned & update penalty & recordedBy
        await update(recordRef, {
            returnDate: new Date().toISOString(),
            penaltyDays: penaltyDays,
            returnedBy: returnerId || null
        });

        // 2. Update User
        const userRef = ref(db, `users/${userId}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
            const prevCount = userSnapshot.val().previousBooksCount || 0;
            await update(userRef, {
                borrowedBookId: null,
                previousBooksCount: prevCount + 1
            });
        }

        // 3. Update Book
        const bookRef = ref(db, `books/${bookId}`);
        const bookSnapshot = await get(bookRef);
        if (bookSnapshot.exists()) {
            const currentBook = bookSnapshot.val() as Book;
            const currentCopies = currentBook.copiesAvailable || 0;
            const newCopies = currentCopies + 1;

            // Safety check
            if (newCopies > (currentBook.copiesTotal || 0)) {
                console.warn('[BorrowingAPI] Returning more copies than total. Normalizing.');
            }

            await update(bookRef, {
                copiesAvailable: Math.min(newCopies, currentBook.copiesTotal),
                status: BookLogic.computeStatus(newCopies)
            });
        }
    },

    getByUserId: async (userId: string): Promise<BorrowRecord[]> => {
        try {
            // 1. Get from SQLite first
            const cached = await StorageService.getCollection<BorrowRecord>('borrowRecords');
            return cached.filter(r => r.userId === userId);
        } catch (error) {
            console.error('[BorrowingAPI] getByUserId failed:', error);
            return [];
        }
    },

    getActiveCount: async (): Promise<number> => {
        try {
            const users = await StorageService.getCollection<User>('users');
            return users.filter(u => !!u.borrowedBookId).length;
        } catch (error) {
            console.error('[BorrowingAPI] getActiveCount failed:', error);
            return 0;
        }
    },

    getOverdueCount: async (): Promise<number> => {
        try {
            const records = await StorageService.getCollection<BorrowRecord>('borrowRecords');
            const now = new Date();
            return records.filter(r => !r.returnDate && new Date(r.dueDate) < now).length;
        } catch (error) {
            console.error('[BorrowingAPI] getOverdueCount failed:', error);
            return 0;
        }
    }
};

// ==========================================
// SUBSCRIPTIONS API
// ==========================================
export const SubscriptionsAPI = {
    getByUserId: async (userId: string): Promise<Subscription | null> => {
        try {
            const cached = await StorageService.getCollection<Subscription>('subscriptions');
            const userSubs = cached.filter(s => s.userId === userId);
            if (userSubs.length > 0) {
                userSubs.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
                return userSubs[0];
            }
            return null;
        } catch (error) {
            console.error(`[SubscriptionsAPI] getByUserId failed:`, error);
            return null;
        }
    },

    create: async (subscription: Omit<Subscription, 'id'>): Promise<string> => {
        try {
            subscription.createdAt = new Date().toISOString();
            const subsRef = ref(db, 'subscriptions');
            const newRef = await push(subsRef, subscription);
            return newRef.key as string;
        } catch (error) {
            console.error(`[SubscriptionsAPI] create failed:`, error);
            throw error;
        }
    },

    update: async (id: string, updates: Partial<Subscription>) => {
        try {
            const subRef = ref(db, `subscriptions/${id}`);
            await update(subRef, updates);
        } catch (error) {
            console.error(`[SubscriptionsAPI] update failed:`, error);
            throw error;
        }
    },

    getAll: async (): Promise<Subscription[]> => {
        try {
            const subsRef = ref(db, 'subscriptions');
            const snapshot = await get(subsRef);
            if (snapshot.exists()) {
                return objectToArray<Subscription>(snapshot.val());
            }
            return [];
        } catch (error) {
            console.error(`[SubscriptionsAPI] getAll failed:`, error);
            throw error;
        }
    }
};

// ==========================================
// CHAT API
// ==========================================
export const ChatAPI = {
    sendMessage: async (message: ChatMessage | Omit<ChatMessage, 'id' | 'createdAt' | 'timestamp'>) => {
        try {
            const { bookId } = message as ChatMessage;
            const tempId = (message as ChatMessage).id;
            const msgRef = tempId ? ref(db, `chats/${bookId}/${tempId}`) : push(ref(db, `chats/${bookId}`));

            const msg: ChatMessage = {
                createdAt: new Date().toISOString(),
                timestamp: Date.now(),
                ...message,
                id: tempId || msgRef.key!,
            } as ChatMessage;

            if (!msg.type) (msg as any).type = 'normal';

            // Remove undefined values
            Object.keys(msg).forEach(key => (msg as any)[key] === undefined && delete (msg as any)[key]);

            await set(msgRef, msg);
            return msg;
        } catch (error) {
            console.error('[ChatAPI] sendMessage failed:', error);
            throw error;
        }
    },

    deleteMessage: async (bookId: string, messageId: string) => {
        try {
            const msgRef = ref(db, `chats/${bookId}/${messageId}`);
            await remove(msgRef);
        } catch (error) {
            console.error('[ChatAPI] deleteMessage failed:', error);
            throw error;
        }
    },

    getMessages: async (bookId: string, limit: number = 20, beforeTimestamp?: number): Promise<ChatMessage[]> => {
        try {
            return await StorageService.getMessages(bookId, limit, beforeTimestamp ?? null, false);
        } catch (error) {
            console.error('[ChatAPI] getMessages failed:', error);
            return [];
        }
    },

    fetchOlderMessages: async (bookId: string, limit: number = 20, beforeTimestamp: number): Promise<ChatMessage[]> => {
        try {
            const chatRef = query(
                ref(db, `chats/${bookId}`),
                orderByChild('timestamp'),
                endBefore(beforeTimestamp),
                limitToLast(limit)
            );
            const snapshot = await get(chatRef);
            if (!snapshot.exists()) return [];

            const messages: ChatMessage[] = [];
            snapshot.forEach(child => {
                messages.push({ id: child.key, ...child.val() });
            });

            // Save to local cache
            for (const msg of messages) {
                await StorageService.saveMessage(bookId, msg, false);
            }

            return messages;
        } catch (error) {
            console.error('[ChatAPI] fetchOlderMessages failed:', error);
            return [];
        }
    },

    listenToMessages: (bookId: string, onUpdate: (msg: ChatMessage) => void) => {
        const path = `chats/${bookId}`;
        const chatRef = query(ref(db, path), limitToLast(50));

        const handleSnapshot = (snapshot: any) => {
            if (snapshot.exists()) {
                const message = { id: snapshot.key, ...snapshot.val() } as ChatMessage;
                // Instant update for UI, then persist
                onUpdate(message);
                StorageService.saveMessage(bookId, message, false);
            }
        };

        const addedSub = onChildAdded(chatRef, handleSnapshot);
        const changedSub = onChildChanged(chatRef, handleSnapshot);

        return () => {
            off(chatRef, 'child_added', addedSub);
            off(chatRef, 'child_changed', changedSub);
        };
    },

    toggleReaction: async (bookId: string, messageId: string, emoji: string | null, userId: string) => {
        try {
            const reactionRef = ref(db, `chats/${bookId}/${messageId}/reactions/${userId}`);
            // If user taps the same emoji, it should be removed (handled at screen level by passing null)
            await set(reactionRef, emoji);
        } catch (error) {
            console.error('[ChatAPI] toggleReaction failed:', error);
            throw error;
        }
    }
};

// ==========================================
// LIBRARY CHAT API
// ==========================================
export const LibraryChatAPI = {
    sendMessage: async (message: LibraryChatMessage | Omit<LibraryChatMessage, 'id' | 'createdAt' | 'timestamp'>) => {
        try {
            const tempId = (message as LibraryChatMessage).id;
            const msgRef = tempId ? ref(db, `libraryMessages/${tempId}`) : push(ref(db, `libraryMessages`));

            const msg: LibraryChatMessage = {
                createdAt: new Date().toISOString(),
                timestamp: Date.now(),
                ...message,
                id: tempId || msgRef.key!,
            } as LibraryChatMessage;

            if (!msg.type) (msg as any).type = 'normal';

            // Remove undefined values
            Object.keys(msg).forEach(key => (msg as any)[key] === undefined && delete (msg as any)[key]);

            await set(msgRef, msg);
            return msg;
        } catch (error) {
            console.error('[LibraryChatAPI] sendMessage failed:', error);
            throw error;
        }
    },

    deleteMessage: async (messageId: string) => {
        try {
            const msgRef = ref(db, `libraryMessages/${messageId}`);
            await remove(msgRef);
        } catch (error) {
            console.error('[LibraryChatAPI] deleteMessage failed:', error);
            throw error;
        }
    },

    getMessages: async (limit: number = 20, beforeTimestamp?: number): Promise<LibraryChatMessage[]> => {
        try {
            return await StorageService.getMessages('global', limit, beforeTimestamp ?? null, true);
        } catch (error) {
            console.error('[LibraryChatAPI] getMessages failed:', error);
            return [];
        }
    },

    fetchOlderMessages: async (limit: number = 20, beforeTimestamp: number): Promise<LibraryChatMessage[]> => {
        try {
            const chatRef = query(
                ref(db, `libraryMessages`),
                orderByChild('timestamp'),
                endBefore(beforeTimestamp),
                limitToLast(limit)
            );
            const snapshot = await get(chatRef);
            if (!snapshot.exists()) return [];

            const messages: LibraryChatMessage[] = [];
            snapshot.forEach(child => {
                messages.push({ id: child.key, ...child.val() });
            });

            // Save to local cache
            for (const msg of messages) {
                await StorageService.saveMessage('global', msg, true);
            }

            return messages;
        } catch (error) {
            console.error('[LibraryChatAPI] fetchOlderMessages failed:', error);
            return [];
        }
    },

    listenToMessages: (onUpdate: (msg: LibraryChatMessage) => void) => {
        const path = `libraryMessages`;
        const chatRef = query(ref(db, path), limitToLast(50));

        const handleSnapshot = (snapshot: any) => {
            if (snapshot.exists()) {
                const message = { id: snapshot.key, ...snapshot.val() } as LibraryChatMessage;
                // Instant update for UI, then persist
                onUpdate(message);
                StorageService.saveMessage('global', message, true);
            }
        };

        const addedSub = onChildAdded(chatRef, handleSnapshot);
        const changedSub = onChildChanged(chatRef, handleSnapshot);

        return () => {
            off(chatRef, 'child_added', addedSub);
            off(chatRef, 'child_changed', changedSub);
        };
    },

    toggleReaction: async (messageId: string, emoji: string | null, userId: string) => {
        try {
            const reactionRef = ref(db, `libraryMessages/${messageId}/reactions/${userId}`);
            await set(reactionRef, emoji);
        } catch (error) {
            console.error('[LibraryChatAPI] toggleReaction failed:', error);
            throw error;
        }
    }
};

// ==========================================
// NOTIFICATIONS API
// ==========================================
export const NotificationsAPI = {
    getAll: async (): Promise<AppNotification[]> => {
        try {
            // 1. Get from SQLite first (Instant load)
            const cached = await StorageService.getCollection<AppNotification>('notifications');
            const sortedCache = cached.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            return sortedCache;
        } catch (error) {
            console.error('[NotificationsAPI] getAll failed:', error);
            return [];
        }
    },

    listenToLatest: (callback: (notification: AppNotification | null) => void) => {
        const notifsRef = ref(db, 'notifications');
        const q = query(notifsRef, orderByChild('createdAt'));

        const unsubscribe = onValue(q, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const notifs = objectToArray<AppNotification>(data).sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                callback(notifs[0] || null);
            } else {
                callback(null);
            }
        });

        return () => off(notifsRef, 'value', unsubscribe);
    },

    markAsSeen: async (userId: string, notifId: string): Promise<void> => {
        try {
            const seenRef = ref(db, `userNotifications/${userId}/seen/${notifId}`);
            await set(seenRef, {
                seen: true,
                seenAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('[NotificationsAPI] markAsSeen failed:', error);
            throw error;
        }
    },

    markMultipleAsSeen: async (userId: string, notifIds: string[]): Promise<void> => {
        try {
            const updates: Record<string, any> = {};
            const now = new Date().toISOString();
            notifIds.forEach(id => {
                updates[`userNotifications/${userId}/seen/${id}`] = {
                    seen: true,
                    seenAt: now
                };
            });
            await update(ref(db), updates);
        } catch (error) {
            console.error('[NotificationsAPI] markMultipleAsSeen failed:', error);
            throw error;
        }
    },

    isSeen: async (userId: string, notifId: string): Promise<boolean> => {
        try {
            const seenRef = ref(db, `userNotifications/${userId}/seen/${notifId}`);
            const snapshot = await get(seenRef);
            return snapshot.exists();
        } catch (error) {
            console.error('[NotificationsAPI] isSeen failed:', error);
            return false;
        }
    },

    markAsDeleted: async (userId: string, notifId: string): Promise<void> => {
        try {
            const deletedRef = ref(db, `userNotifications/${userId}/deleted/${notifId}`);
            await set(deletedRef, true);
        } catch (error) {
            console.error('[NotificationsAPI] markAsDeleted failed:', error);
            throw error;
        }
    },

    getDeletedIds: async (userId: string): Promise<string[]> => {
        try {
            const cached = await StorageService.getCollection<string>(`user_${userId}_deleted`);
            return cached || [];
        } catch (error) {
            console.error('[NotificationsAPI] getDeletedIds failed:', error);
            return [];
        }
    },

    deleteGlobally: async (notifId: string): Promise<void> => {
        try {
            const notifRef = ref(db, `notifications/${notifId}`);
            await remove(notifRef);
        } catch (error) {
            console.error('[NotificationsAPI] deleteGlobally failed:', error);
            throw error;
        }
    },

    getSeenIds: async (userId: string): Promise<string[]> => {
        try {
            const cached = await StorageService.getCollection<string>(`user_${userId}_seen`);
            return cached || [];
        } catch (error) {
            console.error('[NotificationsAPI] getSeenIds failed:', error);
            return [];
        }
    }
};

// ==========================================
// DEPRECATED STUDENTS API (For Migration Only)
// ==========================================
export const StudentsAPI = {
    getAll: async (): Promise<Student[]> => {
        const snapshot = await get(ref(db, 'students'));
        return snapshot.exists() ? objectToArray<Student>(snapshot.val()) : [];
    },
    getByPhone: async (phone: string): Promise<Student | null> => {
        const snapshot = await get(query(ref(db, 'students'), orderByChild('phone'), equalTo(phone)));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const keys = Object.keys(data);
            return { id: keys[0], ...data[keys[0]] } as Student;
        }
        return null;
    }
};
