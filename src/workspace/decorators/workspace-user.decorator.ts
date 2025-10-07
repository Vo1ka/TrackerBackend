import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Декоратор для получения роли пользователя в workspace
export const WorkspaceUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data === 'role') {
      return request.workspaceRole;
    }

    return user;
  },
);
