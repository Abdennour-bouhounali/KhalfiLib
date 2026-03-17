import * as Crypto from 'expo-crypto';
import { UsersAPI, User, UserRole } from './database';

export const AuthService = {
    hashPassword: async (password: string): Promise<string> => {
        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            password
        );
    },

    register: async (name: string, phone: string, password: string, role: UserRole, additionalFields?: Partial<User>): Promise<string> => {
        // Check if phone already exists
        const existingUser = await UsersAPI.getByPhone(phone);
        if (existingUser) {
            throw new Error('رقم الهاتف مسجل بالفعل');
        }

        const passwordHash = await AuthService.hashPassword(password);

        const newUser: Omit<User, 'id'> = {
            ...additionalFields,
            name,
            phone,
            passwordHash,
            role,
            status: 'pending', // All new accounts are pending
        };

        return await UsersAPI.create(newUser);
    },

    login: async (phone: string, password: string): Promise<User> => {
        const user = await UsersAPI.getByPhone(phone);
        if (!user) {
            throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
        }

        const passwordHash = await AuthService.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            throw new Error('رقم الهاتف أو كلمة المرور غير صحيحة');
        }

        if (user.status === 'inactive') {
            throw new Error('هذا الحساب معطل');
        }

        if (user.status === 'rejected') {
            throw new Error('تم رفض طلب إنشاء الحساب');
        }

        return user;
    }
};
