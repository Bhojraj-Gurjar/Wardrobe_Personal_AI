import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export @Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {}
