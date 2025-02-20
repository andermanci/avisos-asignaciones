// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import db from '@astrojs/db';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['astro:db'], // Asegura que Astro no intente externalizar `astro:db`
    },
  },
  integrations: [react(), db()],
  adapter: netlify()
});