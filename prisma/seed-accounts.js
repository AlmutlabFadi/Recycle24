/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Developer@2026', 12);
  const adminPassword = await bcrypt.hash('Admin@2026', 12);

  // =============================================
  // 1. DEVELOPER ACCOUNT (Trader + Client access)
  // =============================================
  const developer = await prisma.user.upsert({
    where: { email: 'dev@recycle24.com' },
    update: {
      password,
      role: 'TRADER',
      userType: 'TRADER',
      isVerified: true,
      status: 'ACTIVE',
    },
    create: {
      email: 'dev@recycle24.com',
      phone: '+963999000001',
      password,
      name: 'مطور موثق',
      firstName: 'فادي',
      lastName: 'المطور',
      role: 'TRADER',
      userType: 'TRADER',
      isVerified: true,
      status: 'ACTIVE',
      gender: 'male',
    },
  });

  console.log('✅ Developer account created:');
  console.log(`   ID:    ${developer.id}`);
  console.log(`   Email: dev@recycle24.com`);
  console.log(`   Phone: +963999000001`);
  console.log(`   Pass:  Developer@2026`);
  console.log(`   Role:  TRADER (can switch to BUYER in-app)`);
  console.log('');

  // Create wallet for developer
  await prisma.wallet.upsert({
    where: { userId: developer.id },
    update: { balanceSYP: 100000000, balanceUSD: 5000 },
    create: { userId: developer.id, balanceSYP: 100000000, balanceUSD: 5000 },
  });
  console.log('   💰 Wallet: 100,000,000 SYP + $5,000 USD');

  // Create trader profile for developer
  await prisma.trader.upsert({
    where: { userId: developer.id },
    update: {},
    create: {
      userId: developer.id,
      businessName: 'Recycle24 Dev',
      verificationStatus: 'APPROVED',
    },
  });
  console.log('   🏪 Trader profile: PLATINUM tier, verified');
  console.log('');

  // =============================================
  // 2. ADMIN ACCOUNT
  // =============================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@recycle24.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      userType: 'ADMIN',
      isVerified: true,
      status: 'ACTIVE',
    },
    create: {
      email: 'admin@recycle24.com',
      phone: '+963999000000',
      password: adminPassword,
      name: 'مدير النظام',
      firstName: 'مدير',
      lastName: 'النظام',
      role: 'ADMIN',
      userType: 'ADMIN',
      isVerified: true,
      status: 'ACTIVE',
      gender: 'male',
    },
  });

  console.log('✅ Admin account created:');
  console.log(`   ID:    ${admin.id}`);
  console.log(`   Email: admin@recycle24.com`);
  console.log(`   Phone: +963999000000`);
  console.log(`   Pass:  Admin@2026`);
  console.log(`   Role:  ADMIN`);
  console.log('');

  // Create wallet for admin
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: { balanceSYP: 0, balanceUSD: 0 },
    create: { userId: admin.id, balanceSYP: 0, balanceUSD: 0 },
  });

  // =============================================
  // 3. Create permissions and link to admin role
  // =============================================
  const permissions = [
    { key: 'MANAGE_USERS', label: 'إدارة المستخدمين والتوثيق' },
    { key: 'MANAGE_ACCESS', label: 'إدارة الوصول والأدوار' },
    { key: 'MANAGE_KNOWLEDGE', label: 'إدارة المعرفة' },
    { key: 'MANAGE_SAFETY', label: 'إدارة السلامة' },
    { key: 'MANAGE_SUPPORT', label: 'إدارة الدعم الفني' },
    { key: 'MANAGE_FINANCE', label: 'إدارة المالية' },
    { key: 'MANAGE_REWARDS', label: 'إدارة المكافآت' },
    { key: 'VIEW_AUDIT', label: 'عرض السجلات والتقارير' },
  ];

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'صلاحيات المدير الكامل - وصول لجميع أقسام لوحة التحكم',
      isSystem: true,
    },
  });

  for (const p of permissions) {
    const perm = await prisma.permission.upsert({
      where: { key: p.key },
      update: { label: p.label },
      create: { key: p.key, label: p.label },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Link admin user to admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      }
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  console.log('   🔐 Admin role and permissions assigned (RBAC)');
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  ACCOUNTS READY - LOGIN INFORMATION');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('  📱 DEVELOPER (Client + Trader):');
  console.log('     Login: dev@recycle24.com / Developer@2026');
  console.log('     URL:   http://localhost:3000/login');
  console.log('');
  console.log('  🛡️  ADMIN (Dashboard):');
  console.log('     Login: admin@recycle24.com / Admin@2026');
  console.log('     URL:   http://localhost:3000/login');
  console.log('     Then:  http://localhost:3000/dashboard');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
