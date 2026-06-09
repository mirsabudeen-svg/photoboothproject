import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('captures')
export class CaptureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  deviceId: string;

  @Column()
  captureType: string;

  @Index({ unique: true })
  @Column()
  idempotencyKey: string;

  @Column({ nullable: true })
  objectKey: string;

  @Column({ nullable: true })
  webpKey: string | null;

  @Column({ nullable: true })
  thumbKey: string | null;

  @Column({ nullable: true })
  printKey: string | null;

  @Column({ nullable: true })
  expectedMime: string | null;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
