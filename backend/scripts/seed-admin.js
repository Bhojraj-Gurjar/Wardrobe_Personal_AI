const { config: loadEnv } = require('dotenv');
const { resolve } = require('node:path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

loadEnv({ path: resolve(__dirname, '../.env') });

const ADMIN_EMAIL = 'admin@wardrobeai.com';
const ADMIN_PASSWORD = 'Admin@123';
const BCRYPT_ROUNDS = 12;

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
    const existing = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existing) {
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          role: 'ADMIN',
          status: 'ACTIVE',
          password_hash: passwordHash,
          admin_created_at: existing.admin_created_at || new Date(),
        },
      });
      console.log(`Updated existing admin: ${ADMIN_EMAIL}`);
    } else {
      const admin = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          password_hash: passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          admin_created_at: new Date(),
          profile: { create: { name: 'Admin' } },
        },
      });
      console.log(`Created admin user: ${admin.email} (${admin.id})`);
    }

    console.log('Default admin credentials:');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Admin seed failed:', error);
  process.exit(1);
});
