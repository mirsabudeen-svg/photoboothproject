import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 'WEDDING' })
  eventType: string;

  @Column({ type: 'jsonb' })
  config: Record<string, unknown>;

  @Column({ type: 'bigint', default: 1 })
  serverVersion: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 12 })
  galleryToken: string;

  @Column({ type: 'timestamptz', nullable: true })
  galleryPublishedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  galleryExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
