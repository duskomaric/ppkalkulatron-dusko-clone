import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        tailwindcss(),
        reactRouter(),
        tsconfigPaths(),
        VitePWA({
            strategies: 'injectManifest',
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            devOptions: {
                enabled: true
            },
            includeAssets: ['favicon.ico', 'icon-512.png', 'icon-192.png', 'screenshot-desktop.png'],
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                swSrc: 'app/sw.ts',
            },
            manifest: {
                name: '++Kalkulatron',
                short_name: 'Kalkulatron',
                description: 'Ultra-Premium ++Kalkulatron.',
                theme_color: '#0B0B0F',
                background_color: '#0B0B0F',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    }
                ],
                screenshots: [
                    {
                        src: 'screenshot-desktop.png',
                        sizes: '1024x1024',
                        type: 'image/png',
                        form_factor: 'wide',
                        label: '++Kalkulatron Desktop'
                    }
                ],
                protocol_handlers: [
                    {
                        protocol: 'web+kalkulatron',
                        url: '/protocol?url=%s'
                    }
                ]
            },
        })
    ],
    server: {
        // Add the specific ngrok hostname to the allowed list
        allowedHosts: ['4201-185-84-144-229.ngrok-free.app', 'localhost', '127.0.0.1'],
        proxy: {
            '/api': {
                target: 'http://localhost',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
