import * as SQLite from 'expo-sqlite';

const DB_NAME = 'khalfilib_v3.db'; // Switched to v3 to ensure clean schema if needed

export const SQLiteService = {
    db: null as any,
    initPromise: null as Promise<any> | null,

    init: async () => {
        if (SQLiteService.db) return SQLiteService.db;
        if (SQLiteService.initPromise) return SQLiteService.initPromise;

        SQLiteService.initPromise = (async () => {
            try {
                console.log('[SQLiteService] Initializing database...');
                const db = await SQLite.openDatabaseAsync(DB_NAME);

                await db.execAsync(`
                    PRAGMA journal_mode = WAL;
                    PRAGMA synchronous = NORMAL;

                    CREATE TABLE IF NOT EXISTS collections (
                        id TEXT PRIMARY KEY,
                        data TEXT NOT NULL,
                        updatedAt INTEGER NOT NULL
                    );

                    CREATE TABLE IF NOT EXISTS messages (
                        id TEXT PRIMARY KEY,
                        bookId TEXT NOT NULL,
                        data TEXT NOT NULL,
                        createdAt INTEGER NOT NULL,
                        timestamp INTEGER NOT NULL,
                        isGlobal INTEGER DEFAULT 0
                    );

                    CREATE INDEX IF NOT EXISTS idx_messages_bookId ON messages(bookId);
                    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
                    CREATE INDEX IF NOT EXISTS idx_messages_isGlobal ON messages(isGlobal);
                `);

                SQLiteService.db = db;
                console.log('[SQLiteService] Database ready');
                return db;
            } catch (error) {
                console.error('[SQLiteService] Initialization failed:', error);
                SQLiteService.initPromise = null;
                throw error;
            }
        })();

        return SQLiteService.initPromise;
    },

    getDb: async () => {
        if (!SQLiteService.db) {
            return await SQLiteService.init();
        }
        return SQLiteService.db;
    },

    // Generic collection handler
    saveToCollection: async (id: string, data: any) => {
        try {
            const db = await SQLiteService.getDb();
            const json = JSON.stringify(data);
            const now = Date.now();
            await db.runAsync(
                'INSERT OR REPLACE INTO collections (id, data, updatedAt) VALUES (?, ?, ?)',
                [id, json, now]
            );
        } catch (error) {
            console.error(`[SQLiteService] saveToCollection failed for ${id}:`, error);
        }
    },

    getFromCollection: async (id: string) => {
        try {
            const db = await SQLiteService.getDb();
            const result = await db.getFirstAsync(
                'SELECT data FROM collections WHERE id = ?',
                [id]
            ) as { data: string } | null;
            return result ? JSON.parse(result.data) : null;
        } catch (error) {
            console.error(`[SQLiteService] getFromCollection failed for ${id}:`, error);
            return null;
        }
    },

    deleteFromCollection: async (id: string) => {
        try {
            const db = await SQLiteService.getDb();
            await db.runAsync('DELETE FROM collections WHERE id = ?', [id]);
        } catch (error) {
            console.error(`[SQLiteService] deleteFromCollection failed for ${id}:`, error);
        }
    },

    // Chat specialized methods
    saveMessage: async (msg: any, bookId: string, isGlobal: boolean = false) => {
        try {
            const db = await SQLiteService.getDb();
            const json = JSON.stringify(msg);
            const ts = msg.timestamp || new Date(msg.createdAt).getTime();
            const createdAt = new Date(msg.createdAt).getTime();

            await db.runAsync(
                'INSERT OR REPLACE INTO messages (id, bookId, data, createdAt, timestamp, isGlobal) VALUES (?, ?, ?, ?, ?, ?)',
                [msg.id, bookId, json, createdAt, ts, isGlobal ? 1 : 0]
            );
        } catch (error) {
            console.error('[SQLiteService] saveMessage failed:', error);
        }
    },

    getMessages: async (bookId: string, limit: number = 20, beforeTimestamp: number | null = null, isGlobal: boolean = false) => {
        try {
            const db = await SQLiteService.getDb();
            const query = beforeTimestamp
                ? 'SELECT data FROM messages WHERE bookId = ? AND isGlobal = ? AND timestamp < ? ORDER BY timestamp DESC LIMIT ?'
                : 'SELECT data FROM messages WHERE bookId = ? AND isGlobal = ? ORDER BY timestamp DESC LIMIT ?';
            const params = beforeTimestamp
                ? [bookId, isGlobal ? 1 : 0, beforeTimestamp, limit]
                : [bookId, isGlobal ? 1 : 0, limit];

            const results = await db.getAllAsync(query, params) as { data: string }[];

            const messages = results.map((r: { data: string }) => JSON.parse(r.data));
            return messages.reverse(); // Standard ordering (oldest first)
        } catch (error) {
            console.error('[SQLiteService] getMessages failed:', error);
            return [];
        }
    },

    clearAll: async () => {
        try {
            const db = await SQLiteService.getDb();
            await db.execAsync('DELETE FROM collections; DELETE FROM messages;');
        } catch (error) {
            console.error('[SQLiteService] clearAll failed:', error);
        }
    }
};
