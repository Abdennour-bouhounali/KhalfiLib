import * as SQLite from 'expo-sqlite';

const DB_NAME = 'khalfilib_v2.db';

export const SQLiteService = {
    db: null as any,

    init: async () => {
        if (SQLiteService.db) return SQLiteService.db;
        SQLiteService.db = await SQLite.openDatabaseAsync(DB_NAME);

        await SQLiteService.db.execAsync(`
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
                isGlobal INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_messages_bookId ON messages(bookId);
            CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt);
        `);

        return SQLiteService.db;
    },

    // Generic collection handler
    saveToCollection: async (id: string, data: any) => {
        const db = await SQLiteService.init();
        const json = JSON.stringify(data);
        const now = Date.now();
        await db.runAsync(
            'INSERT OR REPLACE INTO collections (id, data, updatedAt) VALUES (?, ?, ?)',
            [id, json, now]
        );
    },

    getFromCollection: async (id: string) => {
        const db = await SQLiteService.init();
        const result = await db.getFirstAsync(
            'SELECT data FROM collections WHERE id = ?',
            [id]
        ) as { data: string } | null;
        return result ? JSON.parse(result.data) : null;
    },

    deleteFromCollection: async (id: string) => {
        const db = await SQLiteService.init();
        await db.runAsync('DELETE FROM collections WHERE id = ?', [id]);
    },

    // Chat specialized methods
    saveMessage: async (msg: any, bookId: string, isGlobal: boolean = false) => {
        const db = await SQLiteService.init();
        const json = JSON.stringify(msg);
        const createdAt = new Date(msg.createdAt).getTime();
        await db.runAsync(
            'INSERT OR REPLACE INTO messages (id, bookId, data, createdAt, isGlobal) VALUES (?, ?, ?, ?, ?)',
            [msg.id, bookId, json, createdAt, isGlobal ? 1 : 0]
        );
    },

    getMessages: async (bookId: string, limit: number = 20, beforeTimestamp: number | null = null, isGlobal: boolean = false) => {
        const db = await SQLiteService.init();
        const query = beforeTimestamp
            ? 'SELECT data FROM messages WHERE bookId = ? AND isGlobal = ? AND createdAt < ? ORDER BY createdAt DESC LIMIT ?'
            : 'SELECT data FROM messages WHERE bookId = ? AND isGlobal = ? ORDER BY createdAt DESC LIMIT ?';
        const params = beforeTimestamp
            ? [bookId, isGlobal ? 1 : 0, beforeTimestamp, limit]
            : [bookId, isGlobal ? 1 : 0, limit];

        const results = await db.getAllAsync(query, params) as { data: string }[];

        const messages = results.map((r: { data: string }) => JSON.parse(r.data));
        // Result is already DESC (newest first). UI needs them in correct order for FlatList.
        // If sorting in FlatList, we keep them as is. But current UI expects oldest first if not using inverted.
        return messages.reverse();
    },

    clearAll: async () => {
        const db = await SQLiteService.init();
        await db.execAsync('DELETE FROM collections; DELETE FROM messages;');
    }
};
