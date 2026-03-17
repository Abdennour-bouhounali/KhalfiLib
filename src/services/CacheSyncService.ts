import { ref, onValue, off } from 'firebase/database';
import { db } from './firebase';
import { StorageService } from './StorageService';

const collections = [
    { name: 'books', path: 'books' },
    { name: 'fields', path: 'fields' },
    { name: 'notifications', path: 'notifications' },
    { name: 'borrowRecords', path: 'borrowRecords' },
];

export const CacheSyncService = {
    startSync: () => {
        console.log('[CacheSyncService] Initializing real-time sync...');

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
                } else {
                    StorageService.saveCollection(collection.name, []);
                }
            }, (error) => {
                console.error(`[CacheSyncService] Sync failed for ${collection.name}:`, error);
            });

            cleanupFunctions.push(() => off(collectionRef, 'value', unsubscribe));
        });

        return () => {
            console.log('[CacheSyncService] Stopping sync...');
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }
};
