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
    
    // Можно добавить проверку на блокировку пользователя
    // const user = await this.usersService.findById(payload.sub);
    // if (user.isBlocked) throw new UnauthorizedException('User is blocked');
    
    return { 
      userId: payload.sub, 
      email: payload.email 
    };
  }
}
