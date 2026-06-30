/**
 * Backfill transparent body PNGs for users who have an original body photo
 * but no processed background-removed PNG yet.
 *
 * Usage:
 *   node scripts/backfill-body-photo-processing.js
 *   node scripts/backfill-body-photo-processing.js --dry-run
 *   node scripts/backfill-body-photo-processing.js --user-id=<uuid>
 */

const { config: loadEnv } = require('dotenv');
const { existsSync, readdirSync } = require('fs');
const { join, resolve } = require('path');
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

loadEnv({ path: resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const userIdFilter = args.find((arg) => arg.startsWith('--user-id='))?.split('=')[1] || null;

const STORAGE_ROOT = resolve(__dirname, '..', process.env.STORAGE_LOCAL_ROOT || 'uploads');
const PYTHON_SCRIPT = join(__dirname, '..', 'python', 'remove_background.py');
const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || '').replace(/\/$/, '');

function buildUserPngPath(userId) {
  return `/uploads/user-png/${userId}.png`;
}

function isBodyPath(value) {
  return typeof value === 'string' && value.startsWith('/uploads/body/');
}

function resolveOriginalPath(user) {
  const preferences = user.profile?.preferences || {};
  const processing = preferences.bodyPhotoProcessing || {};

  const candidates = [
    processing.originalImage,
    preferences.bodyPhotoOriginal,
    user.body_analysis?.body_image_url,
    preferences.bodyPhoto,
    preferences.body_photo,
    preferences.onboardingBodyPhoto,
    user.profile?.body_image,
  ];

  for (const candidate of candidates) {
    if (isBodyPath(candidate)) {
      return candidate;
    }
  }

  const bodyDir = join(STORAGE_ROOT, 'body', user.id);

  if (!existsSync(bodyDir)) {
    return null;
  }

  const files = readdirSync(bodyDir).filter((name) => /^body\./i.test(name));

  if (!files.length) {
    return null;
  }

  return `/uploads/body/${user.id}/${files[0]}`;
}

function toAbsolutePath(storagePath) {
  const normalized = storagePath.replace(/^\/uploads\//, '');
  return join(STORAGE_ROOT, normalized);
}

function transparentPngExists(userId) {
  return existsSync(join(STORAGE_ROOT, 'user-png', `${userId}.png`));
}

function needsProcessing(user, originalPath) {
  const preferences = user.profile?.preferences || {};
  const processing = preferences.bodyPhotoProcessing || {};
  const outputPath = buildUserPngPath(user.id);
  const pngExists = transparentPngExists(user.id);

  if (!originalPath) {
    return { needed: false, reason: 'no original body photo' };
  }

  if (
    processing.processedTransparentImage
    && processing.originalImage === originalPath
    && pngExists
  ) {
    return { needed: false, reason: 'already processed' };
  }

  if (pngExists && processing.originalImage === originalPath) {
    return {
      needed: true,
      reason: 'metadata missing',
      originalPath,
      outputPath,
      metadataOnly: true,
    };
  }

  return {
    needed: true,
    reason: pngExists ? 'original changed' : 'missing processed png',
    originalPath,
    outputPath,
    metadataOnly: false,
  };
}

async function removeBackgroundViaAi(userId, inputPath, outputPath) {
  if (!AI_SERVICE_URL) {
    return null;
  }

  const response = await fetch(`${AI_SERVICE_URL}/virtual-tryon/remove-background`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      bodyImagePath: inputPath,
      outputPath,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI service failed (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  return payload?.storagePath || outputPath;
}

function removeBackgroundViaPython(inputAbsolute, outputAbsolute) {
  return new Promise((resolvePromise, reject) => {
    const pythonBin = process.env.PYTHON_BIN || 'python';
    const child = spawn(pythonBin, [
      PYTHON_SCRIPT,
      '--input',
      inputAbsolute,
      '--output',
      outputAbsolute,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Background removal exited with code ${code}`));
        return;
      }

      resolvePromise(outputAbsolute);
    });
  });
}

async function processUser(user, prisma) {
  const originalPath = resolveOriginalPath(user);
  const assessment = needsProcessing(user, originalPath);

  if (!assessment.needed) {
    return { userId: user.id, status: 'skipped', reason: assessment.reason };
  }

  if (dryRun) {
    return {
      userId: user.id,
      status: 'dry-run',
      reason: assessment.reason,
      originalPath: assessment.originalPath,
      outputPath: assessment.outputPath,
    };
  }

  if (!assessment.metadataOnly) {
    const inputAbsolute = toAbsolutePath(assessment.originalPath);
    const outputAbsolute = toAbsolutePath(assessment.outputPath);

    if (!existsSync(inputAbsolute)) {
      return {
        userId: user.id,
        status: 'failed',
        reason: `original file missing: ${inputAbsolute}`,
      };
    }

    try {
      await removeBackgroundViaAi(user.id, assessment.originalPath, assessment.outputPath);
    } catch (aiError) {
      if (!existsSync(PYTHON_SCRIPT)) {
        return {
          userId: user.id,
          status: 'failed',
          reason: aiError.message,
        };
      }

      await removeBackgroundViaPython(inputAbsolute, outputAbsolute);
    }
  }

  if (!transparentPngExists(user.id)) {
    return {
      userId: user.id,
      status: 'failed',
      reason: 'processed png was not created',
    };
  }

  const preferences = {
    ...(user.profile?.preferences || {}),
    bodyPhotoProcessing: {
      originalImage: assessment.originalPath,
      processedTransparentImage: assessment.outputPath,
      processedAt: new Date().toISOString(),
      processingStatus: 'completed',
    },
    bodyPhotoOriginal: assessment.originalPath,
    bodyPhotoProcessed: assessment.outputPath,
    transparentBodyPhoto: assessment.outputPath,
  };

  await prisma.userProfile.update({
    where: { user_id: user.id },
    data: { preferences },
  });

  return {
    userId: user.id,
    status: 'processed',
    reason: assessment.reason,
    originalPath: assessment.originalPath,
    outputPath: assessment.outputPath,
  };
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany({
      where: userIdFilter ? { id: userIdFilter } : undefined,
      include: {
        profile: true,
        body_analysis: true,
      },
    });

    const summary = {
      total: users.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      dryRun: dryRun,
    };

    for (const user of users) {
      try {
        const result = await processUser(user, prisma);

        if (result.status === 'processed' || result.status === 'dry-run') {
          summary.processed += 1;
          console.log(`[${result.status}] ${result.userId} — ${result.reason}`);
          if (result.originalPath) {
            console.log(`  original: ${result.originalPath}`);
            console.log(`  output:   ${result.outputPath}`);
          }
        } else if (result.status === 'skipped') {
          summary.skipped += 1;
        } else {
          summary.failed += 1;
          console.error(`[failed] ${result.userId} — ${result.reason}`);
        }
      } catch (error) {
        summary.failed += 1;
        console.error(`[failed] ${user.id} — ${error.message}`);
      }
    }

    console.log('\nBackfill summary:', summary);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
