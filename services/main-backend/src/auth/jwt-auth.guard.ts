import { ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const REQUIRE_AUTH_KEY = 'require-auth';

export const RequireAuth = () => SetMetadata(REQUIRE_AUTH_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtAuthOptInGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const requireAuth = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireAuth) {
      return true;
    }

    return super.canActivate(context);
  }
}
