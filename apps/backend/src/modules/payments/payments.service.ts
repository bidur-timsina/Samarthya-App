import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async initiateEsewa(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: 'ACTIVE' },
      update: {},
    });

    const payment = await this.prisma.payment.upsert({
      where: { enrollmentId: enrollment.id },
      create: { userId, enrollmentId: enrollment.id, amount: course.price, method: 'ESEWA', status: 'PENDING' },
      update: { status: 'PENDING' },
    });

    const amount = Number(course.price);
    const productCode = this.config.get('ESEWA_MERCHANT_CODE');
    const secretKey = this.config.get('ESEWA_SECRET_KEY');
    const message = `total_amount=${amount},transaction_uuid=${payment.id},product_code=${productCode}`;
    const signature = crypto.createHmac('sha256', secretKey).update(message).digest('base64');

    return {
      url: `${this.config.get('ESEWA_BASE_URL')}/api/epay/main/v2/form`,
      fields: {
        amount,
        tax_amount: 0,
        total_amount: amount,
        transaction_uuid: payment.id,
        product_code: productCode,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${this.config.get('FRONTEND_URL')}/payment/esewa/success`,
        failure_url: `${this.config.get('FRONTEND_URL')}/payment/esewa/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
      },
    };
  }

  async verifyEsewa(data: string) {
    const decoded = JSON.parse(Buffer.from(data, 'base64').toString());
    const payment = await this.prisma.payment.findUnique({ where: { id: decoded.transaction_uuid } });
    if (!payment) throw new NotFoundException('Payment not found');

    const secretKey = this.config.get('ESEWA_SECRET_KEY');
    const message = `transaction_code=${decoded.transaction_code},status=${decoded.status},total_amount=${decoded.total_amount},transaction_uuid=${decoded.transaction_uuid},product_code=${decoded.product_code},signed_field_names=${decoded.signed_field_names}`;
    const expected = crypto.createHmac('sha256', secretKey).update(message).digest('base64');

    if (expected !== decoded.signature || decoded.status !== 'COMPLETE') {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      throw new BadRequestException('Payment verification failed');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED', transactionId: decoded.transaction_code, refId: decoded.transaction_code, paidAt: new Date() },
    });
    await this.prisma.enrollment.update({ where: { id: payment.enrollmentId }, data: { status: 'ACTIVE' } });
    return { success: true, enrollmentId: payment.enrollmentId };
  }

  async initiateKhalti(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: 'ACTIVE' },
      update: {},
    });

    const payment = await this.prisma.payment.upsert({
      where: { enrollmentId: enrollment.id },
      create: { userId, enrollmentId: enrollment.id, amount: course.price, method: 'KHALTI', status: 'PENDING' },
      update: { status: 'PENDING' },
    });

    const response = await axios.post(
      `${this.config.get('KHALTI_BASE_URL')}/api/v2/epayment/initiate/`,
      {
        return_url: `${this.config.get('FRONTEND_URL')}/payment/khalti/verify`,
        website_url: this.config.get('FRONTEND_URL'),
        amount: Number(course.price) * 100,
        purchase_order_id: payment.id,
        purchase_order_name: course.title,
      },
      { headers: { Authorization: `Key ${this.config.get('KHALTI_SECRET_KEY')}` } },
    );

    await this.prisma.payment.update({ where: { id: payment.id }, data: { pidx: response.data.pidx } });
    return { paymentUrl: response.data.payment_url, pidx: response.data.pidx };
  }

  async verifyKhalti(pidx: string) {
    const payment = await this.prisma.payment.findFirst({ where: { pidx } });
    if (!payment) throw new NotFoundException('Payment not found');

    const response = await axios.post(
      `${this.config.get('KHALTI_BASE_URL')}/api/v2/epayment/lookup/`,
      { pidx },
      { headers: { Authorization: `Key ${this.config.get('KHALTI_SECRET_KEY')}` } },
    );

    if (response.data.status !== 'Completed') throw new BadRequestException('Payment not completed');

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED', transactionId: response.data.transaction_id, paidAt: new Date() },
    });
    await this.prisma.enrollment.update({ where: { id: payment.enrollmentId }, data: { status: 'ACTIVE' } });
    return { success: true };
  }

  async getAll() {
    return this.prisma.payment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        enrollment: { include: { course: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
