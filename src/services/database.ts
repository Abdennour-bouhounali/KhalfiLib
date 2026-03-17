import { ref, get, push, update, remove, query, orderByChild, equalTo, set, onValue, off } from 'firebase/database';
import { db } from './firebase';

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
    status: 'available' | 'low' | 'unavailable';
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
    imageUrl?: string;
    reactions?: Record<string, number>; // e.g. { "👍": 2, "❤️": 1 }
    userReactionType?: Record<string, string>; // userId -> emoji
    replyToId?: string;
    createdAt: string;
    timestamp: number;
}

export interface LibraryChatMessage {
    id?: string;
    userId: string;
    text: string;
    imageUrl?: string;
    reactions?: Record<string, number>;
    userReactionType?: Record<string, string>;
    replyToId?: string;
    createdAt: string;
    timestamp: number;
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
// FIELDS (CATEGORIES) API
// ==========================================
export const FieldsAPI = {
    getAll: async (): Promise<Field[]> => {
        try {
            const fieldsRef = ref(db, 'fields');
            const snapshot = await get(fieldsRef);
            if (snapshot.exists()) {
                return objectToArray<Field>(snapshot.val());
            }
            return [];
        } catch (error) {
            console.error(`[FieldsAPI] getAll failed:`, error);
            throw error;
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
            const booksRef = ref(db, 'books');
            const snapshot = await get(booksRef);
            if (snapshot.exists()) {
                return objectToArray<Book>(snapshot.val());
            }
            return [];
        } catch (error) {
            console.error(`[BooksAPI] getAll failed:`, error);
            throw error;
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
            book.createdAt = new Date().toISOString();
            book.status = book.copiesAvailable === 0 ? 'unavailable' : (book.copiesAvailable < 3 ? 'low' : 'available');
            const booksRef = ref(db, 'books');
            const newRef = await push(booksRef, book);
            return newRef.key as string;
        } catch (error) {
            console.error(`[BooksAPI] create failed:`, error);
            throw error;
        }
    },

    update: async (id: string, book: Partial<Book>) => {
        if (book.copiesAvailable !== undefined) {
            book.status = book.copiesAvailable === 0 ? 'unavailable' : (book.copiesAvailable < 3 ? 'low' : 'available');
        }
        const bookRef = ref(db, `books/${id}`);
        await update(bookRef, book);
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
            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);
            if (snapshot.exists()) {
                const users = objectToArray<User>(snapshot.val());
                return role ? users.filter(u => u.role === role) : users;
            }
            return [];
        } catch (error) {
            console.error(`[UsersAPI] getAll failed:`, error);
            throw error;
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
            const currentCopies = bookSnapshot.val().copiesAvailable || 0;
            const newCopies = Math.max(0, currentCopies - 1);
            const newStatus = newCopies === 0 ? 'unavailable' : (newCopies < 3 ? 'low' : 'available');

            await update(bookRef, {
                copiesAvailable: newCopies,
                status: newStatus
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
            const currentCopies = bookSnapshot.val().copiesAvailable || 0;
            const newCopies = currentCopies + 1;
            const newStatus = newCopies === 0 ? 'unavailable' : (newCopies < 3 ? 'low' : 'available');

            await update(bookRef, {
                copiesAvailable: newCopies,
                status: newStatus
            });
        }
    },

    getByUserId: async (userId: string): Promise<BorrowRecord[]> => {
        try {
            const recordsRef = ref(db, 'borrowRecords');
            const userQuery = query(recordsRef, orderByChild('userId'), equalTo(userId));
            const snapshot = await get(userQuery);
            if (snapshot.exists()) {
                return objectToArray<BorrowRecord>(snapshot.val());
            }
            return [];
        } catch (error) {
            console.error('[BorrowingAPI] getByUserId failed:', error);
            throw error;
        }
    },

    getActiveCount: async (): Promise<number> => {
        try {
            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);
            if (!snapshot.exists()) return 0;

            const users = snapshot.val();
            return Object.values(users).filter((u: any) => !!u.borrowedBookId).length;
        } catch (error) {
            console.error('[BorrowingAPI] getActiveCount failed:', error);
            return 0;
        }
    },

