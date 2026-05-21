import { defineConfig } from '@prisma/config';
import {
  getRequiredDatabaseUrl,
  hydratePrismaEnvFromLocalFiles,
} from './runtime-env';

hydratePrismaEnvFromLocalFiles();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts --mode=bootstrap',
  },
  datasource: {
    url: getRequiredDatabaseUrl(),
  },
});
