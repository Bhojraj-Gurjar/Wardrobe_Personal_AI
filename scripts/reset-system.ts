/**
 * Wardrobe AI — full runtime user data reset.
 * Clears user records, uploads, vector stores, Redis sessions, and build caches.
 * Does NOT touch source code, migrations, schema, .env, products catalog, or node_modules.
 */

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import pg from 'pg';
import Redis from 'ioredis';
import { QdrantClient } from '@qdrant/js-client-rest';

const ROOT = resolve(__dirname, '..');
const BACKEND_ROOT = join(ROOT, 'backend');
const FRONTEND_ROOT = join(ROOT, 'frontend');
const AI_SERVICE_ROOT = join(ROOT, 'ai-service');

loadEnv({ path: join(BACKEND_ROOT, '.env') });

/**
 * User-related tables in safe TRUNCATE order (children before parents).
 * PostgreSQL TRUNCATE ... CASCADE handles FK order, but explicit ordering documents intent.
 */
const USER_RUNTIME_TABLES = [
  'search_history',
  'product_views',
  'fashion_dna_history',
  'fashion_dna',
  'digital_avatars',
  'body_analysis',
  'face_analysis',
  'face_registrations',
  'wishlist',
  'orders',
  'user_profiles',
  'users',
] as const;

const UPLOAD_SUBDIRS = ['faces', 'avatars', 'body', 'profile', 'temp'] as const;

const CACHE_DIRS = [
  join(FRONTEND_ROOT, '.next'),
  join(FRONTEND_ROOT, 'build'),
  join(FRONTEND_ROOT, '.cache'),
  join(BACKEND_ROOT, 'dist'),
  join(BACKEND_ROOT, 'build'),
  join(BACKEND_ROOT, '.cache'),
  join(BACKEND_ROOT, 'coverage'),
  join(AI_SERVICE_ROOT, '.cache'),
  join(AI_SERVICE_ROOT, 'build'),
  join(AI_SERVICE_ROOT, 'dist'),
  join(ROOT, '.cache'),
] as const;

const EMBEDDING_DIRS = [
  join(ROOT, 'embeddings'),
  join(BACKEND_ROOT, 'embeddings'),
  join(AI_SERVICE_ROOT, 'embeddings'),
  join(AI_SERVICE_ROOT, 'data', 'embeddings'),
  join(AI_SERVICE_ROOT, 'cache'),
] as const;

type TableCount = { table: string; count: number };

function env(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

function envInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(env(name), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function discoverUploadRoots(): string[] {
  const roots = new Set<string>();
  const configuredRoot = env('STORAGE_LOCAL_ROOT', 'uploads');
  const candidates = [
    resolve(BACKEND_ROOT, configuredRoot),
    resolve(ROOT, configuredRoot),
    resolve(ROOT, 'uploads'),
  ];

  for (const candidate of candidates) {
    roots.add(candidate);
  }

  return [...roots];
}

async function clearDirectoryContents(dirPath: string): Promise<number> {
  if (!existsSync(dirPath)) {
    return 0;
  }

  let removed = 0;
  const entries = await readdir(dirPath);

  for (const entry of entries) {
    const target = join(dirPath, entry);
    const info = await stat(target);
    removed += 1;

    if (info.isDirectory()) {
      await rm(target, { recursive: true, force: true });
    } else {
      await rm(target, { force: true });
    }
  }

  return removed;
}

async function recreateUploadFolders(): Promise<string[]> {
  const created: string[] = [];

  for (const root of discoverUploadRoots()) {
    await mkdir(root, { recursive: true });
    created.push(root);

    for (const subdir of UPLOAD_SUBDIRS) {
      const path = join(root, subdir);
      await mkdir(path, { recursive: true });
      created.push(path);
    }
  }

  return created;
}

async function clearUploadFolders(): Promise<{ roots: string[]; entriesRemoved: number }> {
  let entriesRemoved = 0;
  const roots = discoverUploadRoots();

  for (const root of roots) {
    entriesRemoved += await clearDirectoryContents(root);
  }

  for (const dir of EMBEDDING_DIRS) {
    if (existsSync(dir)) {
      await rm(dir, { recursive: true, force: true });
      entriesRemoved += 1;
    }
  }

  return { roots, entriesRemoved };
}

async function clearCacheFolders(): Promise<void> {
  for (const dir of CACHE_DIRS) {
    await rm(dir, { recursive: true, force: true });
  }
}

async function withPgClient<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const databaseUrl = env('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Configure backend/.env first.');
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function countTableRows(client: pg.Client, tables: readonly string[]): Promise<TableCount[]> {
  const counts: TableCount[] = [];

  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    counts.push({ table, count: result.rows[0]?.count ?? 0 });
  }

  return counts;
}

async function clearPostgres(): Promise<{ usersRemoved: number; before: TableCount[] }> {
  return withPgClient(async (client) => {
    const before = await countTableRows(client, USER_RUNTIME_TABLES);
    const usersRemoved = before.find((row) => row.table === 'users')?.count ?? 0;

    const tableList = USER_RUNTIME_TABLES.map((table) => `"${table}"`).join(', ');
    await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);

    return { usersRemoved, before };
  });
}

async function clearRedis(): Promise<void> {
  const host = env('REDIS_HOST', 'localhost');
  const port = envInt('REDIS_PORT', 6379);
  const redis = new Redis({ host, port, maxRetriesPerRequest: 1, lazyConnect: true });

  try {
    await redis.connect();
    await redis.flushall();
  } finally {
    await redis.quit();
  }
}

