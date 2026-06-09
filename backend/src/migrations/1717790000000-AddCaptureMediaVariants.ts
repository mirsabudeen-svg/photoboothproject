import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCaptureMediaVariants1717790000000 implements MigrationInterface {
  name = 'AddCaptureMediaVariants1717790000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "captures" ADD "webpKey" character varying`);
    await queryRunner.query(`ALTER TABLE "captures" ADD "thumbKey" character varying`);
    await queryRunner.query(`ALTER TABLE "captures" ADD "printKey" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "captures" DROP COLUMN "printKey"`);
    await queryRunner.query(`ALTER TABLE "captures" DROP COLUMN "thumbKey"`);
    await queryRunner.query(`ALTER TABLE "captures" DROP COLUMN "webpKey"`);
  }
}
