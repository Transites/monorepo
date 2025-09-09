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
}));