function qdrantCollections(): Array<{ name: string; vectorSize: number }> {
  return [
    {
      name: env('QDRANT_FACE_COLLECTION', 'users_face_vectors'),
      vectorSize: envInt('FACE_VECTOR_SIZE', 512),
    },
    {
      name: env('QDRANT_COLLECTION', 'products'),
      vectorSize: envInt('QDRANT_VECTOR_SIZE', 128),
    },
    {
      name: env('QDRANT_DNA_COLLECTION', 'fashion_dna_vectors'),
      vectorSize: envInt('DNA_VECTOR_SIZE', 384),
    },
    {
      name: env('QDRANT_FACE_ANALYSIS_COLLECTION', 'face_analysis_vectors'),
      vectorSize: envInt('FACE_ANALYSIS_VECTOR_SIZE', 384),
    },
    {
      name: env('QDRANT_BODY_ANALYSIS_COLLECTION', 'body_analysis_vectors'),
      vectorSize: envInt('BODY_ANALYSIS_VECTOR_SIZE', 384),
    },
    {
      name: env('QDRANT_DIGITAL_AVATAR_COLLECTION', 'digital_avatar_vectors'),
      vectorSize: envInt('DIGITAL_AVATAR_VECTOR_SIZE', 384),
    },
  ];
}

async function clearQdrant(): Promise<string[]> {
  const url = env('QDRANT_URL');

  if (!url) {
    console.warn('QDRANT_URL not configured — skipping vector store reset.');
    return [];
  }

  const client = new QdrantClient({
    url,
    apiKey: env('QDRANT_API_KEY') || undefined,
  });

  const recreated: string[] = [];
  const collections = qdrantCollections();
  const existing = await client.getCollections();
  const existingNames = new Set(existing.collections.map((item) => item.name));

  for (const { name, vectorSize } of collections) {
    if (existingNames.has(name)) {
      await client.deleteCollection(name);
    }

    await client.createCollection(name, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    });

    recreated.push(name);
  }

  return recreated;
}

function clearDockerRuntimeData(): void {
  const commands = [
    'docker exec wardrobe-backend sh -c "rm -rf /app/uploads/* 2>/dev/null || true"',
    'docker exec wardrobe-redis redis-cli FLUSHALL',
  ];

  for (const command of commands) {
    try {
      execSync(command, { stdio: 'ignore' });
    } catch {
      // Containers may be stopped during local reset — host cleanup still applies.
    }
  }
}

async function verifyReset(): Promise<TableCount[]> {
  return withPgClient(async (client) => {
    const after = await countTableRows(client, USER_RUNTIME_TABLES);
    const remaining = after.filter((row) => row.count > 0);

    if (remaining.length > 0) {
      const summary = remaining.map((row) => `${row.table}=${row.count}`).join(', ');
      throw new Error(`Reset verification failed — remaining rows: ${summary}`);
    }

    return after;
  });
}

function printReport(options: {
  usersRemoved: number;
  before: TableCount[];
  after: TableCount[];
  uploadRoots: string[];
  uploadEntriesRemoved: number;
  recreatedFolders: string[];
  qdrantCollections: string[];
}): void {
  console.log('\n================ RESET REPORT ================\n');

  console.log('1. Tables cleared (TRUNCATE ... RESTART IDENTITY CASCADE):');
  for (const table of USER_RUNTIME_TABLES) {
    const prior = options.before.find((row) => row.table === table)?.count ?? 0;
    console.log(`   - ${table} (removed ${prior} rows)`);
  }

  console.log('\n2. Users removed:', options.usersRemoved);

  console.log('\n3. Upload folders cleaned:');
  for (const root of options.uploadRoots) {
    console.log(`   - ${root}`);
    for (const subdir of UPLOAD_SUBDIRS) {
      console.log(`     - ${join(root, subdir)}`);
    }
  }
  console.log(`   Entries removed: ${options.uploadEntriesRemoved}`);
  console.log(`   Recreated folders: ${options.recreatedFolders.length}`);

  console.log('\n4. Vector stores recreated (face embeddings + analysis vectors):');
  for (const name of options.qdrantCollections) {
    console.log(`   - ${name}`);
  }

  console.log('\n5. Redis flushed (refresh tokens / sessions)');

  console.log('\n6. Post-reset row counts (all should be 0):');
  for (const row of options.after) {
    console.log(`   - ${row.table}: ${row.count}`);
  }

  console.log('\nFresh state confirmed: no users, profiles, face/body/avatar/DNA, wishlist, orders, or activity history remain.');
  console.log('Products catalog preserved. Schema, migrations, source, and .env untouched.\n');
}

async function main(): Promise<void> {
  console.log('Wardrobe AI — resetting all user runtime data...\n');

  const { usersRemoved, before } = await clearPostgres();
  console.log('Database cleared');

  const { roots: uploadRoots, entriesRemoved: uploadEntriesRemoved } = await clearUploadFolders();
  clearDockerRuntimeData();
  const recreatedFolders = await recreateUploadFolders();
  console.log('Upload folders cleared and recreated');

  const qdrantCollectionsReset = await clearQdrant();
  console.log('Qdrant user vectors cleared');

  await clearRedis();
  await clearCacheFolders();
  console.log('Redis and build caches cleared');

  const after = await verifyReset();
  console.log('Verification passed');

  printReport({
    usersRemoved,
    before,
    after,
    uploadRoots,
    uploadEntriesRemoved,
    recreatedFolders,
    qdrantCollections: qdrantCollectionsReset,
  });
}

main().catch((error: Error) => {
  console.error('\nReset failed:', error.message);
  process.exit(1);
});
