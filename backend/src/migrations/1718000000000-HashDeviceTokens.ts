import { createHash } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class HashDeviceTokens1718000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "devices" RENAME COLUMN "accessToken" TO "access_token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" RENAME CONSTRAINT "UQ_devices_accessToken" TO "UQ_devices_access_token_hash"`,
    );

    const rows: { id: string; access_token_hash: string }[] = await queryRunner.query(
      `SELECT id, access_token_hash FROM devices WHERE access_token_hash IS NOT NULL`,
    );
    for (const row of rows) {
      const hash = createHash('sha256').update(row.access_token_hash).digest('hex');
      await queryRunner.query(`UPDATE devices SET access_token_hash = $1 WHERE id = $2`, [
        hash,
        row.id,
      ]);
    }
  }

  public async down(): Promise<void> {
    throw new Error('Irreversible: plaintext tokens are not recoverable (by design).');
  }
}
