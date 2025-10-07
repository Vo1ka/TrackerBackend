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
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(req.user.id, dto);
  }

  @Get()
  async list(@Req() req) {
    return this.workspaceService.findAllByUser(req.user.id);
  }

  @Get(':workspaceId')
  async getDetails(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
  ) {
    return this.workspaceService.findOne(workspaceId, req.user.id);
  }

  @Patch(':workspaceId')
  async update(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.update(workspaceId, req.user.id, dto);
  }

  @Delete(':workspaceId')
  async delete(
    @Req() req,
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
  ) {
    return this.workspaceService.delete(workspaceId, req.user.id);
  }
}
