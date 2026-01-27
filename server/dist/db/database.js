"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const pg_1 = require("pg");
class Database {
    pool;
    constructor(config) {
        this.pool = new pg_1.Pool(config);
    }
    async query(text, params) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        }
        finally {
            client.release();
        }
    }
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async close() {
        await this.pool.end();
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map