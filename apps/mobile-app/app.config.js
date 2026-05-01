const fs = require('fs');
const path = require('path');

const { expo } = require('./app.json');

const GOOGLE_SIGNIN_PLUGIN = '@react-native-google-signin/google-signin';

applyRepoEnvDefaults();

const apiBaseUrl = normalizeOptionalString(process.env.EXPO_PUBLIC_API_BASE_URL);
const googleWebClientId = normalizeOptionalString(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
);

module.exports = {
  ...expo,
  plugins: appendUniquePlugin(expo.plugins, GOOGLE_SIGNIN_PLUGIN),
  extra: {
    ...(expo.extra ?? {}),
    ...(apiBaseUrl ? { apiBaseUrl } : {}),
    ...(googleWebClientId ? { googleWebClientId } : {}),
  },
};

function appendUniquePlugin(plugins, pluginName) {
  const normalizedPlugins = Array.isArray(plugins) ? [...plugins] : [];
  const hasPlugin = normalizedPlugins.some((entry) => {
    if (Array.isArray(entry)) {
      return entry[0] === pluginName;
    }

    return entry === pluginName;
  });

  if (hasPlugin) {
    return normalizedPlugins;
  }

  return [...normalizedPlugins, pluginName];
}

function applyRepoEnvDefaults() {
  const repoRoot = path.resolve(__dirname, '../..');
  const mergedEnv = {
    ...readEnvFile(path.join(repoRoot, '.env')),
    ...readEnvFile(path.join(repoRoot, '.env.local')),
  };

  for (const [key, value] of Object.entries(mergedEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const entries = {};
  const fileContents = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of fileContents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key) {
      continue;
    }

    const rawValue = line.slice(separatorIndex + 1).trim();
    entries[key] = stripWrappingQuotes(rawValue);
  }

  return entries;
}

function stripWrappingQuotes(value) {
  if (value.length >= 2) {
    const firstCharacter = value[0];
    const lastCharacter = value[value.length - 1];

    if (
      (firstCharacter === '"' && lastCharacter === '"') ||
      (firstCharacter === '\'' && lastCharacter === '\'')
    ) {
      return value.slice(1, -1);
    }
  }

  return value;
}

function normalizeOptionalString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}