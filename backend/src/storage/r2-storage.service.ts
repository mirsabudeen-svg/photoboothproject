import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class R2StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('R2_BUCKET', 'photobooth-media');
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.get<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: config.get<string>('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get<string>('R2_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  buildObjectKey(tenantId: string, eventId: string, captureId: string): string {
    return `tenant/${tenantId}/event/${eventId}/capture/${captureId}/${uuidv4()}.jpg`;
  }

  variantKey(baseKey: string, suffix: string): string {
    const dot = baseKey.lastIndexOf('.');
    if (dot === -1) return `${baseKey}_${suffix}`;
    return `${baseKey.slice(0, dot)}_${suffix}${baseKey.slice(dot)}`;
  }

  async presignPut(objectKey: string, contentType: string, maxBytes?: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: contentType,
      ...(maxBytes != null ? { ContentLength: maxBytes } : {}),
    });
    return getSignedUrl(this.client, command, { expiresIn: 900 });
  }

  async getObject(objectKey: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Empty object: ${objectKey}`);
    return Buffer.from(bytes);
  }

  async getRange(objectKey: string, start: number, end: number): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Range: `bytes=${start}-${end}`,
      }),
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Empty range: ${objectKey}`);
    return Buffer.from(bytes);
  }

  async delete(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
  }

  async putObject(objectKey: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  publicUrl(objectKey: string): string {
    const publicBase = this.config.get<string>('R2_PUBLIC_BASE_URL');
    return publicBase ? `${publicBase}/${objectKey}` : objectKey;
  }
}
