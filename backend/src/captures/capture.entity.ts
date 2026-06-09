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
  @Column({ type: 'text', nullable: true })
  objectKey: string;
  @Column({ type: 'text', nullable: true })
  webpKey: string | null;
  @Column({ type: 'text', nullable: true })
  thumbKey: string | null;
  @Column({ type: 'text', nullable: true })
  printKey: string | null;
  @Column({ type: 'text', nullable: true })
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
