import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@cache_';

export const StorageService = {
    saveCollection: async <T>(key: string, data: T[]): Promise<void> => {
        try {
            await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
        } catch (error) {
            console.error(`[StorageService] saveCollection failed for ${key}:`, error);
        }
    },

    getCollection: async <T>(key: string): Promise<T[]> => {
        try {
            const data = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`[StorageService] getCollection failed for ${key}:`, error);
            return [];
        }
    },

    saveItem: async <T>(collectionKey: string, id: string, item: T): Promise<void> => {
        try {
            const collection = await StorageService.getCollection<any>(collectionKey);
            const index = collection.findIndex(i => i.id === id);
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
            const filtered = collection.filter(i => i.id !== id);
            await StorageService.saveCollection(collectionKey, filtered);
        } catch (error) {
            console.error(`[StorageService] deleteItem failed for ${collectionKey}/${id}:`, error);
        }
    },

    clearCache: async (): Promise<void> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (error) {
            console.error('[StorageService] clearCache failed:', error);
        }
    }
};
