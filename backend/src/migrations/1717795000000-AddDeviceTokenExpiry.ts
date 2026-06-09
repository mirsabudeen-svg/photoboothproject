import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceTokenExpiry1717795000000 implements MigrationInterface {
  name = 'AddDeviceTokenExpiry1717795000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "devices"
      ADD COLUMN "tokenIssuedAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "tokenExpiresAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "currentEventId" character varying
    `);
    await queryRunner.query(`
      UPDATE "devices"
      SET "tokenIssuedAt" = NOW(),
          "tokenExpiresAt" = NOW() + INTERVAL '90 days'
      WHERE "tokenIssuedAt" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "devices"
      ALTER COLUMN "tokenIssuedAt" SET NOT NULL,
      ALTER COLUMN "tokenExpiresAt" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "devices"
      DROP COLUMN "currentEventId",
      DROP COLUMN "tokenExpiresAt",
      DROP COLUMN "tokenIssuedAt"
    `);
  }
}
