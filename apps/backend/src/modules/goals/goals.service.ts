import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async getMyStats(userId: string) {
    const xp = await this.prisma.userXP.findUnique({ where: { userId } });
    const goals = await this.prisma.goal.findMany({ where: { userId, completed: false }, orderBy: { createdAt: 'desc' } });
    const badges = await this.prisma.userBadge.findMany({ where: { userId }, include: { badge: true } });
    const leaderboard = await this.prisma.userXP.findMany({
      take: 10,
      orderBy: { totalXP: 'desc' },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    const totalXP = xp?.totalXP ?? 0;
    const level = LEVEL_THRESHOLDS.findLastIndex(t => totalXP >= t) + 1;
    const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;

    return {
      xp: { totalXP, level, streak: xp?.streak ?? 0, progress: totalXP - currentThreshold, nextLevel: nextThreshold - currentThreshold },
      goals,
      badges: badges.map(ub => ub.badge),
      leaderboard: leaderboard.map((entry, i) => ({ rank: i + 1, user: entry.user, totalXP: entry.totalXP, level: LEVEL_THRESHOLDS.findLastIndex(t => entry.totalXP >= t) + 1 })),
    };
  }

  async createGoal(userId: string, dto: { title: string; targetXP: number; deadline?: string }) {
    return this.prisma.goal.create({ data: { userId, ...dto, deadline: dto.deadline ? new Date(dto.deadline) : undefined } });
  }

  async addXP(userId: string, amount: number) {
    const xp = await this.prisma.userXP.upsert({
      where: { userId },
      create: { userId, totalXP: amount, lastStudiedAt: new Date() },
      update: { totalXP: { increment: amount }, lastStudiedAt: new Date() },
    });

    await this.checkAndAwardBadges(userId, xp.totalXP + amount);
    return xp;
  }

  async updateStreak(userId: string) {
    const xp = await this.prisma.userXP.findUnique({ where: { userId } });
    if (!xp) return;

    const lastStudied = xp.lastStudiedAt;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newStreak = lastStudied && lastStudied > yesterday ? xp.streak + 1 : 1;

    await this.prisma.userXP.update({ where: { userId }, data: { streak: newStreak } });
  }

  private async checkAndAwardBadges(userId: string, totalXP: number) {
    const badges = await this.prisma.badge.findMany({ where: { xpRequired: { lte: totalXP } } });
    const earned = await this.prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } });
    const earnedIds = new Set(earned.map(b => b.badgeId));

    const newBadges = badges.filter(b => !earnedIds.has(b.id));
    if (newBadges.length) {
      await this.prisma.userBadge.createMany({ data: newBadges.map(b => ({ userId, badgeId: b.id })) });
    }
  }
}
