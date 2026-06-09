import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCaptureRetention1717795100000 implements MigrationInterface {
  name = 'AddCaptureRetention1717795100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "captures"
      ADD COLUMN "expectedMime" character varying,
      ADD COLUMN "expiresAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "shares"
      ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shares" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`
      ALTER TABLE "captures"
      DROP COLUMN "deletedAt",
      DROP COLUMN "expiresAt",
      DROP COLUMN "expectedMime"
    `);
  }
}
