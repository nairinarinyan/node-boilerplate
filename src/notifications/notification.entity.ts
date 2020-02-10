import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    date: Date;

    @Column()
    body: string;

    @Column({ nullable: true })
    link: string;

    @Column({ default: false })
    read: boolean;

    @ManyToOne(type => User, user => user.notifications, { onDelete: 'CASCADE' })
    user: User;
}
