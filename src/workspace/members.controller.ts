import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { InviteMemberDto } from './dto/invite-member.dto';

@Controller('workspaces/:workspaceId/members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  // Список участников workspace
  @Get()
  async list(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
  ) {
    return this.membersService.findAll(workspaceId, req.user.id);
  }

  // Пригласить участника
  @Post('invite')
  async invite(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() dto: InviteMemberDto,
  ) {
    return this.membersService.invite(workspaceId, req.user.id, dto);
  }

  // Принять приглашение (отдельный роут без workspaceId)
  @Post('accept/:token')
  async acceptInvite(@Req() req, @Param('token') token: string) {
    return this.membersService.acceptInvite(token, req.user.id);
  }

  // Получить мои приглашения
  @Get('invites/my')
  async getMyInvites(@Req() req) {
    return this.membersService.getMyInvites(req.user.id);
  }

  // Изменить роль участника
  @Patch(':memberId/role')
  async updateRole(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body('role') role: string,
  ) {
    return this.membersService.updateRole(
      workspaceId,
      memberId,
      req.user.id,
      role,
    );
  }

  // Удалить участника
  @Delete(':memberId')
  async remove(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.membersService.remove(workspaceId, memberId, req.user.id);
  }

  // Покинуть workspace
  @Post('leave')
  async leave(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
  ) {
    return this.membersService.leave(workspaceId, req.user.id);
  }
}
