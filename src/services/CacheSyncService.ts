import { ref, onValue, off, limitToLast, query, onChildAdded } from 'firebase/database';
import { db } from './firebase';
import { StorageService } from './StorageService';

const collections = [
    { name: 'books', path: 'books' },
    { name: 'fields', path: 'fields' },
    { name: 'notifications', path: 'notifications' },
    { name: 'borrowRecords', path: 'borrowRecords' },
    { name: 'users', path: 'users' },
];

export const CacheSyncService = {
    startSync: () => {
        console.log('[CacheSyncService] Initializing real-time collection sync...');

        const cleanupFunctions: (() => void)[] = [];

        collections.forEach(collection => {
            const collectionRef = ref(db, collection.path);

            const unsubscribe = onValue(collectionRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const arrayData = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));

                    console.log(`[CacheSyncService] Syncing ${collection.name} (${arrayData.length} items)`);
                    StorageService.saveCollection(collection.name, arrayData);
                }
            }, (error) => {
                console.error(`[CacheSyncService] Sync failed for ${collection.name}:`, error);
            });

            cleanupFunctions.push(() => off(collectionRef, 'value', unsubscribe));
        });

        return () => {
            console.log('[CacheSyncService] Stopping collection sync...');
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    },

    syncChat: (id: string, isGlobal: boolean = false) => {
        const path = isGlobal ? 'libraryMessages' : `chats/${id}`;
        console.log(`[CacheSyncService] Starting incremental sync for: ${path}`);
        const chatRef = query(ref(db, path), limitToLast(50));

        const unsubscribe = onChildAdded(chatRef, (snapshot) => {
            if (snapshot.exists()) {
                const message = { id: snapshot.key, ...snapshot.val() } as any;
                StorageService.saveMessage(id, message, isGlobal);
            }
        });

        return () => {
            console.log(`[CacheSyncService] Stopping sync for ${path}`);
            off(chatRef, 'child_added', unsubscribe);
        };
    },

    syncUserMetadata: (userId: string) => {
        console.log(`[CacheSyncService] Starting user metadata sync for: ${userId}`);
        const userNotifRef = ref(db, `userNotifications/${userId}`);

        const unsubscribe = onValue(userNotifRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Store in split collections for easier retrieval
                const deletedIds = data.deleted ? Object.keys(data.deleted) : [];
                const seenIds = data.seen ? Object.keys(data.seen) : [];

                StorageService.saveCollection(`user_${userId}_deleted`, deletedIds);
                StorageService.saveCollection(`user_${userId}_seen`, seenIds);
            }
        });

        return () => {
            console.log(`[CacheSyncService] Stopping user metadata sync for ${userId}`);
            off(userNotifRef, 'value', unsubscribe);
        };
    }
};
