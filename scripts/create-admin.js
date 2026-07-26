const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = process.env[key] || value;
  }
}

loadEnvFile();

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL || 'admin@fujrs.local';
const password = process.env.ADMIN_PASSWORD || 'FujrsAdmin2026!';
const name = process.env.ADMIN_NAME || 'Super Admin';

async function run() {
  console.log('Pushing Prisma schema to the database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  const hashed = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', passwordHash: hashed, name } });
    console.log(`Updated existing user to ADMIN: ${email}`);
  } else {
    await prisma.user.create({ data: { email, name, passwordHash: hashed, role: 'ADMIN' } });
    console.log(`Created new ADMIN user: ${email}`);
  }

  console.log('Credentials:');
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
  console.log('\nChange the password after first sign-in.');

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
