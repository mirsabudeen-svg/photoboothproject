import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  name: string;
  @Column()
  model: string;

  @Index()
  @Column({ name: 'access_token_hash', unique: true })
  accessTokenHash: string;

  @Column({ nullable: true })
  currentEventId: string | null;
  @Column({ type: 'timestamptz' })
  tokenIssuedAt: Date;
  @Column({ type: 'timestamptz' })
  tokenExpiresAt: Date;
  @Column({ type: 'text', nullable: true })
  appVersion: string | null;
  @Column({ type: 'text', nullable: true })
  osVersion: string | null;
  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;
  @CreateDateColumn()
  createdAt: Date;
}
