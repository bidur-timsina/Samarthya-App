import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  async getBanners(all = false) { return this.prisma.banner.findMany({ where: all ? {} : { isActive: true }, orderBy: { order: 'asc' } }); }
  async createBanner(dto: any) { return this.prisma.banner.create({ data: dto }); }
  async updateBanner(id: string, dto: any) { return this.prisma.banner.update({ where: { id }, data: dto }); }
  async deleteBanner(id: string) { return this.prisma.banner.delete({ where: { id } }); }

  async getAnnouncements() { return this.prisma.announcement.findMany({ include: { author: { select: { name: true } } }, orderBy: { publishedAt: 'desc' }, take: 20 }); }
  async createAnnouncement(dto: any, authorId: string) { return this.prisma.announcement.create({ data: { ...dto, authorId } }); }
  async updateAnnouncement(id: string, dto: any) { return this.prisma.announcement.update({ where: { id }, data: dto }); }
  async deleteAnnouncement(id: string) { return this.prisma.announcement.delete({ where: { id } }); }
}
