import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('warranty_data')
export class Warranty {
  @PrimaryColumn()
  id: string;

  @Column()
  managerId: string;

  @Column()
  confirmed: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  clientName: string;
}

@Entity('warranty_users')
export class Users{
  @PrimaryColumn()
  id: string;

  @Column('boolean', {default: true})
  hasAccess: boolean = true;
  
  @Column('boolean', {default: false})
  isAdmin: boolean = false;
}