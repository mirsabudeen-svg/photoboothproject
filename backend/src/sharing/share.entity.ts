import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('shares')
export class ShareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  captureId: string;

  @Column()
  channel: string;

  @Column({ nullable: true })
  destination: string | null;

  @Index({ unique: true })
  @Column()
  idempotencyKey: string;

  @Column({ default: 'QUEUED' })
  status: string;

  @Column({ nullable: true })
  providerMessageId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ nullable: true })
  error: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
