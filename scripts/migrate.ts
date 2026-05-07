import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set. Skipping migrations.");
  process.exit(0);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

console.log("🔄 Running database migrations...");

try {
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../migrations"),
  });
  console.log("✅ Migrations completed successfully.");
} catch (err) {
  console.error("❌ Migration failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
