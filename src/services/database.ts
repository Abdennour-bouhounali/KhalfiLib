import { ref, get, push, update, remove, query, orderByChild, equalTo } from 'firebase/database';
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

export interface Student {
    id?: string;
    firstName: string;
    lastName: string;
    birthdate: string;
    phone: string;
    profilePicture?: string; // Base64 or URI
    borrowedBookId?: string | null;
    previousBooksCount: number;
    createdAt?: string; // Stored as ISO string in RTDB
}

export interface BorrowRecord {
    id?: string;
    studentId: string;
    bookId: string;
    borrowDate: string; // ISO string
    returnDate?: string | null; // ISO string
    dueDate: string; // ISO string
    penaltyDays: number;
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
            console.log(`[FieldsAPI] getAll fetched from RTDB. Exists: ${snapshot.exists()}`);
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
// STUDENTS API
// ==========================================
export const StudentsAPI = {
    getAll: async (): Promise<Student[]> => {
        try {
            const studentsRef = ref(db, 'students');
            const snapshot = await get(studentsRef);
            if (snapshot.exists()) {
                return objectToArray<Student>(snapshot.val());
            }
            return [];
        } catch (error) {
            console.error(`[StudentsAPI] getAll failed:`, error);
            throw error;
        }
    },

    create: async (student: Omit<Student, 'id' | 'previousBooksCount'>): Promise<string> => {
        const newStudent = {
            ...student,
            previousBooksCount: 0,
            profilePicture: student.profilePicture || null,
            createdAt: new Date().toISOString()
        };
        const studentsRef = ref(db, 'students');
        const newRef = await push(studentsRef, newStudent);
        return newRef.key as string;
    },

    update: async (id: string, student: Partial<Student>) => {
        const studentRef = ref(db, `students/${id}`);
        await update(studentRef, student);
    },

    delete: async (id: string) => {
        const studentRef = ref(db, `students/${id}`);
        await remove(studentRef);
    }
};

// ==========================================
// BORROW/RETURN LOGIC
// ==========================================
export const BorrowingAPI = {
    borrowBook: async (studentId: string, bookId: string, daysToBorrow: number) => {
        const borrowDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysToBorrow);

        const borrowRecord = {
            studentId,
            bookId,
            borrowDate: borrowDate.toISOString(),
            dueDate: dueDate.toISOString(),
            penaltyDays: 0,
        };

        // 1. Create Record
        const recordsRef = ref(db, 'borrowRecords');
        await push(recordsRef, borrowRecord);

        // 2. Update Student
        const studentRef = ref(db, `students/${studentId}`);
        await update(studentRef, { borrowedBookId: bookId });

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

    returnBook: async (studentId: string, bookId: string, borrowRecordId: string) => {
        // 1. Fetch Record to get dueDate
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

        // 2. Mark Record returned & update penalty
        await update(recordRef, {
            returnDate: new Date().toISOString(),
            penaltyDays: penaltyDays
        });

        // 3. Update Student
        const studentRef = ref(db, `students/${studentId}`);
        const studentSnapshot = await get(studentRef);
        if (studentSnapshot.exists()) {
            const prevCount = studentSnapshot.val().previousBooksCount || 0;
            await update(studentRef, {
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

    getActiveCount: async (): Promise<number> => {
        try {
            const studentsRef = ref(db, 'students');
            const snapshot = await get(studentsRef);
            if (!snapshot.exists()) return 0;

            const students = snapshot.val();
            return Object.values(students).filter((s: any) => !!s.borrowedBookId).length;
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
