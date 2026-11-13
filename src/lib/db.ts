import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Camada de dados com dois adaptadores para o MESMO SQL (PostgreSQL):
 * - PgDatabase: Postgres real (Supabase) quando DATABASE_URL existe.
 * - PgliteDatabase: Postgres embutido (PGlite/WASM) persistindo em .data/,
 *   para demonstração e desenvolvimento sem credenciais.
 */
export type SqlParam =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>
  | unknown[];

export interface Database {
  query<T = Record<string, unknown>>(sql: string, params?: SqlParam[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
}

class PgDatabase implements Database {
  private pool: import("pg").Pool | null = null;

  private async getPool(): Promise<import("pg").Pool> {
    if (!this.pool) {
      const { Pool } = await import("pg");
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5
      });
    }
    return this.pool;
  }

  async query<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    const pool = await this.getPool();
    const result = await pool.query(sql, params as unknown[]);
    return result.rows as T[];
  }

  async exec(sql: string): Promise<void> {
    const pool = await this.getPool();
    await pool.query(sql);
  }
}

class PgliteDatabase implements Database {
  constructor(private db: import("@electric-sql/pglite").PGlite) {}

  static async create(): Promise<PgliteDatabase> {
    const { PGlite } = await import("@electric-sql/pglite");
    const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data");
    const db = new PGlite(dataDir);
    await db.waitReady;
    return new PgliteDatabase(db);
  }

  async query<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    const result = await this.db.query(sql, params as unknown[]);
    return result.rows as T[];
  }

  async exec(sql: string): Promise<void> {
    await this.db.exec(sql);
  }
}

let instance: Database | null = null;

export async function initSchema(db: Database): Promise<void> {
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  await db.exec(sql);
}

export async function getDb(): Promise<Database> {
  if (!instance) {
    if (process.env.DATABASE_URL) {
      instance = new PgDatabase();
    } else {
      instance = await PgliteDatabase.create();
    }
    await initSchema(instance);
  }
  return instance;
}

/** Cria um banco isolado para testes (PGlite em memória) com o schema aplicado. */
export async function createTestDb(): Promise<Database> {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  await db.waitReady;
  const adapter = new PgliteDatabase(db);
  await initSchema(adapter);
  return adapter;
}

export function newId(): string {
  return globalThis.crypto.randomUUID();
}