    getOverdueCount: async (): Promise<number> => {
        try {
            const recordsRef = ref(db, 'borrowRecords');
            const snapshot = await get(recordsRef);
            if (!snapshot.exists()) return 0;

            const records = snapshot.val();
            const now = new Date();
            return Object.values(records).filter((r: any) =>
                !r.returnDate && new Date(r.dueDate) < now
            ).length;
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
            const subsRef = ref(db, 'subscriptions');
            const subQuery = query(subsRef, orderByChild('userId'), equalTo(userId));
            const snapshot = await get(subQuery);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const subs = objectToArray<Subscription>(data);
                subs.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
                return subs[0];
            }
            return null;
        } catch (error) {
            console.error(`[SubscriptionsAPI] getByUserId failed:`, error);
            throw error;
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
    sendMessage: async (message: Omit<ChatMessage, 'id' | 'createdAt' | 'timestamp'>) => {
        try {
            const msg: ChatMessage = {
                ...message,
                createdAt: new Date().toISOString(),
                timestamp: Date.now()
            };

            // Remove undefined values to avoid Firebase errors
            Object.keys(msg).forEach(key => {
                const k = key as keyof ChatMessage;
                if (msg[k] === undefined) {
                    delete msg[k];
                }
            });

            const chatRef = ref(db, `chats/${message.bookId}`);
            const newRef = await push(chatRef, msg);
            return newRef.key as string;
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

    toggleReaction: async (bookId: string, messageId: string, emoji: string, userId: string) => {
        try {
            const msgRef = ref(db, `chats/${bookId}/${messageId}`);
            const snapshot = await get(msgRef);
            if (!snapshot.exists()) return;

            const msg = snapshot.val() as ChatMessage;
            const currentReactions = msg.reactions || {};
            const userReactionType = msg.userReactionType || {};

            // If user already reacted with this emoji, remove it
            if (userReactionType[userId] === emoji) {
                currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
                delete userReactionType[userId];
            } else {
                // Remove previous reaction if any
                if (userReactionType[userId]) {
                    const oldEmoji = userReactionType[userId];
                    currentReactions[oldEmoji] = Math.max(0, (currentReactions[oldEmoji] || 1) - 1);
                }
                // Add new reaction
                currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
                userReactionType[userId] = emoji;
            }

            // Clean up 0 reactions
            Object.keys(currentReactions).forEach(key => {
                if (currentReactions[key] === 0) delete currentReactions[key];
            });

            await update(msgRef, {
                reactions: currentReactions,
                userReactionType: userReactionType
            });
        } catch (error) {
            console.error('[ChatAPI] toggleReaction failed:', error);
            throw error;
        }
    },

    listenToMessages: (bookId: string, callback: (messages: ChatMessage[]) => void) => {
        const chatRef = ref(db, `chats/${bookId}`);
        const q = query(chatRef, orderByChild('timestamp'));

        const unsubscribe = onValue(q, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                callback(objectToArray<ChatMessage>(data).sort((a, b) => a.timestamp - b.timestamp));
            } else {
                callback([]);
            }
        }, (error) => {
            console.error('[ChatAPI] listenToMessages error:', error);
        });

        return () => off(chatRef, 'value', unsubscribe);
    }
};

// ==========================================
// LIBRARY CHAT API
// ==========================================
export const LibraryChatAPI = {
    sendMessage: async (message: Omit<LibraryChatMessage, 'id' | 'createdAt' | 'timestamp'>) => {
        try {
            const msg: LibraryChatMessage = {
                ...message,
                createdAt: new Date().toISOString(),
                timestamp: Date.now()
            };

            // Remove undefined values to avoid Firebase errors
            Object.keys(msg).forEach(key => {
                const k = key as keyof LibraryChatMessage;
                if (msg[k] === undefined) {
                    delete msg[k];
                }
            });

            const chatRef = ref(db, `libraryMessages`);
            const newRef = await push(chatRef, msg);
            return newRef.key as string;
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

    toggleReaction: async (messageId: string, emoji: string, userId: string) => {
        try {
            const msgRef = ref(db, `libraryMessages/${messageId}`);
            const snapshot = await get(msgRef);
            if (!snapshot.exists()) return;

            const msg = snapshot.val() as LibraryChatMessage;
            const currentReactions = msg.reactions || {};
            const userReactionType = msg.userReactionType || {};

            // If user already reacted with this emoji, remove it
            if (userReactionType[userId] === emoji) {
                currentReactions[emoji] = Math.max(0, (currentReactions[emoji] || 1) - 1);
                delete userReactionType[userId];
            } else {
                // Remove previous reaction if any
                if (userReactionType[userId]) {
                    const oldEmoji = userReactionType[userId];
                    currentReactions[oldEmoji] = Math.max(0, (currentReactions[oldEmoji] || 1) - 1);
                }
                // Add new reaction
                currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
                userReactionType[userId] = emoji;
            }

            // Clean up 0 reactions
            Object.keys(currentReactions).forEach(key => {
                if (currentReactions[key] === 0) delete currentReactions[key];
            });

            await update(msgRef, {
                reactions: currentReactions,
                userReactionType: userReactionType
            });
        } catch (error) {
            console.error('[LibraryChatAPI] toggleReaction failed:', error);
            throw error;
        }
    },

    listenToMessages: (callback: (messages: LibraryChatMessage[]) => void) => {
        const chatRef = ref(db, `libraryMessages`);
        const q = query(chatRef, orderByChild('timestamp'));

        const unsubscribe = onValue(q, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                callback(objectToArray<LibraryChatMessage>(data).sort((a, b) => a.timestamp - b.timestamp));
            } else {
                callback([]);
            }
        }, (error) => {
            console.error('[LibraryChatAPI] listenToMessages error:', error);
        });

        return () => off(chatRef, 'value', unsubscribe);
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
