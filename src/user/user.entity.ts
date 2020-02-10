import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import bcrypt from 'bcrypt';
import { Notification } from '../notifications/notification.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    passwordHash: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ nullable: true })
    name: string;

    @OneToMany(type => Notification, notification => notification.user, { cascade: true })
    notifications: Notification[];

    async setPassword(plainPassword: string) {
        const hash = await bcrypt.hash(plainPassword, 8);
        this.passwordHash = hash; 
    }

    async validatePassword(plainPassword: string, passwordHash: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, passwordHash);
    }
}