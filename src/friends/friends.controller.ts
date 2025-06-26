import { Controller, Get, Post, Delete, Param, Req, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { FeedService } from '../feed/feed.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { userId: number; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    private readonly feedService: FeedService,
  ) {}

  @Post('request/:userId')
  async sendRequest(@Req() req: AuthenticatedRequest, @Param('userId') toUserId: string) {
    const friendship = await this.friendsService.sendRequest(req.user.userId, Number(toUserId));
    // Можно добавить feed-событие для addressee
    await this.feedService.addEvent(Number(toUserId), 'friend_request_received', { from: req.user.userId });
    return friendship;
  }

  @Post('accept/:friendshipId')
  async acceptRequest(@Req() req: AuthenticatedRequest, @Param('friendshipId') friendshipId: string) {
    const friendship = await this.friendsService.acceptRequest(req.user.userId, Number(friendshipId));
    // Feed события для обоих
    await this.feedService.addEvent(friendship.requesterId, 'friend_added', { friendId: friendship.addresseeId });
    await this.feedService.addEvent(friendship.addresseeId, 'friend_added', { friendId: friendship.requesterId });
    return friendship;
  }

  @Delete(':friendshipId')
  async removeFriend(@Req() req: AuthenticatedRequest, @Param('friendshipId') friendshipId: string) {
    return this.friendsService.removeFriendship(req.user.userId, Number(friendshipId));
  }

  @Get()
  async getFriends(@Req() req: AuthenticatedRequest) {
    return this.friendsService.getFriends(req.user.userId);
  }

  @Get('requests')
  async getRequests(@Req() req: AuthenticatedRequest) {
    return this.friendsService.getRequests(req.user.userId);
  }
}
