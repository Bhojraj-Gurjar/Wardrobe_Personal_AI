const { cpSync, existsSync, mkdirSync, readdirSync } = require('node:fs');
const { join, resolve } = require('node:path');

const BACKEND_ROOT = resolve(__dirname, '..');
const UPLOADS_ROOT = join(
  BACKEND_ROOT,
  process.env.STORAGE_LOCAL_ROOT || 'uploads',
);

const CURATED_ASSET_DIRS = [
  'curated-footwear',
  'curated-shirts',
  'curated-tshirts',
  'curated-pants',
  'curated-jackets',
];

function copyDirectoryContents(sourceDir, destinationDir) {
  if (!existsSync(sourceDir)) {
    return 0;
  }

  mkdirSync(destinationDir, { recursive: true });

  let copied = 0;

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = join(sourceDir, entry.name);
    const destinationPath = join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copied += copyDirectoryContents(sourcePath, destinationPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!existsSync(destinationPath)) {
      cpSync(sourcePath, destinationPath);
      copied += 1;
    }
  }

  return copied;
}

function main() {
  let totalCopied = 0;

  for (const dirName of CURATED_ASSET_DIRS) {
    const sourceDir = join(BACKEND_ROOT, 'assets', dirName);
    const destinationDir = join(UPLOADS_ROOT, 'products', dirName);

    totalCopied += copyDirectoryContents(sourceDir, destinationDir);
  }

  console.log(
    `Synced curated product assets to uploads (${totalCopied} file(s) copied).`,
  );
}

main();
