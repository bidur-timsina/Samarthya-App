import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  private minio: Minio.Client;
  private bucket: string;
  private readonly logger = new Logger(UploadsService.name);

  constructor(private config: ConfigService) {
    this.bucket = config.get('MINIO_BUCKET');
    this.minio = new Minio.Client({
      endPoint: config.get('MINIO_ENDPOINT'),
      port: config.get<number>('MINIO_PORT'),
      useSSL: false,
      accessKey: config.get('MINIO_ACCESS_KEY'),
      secretKey: config.get('MINIO_SECRET_KEY'),
    });
    this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.minio.bucketExists(this.bucket);
      if (!exists) {
        await this.minio.makeBucket(this.bucket);
      }
      // Always apply public-read policy (covers existing buckets too)
      await this.minio.setBucketPolicy(this.bucket, JSON.stringify({
        Version: '2012-10-17',
        Statement: [{ Effect: 'Allow', Principal: { AWS: ['*'] }, Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${this.bucket}/*`] }],
      }));
      this.logger.log(`MinIO bucket "${this.bucket}" ready`);
    } catch (err) {
      this.logger.warn(`MinIO not reachable at startup — uploads will fail until MinIO is available. Error: ${err.message}`);
    }
  }

  async uploadFile(buffer: Buffer, originalName: string, mimetype: string): Promise<string> {
    const ext = path.extname(originalName);
    const key = `uploads/${uuidv4()}${ext}`;
    await this.minio.putObject(this.bucket, key, buffer, buffer.length, { 'Content-Type': mimetype });
    return `${this.config.get('MINIO_PUBLIC_URL')}/${this.bucket}/${key}`;
  }

  async uploadVideoAndTranscode(buffer: Buffer, originalName: string): Promise<{ url: string; key: string; duration: number }> {
    const id = uuidv4();
    const inputPath = `/tmp/${id}_input${path.extname(originalName)}`;
    const outputDir = `/tmp/${id}_hls`;

    fs.writeFileSync(inputPath, buffer);
    fs.mkdirSync(outputDir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(['-codec: copy', '-start_number 0', '-hls_time 10', '-hls_list_size 0', '-f hls'])
        .output(`${outputDir}/index.m3u8`)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });

    const files = fs.readdirSync(outputDir);
    const key = `videos/${id}`;

    for (const file of files) {
      const filePath = `${outputDir}/${file}`;
      const fileBuffer = fs.readFileSync(filePath);
      const mimetype = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';
      await this.minio.putObject(this.bucket, `${key}/${file}`, fileBuffer, fileBuffer.length, { 'Content-Type': mimetype });
    }

    fs.unlinkSync(inputPath);
    fs.rmSync(outputDir, { recursive: true });

    const url = `${this.config.get('MINIO_PUBLIC_URL')}/${this.bucket}/${key}/index.m3u8`;
    return { url, key, duration: 0 };
  }

  async deleteFile(key: string) {
    await this.minio.removeObject(this.bucket, key).catch(err => this.logger.error(err));
  }
}
