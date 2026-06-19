import { Injectable, CanActivate } from '@nestjs/common';

export @Injectable()
class RolesGuard {
  canActivate() {
    return true;
  }
}
