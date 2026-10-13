// @ts-check
import { defineConfig } from 'astro/config';
import { deploymentConfig } from './scripts/deployment-config.mjs';

export default defineConfig({
  ...deploymentConfig(process.env),
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'always',
});
