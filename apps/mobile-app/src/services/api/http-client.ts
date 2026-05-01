import axios, { type AxiosInstance } from 'axios';

import { normalizeOptionalString, resolveApiBaseUrl } from './api-config';

const DEFAULT_TIMEOUT_MS = 10000;

type ApiErrorShape = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
};

export type ApiClientConfig = {
  apiBaseUrl?: string;
};

export type AuthenticatedApiClientConfig = ApiClientConfig & {
  accessToken: string;
};

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string | null;
  readonly details: unknown;
  readonly data: unknown;

  constructor(params: {
    message: string;
    status: number | null;
    code?: string | null;
    details?: unknown;
    data?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code ?? null;
    this.details = params.details ?? null;
    this.data = params.data ?? null;
  }
}

export function createApiClient(config: ApiClientConfig = {}): AxiosInstance {
  const client = axios.create({
    baseURL: resolveApiBaseUrl(config.apiBaseUrl),
    timeout: DEFAULT_TIMEOUT_MS,
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(normalizeApiError(error)),
  );

  return client;
}

export function createAuthenticatedApiClient(
  config: AuthenticatedApiClientConfig,
): AxiosInstance {
  const client = createApiClient(config);
  client.defaults.headers.common.Authorization = `Bearer ${normalizeRequiredAccessToken(
    config.accessToken,
  )}`;

  return client;
}

export function isApiErrorWithStatus(
  error: unknown,
  status: number,
): error is ApiError {
  return error instanceof ApiError && error.status === status;
}

function normalizeApiError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Unexpected API error.');
  }

  const data = error.response?.data as ApiErrorShape | undefined;
  return new ApiError({
    message: extractApiMessage(data) ?? error.message ?? 'API request failed.',
    status: error.response?.status ?? null,
    code: typeof data?.code === 'string' ? data.code : null,
    details: data?.details ?? null,
    data: error.response?.data ?? null,
  });
}

function extractApiMessage(data: ApiErrorShape | undefined) {
  if (!data) {
    return null;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  if (Array.isArray(data.message)) {
    const messages = data.message
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());

    return messages.length > 0 ? messages.join(', ') : null;
  }

  return null;
}

function normalizeRequiredAccessToken(accessToken: string) {
  const normalizedAccessToken = normalizeOptionalString(accessToken);
  if (!normalizedAccessToken) {
    throw new Error(
      'Missing access token. Pass session.accessToken when calling protected APIs.',
    );
  }

  return normalizedAccessToken;
}