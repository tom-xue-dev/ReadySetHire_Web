import { PoolClient } from 'pg';
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}
export declare class Database {
    private pool;
    constructor(config: DatabaseConfig);
    query(text: string, params?: any[]): Promise<any>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map