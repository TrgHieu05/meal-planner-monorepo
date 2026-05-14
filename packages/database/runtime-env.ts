import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

const MONOREPO_ROOT = path.resolve(__dirname, '../..');

const LOCAL_ENV_FILE_PATHS = [
  path.join(MONOREPO_ROOT, '.env.local'),
  path.join(MONOREPO_ROOT, '.env'),
];

export function hydratePrismaEnvFromLocalFiles() {
  if (!shouldLoadLocalEnvFiles()) {
    return;
  }

  for (const envFilePath of LOCAL_ENV_FILE_PATHS) {
    if (!fs.existsSync(envFilePath)) {
      continue;
    }

    dotenv.config({ path: envFilePath });
  }
}

export function getRequiredDatabaseUrl() {
  const databaseUrl = normalizeOptionalString(process.env.DATABASE_URL);
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Inject it from the environment in CI/staging/production, or define it in the local repo .env files for local development.',
    );
  }

  return databaseUrl;
}

export function isProductionRuntime() {
  return normalizeOptionalString(process.env.NODE_ENV)?.toLowerCase() === 'production';
}

export function isCiEnvironment() {
  const ciValue = normalizeOptionalString(process.env.CI)?.toLowerCase();
  return ciValue === 'true' || ciValue === '1';
}

function shouldLoadLocalEnvFiles() {
  return !normalizeOptionalString(process.env.DATABASE_URL) && !isCiEnvironment() && !isProductionRuntime();
}

function normalizeOptionalString(value: string | undefined | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}