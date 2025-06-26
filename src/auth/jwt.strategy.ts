import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SUPER_SECRET_KEY', // Лучше вынести в .env!
    });
  }

  async validate(payload: any) {
    // Здесь можно добавить любые проверки, например, заблокирован ли пользователь
    return { userId: payload.sub, email: payload.email };
  }
}
