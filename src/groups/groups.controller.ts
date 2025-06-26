import { Controller, Post, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { userId: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async createGroup(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.groupsService.createGroup(req.user.userId, body.title, body.description);
  }

  @Post(':groupId/join')
  async joinGroup(@Req() req: AuthenticatedRequest, @Param('groupId') groupId: string) {
    return this.groupsService.joinGroup(req.user.userId, Number(groupId));
  }

  @Get()
  async getMyGroups(@Req() req: AuthenticatedRequest) {
    return this.groupsService.getMyGroups(req.user.userId);
  }

  @Get(':groupId/members')
  async getGroupMembers(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupMembers(Number(groupId));
  }
}
