import { SQLiteService } from './SQLiteService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageService = {
    // Collection-based operations (Now powered by SQLite)
    saveCollection: async <T>(key: string, data: T[]): Promise<void> => {
        try {
            await SQLiteService.saveToCollection(key, data);
        } catch (error) {
            console.error(`[StorageService] saveCollection failed for ${key}:`, error);
        }
    },

    getCollection: async <T>(key: string): Promise<T[]> => {
        try {
            const data = await SQLiteService.getFromCollection(key);
            return data || [];
        } catch (error) {
            console.error(`[StorageService] getCollection failed for ${key}:`, error);
            return [];
        }
    },

    saveItem: async <T>(collectionKey: string, id: string, item: T): Promise<void> => {
        try {
            const collection = await StorageService.getCollection<any>(collectionKey);
            const index = collection.findIndex(i => (i.id === id || i.userId === id)); // Support different ID keys
            if (index > -1) {
                collection[index] = { ...collection[index], ...item };
            } else {
                collection.push({ id, ...item });
            }
            await StorageService.saveCollection(collectionKey, collection);
        } catch (error) {
            console.error(`[StorageService] saveItem failed for ${collectionKey}/${id}:`, error);
        }
    },

    deleteItem: async (collectionKey: string, id: string): Promise<void> => {
        try {
            const collection = await StorageService.getCollection<any>(collectionKey);
            const filtered = collection.filter(i => (i.id !== id && i.userId !== id));
            await StorageService.saveCollection(collectionKey, filtered);
        } catch (error) {
            console.error(`[StorageService] deleteItem failed for ${collectionKey}/${id}:`, error);
        }
    },

    // Chat specialized operations
    saveMessage: async (bookId: string, message: any, isGlobal: boolean = false) => {
        await SQLiteService.saveMessage(message, bookId, isGlobal);
    },

    getMessages: async (bookId: string, limit: number = 20, offset: number = 0, isGlobal: boolean = false) => {
        return await SQLiteService.getMessages(bookId, limit, offset, isGlobal);
    },

    clearCache: async (): Promise<void> => {
        try {
            await SQLiteService.clearAll();
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith('@cache_'));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (error) {
            console.error('[StorageService] clearCache failed:', error);
        }
    }
};
