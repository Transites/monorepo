import {defineConfig} from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import removeConsole from "vite-plugin-remove-console";

export default defineConfig(({mode}) => ({
    server: {
        host: '0.0.0.0',
        port: 8080,
        allowedHosts: ['enciclopedia.iea.usp.br']
    },
    plugins: [
        react(),
        mode === "production" && removeConsole(),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React libraries
                    'react-vendor': ['react', 'react-dom'],
                    // Router
                    'router': ['react-router-dom'],
                    // Query and state management
                    'query': ['@tanstack/react-query'],
                    // UI component library (largest chunk)
                    'radix-ui': [
                        '@radix-ui/react-accordion',
                        '@radix-ui/react-alert-dialog',
                        '@radix-ui/react-aspect-ratio',
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-checkbox',
                        '@radix-ui/react-collapsible',
                        '@radix-ui/react-context-menu',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-hover-card',
                        '@radix-ui/react-label',
                        '@radix-ui/react-menubar',
                        '@radix-ui/react-navigation-menu',
                        '@radix-ui/react-popover',
                        '@radix-ui/react-progress',
                        '@radix-ui/react-radio-group',
                        '@radix-ui/react-scroll-area',
                        '@radix-ui/react-select',
                        '@radix-ui/react-separator',
                        '@radix-ui/react-slider',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-switch',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-toggle',
                        '@radix-ui/react-toggle-group',
                        '@radix-ui/react-tooltip'
                    ],
                    // Internationalization
                    'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-http-backend'],
                    // Icons (keep separate to prevent bloat)
                    'icons': ['lucide-react'],
                    // Other utilities
                    'utils': ['clsx', 'tailwind-merge', 'date-fns', 'zod']
                }
            }
        },
        // Warn about large chunks (lowered to catch issues early)
        chunkSizeWarningLimit: 300
    }
}));
