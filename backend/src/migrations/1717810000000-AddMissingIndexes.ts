import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingIndexes1717810000000 implements MigrationInterface {
  name = 'AddMissingIndexes1717810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_captures_event_created"
      ON "captures" ("eventId", "createdAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_captures_expires_active"
      ON "captures" ("expiresAt")
      WHERE "status" != 'deleted'
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_shares_provider_message"
      ON "shares" ("providerMessageId")
      WHERE "providerMessageId" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_devices_last_seen"
      ON "devices" ("lastSeenAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_devices_last_seen"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shares_provider_message"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_captures_expires_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_captures_event_created"`);
  }
}
