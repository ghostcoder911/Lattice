/**
 * Starts embedded PostgreSQL, applies migrations, seeds, then `next dev`.
 * Does not rely on Docker or a system Postgres install.
 */
import EmbeddedPostgres from "embedded-postgres";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function main() {
  const port = 5433;
  const pg = new EmbeddedPostgres({
    databaseDir: path.join(root, ".demo-pg", "data"),
    user: "postgres",
    password: "demo",
    port,
    persistent: true,
  });

  console.log("Starting embedded PostgreSQL on port", port, "…");
  await pg.initialise();
  await pg.start();

  try {
    await pg.createDatabase("lattice");
  } catch {
    // already exists
  }

  const databaseUrl = `postgresql://postgres:demo@127.0.0.1:${port}/lattice`;
  const env = { ...process.env, DATABASE_URL: databaseUrl };

  console.log("Applying migrations…");
  const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (migrate.status !== 0) {
    await pg.stop().catch(() => {});
    process.exit(migrate.status ?? 1);
  }

  console.log("Seeding database…");
  const seed = spawnSync("npm", ["run", "db:seed"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (seed.status !== 0) {
    await pg.stop().catch(() => {});
    process.exit(seed.status ?? 1);
  }

  console.log("\nLattice demo: http://localhost:3000  (Board + Time clock)\n");

  const child = spawn("npx", ["next", "dev", "--turbopack"], {
    cwd: root,
    env,
    stdio: "inherit",
  });

  const cleanup = async () => {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
    try {
      await pg.stop();
    } catch {
      /* ignore */
    }
  };

  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await cleanup();
    process.exit(0);
  });

  child.on("exit", async (code) => {
    await pg.stop().catch(() => {});
    process.exit(code ?? 0);
  });
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
