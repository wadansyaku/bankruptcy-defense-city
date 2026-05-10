import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const database = process.env.D1_DATABASE_NAME ?? "bankruptcy-defense-city";
const remote = process.argv.includes("--remote") || process.env.SEED_REMOTE === "1";
const production = process.env.APP_ENV === "production" || process.argv.includes("--production");
const files = ["migrations/0002_seed_initial_content.sql", ...(production ? [] : ["seeds/dev_test_user.sql"])];

for (const file of files) {
  const path = resolve(file);
  if (!existsSync(path)) {
    throw new Error(`Seed file not found: ${file}`);
  }
  const args = ["d1", "execute", database, remote ? "--remote" : "--local", "--file", path];
  const result = spawnSync("wrangler", args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Seed complete (${production ? "production content only" : "local/dev content"}, ${remote ? "remote" : "local"}).`);
