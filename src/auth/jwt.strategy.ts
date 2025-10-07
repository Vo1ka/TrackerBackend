// src/auth/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'SUPER_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    console.log('🔑 JWT Payload validated:', { sub: payload.sub, email: payload.email });
    
    // ✅ ИСПРАВЛЕНИЕ: возвращаем 'id' вместо 'userId'
    return { 
      id: payload.sub,        // ← Теперь req.user.id будет работать
      userId: payload.sub,    // ← Для обратной совместимости (если где-то используется)
      email: payload.email 
    };
  }
}
