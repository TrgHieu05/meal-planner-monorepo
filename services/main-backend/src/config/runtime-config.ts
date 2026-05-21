import * as path from 'node:path';

type SwaggerServer = {
  url: string;
  description: string;
};

const MONOREPO_ROOT = path.resolve(__dirname, '../../../../');

const LOCAL_ENV_FILE_PATHS = [
  path.join(MONOREPO_ROOT, '.env.local'),
  path.join(MONOREPO_ROOT, '.env'),
];

const LOCAL_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
];

export function isProductionRuntime() {
  return normalizeOptionalString(process.env.NODE_ENV)?.toLowerCase() === 'production';
}

export function getEnvFilePaths() {
  return isProductionRuntime() ? [] : LOCAL_ENV_FILE_PATHS;
}

export function getAllowedCorsOrigins() {
  const configuredOrigins = [
    process.env.MAIN_DOMAIN,
    process.env.API_STAGING_DOMAIN,
    process.env.API_PRODUCTION_DOMAIN,
  ]
    .map(normalizeDomainOrigin)
    .filter((origin): origin is string => origin !== null);

  const localOrigins = isProductionRuntime() ? [] : LOCAL_ALLOWED_ORIGINS;

  return Array.from(new Set([...configuredOrigins, ...localOrigins]));
}

export function getSwaggerServers(port: number): SwaggerServer[] {
  const configuredServers = [
    buildSwaggerServer(process.env.API_STAGING_DOMAIN, 'Staging API'),
    buildSwaggerServer(process.env.API_PRODUCTION_DOMAIN, 'Production API'),
  ].filter((server): server is SwaggerServer => server !== null);

  if (isProductionRuntime()) {
    return configuredServers;
  }

  return [
    ...configuredServers,
    {
      url: 'http://localhost:8080',
      description: 'Nginx Gateway Local',
    },
    {
      url: `http://localhost:${port}`,
      description: 'Direct Main-Backend Port',
    },
  ];
}

function buildSwaggerServer(domainValue: string | undefined, description: string) {
  const origin = normalizeDomainOrigin(domainValue);
  if (!origin) {
    return null;
  }

  return {
    url: origin,
    description,
  };
}

function normalizeDomainOrigin(value: string | undefined) {
  const normalizedValue = normalizeOptionalString(value);
  if (!normalizedValue) {
    return null;
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return trimTrailingSlash(normalizedValue);
  }

  return `https://${trimTrailingSlash(normalizedValue)}`;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/u, '');
}

function normalizeOptionalString(value: string | undefined | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}