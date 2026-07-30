const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

// Keep package exports ON so subpath imports like `@posthog/core/surveys` work.
config.resolver.unstable_enablePackageExports = true;

// Explicit fallback for PostHog survey subpath (avoids "Unable to resolve" if
// Metro's export map resolution is flaky with this package version).
const POSTHOG_CORE_MAP = {
  '@posthog/core/surveys': path.join(
    __dirname,
    'node_modules/@posthog/core/dist/surveys/index.js',
  ),
  '@posthog/core/error-tracking': path.join(
    __dirname,
    'node_modules/@posthog/core/dist/error-tracking/index.js',
  ),
  '@posthog/core/utils': path.join(
    __dirname,
    'node_modules/@posthog/core/dist/utils/index.js',
  ),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const mapped = POSTHOG_CORE_MAP[moduleName];
  if (mapped && fs.existsSync(mapped)) {
    return { type: 'sourceFile', filePath: mapped };
  }

  // Default Metro resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
