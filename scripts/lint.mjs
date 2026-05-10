import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const forbiddenFiles = [".dev.vars"];
const forbiddenClientTokens = ["OPENAI_API_KEY", "TURNSTILE_SECRET_KEY", "SESSION_SECRET"];
const clientRoots = ["src/client", "public"];

async function exists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".wrangler") {
      continue;
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}

const problems = [];

for (const file of forbiddenFiles) {
  if (await exists(join(root, file))) {
    problems.push(`${file} はコミット対象に置かないでください`);
  }
}

for (const clientRoot of clientRoots) {
  for await (const file of walk(join(root, clientRoot))) {
    if (!/\.(ts|tsx|js|jsx|html|json|css|svg)$/.test(file)) continue;
    const text = await readFile(file, "utf8");
    for (const token of forbiddenClientTokens) {
      if (text.includes(token)) {
        problems.push(`${file.replace(`${root}/`, "")} にクライアント禁止シークレット名 ${token} が含まれます`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log("lint checks passed");
