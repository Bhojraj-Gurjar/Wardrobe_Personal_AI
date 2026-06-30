import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsEnum(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV = 'development';

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN = '7d';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN = '30d';

  @IsString()
  @IsOptional()
  REDIS_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  REDIS_PORT = 6379;

  @IsString()
  @IsOptional()
  QDRANT_URL;

  @IsString()
  @IsOptional()
  QDRANT_API_KEY;

  @IsString()
  @IsOptional()
  OPENAI_API_KEY;

  @IsString()
  @IsOptional()
  AI_SERVICE_URL;
}

export function validateEnv(config) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}
