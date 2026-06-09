import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventGalleryToken1717800000000 implements MigrationInterface {
  name = 'AddEventGalleryToken1717800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN "galleryToken" character varying(12),
      ADD COLUMN "galleryPublishedAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "galleryExpiresAt" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      UPDATE "events"
      SET "galleryToken" = substr(md5(random()::text), 1, 12)
      WHERE "galleryToken" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "events"
      ALTER COLUMN "galleryToken" SET NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_events_galleryToken" ON "events" ("galleryToken")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_events_galleryToken"`);
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN "galleryExpiresAt",
      DROP COLUMN "galleryPublishedAt",
      DROP COLUMN "galleryToken"
    `);
  }
}
