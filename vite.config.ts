import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),

        ...(uploadSourceMaps
            ? [
                sentryVitePlugin({
                    org: '0da92dac133e',
                    project: 'planit-frontend',
                    authToken: process.env.SENTRY_AUTH_TOKEN,

                    errorHandler: (error) => {
                        throw error;
                    },

                    sourcemaps: {
                        assets: './dist/**',
                        filesToDeleteAfterUpload: './dist/**/*.map',
                    },

                    telemetry: false,
                }),
            ]
            : []),
    ],

    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },

    build: {
        sourcemap: uploadSourceMaps ? 'hidden' : false,
    },
});