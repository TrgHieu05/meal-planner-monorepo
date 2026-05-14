const fs = require('fs');
const path = require('path');

const baseExpoConfig = {
  name: 'Kitchen Mind',
  slug: 'KitchenMind',
  scheme: 'mobile-app-scheme',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/android-icon-foreground.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/android-icon-foreground.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#ffffff',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.trghieu05.KitchenMind',
  },
  web: {
    favicon: './assets/images/favicon.png',
  },
  experiments: {
    tsconfigPaths: true,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-web-browser',
    'expo-image-picker',
  ],
  extra: {
    router: {},
    eas: {
      projectId: '8f3c2e1e-5e9c-4baa-aff9-017f6b4dc83c',
    },
  },
  owner: 'trghieu05',
};

const GOOGLE_SIGNIN_PLUGIN = '@react-native-google-signin/google-signin';
const appVariant = normalizeAppVariant(process.env.APP_VARIANT);

applyRepoEnvDefaults(appVariant);

const apiBaseUrl = normalizeOptionalString(process.env.EXPO_PUBLIC_API_BASE_URL);
const googleWebClientId = normalizeOptionalString(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
);

assertRequiredPublicEnv({
  apiBaseUrl,
  appVariant,
  googleWebClientId,
});

module.exports = {
  ...baseExpoConfig,
  plugins: appendUniquePlugin(baseExpoConfig.plugins, GOOGLE_SIGNIN_PLUGIN),
  extra: {
    ...(baseExpoConfig.extra ?? {}),
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

function applyRepoEnvDefaults(appVariant) {
  if (!shouldLoadRepoEnvDefaults(appVariant)) {
    return;
  }

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

function shouldLoadRepoEnvDefaults(appVariant) {
  return !appVariant && !isTruthy(process.env.CI) && !isTruthy(process.env.EAS_BUILD);
}

function assertRequiredPublicEnv({ apiBaseUrl, appVariant, googleWebClientId }) {
  if (!shouldRequireInjectedPublicEnv(appVariant)) {
    return;
  }

  const missingVariables = [];

  if (!apiBaseUrl) {
    missingVariables.push('EXPO_PUBLIC_API_BASE_URL');
  }

  if (!googleWebClientId) {
    missingVariables.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }

  if (missingVariables.length === 0) {
    return;
  }

  throw new Error(
    `Missing required Expo public env for ${appVariant ?? 'this build'}: ${missingVariables.join(', ')}. Configure them in the selected EAS environment or pass them explicitly before app.config.js is evaluated.`,
  );
}

function shouldRequireInjectedPublicEnv(appVariant) {
  return isTruthy(process.env.CI) || isTruthy(process.env.EAS_BUILD) || appVariant === 'preview' || appVariant === 'production';
}

function normalizeAppVariant(value) {
  const normalizedValue = normalizeOptionalString(value);
  if (!normalizedValue) {
    return null;
  }

  if (
    normalizedValue !== 'development' &&
    normalizedValue !== 'preview' &&
    normalizedValue !== 'production'
  ) {
    throw new Error(
      `Unsupported APP_VARIANT "${normalizedValue}". Expected one of: development, preview, production.`,
    );
  }

  return normalizedValue;
}

function isTruthy(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue === '1' || normalizedValue === 'true';
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