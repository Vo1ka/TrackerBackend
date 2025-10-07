import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '../guards/workspace-role.dto';

export const RequireWorkspaceRole = (role: WorkspaceRole) =>
  SetMetadata('workspaceRole', role);
