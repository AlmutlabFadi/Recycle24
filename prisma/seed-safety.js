/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const safetySessions = [
    {
      id: 'safety_session_1',
      title: 'الاستجابة لمخلفات الحرب غير المنفجرة',
      description: 'تدريب عملي على التعرف والإبلاغ الآمن والتصرف الصحيح.',
      level: 'BASIC',
      location: 'دمشق - مركز التدريب الصناعي',
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      durationHours: 4,
      capacity: 30,
      availableSeats: 12,
      instructorName: 'م. رائد الحسن',
      status: 'OPEN',
    },
    {
      id: 'safety_session_2',
      title: 'إدارة المواد الخطرة في ساحات الخردة',
      description: 'تصنيف، تخزين، ونقل البطاريات والمواد الكيميائية بأمان.',
      level: 'ADVANCED',
      location: 'حلب - مركز السلامة المهنية',
      startDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      durationHours: 6,
      capacity: 25,
      availableSeats: 7,
      instructorName: 'د. ناهد شهاب',
      status: 'OPEN',
    },
    {
      id: 'safety_session_3',
      title: 'خطة الطوارئ والإخلاء السريع',
      description: 'محاكاة سيناريوهات الحرائق والانفجارات وكيفية الإخلاء.',
      level: 'BASIC',
      location: 'حمص - قاعة الدفاع المدني',
      startDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      durationHours: 3,
      capacity: 40,
      availableSeats: 21,
      instructorName: 'م. هبة المصري',
      status: 'OPEN',
    },
  ];

  for (const session of safetySessions) {
    await prisma.safetyTrainingSession.upsert({
      where: { id: session.id },
      update: session,
      create: session,
    });
  }

  console.log('Safety training sessions seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
