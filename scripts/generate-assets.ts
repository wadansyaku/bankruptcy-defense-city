import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type AssetKind = "hero" | "district" | "card" | "event" | "gacha" | "ui";

type AssetRequest = {
  slug: string;
  kind: AssetKind;
  prompt: string;
  size: "1024x1024" | "1536x1024" | "1024x1536";
};

type GeneratedAsset = {
  slug: string;
  kind: AssetKind;
  source: "codex-gpt-image2" | "placeholder";
  prompt: string;
  files: {
    svg: string;
    png: string;
    publicSvg: string;
    publicPng: string;
  };
  model: string;
  createdAt: string;
};

const outputDir = path.resolve("generated");
const publicOutputDir = path.resolve("public/assets/generated");
const codexSourceDir = path.resolve(process.env.CODEX_IMAGE2_SOURCE_DIR ?? "generated/codex-image2-source");
const imageModel = process.env.CODEX_IMAGE_MODEL ?? "gpt-image-2";

const globalStyle =
  "Grounded near-future Japanese city, municipal finance crisis, tactical mobile game, clean readable shapes, civic teal and warning amber accents, hopeful reconstruction mood, no text.";

const assets: AssetRequest[] = [
  {
    slug: "hero-city-crisis",
    kind: "hero",
    size: "1536x1024",
    prompt:
      "Key visual for a mobile strategy game called Bankruptcy Defense City. A near-future Japanese city seen from above at dusk, city hall as the command point, financial warning lines and reconstruction lights over districts, dramatic but hopeful, no readable text.",
  },
  {
    slug: "district-city-hall",
    kind: "district",
    size: "1024x1024",
    prompt:
      "Modern Japanese city hall district as the core base in a tactical city defense game, clear silhouette, civic teal lights, administrative plaza, readable mobile icon, no text.",
  },
  {
    slug: "district-commercial",
    kind: "district",
    size: "1024x1024",
    prompt:
      "Commercial shopping district under fiscal pressure, storefront lights, tax revenue data lines, amber warning accents, tactical mobile game icon, no text.",
  },
  {
    slug: "district-residential",
    kind: "district",
    size: "1024x1024",
    prompt:
      "Residential district protected by community services, apartment blocks, small parks, green reconstruction accents, readable at small size, no text.",
  },
  {
    slug: "district-industrial",
    kind: "district",
    size: "1024x1024",
    prompt:
      "Industrial district with factories, logistics roads, repair cranes, infrastructure gray and warning amber, tactical city map tile, no text.",
  },
  {
    slug: "card-emergency-loan",
    kind: "card",
    size: "1024x1536",
    prompt:
      "Policy card art showing emergency municipal loan approval, official document motif without readable text, urgent financial tension, teal and red accents, mobile card game art.",
  },
  {
    slug: "card-public-briefing",
    kind: "card",
    size: "1024x1536",
    prompt:
      "Policy card art showing a calm public briefing in a disaster response room, city officials and residents around a map table, hopeful civic mood, no text.",
  },
  {
    slug: "event-interest-shock",
    kind: "event",
    size: "1536x1024",
    prompt:
      "Crisis event banner representing sudden interest payment shock, financial graph pressure over city skyline, insolvency red accents, no readable text.",
  },
  {
    slug: "gacha-support-package",
    kind: "gacha",
    size: "1024x1024",
    prompt:
      "Free currency gacha visual: reconstruction support package with policy documents, tools, civic seals, bright reward feeling without casino imagery, no text.",
  },
  {
    slug: "ui-command-dock-bg",
    kind: "ui",
    size: "1536x1024",
    prompt:
      "Mobile game command dock background, compact emergency operations dashboard surface, dark charcoal base, teal highlights, amber alert slots, no text, no icons.",
  },
];

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await mkdir(publicOutputDir, { recursive: true });
  await mkdir(codexSourceDir, { recursive: true });

  const generated: GeneratedAsset[] = [];

  for (const asset of assets) {
    generated.push((await importCodexImage2Asset(asset)) ?? (await createPlaceholder(asset, "Codex GPT image2 source file not found")));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    imageMode: "codex-gpt-image2-import",
    imageModel,
    codexSourceDir: path.relative(process.cwd(), codexSourceDir),
    assets: generated,
  };

  await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await copyFile(path.join(outputDir, "manifest.json"), path.join(publicOutputDir, "manifest.json"));

  console.log(`Prepared ${generated.length} assets into ${outputDir}`);
  console.log(`Codex GPT image2 source dir: ${path.relative(process.cwd(), codexSourceDir)}`);
  console.log(`Copied public assets into ${publicOutputDir}`);
}

async function importCodexImage2Asset(asset: AssetRequest): Promise<GeneratedAsset | null> {
  const sourcePath = path.join(codexSourceDir, `${asset.slug}.png`);
  const exists = await fileExists(sourcePath);
  if (!exists) {
    return null;
  }

  const svg = buildAttributionSvg(asset, "codex-gpt-image2");
  const svgName = `${asset.slug}.codex-image2.svg`;
  const pngName = `${asset.slug}.codex-image2.png`;
  const svgPath = path.join(outputDir, svgName);
  const pngPath = path.join(outputDir, pngName);
  const publicSvgPath = path.join(publicOutputDir, svgName);
  const publicPngPath = path.join(publicOutputDir, pngName);

  await writeFile(svgPath, svg, "utf8");
  await writeFile(publicSvgPath, svg, "utf8");
  await copyFile(sourcePath, pngPath);
  await copyFile(sourcePath, publicPngPath);

  return {
    slug: asset.slug,
    kind: asset.kind,
    source: "codex-gpt-image2",
    prompt: `${globalStyle}\n\n${asset.prompt}`,
    files: relativeFiles(svgPath, pngPath, publicSvgPath, publicPngPath),
    model: imageModel,
    createdAt: new Date().toISOString(),
  };
}

