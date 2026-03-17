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
        } catch (error) {
            console.error('[SeedService] Seeding failed:', error);
        }
    }
};
