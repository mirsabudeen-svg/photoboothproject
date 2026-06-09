import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1717785600000 implements MigrationInterface {
  name = 'InitialSchema1717785600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "devices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "model" character varying NOT NULL,
        "accessToken" character varying NOT NULL,
        "appVersion" character varying,
        "osVersion" character varying,
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        "lastSeenAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_devices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_devices_accessToken" UNIQUE ("accessToken")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "eventType" character varying NOT NULL DEFAULT 'WEDDING',
        "config" jsonb NOT NULL,
        "serverVersion" bigint NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "captures" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "eventId" character varying NOT NULL,
        "deviceId" character varying NOT NULL,
        "captureType" character varying NOT NULL,
        "idempotencyKey" character varying NOT NULL,
        "objectKey" character varying,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_captures" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_captures_idempotencyKey" UNIQUE ("idempotencyKey")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_captures_eventId" ON "captures" ("eventId")`);
    await queryRunner.query(`
      CREATE TABLE "shares" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "captureId" character varying NOT NULL,
        "channel" character varying NOT NULL,
        "destination" character varying,
        "idempotencyKey" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'QUEUED',
        "providerMessageId" character varying,
        "sentAt" TIMESTAMP WITH TIME ZONE,
        "deliveredAt" TIMESTAMP WITH TIME ZONE,
        "error" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shares" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_shares_idempotencyKey" UNIQUE ("idempotencyKey")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "analytics_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "deviceId" character varying NOT NULL,
        "type" character varying NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}',
        "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analytics_events" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "analytics_events"`);
    await queryRunner.query(`DROP TABLE "shares"`);
    await queryRunner.query(`DROP INDEX "IDX_captures_eventId"`);
    await queryRunner.query(`DROP TABLE "captures"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "devices"`);
  }
}