async function createPlaceholder(asset: AssetRequest, reason: string): Promise<GeneratedAsset> {
  const svg = buildPlaceholderSvg(asset, reason);
  const png = placeholderPng();

  const svgName = `${asset.slug}.placeholder.svg`;
  const pngName = `${asset.slug}.placeholder.png`;
  const svgPath = path.join(outputDir, svgName);
  const pngPath = path.join(outputDir, pngName);
  const publicSvgPath = path.join(publicOutputDir, svgName);
  const publicPngPath = path.join(publicOutputDir, pngName);

  await writeFile(svgPath, svg, "utf8");
  await writeFile(publicSvgPath, svg, "utf8");
  await writeFile(pngPath, png);
  await writeFile(publicPngPath, png);

  return {
    slug: asset.slug,
    kind: asset.kind,
    source: "placeholder",
    prompt: `${globalStyle}\n\n${asset.prompt}`,
    files: relativeFiles(svgPath, pngPath, publicSvgPath, publicPngPath),
    model: imageModel,
    createdAt: new Date().toISOString(),
  };
}

function relativeFiles(
  svgPath: string,
  pngPath: string,
  publicSvgPath: string,
  publicPngPath: string,
): GeneratedAsset["files"] {
  return {
    svg: path.relative(process.cwd(), svgPath),
    png: path.relative(process.cwd(), pngPath),
    publicSvg: path.relative(process.cwd(), publicSvgPath),
    publicPng: path.relative(process.cwd(), publicPngPath),
  };
}

function buildPlaceholderSvg(asset: AssetRequest, reason: string): string {
  const [width, height] = asset.size.split("x").map((value) => Number.parseInt(value, 10));
  const title = escapeXml(asset.slug);
  const subtitle = escapeXml(asset.kind);
  const note = escapeXml(reason.slice(0, 96));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title} placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#182026"/>
      <stop offset="0.55" stop-color="#1A8C8C"/>
      <stop offset="1" stop-color="#F2A900"/>
    </linearGradient>
    <pattern id="grid" width="96" height="96" patternUnits="userSpaceOnUse">
      <path d="M 96 0 L 0 0 0 96" fill="none" stroke="#F4F1E8" stroke-opacity="0.12" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <rect x="${width * 0.08}" y="${height * 0.14}" width="${width * 0.84}" height="${height * 0.72}" rx="18" fill="#182026" fill-opacity="0.76" stroke="#F4F1E8" stroke-opacity="0.35" stroke-width="3"/>
  <path d="M ${width * 0.18} ${height * 0.62} L ${width * 0.34} ${height * 0.46} L ${width * 0.48} ${height * 0.56} L ${width * 0.64} ${height * 0.34} L ${width * 0.82} ${height * 0.54}" fill="none" stroke="#F2A900" stroke-width="${Math.max(8, width * 0.012)}" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${width * 0.34}" cy="${height * 0.46}" r="${Math.max(18, width * 0.025)}" fill="#3FA66B"/>
  <circle cx="${width * 0.64}" cy="${height * 0.34}" r="${Math.max(18, width * 0.025)}" fill="#D64545"/>
  <text x="50%" y="44%" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${Math.max(40, width * 0.052)}" font-weight="800" fill="#F4F1E8">${title}</text>
  <text x="50%" y="52%" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${Math.max(24, width * 0.028)}" fill="#F2A900">${subtitle} placeholder</text>
  <text x="50%" y="60%" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="${Math.max(18, width * 0.018)}" fill="#F4F1E8" fill-opacity="0.72">${note}</text>
</svg>
`;
}

function buildAttributionSvg(asset: AssetRequest, source: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="256" viewBox="0 0 1024 256" role="img" aria-label="${escapeXml(asset.slug)} source metadata">
  <rect width="1024" height="256" fill="#182026"/>
  <text x="48" y="96" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="48" font-weight="800" fill="#F4F1E8">${escapeXml(asset.slug)}</text>
  <text x="48" y="152" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="30" fill="#F2A900">${escapeXml(source)} / ${escapeXml(imageModel)}</text>
</svg>
`;
}

function placeholderPng(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAhklEQVR4nO3QQQ0AIAwEsQf9d25XIBJhZ7mE2qZkz3ZgF3fXgQfQAFoA1gCwAKwBYAFYA8ACsAWABWALAArAFgAWgDUALABrAFgAVgCwAKwBYAFYA8ACsAWABWALAArAFgAWgDUALABrAFgAVgCwAKwBYAFYA8ACsAWABWALAArAFgA3wEoWgJ4Eqk1pAAAAABJRU5ErkJggg==",
    "base64",
  );
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
