import "server-only";
import path from "node:path";
import * as schema from "./schema";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

/**
 * Base de dados:
 *  - Produção: Postgres real via DATABASE_URL (Render, Supabase, Neon...).
 *  - Desenvolvimento: sem DATABASE_URL usa PGlite (Postgres embutido em ./.data/pglite),
 *    por isso basta `npm run dev` para começar.
 * As migrações (pasta ./drizzle) correm automaticamente na primeira ligação.
 */
type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const g = globalThis as unknown as { __aprovaDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const migrationsFolder = path.join(/*turbopackIgnore: true*/ process.cwd(), "drizzle");

  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
      max: 10,
    });
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder });
    return db as unknown as DB;
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PGLITE_IN_PRODUCTION !== "true") {
    throw new Error("DATABASE_URL é obrigatória em produção.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "pglite"));
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  if (!g.__aprovaDb) {
    g.__aprovaDb = connect().catch((err) => {
      g.__aprovaDb = undefined;
      throw err;
    });
  }
  return g.__aprovaDb;
}

export { schema };
