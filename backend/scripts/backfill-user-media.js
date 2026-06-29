const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const { randomUUID } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

loadEnv({ path: resolve(__dirname, '../.env') });

const USER_MEDIA_STATUS = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
};

async function registerIfMissing(prisma, { userId, module, storagePath, mimeType, uploadSource }) {
  if (!userId || !module || !storagePath) {
    return { skipped: true };
  }

  const existing = await prisma.userMedia.findFirst({
    where: {
      user_id: userId,
      module,
      storage_path: storagePath,
      deleted_at: null,
    },
  });

  if (existing) {
    return { skipped: true, existing: true };
  }

  await prisma.userMedia.updateMany({
    where: {
      user_id: userId,
      module,
      status: USER_MEDIA_STATUS.ACTIVE,
    },
    data: {
      status: USER_MEDIA_STATUS.ARCHIVED,
      updated_at: new Date(),
    },
  });

  await prisma.userMedia.create({
    data: {
      id: randomUUID(),
      user_id: userId,
      module,
      storage_path: storagePath,
      public_url: storagePath,
      mime_type: mimeType || null,
      upload_source: uploadSource || 'backfill',
      status: USER_MEDIA_STATUS.ACTIVE,
      stored_file_name: storagePath.split('/').pop() || null,
    },
  });

  return { created: true };
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  let created = 0;
  let skipped = 0;

  const faceRows = await prisma.faceRegistration.findMany({
    where: { NOT: { face_image_url: null } },
    select: { user_id: true, face_image_url: true },
  });

  for (const row of faceRows) {
    const result = await registerIfMissing(prisma, {
      userId: row.user_id,
      module: 'FACE_REGISTRATION',
      storagePath: row.face_image_url,
      mimeType: 'image/jpeg',
      uploadSource: 'backfill_face_registration',
    });
    if (result.created) created += 1;
    else skipped += 1;
  }

  const bodyRows = await prisma.bodyAnalysis.findMany({
    where: { NOT: { body_image_url: null } },
    select: { user_id: true, body_image_url: true },
  });

  for (const row of bodyRows) {
    const result = await registerIfMissing(prisma, {
      userId: row.user_id,
      module: 'BODY_ANALYSIS',
      storagePath: row.body_image_url,
      mimeType: 'image/jpeg',
      uploadSource: 'backfill_body_analysis',
    });
    if (result.created) created += 1;
    else skipped += 1;
  }

  const avatarRows = (await prisma.digitalAvatar.findMany({
    where: { is_active: true },
    select: { user_id: true, avatar_image: true, avatar_type: true, version: true },
  })).filter((row) => Boolean(row.avatar_image));

  for (const row of avatarRows) {
    const result = await registerIfMissing(prisma, {
      userId: row.user_id,
      module: 'AVATAR',
      storagePath: row.avatar_image,
      mimeType: 'image/png',
      uploadSource: 'backfill_avatar',
    });
    if (result.created) created += 1;
    else skipped += 1;
  }

  const tryOnRows = await prisma.virtualTryOnResult.findMany({
    where: { NOT: { generated_image: null } },
    select: { user_id: true, generated_image: true },
  });

  for (const row of tryOnRows) {
    if (!String(row.generated_image).includes('/uploads/try-on/')) {
      skipped += 1;
      continue;
    }

    const result = await registerIfMissing(prisma, {
      userId: row.user_id,
      module: 'VIRTUAL_TRYON',
      storagePath: row.generated_image,
      mimeType: 'image/png',
      uploadSource: 'backfill_virtual_try_on',
    });
    if (result.created) created += 1;
    else skipped += 1;
  }

  console.log(`User media backfill complete | created=${created} skipped=${skipped}`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
