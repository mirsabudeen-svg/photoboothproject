import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  model: string;

  @Column({ unique: true })
  accessToken: string;

  @Column({ nullable: true })
  currentEventId: string | null;

  @Column({ type: 'timestamptz' })
  tokenIssuedAt: Date;

  @Column({ type: 'timestamptz' })
  tokenExpiresAt: Date;

  @Column({ nullable: true })
  appVersion: string | null;

  @Column({ nullable: true })
  osVersion: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
