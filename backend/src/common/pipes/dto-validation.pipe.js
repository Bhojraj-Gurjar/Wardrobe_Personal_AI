import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export function DtoValidationPipe(dtoClass) {
  @Injectable()
  class MixinValidationPipe {
    async transform(value) {
      const object = plainToInstance(dtoClass, value, {
        enableImplicitConversion: true,
      });

      const errors = await validate(object, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (errors.length > 0) {
        const messages = errors.flatMap((error) =>
          Object.values(error.constraints || {}),
        );
        throw new BadRequestException(messages);
      }

      return object;
    }
  }

  return new MixinValidationPipe();
}
