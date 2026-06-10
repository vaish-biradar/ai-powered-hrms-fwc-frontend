import fs from "fs";
import path from "path";
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

function loadDotEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return {};
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return acc;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return acc;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    acc[key] = value;
    return acc;
  }, {});
}

class PostgresDB {
  private pool: Pool;

  constructor(connectionString: string) {
    if (!connectionString) {
      console.error("🚨 Missing PostgreSQL connection string.");
      throw new Error("Missing required PostgreSQL connection string.");
    }

    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    this.pool.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client:", err);
      process.exit(-1);
    });
  }

  // Generic query method
  async query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      return await client.query<T>(text, params);
    } finally {
      client.release();
    }
  }

  // For advanced use cases: get a raw client (e.g., transactions)
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }
}
const envFilePath = path.resolve(process.cwd(), ".env.local");
const fileEnv = loadDotEnvFile(envFilePath);

const DB_USER = process.env.DB_USER || fileEnv.DB_USER || "dohr_postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || fileEnv.DB_PASSWORD || "";
const DB_HOST = process.env.DB_HOST || fileEnv.DB_HOST || "hr-recruitment-postgres.postgres.database.azure.com";
const DB_PORT = process.env.DB_PORT || fileEnv.DB_PORT || "5432";
const DB_NAME = process.env.DB_NAME || fileEnv.DB_NAME || "DOHR_Recruitment";

// Encode special characters in the password
const encodedPassword = encodeURIComponent(DB_PASSWORD);
const DATABASE_URL = process.env.DATABASE_URL || `postgresql://${DB_USER}:${encodedPassword}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require`;

if (process.env.NODE_ENV === "development") {
  console.log("[PostgresDB] connecting to:", {
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
  });
}

// Initialize the singleton
const postgresDB = new PostgresDB(DATABASE_URL as string);

export default postgresDB;
