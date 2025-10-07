import { IsEmail, IsString, IsIn } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['member', 'manager', 'admin'])
  role: string;
}
