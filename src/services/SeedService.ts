import { db } from './firebase';
import { ref, get, set } from 'firebase/database';
import { UsersAPI } from './database';
import { AuthService } from './AuthService';

export const SeedService = {
    seedSuperAdmin: async () => {
        try {
            console.log('[SeedService] Checking for Super Admin...');

            // Check if super_admin exists
            const admins = await UsersAPI.getAll('super_admin');

            if (admins.length === 0) {
                console.log('[SeedService] No Super Admin found. Seeding...');

                const superAdminPhone = '0558985560';
                const superAdminPassword = 'AlgerDzAbdo@47khalfi#';

                const passwordHash = await AuthService.hashPassword(superAdminPassword);

                await UsersAPI.create({
                    name: 'Super Admin',
                    phone: superAdminPhone,
                    passwordHash: passwordHash,
                    role: 'super_admin',
                    status: 'active',
                });

                console.log('[SeedService] Super Admin seeded successfully.');
            } else {
                console.log('[SeedService] Super Admin already exists.');
            }

            // Seed default notification
            await SeedService.seedNotifications();
        } catch (error) {
            console.error('[SeedService] Seeding failed:', error);
        }
    },

    seedNotifications: async () => {
        try {
            const currentVersion = "1.0.0-3"; // Sync this with your build version
            const notifId = `notif_${currentVersion.replace(/\./g, '_')}`;
            const notifRef = ref(db, `notifications/${notifId}`);
            const snapshot = await get(notifRef);

            if (!snapshot.exists()) {
                console.log(`[SeedService] Seeding notification for version ${currentVersion}...`);
                await set(notifRef, {
                    title: "تحديث جديد متوفر",
                    message: "اضغط لتحميل آخر نسخة من التطبيق لضمان الحصول على أفضل تجربة ومميزات جديدة.",
                    link: "https://github.com/Abdennour-bouhounali/KhalfiLib/releases/download/v1.0.0-8/library-app-v1.0.0.apk",

                    type: "update",
                    createdAt: new Date().toISOString(),
                    createdBy: "super_admin_system"
                });
            }
        } catch (error) {
            console.error('[SeedService] Notification seeding failed:', error);
        }
    }
};
