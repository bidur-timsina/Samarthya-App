import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@samarthya.edu.np' },
    update: {},
    create: { name: 'Admin', email: 'admin@samarthya.edu.np', password: await hash('Admin@123'), role: 'ADMIN', isVerified: true },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@samarthya.edu.np' },
    update: {},
    create: { name: 'Teacher', email: 'teacher@samarthya.edu.np', password: await hash('Teacher@123'), role: 'TEACHER', isVerified: true },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@samarthya.edu.np' },
    update: {},
    create: { name: 'Student', email: 'student@samarthya.edu.np', password: await hash('Student@123'), role: 'STUDENT', isVerified: true, xp: { create: {} } },
  });

  const categories = ['Loksewa', 'Engineering', 'Health', 'Banking', 'Teaching', 'IT'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { slug: name.toLowerCase() },
      update: {},
      create: { name, slug: name.toLowerCase() },
    });
  }

  const loksewa = await prisma.category.findUnique({ where: { slug: 'loksewa' } });

  const course = await prisma.course.upsert({
    where: { slug: 'loksewa-preparation-complete-guide' },
    update: {},
    create: {
      title: 'Loksewa Preparation: Complete Guide',
      slug: 'loksewa-preparation-complete-guide',
      description: 'Comprehensive preparation for Nepal Public Service Commission exams.',
      price: 2500,
      level: 'BEGINNER',
      isPublished: true,
      isFeatured: true,
      categoryId: loksewa.id,
      instructorId: teacher.id,
    },
  });

  const chapter = await prisma.chapter.upsert({
    where: { id: 'intro-chapter' },
    update: {},
    create: { id: 'intro-chapter', courseId: course.id, title: 'Introduction', order: 1 },
  });

  await prisma.lesson.upsert({
    where: { id: 'intro-lesson-1' },
    update: {},
    create: { id: 'intro-lesson-1', chapterId: chapter.id, title: 'Welcome & Overview', type: 'VIDEO', duration: 600, order: 1, isFree: true, isPublished: true },
  });

  const badges = [
    { name: 'First Step', description: 'Earned your first XP', icon: '🌟', xpRequired: 1 },
    { name: 'Learner', description: 'Reached 100 XP', icon: '📚', xpRequired: 100 },
    { name: 'Achiever', description: 'Reached 500 XP', icon: '🏆', xpRequired: 500 },
    { name: 'Scholar', description: 'Reached 1000 XP', icon: '🎓', xpRequired: 1000 },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({ where: { name: badge.name }, update: {}, create: badge });
  }

  const generalChannel = await prisma.channel.upsert({
    where: { id: 'general-channel' },
    update: {},
    create: { id: 'general-channel', type: 'GENERAL', name: 'General' },
  });

  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId: generalChannel.id, userId: student.id } },
    update: {},
    create: { channelId: generalChannel.id, userId: student.id },
  });

  console.log('✅ Seed complete');
  console.log('Admin:   admin@samarthya.edu.np / Admin@123');
  console.log('Teacher: teacher@samarthya.edu.np / Teacher@123');
  console.log('Student: student@samarthya.edu.np / Student@123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
