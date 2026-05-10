import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

type UploadOptions = {
  dir: string;
  bucket: string;
  prefix: string;
  dryRun: boolean;
  remote: boolean;
  wranglerBin: string;
};

type UploadCandidate = {
  filePath: string;
  key: string;
  contentType: string;
};

const defaultDir = "public/assets/generated";
const allowedExtensions = new Set([".avif", ".gif", ".jpg", ".jpeg", ".json", ".png", ".svg", ".webp"]);

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const files = await collectFiles(path.resolve(options.dir));
  const candidates = files.map((filePath) => toUploadCandidate(filePath, options));

  if (candidates.length === 0) {
    console.log(`No uploadable assets found in ${options.dir}`);
    return;
  }

  for (const candidate of candidates) {
    const target = `${options.bucket}/${candidate.key}`;
    if (options.dryRun) {
      console.log(`[dry-run] ${candidate.filePath} -> r2://${target} (${candidate.contentType})`);
      continue;
    }

    await putObject(options, candidate);
    console.log(`uploaded ${candidate.filePath} -> r2://${target}`);
  }
}

function parseArgs(args: string[]): UploadOptions {
  const values = new Map<string, string | boolean>();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      values.set("dry-run", true);
      continue;
    }
    if (arg === "--remote") {
      values.set("remote", true);
      continue;
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    values.set(key, next);
    index += 1;
  }

  const dir = stringValue(values, "dir") ?? defaultDir;
  const bucket = stringValue(values, "bucket") ?? process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2 bucket is required. Pass --bucket or set R2_BUCKET_NAME.");
  }

  return {
    dir,
    bucket,
    prefix: stringValue(values, "prefix") ?? process.env.R2_ASSET_PREFIX ?? "",
    dryRun: values.get("dry-run") === true,
    remote: values.get("remote") === true || process.env.R2_REMOTE === "1",
    wranglerBin: stringValue(values, "wrangler-bin") ?? process.env.WRANGLER_BIN ?? "wrangler",
  };
}

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (allowedExtensions.has(extension)) {
      files.push(entryPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function toUploadCandidate(filePath: string, options: UploadOptions): UploadCandidate {
  const relativePath = path.relative(path.resolve(options.dir), filePath);
  const key = sanitizeKey(path.posix.join(options.prefix, toPosix(relativePath)));

  return {
    filePath,
    key,
    contentType: contentTypeFor(filePath),
  };
}

function sanitizeKey(value: string): string {
  const parts = toPosix(value)
    .split("/")
    .filter((part) => part.length > 0 && part !== "." && part !== "..")
    .map((part) => part.replaceAll(/[^a-zA-Z0-9._=-]/g, "-"));

  const key = parts.join("/");
  if (!key) {
    throw new Error(`Invalid R2 key from value: ${value}`);
  }
  return key;
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function contentTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml; charset=utf-8";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

async function putObject(options: UploadOptions, candidate: UploadCandidate): Promise<void> {
  const destination = `${options.bucket}/${candidate.key}`;
  const args = [
    "r2",
    "object",
    "put",
    destination,
    "--file",
    candidate.filePath,
    "--content-type",
    candidate.contentType,
  ];
  if (options.remote) {
    args.push("--remote");
  }

  await run(options.wranglerBin, args);
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with ${code ?? "unknown"}`));
    });
  });
}

function stringValue(values: Map<string, string | boolean>, key: string): string | undefined {
  const value = values.get(key);
  return typeof value === "string" ? value : undefined;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
