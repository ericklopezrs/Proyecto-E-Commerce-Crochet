// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import netlify from '@astrojs/netlify';

import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  integrations: [react()],
  adapter: vercel(),
});