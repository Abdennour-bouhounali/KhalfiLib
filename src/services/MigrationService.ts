import { ref, get, update, remove, set } from 'firebase/database';
import { db } from './firebase';
import { UsersAPI, StudentsAPI, BorrowingAPI, SubscriptionsAPI, BorrowRecord, Subscription, User } from './database';

export const MigrationService = {
    migrateStudentsToUsers: async () => {
        console.log('[Migration] Starting migration...');

        try {
            // 1. Get all students and users
            const students = await StudentsAPI.getAll();
            const users = await UsersAPI.getAll();

            console.log(`[Migration] Found ${students.length} students and ${users.length} users.`);

            const studentIdToUserIdMap: Record<string, string> = {};

            for (const student of students) {
                console.log(`[Migration] Processing student: ${student.firstName} ${student.lastName} (${student.phone})`);

                // Check if user already exists by phone
                let existingUser = users.find(u => u.phone === student.phone);
                let userId: string;

                if (existingUser) {
                    userId = existingUser.id!;
                    console.log(`[Migration] User already exists for phone ${student.phone}. Updating...`);

                    // Update user with student data
                    await update(ref(db, `users/${userId}`), {
                        firstName: student.firstName,
                        lastName: student.lastName,
                        profileImage: student.profilePicture || null,
                        birthdate: student.birthdate,
                        borrowedBookId: student.borrowedBookId || null,
                        previousBooksCount: student.previousBooksCount || 0,
                        // Preserve role if already set, else default to student
                        role: existingUser.role || 'student'
                    });
                } else {
                    console.log(`[Migration] Creating new user for student ${student.firstName}.`);
                    // Create new user
                    const newUser: Omit<User, 'id'> = {
                        firstName: student.firstName,
                        lastName: student.lastName,
                        name: `${student.firstName} ${student.lastName}`,
                        phone: student.phone,
                        passwordHash: 'MIGRATED', // Placeholder, user needs to reset OR we use a default
                        role: 'student',
                        status: 'active',
                        profileImage: student.profilePicture || undefined,
                        birthdate: student.birthdate,
                        borrowedBookId: student.borrowedBookId || null,
                        previousBooksCount: student.previousBooksCount || 0,
                        createdAt: student.createdAt || new Date().toISOString()
                    };
                    userId = await UsersAPI.create(newUser);
                }

                studentIdToUserIdMap[student.id!] = userId;
            }

            // 2. Migrate Borrow Records
            console.log('[Migration] Migrating borrow records...');
            const recordsSnapshot = await get(ref(db, 'borrowRecords'));
            if (recordsSnapshot.exists()) {
                const records = recordsSnapshot.val();
                for (const recordId in records) {
                    const record = records[recordId];
                    if (record.studentId && studentIdToUserIdMap[record.studentId]) {
                        const newUserId = studentIdToUserIdMap[record.studentId];
                        console.log(`[Migration] Updating record ${recordId}: studentId ${record.studentId} -> userId ${newUserId}`);

                        const updates: any = {
                            userId: newUserId
                        };
                        // Remove studentId field
                        await update(ref(db, `borrowRecords/${recordId}`), updates);
                        await remove(ref(db, `borrowRecords/${recordId}/studentId`));
                    }
                }
            }

            // 3. Migrate Subscriptions
            console.log('[Migration] Migrating subscriptions...');
            const subsSnapshot = await get(ref(db, 'subscriptions'));
            if (subsSnapshot.exists()) {
                const subs = subsSnapshot.val();
                for (const subId in subs) {
                    const sub = subs[subId];
                    if (sub.studentId && studentIdToUserIdMap[sub.studentId]) {
                        const newUserId = studentIdToUserIdMap[sub.studentId];
                        console.log(`[Migration] Updating subscription ${subId}: studentId ${sub.studentId} -> userId ${newUserId}`);

                        await update(ref(db, `subscriptions/${subId}`), {
                            userId: newUserId
                        });
                        await remove(ref(db, `subscriptions/${subId}/studentId`));
                    }
                }
            }

            console.log('[Migration] Migration completed successfully.');
            return { success: true, migratedCount: students.length };
        } catch (error) {
            console.error('[Migration] Migration failed:', error);
            throw error;
        }
    },

    cleanupStudentsTable: async () => {
        console.log('[Migration] Cleaning up students table...');
        await remove(ref(db, 'students'));
    }
};
